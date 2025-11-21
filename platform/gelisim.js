// =============================================================
// 📌 gelisim.js — Tarihsel Gelişim Analiz Motoru (v8.0)
// Günlük/Haftalık/Aylık Gelişim, Trend Analizi, Ay Ay Karşılaştırma
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS } from "./globalConfig.js";
import { db } from "../data/firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------------------------------------
// 1) ROL & ÖĞRENCİ ERİŞİM KONTROLÜ
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid");

// Öğrenci seçimi zorunlu değil, opsiyonel
// Eğer öğrenci seçilmemişse, kullanıcıya uyarı ver ama sayfa kırılmasın
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  console.warn("⚠ Öğrenci seçilmemiş. Gelişim verileri gösterilemeyecek.");
  // Sayfa kırılmasın, sadece uyarı ver
}

console.log("🎯 Tarihsel gelişim ekranı yüklendi → Rol:", role);

// -------------------------------------------------------------
// 2) HTML Elemanları
// -------------------------------------------------------------
const zamanFiltre = document.getElementById("zamanFiltre");
const alanFiltre = document.getElementById("alanFiltre");

let gecmis = [];

// =============================================================
// 3) VERİ YÜKLEME
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    if (!aktifOgrenciId) return;

    let yol = null;

    // Öğretmen için: Öğrencinin kendi profilinden veri çek (tüm veriler burada)
    if (role === ROLES.OGRETMEN && teacherID) {
      // Öğrencinin öğretmene bağlı olup olmadığını kontrol et (zorunlu değil)
      try {
        const teacherRef = doc(db, "profiles", teacherID);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          const students = teacherData.students || {};
          if (students[aktifOgrenciId] !== "kabul") {
            console.warn("⚠ Öğrenci öğretmene bağlı değil veya onay bekliyor.");
          }
        }
      } catch (err) {
        console.warn("⚠ Öğretmen-öğrenci bağlantı kontrolü yapılamadı:", err);
      }
      
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }
    // Kurum ve Admin için: profiles/{ogrenciID}/oyunSonuclari (direkt öğrenci profili)
    else if (role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
      // Kurum için: Öğrencinin kuruma bağlı olup olmadığını kontrol et (zorunlu değil)
      if (role === ROLES.INSTITUTION) {
        try {
          const institutionID = localStorage.getItem("institutionID");
          if (institutionID) {
            const studentRef = doc(db, "profiles", aktifOgrenciId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              if (studentData.institution?.id !== institutionID || studentData.institution?.status !== "kabul") {
                console.warn("⚠ Öğrenci kuruma bağlı değil veya onay bekliyor.");
              }
            }
          }
        } catch (err) {
          console.warn("⚠ Kurum-öğrenci bağlantı kontrolü yapılamadı:", err);
        }
      }
      
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    } else {
      return;
    }

    if (!yol) return;

    const snap = await getDocs(yol);
    const temp = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data?.tarih) temp.push(data);
    });

    gecmis = temp.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    alanFiltreleriDoldur();
    analizEt();

  } catch (err) {
    console.error("❌ Firestore geçmiş okunamadı:", err);
  }
}

// Öğrenci için önce Firestore, sonra LocalStorage
async function yukleOgrenciGecmis() {
  // Önce Firestore'dan çek
  try {
    if (db && uid) {
      const yol = collection(
        db,
        "profiles",
        uid,
        "oyunSonuclari"
      );
      
      const snap = await getDocs(yol);
      const firestoreData = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data?.tarih) firestoreData.push(data);
      });
      
      if (firestoreData.length > 0) {
        gecmis = firestoreData.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        console.log("📥 Firestore geçmiş yüklendi (öğrenci - gelişim):", gecmis.length, "kayıt");
        alanFiltreleriDoldur();
        analizEt();
        return;
      }
    }
  } catch (err) {
    console.warn("⚠ Firestore'dan veri çekilemedi, LocalStorage deneniyor:", err);
  }
  
  // Firestore'da veri yoksa LocalStorage'dan çek
  yukleLocalGecmis();
}

function yukleLocalGecmis() {
  try {
    const data = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
    gecmis = data
      .filter(x => x?.tarih)
      .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    alanFiltreleriDoldur();
    analizEt();
  } catch {
    console.warn("⚠ LocalStorage geçmiş bozuk.");
    gecmis = [];
    analizEt();
  }
}

// -------------------------------------------------------------
// 4) ALAN FİLTRELERİNİ DOLDUR
// -------------------------------------------------------------
function alanFiltreleriDoldur() {
  if (!alanFiltre) return;

  alanFiltre.innerHTML = '<option value="hepsi">Tüm Alanlar</option>';

  Object.keys(BRAIN_AREAS || {}).forEach(alanKey => {
    const opt = document.createElement("option");
    opt.value = alanKey;
    opt.textContent = BRAIN_AREAS[alanKey]?.ad || alanKey;
    alanFiltre.appendChild(opt);
  });
}

