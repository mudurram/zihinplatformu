// =============================================================
// 📌 analiz.js — Zihin Platformu Analiz Motoru (v8.0 - Yeni Şema)
// 12 Alan Radar, Öğrenme Hızı, Hata Türleri, AI Öneri
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS } from "./globalConfig.js";
import { drawTrendLines } from "../engine/trendAI.js";
import { drawComparisonChart } from "../engine/comparisonChart.js";
import { aiAdvice } from "../engine/aiAdvisor.js";

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
const institutionID = localStorage.getItem("institutionID");

// Öğrenci seçimi zorunlu değil, opsiyonel
// Eğer öğrenci seçilmemişse, kullanıcıya uyarı ver ama sayfa kırılmasın
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  console.warn("⚠ Öğrenci seçilmemiş. Analiz verileri gösterilemeyecek.");
  // Sayfa kırılmasın, sadece uyarı ver
  // Kullanıcı isterse öğrenci seçebilir
}

console.log("🎯 Analiz ekranı yüklendi → Rol:", role);

// -------------------------------------------------------------
// 2) HTML Elemanları
// -------------------------------------------------------------
const oyunFiltre = document.getElementById("oyunFiltre");
const tarihFiltre = document.getElementById("tarihFiltre");
const sonucListe = document.getElementById("sonucListe");

let gecmis = []; // Analiz veri kaynağı

// =============================================================
// 🔥 3A — Öğretmen/Kurum/Admin → Firestore'dan kayıt çek
// ÖNEMLİ: Onay durumu kontrolü yapılmalı (kabul durumundaki öğrenciler)
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    if (!aktifOgrenciId) {
      console.warn("⚠ aktifOgrenciId eksik.");
      return;
    }

    // Öğretmen için: Öğrencinin öğretmene bağlı olup olmadığını kontrol et
    if (role === ROLES.OGRETMEN && teacherID) {
      try {
        const teacherRef = doc(db, "profiles", teacherID);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          const students = teacherData.students || {};
          // Öğrencinin öğretmene "kabul" durumunda bağlı olup olmadığını kontrol et
          if (students[aktifOgrenciId] !== "kabul") {
            console.warn("⚠ Öğrenci öğretmene bağlı değil veya onay bekliyor.");
            // Zorunlu değil, sadece uyarı ver ve devam et
          }
        }
      } catch (err) {
        console.warn("⚠ Öğretmen-öğrenci bağlantı kontrolü yapılamadı:", err);
        // Hata olsa bile devam et, zorunlu değil
      }
    }

    // Kurum için: Öğrencinin kuruma bağlı olup olmadığını kontrol et
    if (role === ROLES.INSTITUTION && institutionID) {
      try {
        const studentRef = doc(db, "profiles", aktifOgrenciId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          // Öğrencinin kuruma "kabul" durumunda bağlı olup olmadığını kontrol et
          if (studentData.institution?.id !== institutionID || studentData.institution?.status !== "kabul") {
            console.warn("⚠ Öğrenci kuruma bağlı değil veya onay bekliyor.");
            // Zorunlu değil, sadece uyarı ver ve devam et
          }
        }
      } catch (err) {
        console.warn("⚠ Kurum-öğrenci bağlantı kontrolü yapılamadı:", err);
        // Hata olsa bile devam et, zorunlu değil
      }
    }

    let yol = null;

    // Öğretmen için: Öğrencinin kendi profilinden veri çek (tüm veriler burada)
    // Öğretmen alt koleksiyonundan değil, öğrencinin kendi profilinden çek
    if (role === ROLES.OGRETMEN && teacherID) {
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }
    // Kurum ve Admin için: profiles/{ogrenciID}/oyunSonuclari (direkt öğrenci profili)
    else if (role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    } else {
      console.warn("⚠ Geçersiz rol veya eksik bilgi.");
      return;
    }

    if (!yol) {
      console.warn("⚠ Firestore yolu oluşturulamadı.");
      return;
    }

    const snap = await getDocs(yol);
    const temp = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data?.tarih) temp.push(data);
    });

    console.log("📥 Firestore geçmiş yüklendi:", temp.length, "kayıt");
    
    // Veri formatını kontrol et
    if (temp.length > 0) {
      console.log("📊 İlk kayıt örneği:", temp[0]);
      console.log("📊 İlk kayıt coklu_alan:", temp[0].coklu_alan);
      console.log("📊 İlk kayıt temel_skor:", temp[0].temel_skor);
    }

    gecmis = temp.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

    filtrele();

  } catch (err) {
    console.error("❌ Firestore geçmiş okunamadı:", err);
  }
}

// =============================================================
// 🔥 3B — Öğrenci → Önce Firestore, sonra LocalStorage geçmişi
// =============================================================
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
        console.log("📥 Firestore geçmiş yüklendi (öğrenci):", gecmis.length, "kayıt");
        
        // Veri formatını kontrol et
        if (gecmis.length > 0) {
          console.log("📊 İlk kayıt örneği:", gecmis[0]);
          console.log("📊 İlk kayıt coklu_alan:", gecmis[0].coklu_alan);
          console.log("📊 İlk kayıt temel_skor:", gecmis[0].temel_skor);
        }
        
        filtrele();
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
  let data;

  try {
    data = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
    if (!Array.isArray(data)) throw 0;
  } catch {
    console.warn("⚠ LocalStorage geçmiş bozuk → sıfırlandı.");
    data = [];
  }

  gecmis = data
    .filter(x => x?.tarih)
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  console.log("📥 LocalStorage geçmiş yüklendi:", gecmis.length, "kayıt");
  
  // Veri formatını kontrol et
  if (gecmis.length > 0) {
    console.log("📊 İlk kayıt örneği:", gecmis[0]);
    console.log("📊 İlk kayıt coklu_alan:", gecmis[0].coklu_alan);
    console.log("📊 İlk kayıt temel_skor:", gecmis[0].temel_skor);
  }

  filtrele();
}

