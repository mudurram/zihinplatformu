// ==========================================================
// 🎯 2. Basamak - Renk Ayırt Etme Oyunu (Stabil Final Sürüm)
// ==========================================================

import { GLOBAL } from "../../platform/globalConfig.js";
import { db } from "../../data/firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🎨 RENK HAVUZU
// ===============================
const renkler = [
  { ad: "Kırmızı", kod: "#e53935" },
  { ad: "Mavi", kod: "#2962ff" },
  { ad: "Yeşil", kod: "#43a047" },
  { ad: "Sarı", kod: "#fdd835" },
  { ad: "Mor", kod: "#8e24aa" },
  { ad: "Turuncu", kod: "#fb8c00" },
  { ad: "Kahverengi", kod: "#6d4c41" },
  { ad: "Pembe", kod: "#f06292" }
];

// ===============================
// 🔊 SESLER
// ===============================
const dogruSes = new Audio(GLOBAL.PATHS.SES_DOGRU);
const yanlisSes = new Audio(GLOBAL.PATHS.SES_YANLIS);

// ===============================
// 🔢 OYUN DEĞİŞKENLERİ
// ===============================
let secenekSayisi = 2;
let score = 0;
let mistakes = 0;
let sure = 30;
let timer;
let trials = [];
let soruBaslangic = 0;

// ===============================
// 🎬 SAYFA YÜKLENİNCE POPUP AÇILSIN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("seviyePopup");
  popup.classList.add("show");

  document.querySelectorAll(".seviyeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      secenekSayisi = Number(btn.dataset.seviye);
      popup.classList.remove("show");
      baslat();
    });
  });

  document.getElementById("bitirBtn").onclick = () => endGame();
});

// ===============================
// 🎮 OYUN BAŞLAT
// ===============================
function baslat() {
  score = 0;
  mistakes = 0;
  sure = 30;
  trials = [];

  document.getElementById("skor").textContent = score;
  document.getElementById("yanlis").textContent = mistakes;
  document.getElementById("sure").textContent = sure;

  clearInterval(timer);
  timer = setInterval(() => {
    sure--;
    document.getElementById("sure").textContent = sure;
    if (sure <= 0) endGame();
  }, 1000);

  yeniSoru();
}

// ===============================
// 🟦 YENİ SORU
// ===============================
function yeniSoru() {
  const zemin = rastgeleRenk();
  let yaziRenk = rastgeleRenk();

  while (yaziRenk.ad === zemin.ad) {
    yaziRenk = rastgeleRenk();
  }

  document.getElementById("hedefKutu").style.backgroundColor = zemin.kod;
  const kelime = document.getElementById("renkYazi");
  kelime.textContent = yaziRenk.ad;
  kelime.style.color = yaziRenk.kod;

  soruBaslangic = Date.now();

  let secenekler = [...renkler]
    .sort(() => Math.random() - 0.5)
    .slice(0, secenekSayisi);

  if (!secenekler.includes(zemin)) secenekler[0] = zemin;

  const alan = document.getElementById("secenekAlani");
  alan.innerHTML = "";

  secenekler.forEach(renk => {
    let btn = document.createElement("button");
    btn.className = "renk-btn";
    btn.style.backgroundColor = renk.kod;
    btn.textContent = renk.ad;

    btn.onclick = () => cevapVer(renk, zemin);

    alan.appendChild(btn);
  });
}

// ===============================
// 🟩 CEVABI KONTROL ET
// ===============================
function cevapVer(renk, zemin) {
  let tepki = Date.now() - soruBaslangic;
  let dogruMu = renk.ad === zemin.ad;

  trials.push({
    stimulus: zemin.ad,
    response: renk.ad,
    correct: dogruMu,
    reaction_time_ms: tepki,
    timestamp: new Date().toISOString()
  });

  if (dogruMu) {
    dogruSes.currentTime = 0;
    dogruSes.play();
    score++;
  } else {
    yanlisSes.currentTime = 0;
    yanlisSes.play();
    mistakes++;
  }

  document.getElementById("skor").textContent = score;
  document.getElementById("yanlis").textContent = mistakes;

  yeniSoru();
}

function rastgeleRenk() {
  return renkler[Math.floor(Math.random() * renkler.length)];
}

// ===============================
// 🟥 OYUN BİTİR
// ===============================
async function endGame() {
  clearInterval(timer);

  // 📌 BECERİSEL HESAPLAMALAR
  const avg = arr => arr.length
    ? Math.round(arr.reduce((x, y) => x + y, 0) / arr.length)
    : 0;

  let skorlar = {
    reaction_speed: avg(trials.map(t => 1000 - t.reaction_time_ms)),
    sustained_attention: Math.round((score / (score + mistakes)) * 100) || 0,
    inhibitory_control: Math.round((score / (score + mistakes)) * 100) || 0,
  };

  // 📌 ORTAK SONUÇ FORMATINI OLUŞTUR
  const data = {
    game: "renk_ayirt_etme",
    level: secenekSayisi,
    dogru: score,
    yanlis: mistakes,
    sure: 30 - sure,
    tarih: new Date().toISOString(),
    beceriler: skorlar,
    trials
  };

  // 📌 LOCAL STORAGE YEDEĞİ
  let gecmis = JSON.parse(localStorage.getItem(GLOBAL.KEYS.GAME_HISTORY)) || [];
  gecmis.push(data);
  localStorage.setItem(GLOBAL.KEYS.GAME_HISTORY, JSON.stringify(gecmis));

  // 📌 FIRESTORE KAYDET
  try {
    const aktif = JSON.parse(localStorage.getItem(GLOBAL.KEYS.USER_ACTIVE) || "{}");
    const ogrId = localStorage.getItem(GLOBAL.KEYS.STUDENT_ACTIVE_ID);

    let hedefYol = null;

    if (aktif.role === "ogrenci") {
      hedefYol = collection(db, "profiles", aktif.uid, "oyunSonuclari");
    } else if (aktif.role === "ogretmen" && ogrId) {
      hedefYol = collection(db, "profiles", aktif.uid, "ogrenciler", ogrId, "oyunSonuclari");
    }

    if (hedefYol) {
      await addDoc(hedefYol, {
        ...data,
        kaydedildi: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn("⚠️ Firestore kaydedilemedi:", err);
  }

  // 📌 SONUÇ SAYFASINA GİT
  window.location.href = GLOBAL.PATHS.AYIRTETME_SONUC;
}

// ===============================
window.endGame = endGame;