// ==================================================================
// 📌 Zihin Platformu — Ortak Sonuç JS (Final v7.1 Ultra Stabil)
// FULL GLOBAL UYUMLU — Tüm mimari korunmuştur
// ==================================================================

import { GLOBAL, ROLES } from "./globalConfig.js";

// -------------------------------------------------------------
// 1) 📌 Rol & Öğrenci Erişim Kontrolü
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");

// Öğretmen → öğrenci seçmeden sonuç ekranına giremez
if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
  alert("ℹ Önce bir öğrenci seçmeniz gerekiyor.");
  window.location.href = "teacher_panel.html";
  throw new Error("Öğretmen öğrenci seçmeden sonuç ekranına erişemez.");
}

// Admin & Editor sonuç ekranına giremez
if (role === ROLES.ADMIN || role === ROLES.EDITOR) {
  alert("⛔ Bu ekran admin/editor için kapalıdır.");
  window.location.href = "index.html";
  throw new Error("Admin/Editor yetkisiz sonuç ekranı erişimi.");
}

// -------------------------------------------------------------
// 2) 📌 Yerel Oyun Geçmişi → Son Kayıt
// -------------------------------------------------------------
let gecmis;

try {
  gecmis = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
  if (!Array.isArray(gecmis)) throw 0;
} catch {
  console.warn("⚠ oyunGecmisi bozuk → sıfırlandı.");
  gecmis = [];
}

const son = gecmis.at(-1);

if (!son) {
  alert("Henüz bir oyun sonucu kayıtlı değil.");
  window.location.href = "index.html";
  throw new Error("Sonuç bulunamadı.");
}

// -------------------------------------------------------------
// 3) 📌 Oyun Adı
// -------------------------------------------------------------
const oyunKod = son.oyun || "bilinmiyor";

const oyunAdi =
  GLOBAL.OYUN_ADLARI?.[oyunKod] ||
  oyunKod.replace(/_/g, " ").toUpperCase() ||
  "Oyun Sonucu";

const oyunBaslikEl = document.getElementById("oyunBaslik");
if (oyunBaslikEl) oyunBaslikEl.textContent = oyunAdi;

// -------------------------------------------------------------
// 4) 📌 Temel Skor Bilgileri
// -------------------------------------------------------------
document.getElementById("dogru").textContent = son.dogru ?? 0;
document.getElementById("yanlis").textContent = son.yanlis ?? 0;

document.getElementById("tarih").textContent =
  new Date(son.tarih).toLocaleString("tr-TR");

// -------------------------------------------------------------
// 5) 📌 Bilişsel Skorlar (Pad & Stabil)
// -------------------------------------------------------------
const skor = son.skorlar || {};

const reaction = Math.round(skor.reaction_speed ?? 0);
const inhib    = Math.round(skor.inhibitory_control ?? 0);
const sustain  = Math.round(skor.sustained_attention ?? 0);

document.getElementById("reactionSpeed").textContent = `${reaction} / 100`;
document.getElementById("inhibControl").textContent = `${inhib} / 100`;
document.getElementById("sustainedAttention").textContent = `${sustain} / 100`;

// -------------------------------------------------------------
// 6) 📊 Bar Grafik — Doğru / Yanlış
// -------------------------------------------------------------
const skorCanvas = document.getElementById("skorGrafik");

if (skorCanvas && window.Chart) {
  new Chart(skorCanvas, {
    type: "bar",
    data: {
      labels: ["Doğru", "Yanlış"],
      datasets: [
        {
          data: [son.dogru ?? 0, son.yanlis ?? 0],
          backgroundColor: ["#4A90E2", "#E53935"],
          borderRadius: 8
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// -------------------------------------------------------------
// 7) 🧭 Radar Grafik — Bilişsel Profil
// -------------------------------------------------------------
const radarCanvas = document.getElementById("radarGrafik");

if (radarCanvas && window.Chart) {

  // Retina desteği
  const scale = (window.devicePixelRatio || 1) * 1.25;
  radarCanvas.width = radarCanvas.clientWidth * scale;
  radarCanvas.height = radarCanvas.clientHeight * scale;
  radarCanvas.getContext("2d").scale(scale, scale);

  new Chart(radarCanvas, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
      datasets: [
        {
          label: "Bilişsel Profil",
          data: [reaction, inhib, sustain],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  });
}

// -------------------------------------------------------------
// 8) 🧑‍🏫 Öğretmen Yorumu (READ-ONLY)
// -------------------------------------------------------------
const yorumInput = document.getElementById("ogretmenYorumMetin");
const yorumKey = "ogretmenYorumu_" + oyunKod;

if (yorumInput) {
  yorumInput.value = localStorage.getItem(yorumKey) || "";
  yorumInput.readOnly = true;
}

// -------------------------------------------------------------
// 9) 🔁 Tekrar Oyna — Global Path ile Yönlendirme
// -------------------------------------------------------------
const tekrarBtn = document.getElementById("tekrarBtn");

if (tekrarBtn) {
  tekrarBtn.onclick = () => {
    const path = GLOBAL.OYUN_YOLLARI?.[oyunKod];
    if (!path) return alert("Bu oyunun yönlendirme yolu bulunamadı!");
    window.location.href = path;
  };
}

console.log("📘 sonuc.js yüklendi (Final v7.1 — Ultra Stabil & GLOBAL Tam Uyumlu)");