// =============================================================
// 5) ANA ANALİZ FONKSİYONU
// =============================================================
function analizEt() {
  if (gecmis.length === 0) {
    const genelTrendChart = document.getElementById("genelTrendChart");
    if (genelTrendChart && genelTrendChart.parentElement) {
      genelTrendChart.parentElement.innerHTML = 
        "<p style='text-align:center;color:#999;'>Analiz için yeterli veri yok.</p>";
    }
    return;
  }

  const zamanTipi = (zamanFiltre && zamanFiltre.value) ? zamanFiltre.value : "gunluk";
  const secilenAlan = (alanFiltre && alanFiltre.value) ? alanFiltre.value : "hepsi";

  // Yeni yapı: Blok bazlı yükleme
  yukleAnaBlok(zamanTipi, secilenAlan);
  yukleOrtaBlok(zamanTipi, secilenAlan);
  yukleAltBlok(zamanTipi);
}

// -------------------------------------------------------------
// ANA BLOK – ANA GELİŞİM GRAFİĞİ
// -------------------------------------------------------------
function yukleAnaBlok(zamanTipi, secilenAlan) {
  genelTrendGrafik(zamanTipi, secilenAlan);
  
  // Ortalama skor ve trend yönü
  if (gecmis.length > 0) {
    const skorlar = gecmis.map(item => {
      const dogru = item.oyunDetaylari?.toplamDogru ?? item.dogru ?? 0;
      const yanlis = item.oyunDetaylari?.toplamYanlis ?? item.yanlis ?? 0;
      const toplam = dogru + yanlis;
      return toplam > 0 ? (dogru / toplam) * 100 : 0;
    });
    
    const ortalama = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
    
    const ortalamaSkorEl = document.getElementById("ortalamaSkor");
    if (ortalamaSkorEl) ortalamaSkorEl.textContent = `${ortalama}%`;
    
    // Trend yönü
    const ilkYari = skorlar.slice(0, Math.floor(skorlar.length / 2));
    const sonYari = skorlar.slice(Math.floor(skorlar.length / 2));
    const ilkOrt = ilkYari.length > 0 ? ilkYari.reduce((a, b) => a + b, 0) / ilkYari.length : 0;
    const sonOrt = sonYari.length > 0 ? sonYari.reduce((a, b) => a + b, 0) / sonYari.length : 0;
    
    const trendYonuEl = document.getElementById("trendYonu");
    if (trendYonuEl) {
      if (sonOrt > ilkOrt + 5) {
        trendYonuEl.textContent = "📈 Artış";
        trendYonuEl.style.color = "#4caf50";
      } else if (sonOrt < ilkOrt - 5) {
        trendYonuEl.textContent = "📉 Azalış";
        trendYonuEl.style.color = "#f44336";
      } else {
        trendYonuEl.textContent = "➖ Sabit";
        trendYonuEl.style.color = "#666";
      }
    }
  }
}

// -------------------------------------------------------------
// ORTA BLOK – ALAN GRAFİKLERİ (GRID)
// -------------------------------------------------------------
function yukleOrtaBlok(zamanTipi, secilenAlan) {
  alanGrafikleri(zamanTipi, secilenAlan);
}

// -------------------------------------------------------------
// ALT BLOK – TARİH TABLOSU
// -------------------------------------------------------------
function yukleAltBlok(zamanTipi) {
  tarihTablosu(zamanTipi);
}

// =============================================================
// 6) VERİ GRUPLAMA (Günlük/Haftalık/Aylık)
// =============================================================
function veriGrupla(zamanTipi) {
  const gruplar = {};

  gecmis.forEach(item => {
    if (!item.tarih) return; // Tarih yoksa atla
    
    const tarih = new Date(item.tarih);
    if (isNaN(tarih.getTime())) return; // Geçersiz tarih ise atla
    
    let grupKey;

    if (zamanTipi === "gunluk") {
      grupKey = tarih.toLocaleDateString("tr-TR");
    } else if (zamanTipi === "haftalik") {
      const haftaBaslangic = new Date(tarih);
      haftaBaslangic.setDate(tarih.getDate() - tarih.getDay());
      grupKey = haftaBaslangic.toLocaleDateString("tr-TR") + " Haftası";
    } else if (zamanTipi === "aylik") {
      grupKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
    } else {
      grupKey = tarih.toLocaleDateString("tr-TR");
    }

    if (!gruplar[grupKey]) {
      gruplar[grupKey] = [];
    }
    gruplar[grupKey].push(item);
  });

  return gruplar;
}

