// ==========================================================
// 🎯 2. Basamak - Renk Ayırt Etme Oyunu
// Final v6.7 — Zihin Platformu ile %100 uyumlu
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";
import { GameEngine } from "../../engine/gameEngine.js";

// ==========================================================
// 🎨 RENK HAVUZU
// ==========================================================
const RENKLER = [
  { ad: "Kırmızı", kod: "#e53935" },
  { ad: "Mavi", kod: "#2962ff" },
  { ad: "Yeşil", kod: "#43a047" },
  { ad: "Sarı", kod: "#fdd835" },
  { ad: "Mor", kod: "#8e24aa" },
  { ad: "Turuncu", kod: "#fb8c00" },
  { ad: "Kahverengi", kod: "#6d4c41" },
  { ad: "Pembe", kod: "#f06292" }
];

// ==========================================================
// 🔊 SESLER
// ==========================================================
const dogruSes = new Audio(GLOBAL.SES.DOGRU);
const yanlisSes = new Audio(GLOBAL.SES.YANLIS);

// ==========================================================
// 🎮 GAME ENGINE BAŞLAT
// ==========================================================
// Oyun meta bilgisini al
const gameMeta = GLOBAL.GAME_MAP?.[GLOBAL.OYUN_KODLARI.AYIRT_ETME] || null;

let engine = new GameEngine({
  gameName: GLOBAL.OYUN_KODLARI.AYIRT_ETME,
  timeLimit: 30,
  gameMeta: gameMeta
});

// ==========================================================
// 🎬 SEVİYE POPUP
// ==========================================================
let secenekSayisi = 2;

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("seviyePopup");
  if (popup) popup.classList.add("show");

  document.querySelectorAll(".seviyeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      secenekSayisi = Number(btn.dataset.seviye);
      if (popup) popup.classList.remove("show");
      oyunBaslat();
    });
  });

  const bitirBtn = document.getElementById("bitirBtn");
  if (bitirBtn) {
    bitirBtn.onclick = () => engine.endGame();
  }
});

// ==========================================================
// ▶️ OYUN BAŞLAT
// ==========================================================
function oyunBaslat() {
  engine.start(updateUI);
  yeniSoru();
}

// ==========================================================
// 🔄 UI Güncelleme
// ==========================================================
function updateUI(score, mistakes, timeLeft) {
  const skorEl = document.getElementById("skor");
  const yanlisEl = document.getElementById("yanlis");
  const sureEl = document.getElementById("sure");
  
  if (skorEl) skorEl.textContent = score;
  if (yanlisEl) yanlisEl.textContent = mistakes;
  if (sureEl) sureEl.textContent = timeLeft;
}

// ==========================================================
// 🎲 Rastgele Renk
// ==========================================================
function rastgeleRenk() {
  return RENKLER[Math.floor(Math.random() * RENKLER.length)];
}

// ==========================================================
// 🟦 Yeni Soru Oluştur
// ==========================================================
let soruStart = 0;

function yeniSoru() {
  const zemin = rastgeleRenk();
  let yaziRenk = rastgeleRenk();

  while (yaziRenk.ad === zemin.ad) {
    yaziRenk = rastgeleRenk();
  }

  // Hedef kutu
  const hedef = document.getElementById("hedefKutu");
  if (hedef) hedef.style.backgroundColor = zemin.kod;

  const kelimeEl = document.getElementById("renkYazi");
  if (kelimeEl) {
    kelimeEl.textContent = yaziRenk.ad;
    kelimeEl.style.color = yaziRenk.kod;
  }

  // Tepki süresi başlangıcı
  soruStart = performance.now();

  // Seçenekler
  let secenekler = [...RENKLER]
    .sort(() => Math.random() - 0.5)
    .slice(0, secenekSayisi);

  if (!secenekler.find(x => x.ad === zemin.ad)) {
    secenekler[0] = zemin;
  }

  const alan = document.getElementById("secenekAlani");
  if (!alan) return;
  
  alan.innerHTML = "";

  secenekler.forEach(renk => {
    const btn = document.createElement("button");
    btn.className = "renk-btn";
    btn.style.backgroundColor = renk.kod;
    btn.textContent = renk.ad;

    btn.onclick = () => cevapVer(renk, zemin);

    alan.appendChild(btn);
  });
}

// ==========================================================
// 🟩 Cevabı Kontrol Et
// ==========================================================
function cevapVer(renk, zemin) {
  const tepki = Math.round(performance.now() - soruStart);

  const dogruMu = renk.ad === zemin.ad;

  if (dogruMu) {
    dogruSes.currentTime = 0;
    dogruSes.play();
  } else {
    yanlisSes.currentTime = 0;
    yanlisSes.play();
  }

  // GAME ENGINE Trial Kaydı
  engine.recordTrial({
    correct: dogruMu,
    reaction_ms: tepki,
    hedefRenk: zemin.ad, // Hedef renk (zemin rengi)
    secilenRenk: renk.ad, // Seçilen renk
    renkKodu: zemin.kod // Renk kodu (görselleştirme için)
  });

  yeniSoru();
}

// ==========================================================
// Dışarıya endGame aç
// ==========================================================
window.endGame = () => engine.endGame();