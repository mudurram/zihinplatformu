// =============================================================
// 📌 adaptiveDifficulty.js — Adaptif Zorluk Motoru
// Zihin Platformu • Final v7.1 Ultra Stabil
// =============================================================
//
// Bu motor oyunlardan gelen sonuçlara göre otomatik zorluk ayarı yapar.
//
// Kullanılan kriterler:
// ✔ Doğruluk oranı
// ✔ Ortalama tepki süresi
// ✔ Sürekli hata (üçlü hata trendi)
// ✔ GLOBAL sonuç şeması ile %100 uyumlu
//
// Not: Hiçbir modülü bozmaz. Bağımsız çalışır.
// =============================================================


// =============================================================
// 🧠 1) Ana Hesaplama — Seviye Dönüşü
// =============================================================
export function calculateDifficultyLevel(result) {

  if (!result || typeof result !== "object") {
    return 2; // Default → orta seviye
  }

  const dogru = Number(result.dogru ?? 0);
  const yanlis = Number(result.yanlis ?? 0);
  const total = dogru + yanlis;

  const accuracy = total > 0 ? (dogru / total) : 0;

  // -------------------------------------------------------------
  // Tepki Süresi Ortalaması
  // -------------------------------------------------------------
  const trials = Array.isArray(result.trials) ? result.trials : [];

  const reactionTimes = trials
    .filter(t => typeof t.reaction_ms === "number" && t.reaction_ms > 0)
    .map(t => t.reaction_ms);

  const avgReaction = reactionTimes.length
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    : 650; // Normal default

  // -------------------------------------------------------------
  // Üst üste hata trendi (son 3 trial)
  // -------------------------------------------------------------
  const last3 = trials.slice(-3);
  const consecutiveFails = last3.filter(t => t.correct === false).length;

  let level = 2; // Varsayılan orta

  // =============================================================
  // 🔵 1) KOLAY SEVİYE KRİTERLERİ
  // =============================================================
  if (
    accuracy < 0.55 ||
    avgReaction > 900 ||
    consecutiveFails >= 3
  ) {
    level = 1;
  }

  // =============================================================
  // 🟢 2) ORTA SEVİYE KRİTERLERİ
  // =============================================================
  else if (
    (accuracy >= 0.55 && accuracy <= 0.80) ||
    (avgReaction >= 550 && avgReaction <= 750)
  ) {
    level = 2;
  }

  // =============================================================
  // 🔴 3) ZOR SEVİYE KRİTERLERİ
  // =============================================================
  else if (
    accuracy > 0.80 &&
    avgReaction < 550 &&
    consecutiveFails <= 1
  ) {
    level = 3;
  }

  return level;
}


// =============================================================
// 🏷 2) Seviye Adı Döndür
// =============================================================
export function difficultyName(level) {
  switch (level) {
    case 1: return "Kolay";
    case 2: return "Orta";
    case 3: return "Zor";
    default: return "Bilinmiyor";
  }
}

console.log("adaptiveDifficulty.js yüklendi ✔ (Final v7.1)");