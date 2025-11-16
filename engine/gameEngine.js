// ======================================================================
// 📌 gameEngine.js — Zihin Platformu Oyun Motoru (Final v7.1 Ultra Stabil)
// ======================================================================
//
// Ortak oyun motoru:
//   • süre kontrolü
//   • trial kaydı
//   • tepki süresi hesaplama
//   • trial etiketleme
//   • ham bileşen çıkarma
//   • 0–100 normalize bileşen üretimi
//   • localStorage geçmişi yazma
//   • Firestore'a sonuç gönderme
//   • sonuç ekranına yönlendirme
//
// Tüm oyunlarla %100 uyumludur.
// ======================================================================

import { labelTrials } from "./trialLabeler.js";
import { calculateComponents } from "./componentCalculator.js";
import { normalizeComponents } from "./normalizer.js";
import { saveGameResult } from "../data/gameResultService.js";
import { GLOBAL } from "../platform/globalConfig.js";

console.log("gameEngine.js yüklendi ✔ v7.1");


// ======================================================================
// 🎮 GAME ENGINE SINIFI
// ======================================================================
export class GameEngine {
  constructor({ gameName, timeLimit = 30 }) {
    this.gameName = gameName;
    this.timeLimit = timeLimit;

    this.score = 0;
    this.mistakes = 0;

    this.trials = [];
    this.timeLeft = timeLimit;

    this.timerInterval = null;
    this.updateUI = null;

    this.gameFinished = false; // Çift kayıt + çift yönlendirme koruması
  }

  // ====================================================================
  // ▶️ Oyunu Başlat
  // ====================================================================
  start(updateUI) {
    this.updateUI = updateUI;
    this.startTimer();
  }


  // ====================================================================
  // 📝 Trial Kaydet
  // ====================================================================
  recordTrial({ correct, reaction_ms }) {
    if (this.gameFinished) return; // oyun bitmişse işleme alma

    this.trials.push({ correct: !!correct, reaction_ms });

    if (correct) this.score++;
    else this.mistakes++;

    if (this.updateUI)
      this.updateUI(this.score, this.mistakes, this.timeLeft);
  }


  // ====================================================================
  // ⏱ Zamanlayıcı
  // ====================================================================
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      if (this.updateUI)
        this.updateUI(this.score, this.mistakes, this.timeLeft);

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }


  // ====================================================================
  // 🔚 OYUN BİTİŞİ
  // ====================================================================
  async endGame() {
    if (this.gameFinished) return; // çift kaydı önle
    this.gameFinished = true;

    clearInterval(this.timerInterval);

    // ------------------------------------------------------------
    // 1) Trial Etiketleme (reaction / inhibition / sustained)
    // ------------------------------------------------------------
    const labeledTrials = labelTrials(this.trials);

    // ------------------------------------------------------------
    // 2) Ham bileşen skorları
    // ------------------------------------------------------------
    const rawComponents = calculateComponents(labeledTrials);

    // ------------------------------------------------------------
    // 3) Normalize edilmiş 0–100 skorlar
    // ------------------------------------------------------------
    const normalized = normalizeComponents(rawComponents);

    // ------------------------------------------------------------
    // 4) TAM SONUÇ OBJESİ (platform standardı)
    // ------------------------------------------------------------
    const fullResult = {
      oyun: this.gameName,
      dogru: this.score,
      yanlis: this.mistakes,
      skorlar: normalized,
      trials: labeledTrials,
      tarih: new Date().toISOString()
    };

    // ------------------------------------------------------------
    // 5) LOCALSTORAGE KAYIT
    // ------------------------------------------------------------
    try {
      let history = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
      history.push(fullResult);

      localStorage.setItem("oyunGecmisi", JSON.stringify(history));
      localStorage.setItem("sonOyun", this.gameName);
      localStorage.setItem("sonOyunSonuc", JSON.stringify(fullResult));
    } catch (err) {
      console.warn("⚠ LocalStorage kayıt hatası:", err);
    }

    // ------------------------------------------------------------
    // 6) FIRESTORE (opsiyonel)
    // ------------------------------------------------------------
    await saveGameResult(fullResult);

    // ------------------------------------------------------------
    // 7) SONUÇ EKRANINA YÖNLENDİR (GLOBAL)
    // ------------------------------------------------------------
    const path = GLOBAL?.PLATFORM
      ? GLOBAL.PLATFORM + "sonuc.html"
      : "../../platform/sonuc.html";

    console.log("➡ Sonuç ekranına yönlendiriliyor:", path);

    window.location.href = path;
  }
}