// -------------------------------------------------------------
// 4) OYUN FİLTRELERİNİ DOLDUR (GAME_MAP'ten)
// -------------------------------------------------------------
if (oyunFiltre) {
  const opt = document.createElement("option");
  opt.value = "hepsi";
  opt.textContent = "Tüm Oyunlar";
  oyunFiltre.appendChild(opt);

  const gameMap = GLOBAL.GAME_MAP || {};
  Object.keys(gameMap).forEach(oyunId => {
    const oyun = gameMap[oyunId];
    const o = document.createElement("option");
    o.value = oyunId;
    o.textContent = oyun.ad || oyunId;
    oyunFiltre.appendChild(o);
  });
}

// -------------------------------------------------------------
// 5) FİLTRELEME MOTORU
// -------------------------------------------------------------
function filtrele() {
  let filtered = [...gecmis];

  // 🎮 Oyun filtresi
  if (oyunFiltre && oyunFiltre.value !== "hepsi") {
    filtered = filtered.filter(x => x.oyun === oyunFiltre.value);
  }

  // 📅 Tarih filtresi
  const now = Date.now();
  let limit = null;

  switch (tarihFiltre?.value) {
    case "hafta":
      limit = now - 7 * 86400000;
      break;
    case "ay":
      limit = now - 30 * 86400000;
      break;
    case "tum":
      limit = 0;
      break;
    case "son":
      limit = null;
      break;
  }

  if (limit !== null && tarihFiltre.value !== "son") {
    filtered = filtered.filter(x => {
      if (!x.tarih) return false;
      const tarihTime = new Date(x.tarih).getTime();
      return !isNaN(tarihTime) && tarihTime >= limit;
    });
  }

  if (tarihFiltre.value === "son") {
    filtered = filtered.length ? [filtered.at(-1)] : [];
  }

  // Liste + grafik işlemleri (yeni yapı)
  listele(filtered);
  yukleUstBlok(filtered);
  yukleAnaBlok1(filtered);
  yukleAnaBlok2(filtered);
  yukleAnaBlok3(filtered);
  yukleAltBlok(filtered);
}

// -------------------------------------------------------------
// ÜST BLOK – GENEL PERFORMANS ÖZETİ
// -------------------------------------------------------------
function yukleUstBlok(data) {
  if (!data || data.length === 0) return;
  
  // Son 10 oyun
  const son10Oyun = data.slice(-10);
  
  // Son 10 oyun ortalama skor
  const ortalamaSkorlar = son10Oyun.map(item => {
    const dogru = item.oyunDetaylari?.toplamDogru ?? item.temel_skor?.dogru ?? item.dogru ?? 0;
    const yanlis = item.oyunDetaylari?.toplamYanlis ?? item.temel_skor?.yanlis ?? item.yanlis ?? 0;
    const toplam = dogru + yanlis;
    return toplam > 0 ? (dogru / toplam) * 100 : 0;
  });
  const ortalama = ortalamaSkorlar.length > 0 
    ? Math.round(ortalamaSkorlar.reduce((a, b) => a + b, 0) / ortalamaSkorlar.length)
    : 0;
  
  const son10OrtalamaEl = document.getElementById("son10Ortalama");
  if (son10OrtalamaEl) son10OrtalamaEl.textContent = `${ortalama}%`;
  
  // En güçlü/zayıf alan
  const alanSkorlari = {};
  data.forEach(item => {
    // Önce zihinselAlanlar'dan al (1 basamak eşleme oyunu için)
    const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
    Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
      if (!alanSkorlari[key]) alanSkorlari[key] = [];
      alanSkorlari[key].push(skor);
    });
    
    // Eski format kontrolü
    if (item.coklu_alan) {
      Object.entries(item.coklu_alan).forEach(([key, skor]) => {
        if (!alanSkorlari[key]) alanSkorlari[key] = [];
        alanSkorlari[key].push(skor);
      });
    }
    
    // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
    if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
      const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
      let toplamSkor = 0;
      let bolumSayisi = 0;
      Object.values(bolumSkorlari).forEach(bolum => {
        if (bolum && bolum.toplam > 0) {
          const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
          toplamSkor += dogruOrani;
          bolumSayisi++;
        }
      });
      if (bolumSayisi > 0) {
        const ortalamaSkor = Math.round(toplamSkor / bolumSayisi);
        // Algısal işlemleme için kullan (eşleme oyunu genelde algısal işlemleme ile ilgili)
        if (!alanSkorlari["algisal_islemleme"]) alanSkorlari["algisal_islemleme"] = [];
        alanSkorlari["algisal_islemleme"].push(ortalamaSkor);
      }
    }
  });
  
  const alanOrtalamalari = {};
  Object.entries(alanSkorlari).forEach(([key, skorlar]) => {
    if (skorlar.length > 0) {
      alanOrtalamalari[key] = skorlar.reduce((a, b) => a + b, 0) / skorlar.length;
    }
  });
  
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  if (Object.keys(alanOrtalamalari).length > 0) {
    const enGuclu = Object.entries(alanOrtalamalari).sort((a, b) => b[1] - a[1])[0];
    const enZayif = Object.entries(alanOrtalamalari).sort((a, b) => a[1] - b[1])[0];
    
    const enGucluAlanEl = document.getElementById("enGucluAlan");
    if (enGucluAlanEl) enGucluAlanEl.textContent = alanAdlari[enGuclu[0]] || enGuclu[0];
    
    const enZayifAlanEl = document.getElementById("enZayifAlan");
    if (enZayifAlanEl) enZayifAlanEl.textContent = alanAdlari[enZayif[0]] || enZayif[0];
  }
  
  // Mini trend grafiği
  const trendMiniCanvas = document.getElementById("trendMiniChart");
  if (trendMiniCanvas && window.Chart && son10Oyun.length > 0) {
    const existingChart = Chart.getChart(trendMiniCanvas);
    if (existingChart) existingChart.destroy();
    
    const labels = son10Oyun.map((_, i) => i + 1);
    const dogruData = son10Oyun.map(item => item.oyunDetaylari?.toplamDogru ?? item.dogru ?? 0);
    const yanlisData = son10Oyun.map(item => item.oyunDetaylari?.toplamYanlis ?? item.yanlis ?? 0);
    
    new Chart(trendMiniCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doğru",
            data: dogruData,
            borderColor: "#4caf50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            tension: 0.4
          },
          {
            label: "Yanlış",
            data: yanlisData,
            borderColor: "#f44336",
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            tension: 0.4
          }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
          x: { display: false }
        },
        maintainAspectRatio: false
      }
    });
  }
}