// =============================================================
// 7) GENEL TREND GRAFİĞİ
// =============================================================
function genelTrendGrafik(zamanTipi, secilenAlan) {
  try {
    const canvas = document.getElementById("genelTrendChart");
    if (!canvas || !window.Chart) return;

    const gruplar = veriGrupla(zamanTipi);
    const labels = Object.keys(gruplar).sort();
    const datasets = [];

    if (secilenAlan === "hepsi") {
      // Tüm alanlar için ortalama
      const ortalamalar = labels.map(label => {
        const items = gruplar[label];
        const tumSkorlar = [];
        items.forEach(item => {
          if (item.coklu_alan) {
            Object.values(item.coklu_alan).forEach(skor => {
              if (skor > 0) tumSkorlar.push(skor);
            });
          }
        });
        return tumSkorlar.length > 0
          ? Math.round(tumSkorlar.reduce((a, b) => a + b, 0) / tumSkorlar.length)
          : 0;
      });

      datasets.push({
        label: "Genel Ortalama",
        data: ortalamalar,
        borderColor: "#1E88E5",
        backgroundColor: "rgba(30, 136, 229, 0.1)",
        borderWidth: 2,
        fill: true
      });
    } else {
      // Seçilen alan için
      const skorlar = labels.map(label => {
        const items = gruplar[label];
        const alanSkorlari = items
          .map(item => item.coklu_alan?.[secilenAlan] || 0)
          .filter(s => s > 0);
        return alanSkorlari.length > 0
          ? Math.round(alanSkorlari.reduce((a, b) => a + b, 0) / alanSkorlari.length)
          : 0;
      });

      datasets.push({
        label: BRAIN_AREAS[secilenAlan]?.ad || secilenAlan,
        data: skorlar,
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderWidth: 2,
        fill: true
      });
    }

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Genel trend grafiği çizilemedi:", err);
  }
}

