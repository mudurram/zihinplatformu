// =============================================================
// 📌 akademik.js — Akademik Performans Analiz Motoru (v8.0)
// Ders–Bilişsel Bağlantı, Tahmini Ders Skorları, AI Öneriler
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

if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
  alert("ℹ Lütfen önce bir öğrenci seçiniz.");
  window.location.href = "teacher_panel.html";
  throw new Error("Öğretmen öğrenci seçmedi.");
}

console.log("🎯 Akademik analiz ekranı yüklendi → Rol:", role);

// -------------------------------------------------------------
// 2) DERS–BİLİŞSEL BAĞLANTI HARİTASI
// -------------------------------------------------------------
const DERS_BAGLANTILARI = {
  turkce: {
    ad: "Türkçe",
    alanlar: ["literacy", "dyslexia", "attention", "comprehension"],
    beceriler: ["okuma", "WPM", "görsel takip", "anlama"],
    renk: "#3498db"
  },
  matematik: {
    ad: "Matematik",
    alanlar: ["math", "logic", "attention", "memory"],
    beceriler: ["mantık", "örüntü", "sayı belleği", "problem çözme"],
    renk: "#16a085"
  },
  fen: {
    ad: "Fen Bilimleri",
    alanlar: ["logic", "comprehension", "executive", "memory"],
    beceriler: ["neden-sonuç", "sıralama", "analiz", "hatırlama"],
    renk: "#e67e22"
  },
  sosyal: {
    ad: "Sosyal Bilgiler",
    alanlar: ["social", "emotional", "comprehension", "memory"],
    beceriler: ["empati", "analiz", "anlama", "sosyal biliş"],
    renk: "#9b59b6"
  }
};

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

    if (!teacherID || !aktifOgrenciId) return;

    const yol = collection(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      aktifOgrenciId,
      "oyunSonuclari"
    );

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
// 4) ANA ANALİZ FONKSİYONU
// =============================================================
function analizEt() {
  const dersKartlariEl = document.getElementById("dersKartlari");
  if (gecmis.length === 0) {
    if (dersKartlariEl) {
      dersKartlariEl.innerHTML = 
        "<p style='text-align:center;color:#999;'>Analiz için yeterli veri yok.</p>";
    }
    return;
  }

  dersKartlariOlustur();
  baglantiTablosuOlustur();
  akademikGucluVeDestek();
  aiAkademikOneri();
  dersSkorlariGrafik();
}

