// =============================================================
// 📌 profil.js — Tam Öğrenci Profili Analiz Motoru (v1.0)
// Tüm analizlerin birleştirildiği büyük özet
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS } from "./globalConfig.js";
import { db } from "../data/firebaseConfig.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------------------------------------
// 1) ROL & ÖĞRENCİ ERİŞİM KONTROLÜ
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid");
const institutionID = localStorage.getItem("institutionID");

// Öğretmen, Kurum ve Admin için öğrenci seçimi kontrolü
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  if (role === ROLES.OGRETMEN) {
    alert("ℹ Lütfen önce bir öğrenci seçiniz.");
    window.location.href = "teacher_panel.html";
  } else if (role === ROLES.INSTITUTION) {
    alert("ℹ Lütfen önce bir öğrenci seçiniz.");
    window.location.href = "institution_panel.html";
  } else if (role === ROLES.ADMIN) {
    alert("ℹ Lütfen önce bir öğrenci seçiniz.");
    window.location.href = "admin_panel.html";
  }
  throw new Error("Öğrenci seçilmedi.");
}

console.log("🎯 Tam öğrenci profili ekranı yüklendi → Rol:", role);

let gecmis = [];

// =============================================================
// 2) VERİ YÜKLEME
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    if (!aktifOgrenciId) return;

    let yol = null;

    // Öğretmen için: profiles/{teacherID}/ogrenciler/{ogrenciID}/oyunSonuclari
    if (role === ROLES.OGRETMEN && teacherID) {
      yol = collection(
        db,
        "profiles",
        teacherID,
        "ogrenciler",
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
        console.log("📥 Firestore geçmiş yüklendi (öğrenci - profil):", gecmis.length, "kayıt");
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
    analizEt();
  } catch {
    console.warn("⚠ LocalStorage geçmiş bozuk.");
    gecmis = [];
    analizEt();
  }
}

// =============================================================
// 3) ANA ANALİZ FONKSİYONU
// =============================================================
function analizEt() {
  if (gecmis.length === 0) {
    document.getElementById("alanTabloBody").innerHTML = 
      "<tr><td colspan='4'>Analiz için yeterli veri yok.</td></tr>";
    return;
  }

  radarGrafik();
  alanTablo();
  ogrenmeHiziProfil();
  gucluVeZayifYonler();
  akademikProfil();
  sosyalDuygusalProfil();
  gunlukHayatEtkisi();
  aiGelisimPlani();
}