// =============================================================
// 8) ALAN GRAFİKLERİ (12 Alan)
// =============================================================
function alanGrafikleri(zamanTipi, secilenAlan) {
  const container = document.getElementById("alanGrafikleri");
  if (!container) return;

  const alanlar = Object.keys(BRAIN_AREAS || {}).slice(0, 12);
  const gruplar = veriGrupla(zamanTipi);
  const labels = Object.keys(gruplar).sort();

  container.innerHTML = "";

  alanlar.forEach(alanKey => {
    if (secilenAlan !== "hepsi" && alanKey !== secilenAlan) return;

    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    const skorlar = labels.map(label => {
      const items = gruplar[label];
      const alanSkorlari = items
        .map(item => item.coklu_alan?.[alanKey] || 0)
        .filter(s => s > 0);
      return alanSkorlari.length > 0
        ? Math.round(alanSkorlari.reduce((a, b) => a + b, 0) / alanSkorlari.length)
        : 0;
    });

    const kart = document.createElement("div");
    kart.className = "alan-kart";
    const canvasId = `alanChart_${alanKey}`;
    kart.innerHTML = `
      <h4>${alanAd}</h4>
      <canvas id="${canvasId}"></canvas>
    `;
    container.appendChild(kart);

    setTimeout(() => {
      const canvas = document.getElementById(canvasId);
      if (canvas && window.Chart) {
        // Önceki chart'ı destroy et (varsa)
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }

        new Chart(canvas, {
          type: "line",
          data: {
            labels,
            datasets: [{
              label: alanAd,
              data: skorlar,
              borderColor: "#4a90e2",
              backgroundColor: "rgba(74, 144, 226, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            scales: {
              y: {
                min: 0,
                max: 100
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }, 100);
  });
}

// =============================================================
// 9) TARİH TABLOSU
// =============================================================
function tarihTablosu(zamanTipi) {
  const tbody = document.getElementById("tarihTabloBody");
  if (!tbody) return;

  let filtered = [...gecmis];

  // Zaman filtresi
  if (zamanTipi === "haftalik") {
    const son7Gun = Date.now() - 7 * 86400000;
    filtered = filtered.filter(x => new Date(x.tarih).getTime() >= son7Gun);
  } else if (zamanTipi === "aylik") {
    const son30Gun = Date.now() - 30 * 86400000;
    filtered = filtered.filter(x => new Date(x.tarih).getTime() >= son30Gun);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#999;'>Veri bulunamadı.</td></tr>";
    return;
  }

  let html = "";
  filtered.forEach((item, index) => {
    const oyunAdi = GLOBAL.GAME_MAP?.[item.oyun]?.ad || 
                   GLOBAL.OYUN_ADLARI?.[item.oyun] ||
                   item.oyun;
    
    // Doğru/Yanlış
    const dogru = item.oyunDetaylari?.toplamDogru ?? item.dogru ?? 0;
    const yanlis = item.oyunDetaylari?.toplamYanlis ?? item.yanlis ?? 0;
    
    // Süre
    const sure = item.oyunDetaylari?.toplamOyunSuresi ?? item.temel_skor?.sure ?? item.sure ?? 0;
    const sureFormat = sure > 0 ? `${Math.round(sure)}s` : "-";
    
    // Bölüm skorları (eşleme oyunu için)
    let bolumSkorlari = "-";
    if ((item.oyun === "renk_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
      const bolumSkorlariObj = item.oyunDetaylari.bolumSkorlari;
      const bolumAdlari = { renk: "R", sekil: "Ş", golge: "G", parca: "P" };
      const bolumListesi = [];
      
      Object.entries(bolumSkorlariObj).forEach(([key, skor]) => {
        if (skor && skor.toplam > 0) {
          const dogruOrani = Math.round((skor.dogru / skor.toplam) * 100);
          bolumListesi.push(`${bolumAdlari[key] || key}${dogruOrani}`);
        }
      });
      
      if (bolumListesi.length > 0) {
        bolumSkorlari = bolumListesi.join(" ");
      }
    }
    
    // Tarih
    const tarih = item.tarih ? new Date(item.tarih).toLocaleDateString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) : "-";

    html += `
      <tr>
        <td>${tarih}</td>
        <td style="font-weight:600;">${oyunAdi}</td>
        <td style="text-align:center;">
          <span style="color:#4caf50; font-weight:600;">${dogru}✓</span> / 
          <span style="color:#f44336; font-weight:600;">${yanlis}✗</span>
        </td>
        <td style="text-align:center;">${sureFormat}</td>
        <td style="text-align:center; font-size:12px; color:#666;">${bolumSkorlari}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// =============================================================
// 10) TREND HESAPLAMA
// =============================================================
function hesaplaTrend(item, onceki) {
  if (!onceki) return "➖";

  const simdiSkor = item.coklu_alan && Object.keys(item.coklu_alan).length > 0
    ? Object.values(item.coklu_alan).reduce((a, b) => a + b, 0) / Object.keys(item.coklu_alan).length
    : item.skorlar ? (item.skorlar.reaction_speed + item.skorlar.inhibitory_control + item.skorlar.sustained_attention) / 3 : 0;

  const oncekiSkor = onceki.coklu_alan && Object.keys(onceki.coklu_alan).length > 0
    ? Object.values(onceki.coklu_alan).reduce((a, b) => a + b, 0) / Object.keys(onceki.coklu_alan).length
    : onceki.skorlar ? (onceki.skorlar.reaction_speed + onceki.skorlar.inhibitory_control + onceki.skorlar.sustained_attention) / 3 : 0;

  const fark = simdiSkor - oncekiSkor;

  if (fark > 5) return '<span class="trend-artis">📈</span>';
  if (fark < -5) return '<span class="trend-azalis">📉</span>';
  return '<span class="trend-sabit">➖</span>';
}

// =============================================================
// 11) AY AY KARŞILAŞTIRMA
// =============================================================
function ayAyKarsilastirma() {
  try {
    const canvas = document.getElementById("ayAyChart");
    if (!canvas || !window.Chart || gecmis.length === 0) return;

    const aylikGruplar = veriGrupla("aylik");
    const aylar = Object.keys(aylikGruplar).sort();
    
    if (aylar.length < 2) return;

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    const alanlar = Object.keys(BRAIN_AREAS || {}).slice(0, 6); // İlk 6 alan
    const datasets = alanlar.map((alanKey, index) => {
      const renkler = ["#1E88E5", "#4caf50", "#ff9800", "#e53935", "#9c27b0", "#00bcd4"];
      const skorlar = aylar.map(ay => {
        const items = aylikGruplar[ay];
        const alanSkorlari = items
          .map(item => item.coklu_alan?.[alanKey] || 0)
          .filter(s => s > 0);
        return alanSkorlari.length > 0
          ? Math.round(alanSkorlari.reduce((a, b) => a + b, 0) / alanSkorlari.length)
          : 0;
      });

      return {
        label: BRAIN_AREAS[alanKey]?.ad || alanKey,
        data: skorlar,
        borderColor: renkler[index % renkler.length],
        backgroundColor: "transparent",
        borderWidth: 2
      };
    });

    new Chart(canvas, {
      type: "line",
      data: { labels: aylar, datasets },
      options: {
        scales: {
          y: {
            min: 0,
            max: 100
          }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Ay ay karşılaştırma grafiği çizilemedi:", err);
  }
}

// =============================================================
// 12) EVENTLER
// =============================================================
zamanFiltre?.addEventListener("change", () => analizEt());
alanFiltre?.addEventListener("change", () => analizEt());

// =============================================================
// 13) BAŞLAT
// =============================================================
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  yukleFirestoreGecmis();
} else if (role === ROLES.OGRENCI) {
  yukleOgrenciGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📈 gelisim.js yüklendi (v8.0)");

