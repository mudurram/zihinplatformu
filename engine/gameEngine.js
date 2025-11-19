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
  constructor({ gameName, timeLimit = 30, gameMeta = null }) {
    this.gameName = gameName;
    this.timeLimit = timeLimit;
    this.timeElapsed = 0;

    this.score = 0;
    this.mistakes = 0;

    this.trials = [];
    this.timeLeft = timeLimit;

    this.timerInterval = null;
    this.updateUI = null;

    this.gameFinished = false; // Çift kayıt + çift yönlendirme koruması

    // gameMeta parametre olarak gelirse kullan, yoksa resolveGameMeta ile bul
    this.gameMeta = gameMeta || resolveGameMeta(gameName);
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
      this.timeElapsed = Math.max(0, this.timeLimit - this.timeLeft);

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
    const fullResult = buildResultPayload({
      gameName: this.gameName,
      meta: this.gameMeta,
      score: this.score,
      mistakes: this.mistakes,
      timeLimit: this.timeLimit,
      timeElapsed: this.timeElapsed,
      labeledTrials,
      rawComponents,
      normalized
    });

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
    // Oyun dosyasının konumuna göre doğru yolu hesapla
    const currentPath = window.location.pathname;
    let path = "../../platform/sonuc.html";
    
    // Eğer oyunlar klasöründen çağrılıyorsa
    if (currentPath.includes("/oyunlar/") || currentPath.includes("\\oyunlar\\")) {
      path = "../../platform/sonuc.html";
    } else {
      // Diğer durumlar için
      path = GLOBAL?.PLATFORM 
        ? GLOBAL.PLATFORM + "sonuc.html" 
        : "../../platform/sonuc.html";
    }

    console.log("➡ Sonuç ekranına yönlendiriliyor:", path);

    window.location.href = path;
  }
}

function resolveGameMeta(gameName) {
  const map = GLOBAL.GAME_MAP || {};
  if (map[gameName]) return map[gameName];

  const aktif = localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_OYUN);
  if (aktif && map[aktif]) return map[aktif];

  return null;
}

function cloneSchema() {
  try {
    return structuredClone(GLOBAL.SONUC_SEMASI);
  } catch {
    return JSON.parse(JSON.stringify(GLOBAL.SONUC_SEMASI || {}));
  }
}

function buildResultPayload({
  gameName,
  meta,
  score,
  mistakes,
  timeLimit,
  timeElapsed,
  labeledTrials,
  rawComponents,
  normalized
}) {
  const base = cloneSchema();
  const alanId =
    meta?.alan ||
    localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALAN) ||
    "";
  const altId =
    meta?.altBeceri ||
    localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALT_BECERI) ||
    "";

  const accuracy = calcAccuracy(score, mistakes);
  const temelSkor = {
    dogru: score,
    yanlis: mistakes,
    reaction_avg: rawComponents.reaction_speed || 0,
    learning_velocity: calcLearningVelocity(score, mistakes, timeLimit, timeElapsed)
  };

  const fullResult = {
    ...base,
    oyun: gameName,
    alan: alanId,
    altBeceri: altId,
    dogru: score,
    yanlis: mistakes,
    sure: timeLimit,
    tarih: new Date().toISOString(),
    trials: labeledTrials,
    skorlar: normalized,
    temel_skor: temelSkor,
    coklu_alan: buildMultiAreaScores(meta, accuracy),
    oyun_ozel: buildGameSpecificMetrics(meta, { accuracy, rawComponents, normalized }),
    hata_turleri: meta?.sonucMetrics?.hata_turleri || [],
    beceriler: meta?.performans || [],
    moduller: meta?.moduller || [],
    trendMeta: {
      timeLimit,
      timeElapsed,
      totalTrials: labeledTrials.length
    },
    wpm: null
  };

  return fullResult;
}

function calcAccuracy(score, mistakes) {
  const total = Math.max(1, score + mistakes);
  return Math.max(0, Math.min(100, (score / total) * 100));
}

function calcLearningVelocity(score, mistakes, timeLimit, timeElapsed) {
  const elapsed = Math.max(1, timeElapsed || timeLimit);
  const netScore = Math.max(0, score - mistakes * 0.5);
  const velocity = (netScore / elapsed) * 60; // dakikada skor
  return Math.round(Math.max(0, Math.min(100, velocity)));
}

function buildMultiAreaScores(meta, accuracyPercent) {
  const weights = meta?.sonucMetrics?.coklu_alan || {};
  const result = {};
  Object.entries(weights).forEach(([areaId, weight]) => {
    const base = typeof weight === "number" ? weight : 1;
    result[areaId] = Math.round(
      Math.max(0, Math.min(100, accuracyPercent * base))
    );
  });
  return result;
}

function buildGameSpecificMetrics(meta, { accuracy, rawComponents, normalized }) {
  const metrics = {};
  const metaList = meta?.sonucMetrics?.oyun_ozel || [];
  if (!Array.isArray(metaList)) return metrics;

  metaList.forEach(key => {
    metrics[key] = deriveMetricValue(key, { accuracy, rawComponents, normalized });
  });
  return metrics;
}

function deriveMetricValue(key = "", { accuracy, rawComponents, normalized }) {
  const lower = key.toLowerCase();

  if (lower.includes("accuracy") || lower.includes("dogru") || lower.includes("score")) {
    return Math.round(accuracy);
  }

  if (lower.includes("reaction") || lower.includes("time")) {
    return Math.round(rawComponents.reaction_speed || 0);
  }

  if (lower.includes("speed") || lower.includes("processing")) {
    return normalized.reaction_speed || 0;
  }

  if (lower.includes("memory") || lower.includes("sequence")) {
    return normalized.sustained_attention || 0;
  }

  if (lower.includes("inhibition") || lower.includes("control")) {
    return normalized.inhibitory_control || 0;
  }

  return normalized.sustained_attention || 0;
}