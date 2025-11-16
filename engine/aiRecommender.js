// =====================================================================
// 📌 aiRecommender.js — Zihin Platformu AI Öneri Motoru
// Final v7.1 — Ultra Stabil • GLOBAL Skor Yapısı ile %100 Uyumlu
// =====================================================================
//
// Bu modül oyun geçmişinden ortalama skorları çıkarır,
// zayıf alanları tespit eder ve kişiye özel gelişim önerileri üretir.
//
// Kullanılan skorlar:
// - reaction_speed (0–100)
// - sustained_attention (0–100)
// - inhibitory_control (0–100)
//
// Her oyun sonucu aynı şemayı kullandığı için tamamen evrenseldir.
// =====================================================================


// ------------------------------------------------------------
// 1) Ortalama Hesaplama (Güvenli)
// ------------------------------------------------------------
function ortalama(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return Math.round(sum / arr.length);
}


// ------------------------------------------------------------
// 2) GEÇMİŞTEN ALAN BAZLI ORTALAMA ÇIKARMA
// ------------------------------------------------------------
function computeAverages(history) {
  const reaction = [];
  const sustain = [];
  const inhib = [];

  history.forEach(item => {
    const s = item?.skorlar || {};

    reaction.push(s.reaction_speed ?? 0);
    sustain.push(s.sustained_attention ?? 0);
    inhib.push(s.inhibitory_control ?? 0);
  });

  return {
    reaction_speed: ortalama(reaction),
    sustained_attention: ortalama(sustain),
    inhibitory_control: ortalama(inhib)
  };
}


// ------------------------------------------------------------
// 3) Zayıf Alan Tespiti (50 Altı = Zayıf)
// ------------------------------------------------------------
function findWeakAreas(avg) {
  const zayif = [];

  if (avg.reaction_speed < 50) zayif.push("Tepki Hızı");
  if (avg.sustained_attention < 50) zayif.push("Dikkat Sürekliliği");
  if (avg.inhibitory_control < 50) zayif.push("İnhibisyon (Engel Baskılama)");

  return zayif;
}


// ------------------------------------------------------------
// 4) Öneri Sözlüğü (Güncellenmiş v7.1)
// ------------------------------------------------------------
const ONERI = {
  "Tepki Hızı": [
    "Hızlı renk/şekil eşleme oyunlarını daha sık oynayın.",
    "Zamana karşı mini görevler tepki hızını artırır.",
    "Göz–el koordinasyonu gerektiren kısa aktiviteler önerilir."
  ],

  "Dikkat Sürekliliği": [
    "Süreyi yavaş yavaş arttırarak oynayın.",
    "Kısa molalar verip aynı oyunu tekrarlamak sürekliliği geliştirir.",
    "Odak gerektiren oyun türlerini seçerek performansı artırabilirsiniz."
  ],

  "İnhibisyon (Engel Baskılama)": [
    "Yanıltıcı uyaranların olduğu ayırt etme oyunlarını deneyin.",
    "Hızlı karar vermek yerine kontrollü ilerlemeye odaklanın.",
    "Zor seviyede düzenli tekrar engel baskılamayı güçlendirir."
  ]
};


// ------------------------------------------------------------
// 5) ANA ÖNERİ MOTORU (Export)
// ------------------------------------------------------------
export function getAIRecommendations(history) {

  // ----------------------------------------------------------
  // Veri yoksa
  // ----------------------------------------------------------
  if (!Array.isArray(history) || history.length === 0) {
    return {
      averages: null,
      weakAreas: [],
      recommendations: [
        "Henüz yeterli oyun verisi yok. En az 2 oyun tamamladıktan sonra analiz yapılabilir."
      ]
    };
  }

  // ----------------------------------------------------------
  // Averages
  // ----------------------------------------------------------
  const avg = computeAverages(history);

  // ----------------------------------------------------------
  // Weak areas
  // ----------------------------------------------------------
  const weak = findWeakAreas(avg);

  const rec = [];

  if (weak.length === 0) {
    rec.push(
      "🎉 Tüm bilişsel alanlar dengeli görünüyor. Düzenli tekrar ile bu seviyeyi koruyabilirsiniz."
    );
  } else {
    weak.forEach(area => {
      rec.push(`🔹 **${area}** için öneriler:`);
      (ONERI[area] || []).forEach(o => rec.push("• " + o));
      rec.push(""); // Boş satır
    });
  }

  // ----------------------------------------------------------
  // Sonuç formatı (Analiz ekranı ve panel ile %100 uyumlu)
  // ----------------------------------------------------------
  return {
    averages: avg,
    weakAreas: weak,
    recommendations: rec
  };
}

console.log("🤖 aiRecommender.js yüklendi (Final v7.1 • Ultra Stabil)");