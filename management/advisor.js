// ============================================================================
// 🧠 advisor.js — Akıllı Beceri Öneri Motoru (Final v7.1 - Ultra Stabil)
// Zihin Platformu GLOBAL v7.x ile %100 uyumlu, kırılmaz yapı
// ============================================================================
//
// Bu modül:
// ✔ Bilişsel bileşen skorlarını okur
// ✔ En zayıf beceriyi belirler
// ✔ Beceriye özel gelişim + oyun önerisi üretir
//
// Not: globalConfig / role sistemi gerektirmez → bağımsız AI modülüdür.
// ============================================================================

console.log("🧩 advisor.js yüklendi (FINAL v7.1)");


// ============================================================================
// 🔧 Güvenli Sayısal Okuyucu
// ============================================================================

function safe(v) {
  return typeof v === "number" && !isNaN(v) ? v : 0;
}



// ============================================================================
// 1) 🔍 Zayıf Beceri Tespiti
// ============================================================================

function detectWeakSkill(scores) {
  if (!scores || typeof scores !== "object") return "bilinmiyor";

  const R = safe(scores.reaction_speed);
  const I = safe(scores.inhibitory_control);
  const S = safe(scores.sustained_attention);

  const minVal = Math.min(R, I, S);

  if (minVal === R) return "reaction_speed";
  if (minVal === I) return "inhibitory_control";
  return "sustained_attention";
}



// ============================================================================
// 2) 🎮 Beceriye Özel Oyun + Gelişim Önerileri
// ============================================================================

function recommendationFor(skill) {
  switch (skill) {
    case "reaction_speed":
      return {
        beceri: "Tepki Hızı",
        oyun: [
          "Hızlı Renk Eşleme",
          "Renk–Kelime Ayrıştırma",
          "Görsel Hız Tepki Oyunları"
        ],
        öneri:
          "Hızlı karar verme ve görsel uyaranlara ani tepki gerektiren aktiviteler tepki hızını güçlendirir."
      };

    case "inhibitory_control":
      return {
        beceri: "İnhibisyon (Engel Baskılama)",
        oyun: [
          "Ayırt Etme Oyunu",
          "Renk Engel Engelleme",
          "Doğru–Yanlış Hız Testleri"
        ],
        öneri:
          "Daha kontrollü ve dikkatli karar verme gerektiren görevler inhibisyon becerisini artırır."
      };

    case "sustained_attention":
      return {
        beceri: "Dikkat Sürekliliği",
        oyun: [
          "Uzun Süreli Odak Takip",
          "Seri Takip / Tamamlama Oyunları",
          "İşitsel–Görsel Odak Egzersizleri"
        ],
        öneri:
          "Sürekli odağı korumayı gerektiren görevler dikkat sürekliliğini artırır."
      };

    default:
      return {
        beceri: "Bilinmiyor",
        oyun: [],
        öneri: "Analiz için yeterli veri yok."
      };
  }
}



// ============================================================================
// 3) ⭐ Ana Fonksiyon — Öğrenciye Öneri Üretme
// ============================================================================

export function getAdvisorRecommendation(scores) {
  if (!scores || typeof scores !== "object") {
    return {
      zayifBeceri: "Bilinmiyor",
      öneriMetni: "Analiz yapılabilmesi için yeterli performans verisi yok.",
      oyunOneriListesi: []
    };
  }

  const skill = detectWeakSkill(scores);
  const detay = recommendationFor(skill);

  const öneriMetni = `
📌 <strong>Geliştirmen Gereken Beceri: ${detay.beceri}</strong>

${detay.öneri}

🎮 <strong>Önerilen Gelişim Oyunları:</strong>
• ${detay.oyun.join("\n• ")}
  `;

  return {
    zayifBeceri: detay.beceri,
    öneriMetni,
    oyunOneriListesi: detay.oyun
  };
}



// ============================================================================
// 📦 Varsayılan Export
// ============================================================================

export default {
  getAdvisorRecommendation
};