// -------------------------------------------------------------
// ANA BLOK 1 – ZAMAN SERİSİ GRAFİKLERİ
// -------------------------------------------------------------
function yukleAnaBlok1(data) {
  trendGrafik(data);
  ogrenmeHiziGrafik(data);
  tepkiSuresiTrendGrafik(data);
}

// Tepki Süresi Trend Grafiği
function tepkiSuresiTrendGrafik(data) {
  const canvas = document.getElementById("tepkiSuresiChart");
  if (!canvas || !window.Chart || data.length === 0) return;
  
  const labels = data.map((item, i) => {
    if (item.tarih) {
      return new Date(item.tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
    }
    return `Oyun ${i + 1}`;
  });
  
  const tepkiSuresiData = data.map(item => {
    const ortalama = item.oyunDetaylari?.ortalamaTepkiSuresi ?? 
                     item.temel_skor?.ortalamaTepki ?? 
                     item.temel_skor?.reaction_avg ?? 0;
    return ortalama;
  });
  
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();
  
  new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Tepki Süresi (ms)",
        data: tepkiSuresiData,
        borderColor: "#1e88e5",
        backgroundColor: "rgba(30, 136, 229, 0.1)",
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Tepki Süresi (ms)" } }
      }
    }
  });
}

// -------------------------------------------------------------
// ANA BLOK 2 – ZİHİNSEL ALAN ORTALAMALARI
// -------------------------------------------------------------
function yukleAnaBlok2(data) {
  radarGrafik(data);
  alanOrtalamaTablo(data);
}

// Alan Ortalama Tablosu (yeni format)
function alanOrtalamaTablo(data) {
  const tabloBody = document.getElementById("alanTabloBody");
  if (!tabloBody) return;
  
  const alanSkorlari = {};
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  data.forEach(item => {
    // Önce zihinselAlanlar'dan al (1 basamak eşleme oyunu için)
    const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
    Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
      if (!alanSkorlari[key]) alanSkorlari[key] = [];
      alanSkorlari[key].push(skor);
    });
    
    // Eski format kontrolü
    if (item.coklu_alan) {
      Object.entries(item.coklu_alan).forEach(([key, skor]) => {
        if (!alanSkorlari[key]) alanSkorlari[key] = [];
        alanSkorlari[key].push(skor);
      });
    }
    
    // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
    if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
      const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
      let toplamSkor = 0;
      let bolumSayisi = 0;
      Object.values(bolumSkorlari).forEach(bolum => {
        if (bolum && bolum.toplam > 0) {
          const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
          toplamSkor += dogruOrani;
          bolumSayisi++;
        }
      });
      if (bolumSayisi > 0) {
        const ortalamaSkor = Math.round(toplamSkor / bolumSayisi);
        // Algısal işlemleme için kullan
        if (!alanSkorlari["algisal_islemleme"]) alanSkorlari["algisal_islemleme"] = [];
        alanSkorlari["algisal_islemleme"].push(ortalamaSkor);
      }
    }
  });
  
  let html = "";
  Object.entries(alanSkorlari).forEach(([key, skorlar]) => {
    if (skorlar.length > 0) {
      const ortalama = Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length);
      const enYuksek = Math.max(...skorlar);
      const enDusuk = Math.min(...skorlar);
      const oyunSayisi = skorlar.length;
      
      html += `<tr>
        <td style="font-weight:600;">${alanAdlari[key] || key}</td>
        <td style="text-align:center;">${ortalama}</td>
        <td style="text-align:center; color:#4caf50; font-weight:600;">${enYuksek}</td>
        <td style="text-align:center; color:#f44336; font-weight:600;">${enDusuk}</td>
        <td style="text-align:center;">${oyunSayisi}</td>
      </tr>`;
    }
  });
  
  tabloBody.innerHTML = html || "<tr><td colspan='5' style='text-align:center; color:#999;'>Veri bulunamadı.</td></tr>";
}

// -------------------------------------------------------------
// ANA BLOK 3 – HATA ANALİZİ
// -------------------------------------------------------------
function yukleAnaBlok3(data) {
  hataTurleriGrafik(data);
  baskınHataTipiGenel(data);
}

// Baskın Hata Tipi (Genel)
function baskınHataTipiGenel(data) {
  const el = document.getElementById("baskinHataTipiGenel");
  if (!el) return;
  
  let toplamHata = { impulsivite: 0, dikkatsizlik: 0, karistirma: 0, kategori_hatasi: 0 };
  
  data.forEach(item => {
    // Yeni format: hataTurleriDetay (eşleme oyunu için)
    const hataTurleri = item.oyunDetaylari?.hataTurleriDetay ||
                        item.temel_skor?.hataTurleriDetay || 
                        item.temel_skor?.hataTurleri || 
                        {};
    
    toplamHata.impulsivite += hataTurleri.impulsivite || 0;
    toplamHata.dikkatsizlik += hataTurleri.dikkatsizlik || 0;
    toplamHata.karistirma += hataTurleri.karistirma || 0;
    toplamHata.kategori_hatasi += hataTurleri.kategori_hatasi || 0;
  });
  
  const toplam = Object.values(toplamHata).reduce((a, b) => a + b, 0);
  if (toplam === 0) {
    el.textContent = "Baskın hata tipi: Hata yapılmadı";
    return;
  }
  
  const impulsiviteOran = (toplamHata.impulsivite / toplam) * 100;
  const dikkatsizlikOran = (toplamHata.dikkatsizlik / toplam) * 100;
  
  let baskın = "Dengeli";
  if (impulsiviteOran > 40) baskın = "Acelecilik";
  else if (dikkatsizlikOran > 40) baskın = "Dikkatsizlik";
  
  el.textContent = `Baskın hata tipi: ${baskın}`;
}

// -------------------------------------------------------------
// ALT BLOK – GÜÇLÜ/ZAYIF YÖNLER
// -------------------------------------------------------------
function yukleAltBlok(data) {
  gucluVeZayifAnaliz(data);
  aiOneri(data);
}

