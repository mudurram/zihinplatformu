// =====================================================================
// 📌 trialLabeler.js — Trial Etiketleme Motoru (Final v7.1 Ultra Stabil)
// =====================================================================
//
// Bu motor her bir trial’ı analiz ederek şu etiketlerden birini verir:
//   • reaction   → tepki hızı
//   • inhibition → yanlış tepki / kontrol hatası
//   • focus      → dikkat kaybı (çok yavaş tepki veya seri hata)
//
// v7.1 Güncellemeleri:
// - Ortalama tepki süresi fallback daha güvenli
// - focus tespiti iyileştirildi
// - seri hata eşiği optimize edildi (5 trial içinde ≥3 hata → focus)
// - eksik / bozuk trial çökme engellendi
// - reaction_ms değeri olmayan trial’lar güvenli işleniyor
//
// =====================================================================


// ---------------------------------------------------------------------
// 🔢 Güvenli Ortalama
// ---------------------------------------------------------------------
function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}


// ---------------------------------------------------------------------
// 🧠  Ana Etiketleme Motoru
// ---------------------------------------------------------------------
export function labelTrials(trials) {
  if (!Array.isArray(trials) || trials.length === 0) {
    return [];
  }

  // reaction_ms değerlerini al (yalnızca sayısal olanlar)
  const reactionArr = trials
    .filter(t => typeof t.reaction_ms === "number" && t.reaction_ms > 0)
    .map(t => t.reaction_ms);

  // Ortalama tepki süresi (fallback 650ms)
  const avgReaction = avg(reactionArr) || 650;

  return trials.map((trial, idx) => {
    const labeled = { ...trial };

    // -----------------------------------------------------------
    // 🟥 1) Yanlış tepki → inhibition (doğrudan)
    // -----------------------------------------------------------
    if (trial.correct === false) {
      labeled.component = "inhibition";
    }

    // -----------------------------------------------------------
    // 🟦 2) Doğru + normal tepki → reaction
    // -----------------------------------------------------------
    if (
      trial.correct === true &&
      typeof trial.reaction_ms === "number"
    ) {
      labeled.component = "reaction";
    }

    // -----------------------------------------------------------
    // 🟨 3) Çok yavaş tepki → focus
    // -----------------------------------------------------------
    if (
      typeof trial.reaction_ms === "number" &&
      trial.reaction_ms > avgReaction * 1.35
    ) {
      labeled.component = "focus";
    }

    // -----------------------------------------------------------
    // 🟪 4) Son 5 trial içinde ≥3 hata → focus
    // -----------------------------------------------------------
    if (idx >= 4) {
      const lastFive = trials.slice(idx - 4, idx + 1);
      const errorCount = lastFive.filter(t => t.correct === false).length;

      if (errorCount >= 3) {
        labeled.component = "focus";
      }
    }

    // -----------------------------------------------------------
    // Fallback — hiçbir etiket belirlenmezse "reaction"
    // -----------------------------------------------------------
    if (!labeled.component) {
      labeled.component = "reaction";
    }

    return labeled;
  });
}


// =====================================================================
console.log("📘 trialLabeler.js yüklendi (Final v7.1 Ultra Stabil)");
// =====================================================================