import { labelTrials } from "../../engine/trialLabeler.js";
import { calculateComponents } from "../../engine/componentCalculator.js";
import { normalizeComponents } from "../../engine/normalizer.js";

/* SESLER */
const dogruSes = new Audio("../../sesler/dogru.mp3");
const yanlisSes = new Audio("../../sesler/yanlis.mp3");

let secenekSayisi = 2;
let score = 0;
let mistakes = 0;
let sure = 30;
let timer;
let trials = [];
let soruBaslangic = 0;

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

/* SAYFA YÜKLENİNCE */
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

  document.getElementById("seviyeAcBtn").onclick = () => popup.classList.add("show");
  document.getElementById("bitirBtn").onclick = () => endGame();
});

/* TRIAL KAYDI */
function registerTrial(stimulus, response, correct, reaction) {
  trials.push({
    stimulus,
    response,
    correct,
    reaction_time_ms: reaction,
    timestamp: new Date().toISOString()
  });
}

/* OYUN BAŞLAT */
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

/* SORU ÜRET */
function yeniSoru() {
  const hedef = renkler[Math.floor(Math.random() * renkler.length)];

  document.getElementById("hedefKelime").textContent = hedef.ad;
  document.getElementById("hedefKelime").style.color = hedef.kod;
  soruBaslangic = Date.now();

  let secenekler = [...renkler].sort(() => Math.random() - 0.5).slice(0, secenekSayisi);

  if (!secenekler.includes(hedef)) secenekler[0] = hedef;

  const alan = document.getElementById("secenekAlani");
  alan.innerHTML = "";

  secenekler.forEach(renk => {
    const btn = document.createElement("button");
    btn.className = "renk-btn";
    btn.style.backgroundColor = renk.kod;
    btn.textContent = renk.ad;

    btn.onclick = () => {
      let tepki = Date.now() - soruBaslangic;
      let dogruMu = renk.ad === hedef.ad;

      registerTrial(hedef.ad, renk.ad, dogruMu, tepki);

      if (dogruMu) {
        dogruSes.play();
        score++;
      } else {
        yanlisSes.play();
        mistakes++;
      }

      document.getElementById("skor").textContent = score;
      document.getElementById("yanlis").textContent = mistakes;

      yeniSoru();
    };

    alan.appendChild(btn);
  });
}

/* OYUN BİTİR */
function endGame() {

  clearInterval(timer);

  const labeled = labelTrials(trials);
  const rawScores = calculateComponents(labeled);
  const normalized = normalizeComponents(rawScores);

  let gecmis = JSON.parse(localStorage.getItem("oyunGecmisi") || "[]");
  gecmis.push({
    oyun: "renk_kelime_esleme",
    dogru: score,
    yanlis: mistakes,
    seviye: secenekSayisi,
    trials: labeled,
    skorlar: normalized,
    tarih: new Date().toISOString()
  });

  localStorage.setItem("oyunGecmisi", JSON.stringify(gecmis));
  localStorage.setItem("sonOyun", "renk_kelime_esleme");

  window.location.href = "sonuc_esleme.html";
}