// -------------------------------------------------------------
// 6) SONUÇ LİSTESİ
// -------------------------------------------------------------
function listele(data) {
  if (!sonucListe) return;

  sonucListe.innerHTML = "";

  if (!data.length) {
    sonucListe.innerHTML =
      "<p style='text-align:center;color:#999;'>Kayıt bulunamadı.</p>";
    return;
  }

  data.forEach(item => {
    const kart = document.createElement("div");
    kart.className = "sonuc-kart";
    kart.style.cssText = "padding:15px; margin:10px 0; background:white; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); cursor:pointer; transition:0.2s;";
    kart.onmouseover = () => kart.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    kart.onmouseout = () => kart.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
    kart.onclick = () => {
      localStorage.setItem(GLOBAL.STORAGE_KEYS.LAST_GAME_RESULT, JSON.stringify(item));
      window.location.href = "sonuc.html";
    };

    const oyunAdi = GLOBAL.GAME_MAP?.[item.oyun]?.ad || 
                   GLOBAL.OYUN_ADLARI?.[item.oyun] ||
                   (item.oyun ? item.oyun.replace(/_/g, " ").toUpperCase() : "Bilinmeyen Oyun");

    // Temel skorlar (mini)
    const dogru = item.oyunDetaylari?.toplamDogru ?? item.temel_skor?.dogru ?? item.dogru ?? 0;
    const yanlis = item.oyunDetaylari?.toplamYanlis ?? item.temel_skor?.yanlis ?? item.yanlis ?? 0;
    const toplam = dogru + yanlis;
    const basariOrani = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
    
    // Mini zihinsel profil (sadece seviye etiketleri)
    const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
    let miniProfil = "";
    const alanAdlari = {
      dikkat: "Dikkat",
      algisal_islemleme: "Algı",
      hafiza: "Hafıza",
      yuruteci_islev: "Yürütücü",
      mantik: "Mantık",
      okuma_dil: "Okuma",
      sosyal_bilis: "Sosyal"
    };
    
    const profilListesi = [];
    Object.entries(zihinselAlanlar).slice(0, 3).forEach(([key, skor]) => {
      const seviye = skor >= 80 ? "Yüksek" : skor >= 50 ? "Orta" : "Düşük";
      profilListesi.push(`${alanAdlari[key] || key}: ${seviye}`);
    });
    if (profilListesi.length > 0) {
      miniProfil = profilListesi.join(", ");
    }

    // Bölüm skorları bilgisi (eşleme oyunu için - özet)
    let bolumBilgisi = "";
    if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
      const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
      const bolumAdlari = { renk: "🎨", sekil: "🔷", golge: "🌑", parca: "🧩" };
      const bolumListesi = [];
      
      Object.entries(bolumSkorlari).forEach(([key, skor]) => {
        if (skor && skor.toplam > 0) {
          const dogruOrani = Math.round((skor.dogru / skor.toplam) * 100);
          bolumListesi.push(`${bolumAdlari[key] || ""} ${dogruOrani}%`);
        }
      });
      
      if (bolumListesi.length > 0) {
        bolumBilgisi = ` | ${bolumListesi.join(" ")}`;
      }
    }
    
    // Tarih formatı
    const tarih = item.tarih ? new Date(item.tarih).toLocaleDateString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) : "Tarih bilinmiyor";
    
    // Kart içeriği (sadeleştirilmiş)
    kart.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
        <div>
          <strong style="font-size:16px; color:#1e3d59;">${oyunAdi}</strong>
          <div style="font-size:12px; color:#999; margin-top:4px;">${tarih}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px; color:#4caf50; font-weight:600;">${dogru}✓</div>
          <div style="font-size:14px; color:#f44336; font-weight:600;">${yanlis}✗</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">%${basariOrani}</div>
        </div>
      </div>
      ${miniProfil ? `<div style="font-size:13px; color:#666; margin-top:8px; padding-top:8px; border-top:1px solid #e0e0e0;">${miniProfil}${bolumBilgisi}</div>` : bolumBilgisi ? `<div style="font-size:13px; color:#666; margin-top:8px; padding-top:8px; border-top:1px solid #e0e0e0;">${bolumBilgisi}</div>` : ""}
    `;

    kart.onclick = () => {
      localStorage.setItem(GLOBAL.STORAGE_KEYS.LAST_GAME_RESULT, JSON.stringify(item));
      window.location.href = "sonuc.html";
    };

    sonucListe.appendChild(kart);
  });
  
  // Analiz fonksiyonlarını çağır
  radarGrafik(data);
  trendGrafik(data);
  ogrenmeHiziGrafik(data);
  alanTablo(data);
  hataTurleriGrafik(data);
  gucluVeZayifAnaliz(data);
  aiOneriMotoru(data);
  heatmapOlustur(data);
}

// -------------------------------------------------------------
// 7) 12 ALAN RADAR GRAFİĞİ
// -------------------------------------------------------------
function radarGrafik(data) {
  try {
    const canvas = document.getElementById("radarChart");
    if (!canvas || !window.Chart || data.length === 0) {
      console.warn("⚠ Radar grafiği için veri yok");
      return;
    }

    // 7 zihinsel alan için veri topla
    const alanSkorlari = {};
    const alanMap = {
      dikkat: "Dikkat",
      algisal_islemleme: "Algısal İşlemleme",
      hafiza: "Hafıza",
      yuruteci_islev: "Yürütücü İşlev",
      mantik: "Mantık",
      okuma_dil: "Okuma-Dil",
      sosyal_bilis: "Sosyal Biliş"
    };
    
    const alanlar = Object.keys(alanMap);

    alanlar.forEach(alanKey => {
      const skorlar = data
        .map(item => {
          // Önce zihinselAlanlar'dan al (eşleme oyunu için)
          const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
          if (zihinselAlanlar[alanKey] !== undefined) {
            return zihinselAlanlar[alanKey];
          }
          
          // Eski format kontrolü
          if (item.coklu_alan && item.coklu_alan[alanKey]) {
            return item.coklu_alan[alanKey];
          }
          
          // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
          if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
            const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
            // Alan mapping: renk/sekil/golge/parca -> algisal_islemleme, dikkat, mantık vb.
            // Basit bir hesaplama: tüm bölümlerin ortalaması
            let toplamSkor = 0;
            let bolumSayisi = 0;
            Object.values(bolumSkorlari).forEach(bolum => {
              if (bolum && bolum.toplam > 0) {
                const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
                toplamSkor += dogruOrani;
                bolumSayisi++;
              }
            });
            if (bolumSayisi > 0) {
              return Math.round(toplamSkor / bolumSayisi);
            }
          }
          
          return 0;
        })
        .filter(s => s > 0);
        
      alanSkorlari[alanKey] = skorlar.length > 0 
        ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
        : 0;
    });
    
    console.log("📊 Radar grafik alan skorları:", alanSkorlari);

    const labels = alanlar.map(k => alanMap[k] || k);
    const values = alanlar.map(k => alanSkorlari[k]);

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [{
          label: "7 Zihin Alanı",
          data: values,
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Radar grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 8) TREND GRAFİĞİ
// -------------------------------------------------------------
function trendGrafik(data) {
  try {
    const canvas = document.getElementById("trendChart");
    if (canvas) drawTrendLines(canvas, data);
  } catch (err) {
    console.warn("⚠ Trend grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 9) ÖĞRENME HIZI GRAFİĞİ
// -------------------------------------------------------------
function ogrenmeHiziGrafik(data) {
  try {
    const canvas = document.getElementById("ogrenmeHiziChart");
    if (!canvas || !window.Chart || data.length === 0) return;

    const ogrenmeHizlari = data
      .map(item => {
        // Önce oyunDetaylari'dan al (1 basamak eşleme oyunu için)
        const hiz = item.oyunDetaylari?.ogrenmeHiziSkoru ||
                   item.temel_skor?.ogrenmeHizi || 
                   item.temel_skor?.learning_velocity ||
                   item.ogrenmeHizi ||
                   item.learning_velocity ||
                   null;
        
        // Eğer hala null ise, trials'dan hesapla
        let calculatedHiz = null;
        if (hiz === null && item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const dogruTrials = item.trials.filter(t => t.correct);
          const total = item.trials.length;
          if (total > 0) {
            const accuracy = dogruTrials.length / total;
            const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 0), 0) / total;
            // Öğrenme hızı hesaplama (basit versiyon)
            calculatedHiz = Math.round(accuracy * 100 * (1 - Math.min(avgReaction / 2000, 0.5)));
          }
        }
        
        return {
          tarih: item.tarih ? new Date(item.tarih).toLocaleDateString("tr-TR") : "Tarih yok",
          hiz: hiz !== null ? hiz : calculatedHiz
        };
      })
      .filter(item => item.hiz !== null && item.hiz !== undefined);

    if (ogrenmeHizlari.length === 0) {
      console.warn("⚠ Öğrenme hızı verisi bulunamadı");
      return;
    }

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "line",
      data: {
        labels: ogrenmeHizlari.map(item => item.tarih),
        datasets: [{
          label: "Öğrenme Hızı",
          data: ogrenmeHizlari.map(item => item.hiz),
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 2,
          fill: true
        }]
      },
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
    console.warn("⚠ Öğrenme hızı grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 10) ALAN BAZLI SKOR TABLOSU
// -------------------------------------------------------------
function alanTablo(data) {
  const tbody = document.getElementById("alanTabloBody");
  if (!tbody) return;

  const alanlar = Object.keys(BRAIN_AREAS || {});
  if (alanlar.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>Veri bulunamadı.</td></tr>";
    return;
  }

  let html = "";
  alanlar.forEach(alanKey => {
    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    const skorlar = data
      .map(item => {
        // Önce zihinselAlanlar'dan al (1 basamak eşleme oyunu için)
        const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
        if (zihinselAlanlar[alanKey] !== undefined) {
          return zihinselAlanlar[alanKey];
        }
        
        // Önce yeni formattan al
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eski format kontrolü (skorlar objesi)
        if (item.skorlar && item.skorlar[alanKey]) {
          return item.skorlar[alanKey];
        }
        
        // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
        if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
          const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
          let toplamSkor = 0;
          let bolumSayisi = 0;
          Object.values(bolumSkorlari).forEach(bolum => {
            if (bolum && bolum.toplam > 0) {
              const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
              toplamSkor += dogruOrani;
              bolumSayisi++;
            }
          });
          if (bolumSayisi > 0) {
            return Math.round(toplamSkor / bolumSayisi);
          }
        }
        
        // Eğer hiç veri yoksa, trials'dan hesapla
        if (item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const total = item.trials.length;
          const dogru = item.trials.filter(t => t.correct).length;
          const accuracy = total > 0 ? dogru / total : 0;
          const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 1000), 0) / total;
          const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
          
          // Alan bazlı skor hesaplama (basit versiyon)
          let skor = 0;
          if (alanKey === "attention") {
            skor = Math.round(accuracy * 60 + reactionScore * 0.4);
          } else if (alanKey === "perception") {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          } else if (alanKey === "executive") {
            skor = Math.round(accuracy * 50 + reactionScore * 0.5);
          } else if (alanKey === "logic") {
            skor = Math.round(accuracy * 80 + reactionScore * 0.2);
          } else {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          }
          return skor;
        }
        
        return 0;
      })
      .filter(s => s > 0);
    
    const sonSkor = skorlar.length > 0 ? skorlar[skorlar.length - 1] : 0;
    const ortalama = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
    
    const trend = skorlar.length >= 2 
      ? (sonSkor > skorlar[0] ? "📈" : sonSkor < skorlar[0] ? "📉" : "➖")
      : "➖";
    
    const gunlukHayat = BRAIN_AREAS[alanKey]?.gunlukHayat || "-";

    html += `<tr>
      <td>${alanAd}</td>
      <td>${Math.round(sonSkor)}</td>
      <td>${Math.round(ortalama)}</td>
      <td>${trend}</td>
      <td>${gunlukHayat}</td>
    </tr>`;
  });

  tbody.innerHTML = html || "<tr><td colspan='5'>Veri bulunamadı.</td></tr>";
  console.log("📊 Alan tablosu oluşturuldu,", alanlar.length, "alan");
}

// -------------------------------------------------------------
// 10) HEATMAP - Oyun → Zihinsel Alan Eşleşmesi
// -------------------------------------------------------------
function heatmapOlustur(data) {
  const container = document.getElementById("heatmapContainer");
  if (!container) return;
  
  if (data.length === 0) {
    container.innerHTML = "<p style='text-align:center;color:#999;'>Heatmap için veri yok.</p>";
    return;
  }
  
  // Oyunları ve alanları topla
  const oyunlar = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});
  
  data.forEach(item => {
    const oyunKod = item.oyun || "bilinmeyen";
    const oyunAdi = GLOBAL.OYUN_ADLARI?.[oyunKod] || oyunKod;
    
    if (!oyunlar[oyunKod]) {
      oyunlar[oyunKod] = {
        ad: oyunAdi,
        alanlar: {}
      };
    }
    
    // Oyunun modüllerini al
    const oyunMeta = GLOBAL.GAME_MAP?.[oyunKod] || {};
    const moduller = oyunMeta.moduller || [];
    
    // Modül adlarını BRAIN_AREAS key'lerine çevir
    const modulMap = {
      "attention": "attention", "dikkat": "attention",
      "perception": "perception", "algisal_islemleme": "perception", "algisal": "perception",
      "executive": "executive", "yuruteci_islev": "executive", "yuruteci": "executive",
      "logic": "logic", "mantik": "logic", "mantiksal": "logic",
      "memory": "memory", "hafiza": "memory",
      "literacy": "literacy", "okuma": "literacy",
      "dyslexia": "dyslexia", "disleksi": "dyslexia",
      "writing": "writing", "yazi": "writing",
      "math": "math", "matematik": "math",
      "emotional": "emotional", "duygusal": "emotional",
      "social": "social", "sosyal": "social",
      "comprehension": "comprehension", "anlama": "comprehension"
    };
    
    moduller.forEach(modul => {
      const alanKey = modulMap[modul] || modul;
      if (BRAIN_AREAS[alanKey]) {
        if (!oyunlar[oyunKod].alanlar[alanKey]) {
          oyunlar[oyunKod].alanlar[alanKey] = 0;
        }
        
        // Oyunun bu alana katkısını hesapla
        const skor = item.coklu_alan?.[alanKey] || 0;
        if (skor > 0) {
          oyunlar[oyunKod].alanlar[alanKey] = Math.max(oyunlar[oyunKod].alanlar[alanKey], skor);
        }
      }
    });
  });
  
  // Heatmap tablosu oluştur
  let html = "<div style='overflow-x:auto;'>";
  html += "<table class='tablo' style='margin-top:15px;'>";
  html += "<thead><tr><th>Oyun</th>";
  
  // Sadece kullanılan alanları göster
  const kullanilanAlanlar = new Set();
  Object.values(oyunlar).forEach(oyun => {
    Object.keys(oyun.alanlar).forEach(alan => kullanilanAlanlar.add(alan));
  });
  
  const gosterilecekAlanlar = Array.from(kullanilanAlanlar).filter(alan => BRAIN_AREAS[alan]);
  
  gosterilecekAlanlar.forEach(alanKey => {
    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    html += `<th>${alanAd}</th>`;
  });
  html += "</tr></thead><tbody>";
  
  Object.entries(oyunlar).forEach(([oyunKod, oyunInfo]) => {
    html += `<tr><td><strong>${oyunInfo.ad}</strong></td>`;
    gosterilecekAlanlar.forEach(alanKey => {
      const skor = oyunInfo.alanlar[alanKey] || 0;
      const yuzde = Math.round(skor);
      // Skora göre renk ve nokta sayısı
      let renk = "#e0e0e0";
      let nokta = "";
      if (skor >= 80) {
        renk = "#4caf50";
        nokta = "●●●●";
      } else if (skor >= 60) {
        renk = "#8bc34a";
        nokta = "●●●";
      } else if (skor >= 40) {
        renk = "#ffc107";
        nokta = "●●";
      } else if (skor > 0) {
        renk = "#ff9800";
        nokta = "●";
      }
      
      html += `<td style='text-align:center;background:${renk}20;'>
        <span style='color:${renk};font-size:18px;'>${nokta}</span>
        <br><small style='color:#666;'>${yuzde}%</small>
      </td>`;
    });
    html += "</tr>";
  });
  
  html += "</tbody></table></div>";
  container.innerHTML = html;
}

// -------------------------------------------------------------
// 11) HATA TÜRLERİ DAĞILIMI
// -------------------------------------------------------------
function hataTurleriGrafik(data) {
  try {
    const canvas = document.getElementById("hataTurleriChart");
    if (!canvas || !window.Chart || data.length === 0) return;

    const hataToplam = {
      impulsivite: 0,
      karistirma: 0,
      dikkatsizlik: 0
    };

    data.forEach(item => {
      // Yeni format: hataTurleriDetay (eşleme oyunu için)
      const hatalar = item.oyunDetaylari?.hataTurleriDetay ||
                      item.temel_skor?.hataTurleriDetay || 
                      item.temel_skor?.hataTurleri || 
                      {};
      hataToplam.impulsivite += hatalar.impulsivite || 0;
      hataToplam.karistirma += hatalar.karistirma || 0;
      hataToplam.dikkatsizlik += hatalar.dikkatsizlik || 0;
    });

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["İmpulsivite", "Karıştırma", "Dikkatsizlik"],
        datasets: [{
          data: [
            hataToplam.impulsivite,
            hataToplam.karistirma,
            hataToplam.dikkatsizlik
          ],
          backgroundColor: ["#e53935", "#ff9800", "#fbc02d"]
        }]
      }
    });
  } catch (err) {
    console.warn("⚠ Hata türleri grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 12) GÜÇLÜ VE ZAYIF ALANLAR
// -------------------------------------------------------------
function gucluVeZayifAnaliz(data) {
  const gucluListe = document.getElementById("gucluYonler");
  const zayifListe = document.getElementById("gelistirilecekYonler");
  if (!gucluListe || !zayifListe) return;

  const alanSkorlari = {};
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  const alanlar = Object.keys(alanAdlari);

  alanlar.forEach(alanKey => {
    const skorlar = data
      .map(item => {
        // Önce zihinselAlanlar'dan al (1 basamak eşleme oyunu için)
        const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
        if (zihinselAlanlar[alanKey] !== undefined) {
          return zihinselAlanlar[alanKey];
        }
        
        // Eski format kontrolü
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
        if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
          const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
          let toplamSkor = 0;
          let bolumSayisi = 0;
          Object.values(bolumSkorlari).forEach(bolum => {
            if (bolum && bolum.toplam > 0) {
              const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
              toplamSkor += dogruOrani;
              bolumSayisi++;
            }
          });
          if (bolumSayisi > 0) {
            return Math.round(toplamSkor / bolumSayisi);
          }
        }
        
        return 0;
      })
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });

  const siralanmis = Object.entries(alanSkorlari)
    .sort((a, b) => b[1] - a[1]);

  const guclu = siralanmis.filter(([_, skor]) => skor >= 70).slice(0, 5);
  const zayif = siralanmis.filter(([_, skor]) => skor < 50).slice(-5).reverse();

  gucluListe.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<li>${alanAdlari[key] || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";

  zayifListe.innerHTML = zayif.length > 0
    ? zayif.map(([key, skor]) => 
        `<li>${alanAdlari[key] || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";
}

// Eski fonksiyon (geriye uyumluluk için - kullanılmıyor)
function gucluVeZayifAnalizEski(data) {
  const gucluListe = document.getElementById("gucluYonler");
  const zayifListe = document.getElementById("gelistirilecekYonler");
  if (!gucluListe || !zayifListe) return;

  const alanSkorlari = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});

  alanlar.forEach(alanKey => {
    const skorlar = data
      .map(item => {
        // Önce yeni formattan al
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eski format kontrolü (skorlar objesi)
        if (item.skorlar && item.skorlar[alanKey]) {
          return item.skorlar[alanKey];
        }
        
        // Eğer hiç veri yoksa, trials'dan hesapla
        if (item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const total = item.trials.length;
          const dogru = item.trials.filter(t => t.correct).length;
          const accuracy = total > 0 ? dogru / total : 0;
          const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 1000), 0) / total;
          const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
          
          // Alan bazlı skor hesaplama (basit versiyon)
          let skor = 0;
          if (alanKey === "attention") {
            skor = Math.round(accuracy * 60 + reactionScore * 0.4);
          } else if (alanKey === "perception") {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          } else if (alanKey === "executive") {
            skor = Math.round(accuracy * 50 + reactionScore * 0.5);
          } else if (alanKey === "logic") {
            skor = Math.round(accuracy * 80 + reactionScore * 0.2);
          } else {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          }
          return skor;
        }
        
        return 0;
      })
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });

  const siralanmis = Object.entries(alanSkorlari)
    .sort((a, b) => b[1] - a[1]);

  const guclu = siralanmis.filter(([_, skor]) => skor >= 70).slice(0, 5);
  const zayif = siralanmis.filter(([_, skor]) => skor < 50).slice(-5).reverse();

  gucluListe.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<li>${BRAIN_AREAS[key]?.ad || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";

  zayifListe.innerHTML = zayif.length > 0
    ? zayif.map(([key, skor]) => 
        `<li>${BRAIN_AREAS[key]?.ad || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";
}

// -------------------------------------------------------------
// 13) AI ÖNERİ MOTORU
// -------------------------------------------------------------
function aiOneriMotoru(data) {
  const oneriDiv = document.getElementById("aiOneri");
  if (!oneriDiv || data.length === 0) {
    if (oneriDiv) oneriDiv.innerHTML = "<p>Analiz için yeterli veri yok.</p>";
    return;
  }

  // Tüm verilerden AI önerileri oluştur
  let oneriler = [];
  
  // Güçlü ve zayıf alanları belirle
  const alanSkorlari = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});
  
  alanlar.forEach(alanKey => {
    const skorlar = data
      .map(item => {
        // Önce zihinselAlanlar'dan al (1 basamak eşleme oyunu için)
        const zihinselAlanlar = item.oyunDetaylari?.zihinselAlanlar || {};
        if (zihinselAlanlar[alanKey] !== undefined) {
          return zihinselAlanlar[alanKey];
        }
        
        // Eski format kontrolü
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // 1 basamak eşleme oyunu için bolumSkorlari'dan hesaplama (fallback)
        if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") && item.oyunDetaylari?.bolumSkorlari) {
          const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
          let toplamSkor = 0;
          let bolumSayisi = 0;
          Object.values(bolumSkorlari).forEach(bolum => {
            if (bolum && bolum.toplam > 0) {
              const dogruOrani = (bolum.dogru / bolum.toplam) * 100;
              toplamSkor += dogruOrani;
              bolumSayisi++;
            }
          });
          if (bolumSayisi > 0) {
            return Math.round(toplamSkor / bolumSayisi);
          }
        }
        
        return 0;
      })
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });
  
  const siralanmis = Object.entries(alanSkorlari)
    .sort((a, b) => b[1] - a[1]);
  
  const guclu = siralanmis.filter(([_, skor]) => skor >= 70).slice(0, 3);
  const zayif = siralanmis.filter(([_, skor]) => skor < 50).slice(-3).reverse();
  
  // Her alan için öneri oluştur
  zayif.forEach(([alanKey, skor]) => {
    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    let oneri = "";
    
    if (alanKey === "attention" || alanKey === "dikkat") {
      oneri = `Dikkat için: Süreli kısa görevler, dikkat noktası sabitleme çalışmaları önerilir.`;
    } else if (alanKey === "memory" || alanKey === "hafiza") {
      oneri = `Bellek için: Ardışık tekrar oyunları, yönerge takip çalışmaları önerilir.`;
    } else if (alanKey === "perception" || alanKey === "algisal") {
      oneri = `Görsel algı için: Görsel tarama oyunları, şekil-zemin ayırma egzersizleri önerilir.`;
    } else if (alanKey === "executive" || alanKey === "yuruteci") {
      oneri = `Yürütücü işlev için: Planlama oyunları, kural değiştirme çalışmaları önerilir.`;
    } else if (alanKey === "logic" || alanKey === "mantik") {
      oneri = `Mantık için: Örüntü tanıma oyunları, ilişki kurma çalışmaları önerilir.`;
    } else {
      oneri = `${alanAd} için: Bu alana özel oyunlar ve egzersizler önerilir.`;
    }
    
    oneriler.push(`• ${oneri}`);
  });
  
  // Hata türlerine göre öneriler
  const hataToplam = {
    impulsivite: 0,
    karistirma: 0,
    dikkatsizlik: 0,
    kategori_hatasi: 0
  };
  
  data.forEach(item => {
    // Yeni format: hataTurleriDetay (eşleme oyunu için)
    const hatalar = item.oyunDetaylari?.hataTurleriDetay ||
                    item.temel_skor?.hataTurleriDetay || 
                    item.temel_skor?.hataTurleri || 
                    {};
    hataToplam.impulsivite += hatalar.impulsivite || 0;
    hataToplam.karistirma += hatalar.karistirma || 0;
    hataToplam.dikkatsizlik += hatalar.dikkatsizlik || 0;
    hataToplam.kategori_hatasi += hatalar.kategori_hatasi || 0;
  });
  
  const toplamHata = hataToplam.impulsivite + hataToplam.karistirma + hataToplam.dikkatsizlik + hataToplam.kategori_hatasi;
  
  if (toplamHata > 0) {
    const impulsiviteYuzde = Math.round((hataToplam.impulsivite / toplamHata) * 100);
    const dikkatsizlikYuzde = Math.round((hataToplam.dikkatsizlik / toplamHata) * 100);
    
    if (impulsiviteYuzde > 40) {
      oneriler.push(`• İmpulsivite baskın → Daha yavaş tempolu dikkat oyunları önerilir.`);
    }
    if (dikkatsizlikYuzde > 40) {
      oneriler.push(`• Dikkatsizlik baskın → Odaklanma çalışmaları ve süreli görevler önerilir.`);
    }
    
    const karistirmaYuzde = Math.round((hataToplam.karistirma / toplamHata) * 100);
    if (karistirmaYuzde > 40) {
      oneriler.push(`• Karıştırma hatası yüksek → Görsel ayırt etme oyunları, figür-zemin ayırma egzersizleri önerilir.`);
    }
    
    const kategoriHatasiYuzde = Math.round((hataToplam.kategori_hatasi / toplamHata) * 100);
    if (kategoriHatasiYuzde > 30) {
      oneriler.push(`• Kategori hatası yüksek → Sınıflandırma oyunları, kategori eşleme çalışmaları önerilir.`);
    }
  }
  
  // Eşleme oyunu için özel öneriler (bolumSkorlari kontrolü)
  data.forEach(item => {
    if (item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme" || item.oyun === "esleme") {
      const bolumSkorlari = item.oyunDetaylari?.bolumSkorlari || {};
      
      // Bölüm bazlı zayıf alanlar için öneriler
      if (bolumSkorlari.renk && bolumSkorlari.renk.toplam > 0 && 
          bolumSkorlari.renk.dogru / bolumSkorlari.renk.toplam < 0.6) {
        oneriler.push("• Renk eşleme zayıf: Renk ayırt etme oyunları, renk kategorileri çalışmaları önerilir.");
      }
      if (bolumSkorlari.sekil && bolumSkorlari.sekil.toplam > 0 && 
          bolumSkorlari.sekil.dogru / bolumSkorlari.sekil.toplam < 0.6) {
        oneriler.push("• Şekil eşleme zayıf: Şekil tanıma oyunları, görsel kalıp algısı çalışmaları önerilir.");
      }
      if (bolumSkorlari.golge && bolumSkorlari.golge.toplam > 0 && 
          bolumSkorlari.golge.dogru / bolumSkorlari.golge.toplam < 0.6) {
        oneriler.push("• Gölge eşleme zayıf: Figür-zemin ayırma oyunları, görsel algı çalışmaları önerilir.");
      }
      if (bolumSkorlari.parca && bolumSkorlari.parca.toplam > 0 && 
          bolumSkorlari.parca.dogru / bolumSkorlari.parca.toplam < 0.6) {
        oneriler.push("• Parça-bütün eşleme zayıf: Görsel tamamlama oyunları, bütünsel algı çalışmaları önerilir.");
      }
    }
  });
  
  if (oneriler.length === 0) {
    oneriler.push("• Genel performans iyi görünüyor. Düzenli pratik ile gelişim devam edecektir.");
  }
  
  oneriDiv.innerHTML = oneriler.map(o => `<p>${o}</p>`).join("");
}

// -------------------------------------------------------------
// 14) RADAR GRAFİĞİ KARŞILAŞTIRMA
// -------------------------------------------------------------
function compareGrafik(data) {
  try {
    const canvas = document.getElementById("compareChart");
    if (!canvas || data.length < 2) return;

    const sonItem = data.at(-1);
    if (!sonItem) return;
    const son = sonItem.skorlar || {};

    const ort = {
      reaction_speed: avg(data.map(x => x.skorlar?.reaction_speed ?? 0)),
      inhibitory_control: avg(data.map(x => x.skorlar?.inhibitory_control ?? 0)),
      sustained_attention: avg(data.map(x => x.skorlar?.sustained_attention ?? 0))
    };

    drawComparisonChart(canvas, son, ort);

  } catch (err) {
    console.warn("⚠ Radar grafiği çizilemedi:", err);
  }
}

function avg(arr) {
  return arr.length
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : 0;
}

// -------------------------------------------------------------
// 15) EVENTLER
// -------------------------------------------------------------
oyunFiltre?.addEventListener("change", filtrele);
tarihFiltre?.addEventListener("change", filtrele);

// -------------------------------------------------------------
// 16) BAŞLAT
// -------------------------------------------------------------
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  yukleFirestoreGecmis();
} else if (role === ROLES.OGRENCI) {
  yukleOgrenciGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📊 analiz.js yüklendi (v8.0 — Yeni Şema Desteği)");
