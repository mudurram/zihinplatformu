// =============================================================
// 📌 gelisim.js — Tarihsel Gelişim Analiz Motoru (v8.0)
// Günlük/Haftalık/Aylık Gelişim, Trend Analizi, Ay Ay Karşılaştırma
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
    alanFiltreleriDoldur();
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

  genelTrendGrafik(zamanTipi, secilenAlan);
  alanGrafikleri(zamanTipi, secilenAlan);
  tarihTablosu(zamanTipi);
  ayAyKarsilastirma();
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
    tbody.innerHTML = "<tr><td colspan='7'>Veri bulunamadı.</td></tr>";
    return;
  }

  let html = "";
  filtered.forEach((item, index) => {
    const onceki = index > 0 ? filtered[index - 1] : null;
    const trend = hesaplaTrend(item, onceki);
    const oyunAdi = GLOBAL.GAME_MAP?.[item.oyun]?.ad || 
                   GLOBAL.OYUN_ADLARI?.[item.oyun] ||
                   item.oyun;
    const moduller = item.moduller || item.coklu_alan ? Object.keys(item.coklu_alan || {}).join(", ") : "-";
    const genelSkor = item.coklu_alan && Object.keys(item.coklu_alan).length > 0
      ? Math.round(Object.values(item.coklu_alan).reduce((a, b) => a + b, 0) / Object.keys(item.coklu_alan).length)
      : item.skorlar ? Math.round((item.skorlar.reaction_speed + item.skorlar.inhibitory_control + item.skorlar.sustained_attention) / 3) : 0;

    html += `
      <tr>
        <td>${item.tarih ? new Date(item.tarih).toLocaleDateString("tr-TR") : "Tarih bilinmiyor"}</td>
        <td>${oyunAdi}</td>
        <td>${moduller}</td>
        <td>${genelSkor}</td>
        <td>${item.wpm || "-"}</td>
        <td>${item.temel_skor?.ogrenmeHizi || "-"}</td>
        <td>${trend}</td>
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
if (role === ROLES.OGRETMEN) {
  yukleFirestoreGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📈 gelisim.js yüklendi (v8.0)");