// =============================================================
// 5) DERS KARTLARI (Tahmini Skorlar)
// =============================================================
function dersKartlariOlustur() {
  const container = document.getElementById("dersKartlari");
  if (!container) return;

  let html = "";

  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    const tahminSkor = hesaplaDersSkoru(dersKey, dersInfo);
    const seviye = tahminSkor >= 80 ? "Mükemmel" : 
                   tahminSkor >= 60 ? "İyi" : 
                   tahminSkor >= 40 ? "Orta" : "Geliştirilmeli";

    html += `
      <div class="ders-kart" style="border-left-color: ${dersInfo.renk}">
        <div class="ders-baslik">${dersInfo.ad}</div>
        <div class="tahmin-skor" style="color: ${dersInfo.renk}">
          ${Math.round(tahminSkor)} / 100
        </div>
        <p style="text-align:center;color:#666;">Seviye: <strong>${seviye}</strong></p>
        <ul class="baglanti-listesi">
          ${dersInfo.beceriler.map(beceri => `<li>${beceri}</li>`).join("")}
        </ul>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =============================================================
// 6) DERS SKORU HESAPLAMA
// =============================================================
function hesaplaDersSkoru(dersKey, dersInfo) {
  const ilgiliAlanlar = dersInfo.alanlar;
  
  // Son kayıtlardan ilgili alan skorlarını topla
  const alanSkorlari = {};
  
  if (!Array.isArray(ilgiliAlanlar) || ilgiliAlanlar.length === 0) {
    return 50; // Varsayılan skor
  }

  ilgiliAlanlar.forEach(alanKey => {
    if (!alanKey) return;
    
    const skorlar = gecmis
      .map(item => item.coklu_alan?.[alanKey] || 0)
      .filter(s => s > 0 && !isNaN(s));
    
    alanSkorlari[alanKey] = skorlar.length > 0
      ? skorlar.reduce((a, b) => a + b, 0) / skorlar.length
      : 0;
  });

  // WPM özel kontrolü (Türkçe için)
  if (dersKey === "turkce") {
    const wpmSkorlari = gecmis
      .map(item => item.wpm || 0)
      .filter(w => w > 0);
    
    if (wpmSkorlari.length > 0) {
      const ortalamaWPM = wpmSkorlari.reduce((a, b) => a + b, 0) / wpmSkorlari.length;
      if (!isNaN(ortalamaWPM) && ortalamaWPM > 0) {
        // WPM'i 0-100 skoruna çevir (örnek: 60 WPM = 75 puan)
        const wpmSkor = Math.min(100, Math.max(0, (ortalamaWPM / 80) * 100));
        alanSkorlari.wpm = wpmSkor;
      }
    }
  }

  // Ortalama hesapla
  const skorlar = Object.values(alanSkorlari).filter(s => s > 0 && !isNaN(s));
  if (skorlar.length === 0) return 50; // Varsayılan

  const ortalama = skorlar.reduce((a, b) => a + b, 0) / skorlar.length;
  return isNaN(ortalama) ? 50 : Math.max(0, Math.min(100, ortalama));
}

// =============================================================
// 7) BAĞLANTI TABLOSU
// =============================================================
function baglantiTablosuOlustur() {
  const tbody = document.getElementById("baglantiTabloBody");
  if (!tbody) return;

  let html = "";

  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    const tahminSkor = hesaplaDersSkoru(dersKey, dersInfo);
    
    const alanAdlari = dersInfo.alanlar
      .map(k => BRAIN_AREAS[k]?.ad || k)
      .join(", ");

    const kanit = tahminSkor >= 70
      ? `<span class="guclu-alan">Güçlü bilişsel alanlar → ${dersInfo.ad} başarısı yüksek</span>`
      : tahminSkor >= 50
      ? `Orta seviye bilişsel alanlar → ${dersInfo.ad} başarısı normal`
      : `<span class="destek-alan">Düşük bilişsel alanlar → ${dersInfo.ad} için destek gerekli</span>`;

    html += `
      <tr>
        <td><strong>${dersInfo.ad}</strong></td>
        <td>${alanAdlari}</td>
        <td>${dersInfo.beceriler.join(", ")}</td>
        <td>${kanit}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// =============================================================
// 8) AKADEMİK GÜÇLÜ VE DESTEK ALANLARI
// =============================================================
function akademikGucluVeDestek() {
  const gucluDiv = document.getElementById("akademikGuclu");
  const destekDiv = document.getElementById("akademikDestek");
  if (!gucluDiv || !destekDiv) return;

  const dersSkorlari = {};
  Object.keys(DERS_BAGLANTILARI).forEach(dersKey => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, DERS_BAGLANTILARI[dersKey]);
  });

  const siralanmis = Object.entries(dersSkorlari).sort((a, b) => b[1] - a[1]);
  const guclu = siralanmis.filter(([_, skor]) => skor >= 70);
  const destek = siralanmis.filter(([_, skor]) => skor < 50);

  gucluDiv.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<p class="guclu-alan">✅ ${DERS_BAGLANTILARI[key].ad}: ${Math.round(skor)}/100</p>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";

  destekDiv.innerHTML = destek.length > 0
    ? destek.map(([key, skor]) => 
        `<p class="destek-alan">📈 ${DERS_BAGLANTILARI[key].ad}: ${Math.round(skor)}/100 - Destek önerilir</p>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";
}

// =============================================================
// 9) AI AKADEMİK ÖNERİ
// =============================================================
function aiAkademikOneri() {
  const oneriDiv = document.getElementById("aiAkademikOneri");
  if (!oneriDiv || gecmis.length === 0) {
    if (oneriDiv) oneriDiv.innerHTML = "<p>Analiz için yeterli veri yok.</p>";
    return;
  }

  const dersSkorlari = {};
  Object.keys(DERS_BAGLANTILARI).forEach(dersKey => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, DERS_BAGLANTILARI[dersKey]);
  });

  const enDusukDers = Object.entries(dersSkorlari)
    .sort((a, b) => a[1] - b[1])[0];

  const oneriler = [];

  if (enDusukDers && enDusukDers[1] < 50) {
    const dersInfo = DERS_BAGLANTILARI[enDusukDers[0]];
    oneriler.push(
      `📚 <strong>${dersInfo.ad}</strong> dersinde destek önerilir. ` +
      `İlgili zihin alanları: ${dersInfo.alanlar.map(k => BRAIN_AREAS[k]?.ad || k).join(", ")}. ` +
      `Bu alanlara yönelik oyunlar oynayarak gelişim sağlanabilir.`
    );
  }

  const enYuksekDers = Object.entries(dersSkorlari)
    .sort((a, b) => b[1] - a[1])[0];

  if (enYuksekDers && enYuksekDers[1] >= 70) {
    oneriler.push(
      `✅ <strong>${DERS_BAGLANTILARI[enYuksekDers[0]].ad}</strong> dersinde güçlü performans görülüyor. ` +
      `Bu başarıyı korumak için düzenli pratik yapılmalı.`
    );
  }

  oneriler.push(
    `💡 Genel öneri: Tüm derslerde başarı için dikkat, hafıza ve mantıksal düşünme alanlarını geliştirmek önemlidir. ` +
    `Platformdaki oyunları düzenli oynayarak bu alanlar güçlendirilebilir.`
  );

  oneriDiv.innerHTML = `<p>${oneriler.join("<br><br>")}</p>`;
}

// =============================================================
// 10) DERS SKORLARI GRAFİĞİ
// =============================================================
function dersSkorlariGrafik() {
  try {
    const canvas = document.getElementById("dersSkorlariChart");
    if (!canvas || !window.Chart) return;

    const dersler = Object.keys(DERS_BAGLANTILARI);
    const labels = dersler.map(k => DERS_BAGLANTILARI[k].ad);
    const skorlar = dersler.map(k => 
      Math.round(hesaplaDersSkoru(k, DERS_BAGLANTILARI[k]))
    );
    const renkler = dersler.map(k => DERS_BAGLANTILARI[k].renk);

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Tahmini Ders Skorları",
          data: skorlar,
          backgroundColor: renkler,
          borderRadius: 8
        }]
      },
      options: {
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Ders skorları grafiği çizilemedi:", err);
  }
}

// =============================================================
// 11) BAŞLAT
// =============================================================
if (role === ROLES.OGRETMEN) {
  yukleFirestoreGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📚 akademik.js yüklendi (v8.0)");