// =============================================================
// 4) 12 ALAN RADAR GRAFİĞİ
// =============================================================
function radarGrafik() {
  try {
    const canvas = document.getElementById("radarChart");
    if (!canvas || !window.Chart || gecmis.length === 0) {
      console.warn("⚠ Radar grafiği için veri yok");
      return;
    }

    const alanSkorlari = {};
    const alanlar = Object.keys(BRAIN_AREAS || {});

    alanlar.forEach(alanKey => {
      const skorlar = gecmis
        .map(item => {
          if (item.coklu_alan && item.coklu_alan[alanKey]) {
            return item.coklu_alan[alanKey];
          }
          if (item.skorlar && item.skorlar[alanKey]) {
            return item.skorlar[alanKey];
          }
          return 0;
        })
        .filter(s => s > 0);
        
      alanSkorlari[alanKey] = skorlar.length > 0 
        ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
        : 0;
    });
    
    const labels = alanlar.map(k => BRAIN_AREAS[k]?.ad || k);
    const values = alanlar.map(k => alanSkorlari[k]);

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "radar",
      data: {
        labels: labels.slice(0, 12),
        datasets: [{
          label: "Zihin Alanları",
          data: values.slice(0, 12),
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

// =============================================================
// 5) ALAN TABLOSU
// =============================================================
function alanTablo() {
  const tbody = document.getElementById("alanTabloBody");
  if (!tbody) return;

  const alanlar = Object.keys(BRAIN_AREAS || {});
  let html = "";

  alanlar.forEach(alanKey => {
    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    const skorlar = gecmis
      .map(item => {
        // Önce coklu_alan'dan al
        if (item.coklu_alan?.[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eşleme oyunu için özel işleme: bolumSkorlari'dan hesapla
        if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme") && item.oyunDetaylari?.bolumSkorlari) {
          const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
          
          // Alan bazlı bölüm skorlarını topla
          if (alanKey === "perception" || alanKey === "algisal_islemleme") {
            const toplam = (bolumSkorlari.sekil?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0) + 
                          (bolumSkorlari.parca?.toplam || 0);
            const dogru = (bolumSkorlari.sekil?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0) + 
                         (bolumSkorlari.parca?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "attention" || alanKey === "dikkat") {
            const toplam = (bolumSkorlari.renk?.toplam || 0) + 
                          (bolumSkorlari.sekil?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0) + 
                          (bolumSkorlari.parca?.toplam || 0);
            const dogru = (bolumSkorlari.renk?.dogru || 0) + 
                         (bolumSkorlari.sekil?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0) + 
                         (bolumSkorlari.parca?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "logic" || alanKey === "mantik") {
            const toplam = (bolumSkorlari.parca?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0);
            const dogru = (bolumSkorlari.parca?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "literacy" || alanKey === "okuma") {
            const toplam = (bolumSkorlari.renk?.toplam || 0) + 
                          (bolumSkorlari.sekil?.toplam || 0);
            const dogru = (bolumSkorlari.renk?.dogru || 0) + 
                         (bolumSkorlari.sekil?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "social" || alanKey === "sosyal") {
            if (bolumSkorlari.golge && bolumSkorlari.golge.toplam > 0) {
              return Math.round((bolumSkorlari.golge.dogru / bolumSkorlari.golge.toplam) * 100);
            }
          }
        }
        
        return 0;
      })
      .filter(s => s > 0);
    
    const skor = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
    
    const seviye = skor >= 70 ? "Yüksek" : skor >= 50 ? "Orta" : "Düşük";
    const seviyeRenk = skor >= 70 ? "#4caf50" : skor >= 50 ? "#ff9800" : "#f44336";
    const gunlukHayat = BRAIN_AREAS[alanKey]?.gunlukHayat || "-";

    html += `<tr>
      <td><strong>${alanAd}</strong></td>
      <td>${skor} / 100</td>
      <td style="color:${seviyeRenk};font-weight:600;">${seviye}</td>
      <td>${gunlukHayat}</td>
    </tr>`;
  });

  tbody.innerHTML = html || "<tr><td colspan='4'>Veri bulunamadı.</td></tr>";
}

// =============================================================
// 6) ÖĞRENME HIZI PROFİLİ
// =============================================================
function ogrenmeHiziProfil() {
  try {
    const canvas = document.getElementById("ogrenmeHiziChart");
    const bilgiDiv = document.getElementById("ogrenmeHiziBilgi");
    if (!canvas || !window.Chart || gecmis.length === 0) return;

    const ogrenmeHizlari = gecmis
      .map(item => {
        const hiz = item.temel_skor?.ogrenmeHizi || 
                   item.temel_skor?.learning_velocity ||
                   item.ogrenmeHizi ||
                   item.learning_velocity ||
                   null;
        return hiz;
      })
      .filter(h => h !== null && !isNaN(h));

    if (ogrenmeHizlari.length === 0) {
      if (bilgiDiv) bilgiDiv.innerHTML = "<p>Öğrenme hızı verisi bulunamadı.</p>";
      return;
    }

    const labels = gecmis
      .filter((item, index) => {
        const hiz = item.temel_skor?.ogrenmeHizi || item.ogrenmeHizi || null;
        return hiz !== null && !isNaN(hiz);
      })
      .map((item, index) => `Oyun ${index + 1}`);

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Öğrenme Hızı",
          data: ogrenmeHizlari,
          borderColor: "#4a90e2",
          backgroundColor: "rgba(74, 144, 226, 0.1)",
          borderWidth: 2,
          fill: true
        }]
      },
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

    const ortalama = Math.round(ogrenmeHizlari.reduce((a, b) => a + b, 0) / ogrenmeHizlari.length);
    if (bilgiDiv) {
      bilgiDiv.innerHTML = `<p><strong>Ortalama Öğrenme Hızı:</strong> ${ortalama} / 100</p>`;
    }
  } catch (err) {
    console.warn("⚠ Öğrenme hızı grafiği çizilemedi:", err);
  }
}

// =============================================================
// 7) GÜÇLÜ VE ZAYIF YÖNLER
// =============================================================
function gucluVeZayifYonler() {
  const gucluDiv = document.getElementById("gucluYonler");
  const zayifDiv = document.getElementById("gelistirilecekYonler");
  if (!gucluDiv || !zayifDiv) return;

  const alanSkorlari = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});

  alanlar.forEach(alanKey => {
    const skorlar = gecmis
      .map(item => item.coklu_alan?.[alanKey] || 0)
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });

  const siralanmis = Object.entries(alanSkorlari)
    .sort((a, b) => b[1] - a[1]);

  const guclu = siralanmis.filter(([_, skor]) => skor >= 70).slice(0, 5);
  const zayif = siralanmis.filter(([_, skor]) => skor < 50).slice(-5).reverse();

  gucluDiv.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<div style="padding:8px; margin:5px 0; background:#e8f5e9; border-left:4px solid #4caf50; border-radius:6px;">
          <strong>${BRAIN_AREAS[key]?.ad || key}:</strong> ${skor}/100
        </div>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";

  zayifDiv.innerHTML = zayif.length > 0
    ? zayif.map(([key, skor]) => 
        `<div style="padding:8px; margin:5px 0; background:#ffebee; border-left:4px solid #f44336; border-radius:6px;">
          <strong>${BRAIN_AREAS[key]?.ad || key}:</strong> ${skor}/100 - Geliştirilmeli
        </div>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";
}

// =============================================================
// 8) AKADEMİK PROFİL
// =============================================================
function akademikProfil() {
  const div = document.getElementById("akademikProfil");
  if (!div) return;

  // Ders bağlantıları
  const DERS_BAGLANTILARI = {
    turkce: { ad: "Türkçe", alanlar: ["literacy", "dyslexia", "attention", "comprehension"] },
    matematik: { ad: "Matematik", alanlar: ["math", "logic", "attention", "memory"] },
    fen: { ad: "Fen Bilimleri", alanlar: ["logic", "comprehension", "executive", "memory"] },
    sosyal: { ad: "Sosyal Bilgiler", alanlar: ["social", "emotional", "comprehension", "memory"] }
  };

  let html = "";
  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    const ilgiliAlanlar = dersInfo.alanlar;
    const alanSkorlari = {};
    
    ilgiliAlanlar.forEach(alanKey => {
      const skorlar = gecmis
        .map(item => item.coklu_alan?.[alanKey] || 0)
        .filter(s => s > 0);
      alanSkorlari[alanKey] = skorlar.length > 0
        ? skorlar.reduce((a, b) => a + b, 0) / skorlar.length
        : 0;
    });

    const skorlar = Object.values(alanSkorlari).filter(s => s > 0);
    const tahminSkor = skorlar.length > 0
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 50;

    html += `<div style="padding:10px; margin:8px 0; background:#f0f8ff; border-left:4px solid #4a90e2; border-radius:6px;">
      <strong>${dersInfo.ad}:</strong> ${tahminSkor}/100 (Tahmini)
    </div>`;
  });

  div.innerHTML = html || "<p>Akademik profil verisi bulunamadı.</p>";
}

// =============================================================
// 9) SOSYAL-DUYGUSAL PROFİL
// =============================================================
function sosyalDuygusalProfil() {
  const div = document.getElementById("sosyalDuygusalProfil");
  if (!div) return;

  const sosyalAlanlar = ["social", "emotional"];
  let html = "";

  sosyalAlanlar.forEach(alanKey => {
    const skorlar = gecmis
      .map(item => item.coklu_alan?.[alanKey] || 0)
      .filter(s => s > 0);
    
    const skor = skorlar.length > 0
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;

    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    html += `<div style="padding:10px; margin:8px 0; background:#fff3e0; border-left:4px solid #ff9800; border-radius:6px;">
      <strong>${alanAd}:</strong> ${skor}/100
    </div>`;
  });

  div.innerHTML = html || "<p>Sosyal-duygusal profil verisi bulunamadı.</p>";
}

// =============================================================
// 10) GÜNLÜK HAYAT ETKİSİ
// =============================================================
function gunlukHayatEtkisi() {
  const div = document.getElementById("gunlukHayatEtkisi");
  if (!div) return;

  const etkiler = [
    "Karar verme hızı ve doğruluğu",
    "Dikkat kalitesi ve odaklanma",
    "Görsel ayırt etme becerisi",
    "Problem çözme yeteneği",
    "Akran ilişkileri ve sosyal uygunluk",
    "Okuma ve anlama becerileri",
    "Yönerge takip kapasitesi"
  ];

  let html = "<ul style='list-style:none; padding:0;'>";
  etkiler.forEach(etki => {
    html += `<li style="padding:8px; margin:5px 0; background:#f5f5f5; border-radius:6px;">
      💡 ${etki}
    </li>`;
  });
  html += "</ul>";

  div.innerHTML = html;
}

// =============================================================
// 11) AI GELİŞİM PLANI
// =============================================================
function aiGelisimPlani() {
  const div = document.getElementById("aiGelisimPlani");
  if (!div) return;

  // Güçlü ve zayıf alanları belirle
  const alanSkorlari = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});

  alanlar.forEach(alanKey => {
    const skorlar = gecmis
      .map(item => item.coklu_alan?.[alanKey] || 0)
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });

  const zayif = Object.entries(alanSkorlari)
    .filter(([_, skor]) => skor < 50)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  let html = "<h4 style='margin-top:0;'>📋 1-4 Haftalık Kişisel Gelişim Programı</h4>";
  
  if (zayif.length > 0) {
    html += "<p><strong>Odaklanılacak Alanlar:</strong></p><ul>";
    zayif.forEach(([key, skor]) => {
      const alanAd = BRAIN_AREAS[key]?.ad || key;
      html += `<li><strong>${alanAd}</strong> (${skor}/100) - Bu alana özel oyunlar ve egzersizler önerilir.</li>`;
    });
    html += "</ul>";
  } else {
    html += "<p>Tüm alanlar iyi seviyede. Düzenli pratik ile gelişim devam edecektir.</p>";
  }

  html += "<p style='margin-top:15px;'><strong>Beklenen Kazanımlar:</strong></p>";
  html += "<ul>";
  html += "<li>Dikkat ve odaklanma becerilerinde artış</li>";
  html += "<li>Görsel işleme hızında iyileşme</li>";
  html += "<li>Problem çözme yeteneğinde gelişim</li>";
  html += "<li>Akademik performansta pozitif etki</li>";
  html += "</ul>";

  div.innerHTML = html;
}

// =============================================================
// 12) BAŞLAT
// =============================================================
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  yukleFirestoreGecmis();
} else if (role === ROLES.OGRENCI) {
  yukleOgrenciGecmis();
} else {
  yukleLocalGecmis();
}

console.log("👤 profil.js yüklendi (v1.0)");

