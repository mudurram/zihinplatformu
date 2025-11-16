// ============================================================================
// 📌 feedbackAI.js — Kısa Geri Bildirim Motoru (Final v7.1 Ultra Stabil)
// ============================================================================
// Bu modül reaction_speed, sustained_attention, inhibitory_control
// skorlarını okuyarak kısa ve anlaşılır geri bildirim üretir.
// ============================================================================

console.log("🤖 feedbackAI.js yüklendi (Final v7.1)");


// -------------------------------------------------------------
// 🔒 Güvenli değer okuma (TAM KIRILMA ÖNLEME SİSTEMİ)
// -------------------------------------------------------------
function safe(v) {
  return typeof v === "number" && !isNaN(v) ? v : 0;
}


// ============================================================================
// 🧠 1) Kısa Performans Özeti Üretici
// ============================================================================

export function generateQuickFeedback(scores) {
  if (!scores || typeof scores !== "object") {
    console.warn("feedbackAI: skor verisi eksik.");
    return "Veri bulunamadı.";
  }

  // Güvenli skorlar
  const r = safe(scores.reaction_speed);
  const a = safe(scores.sustained_attention);
  const i = safe(scores.inhibitory_control);

  let msg = "📌 <strong>Kısa Performans Özeti</strong>\n\n";

  // ----------------------------------------
  // ⚡ TEPKİ HIZI
  // ----------------------------------------
  if (r < 40) {
    msg += "⚡ Tepki hızı düşük. Hız gerektiren çalışmalar yapılabilir.\n";
  } else if (r < 70) {
    msg += "⚡ Tepki hızı orta seviyede.\n";
  } else {
    msg += "⚡ Tepki hızı oldukça güçlü.\n";
  }

  // ----------------------------------------
  // 🎯 DİKKAT SÜREKLİLİĞİ
  // ----------------------------------------
  if (a < 40) {
    msg += "🎯 Dikkat sürdürülebilirliği düşük, odak kaybı yaşanmış olabilir.\n";
  } else if (a < 70) {
    msg += "🎯 Dikkat kontrolü yeterli fakat geliştirilebilir.\n";
  } else {
    msg += "🎯 Dikkat kontrolü güçlü.\n";
  }

  // ----------------------------------------
  // 🛑 İNHİBİSYON
  // ----------------------------------------
  if (i < 40) {
    msg += "🛑 İnhibisyon zayıf, kontrolsüz hatalar görülebilir.\n";
  } else if (i < 70) {
    msg += "🛑 Hata kontrolü orta seviyede.\n";
  } else {
    msg += "🛑 Hata kontrolü başarılı.\n";
  }

  return msg;
}


// ============================================================================
// 🌟 Default Export
// ============================================================================
export default {
  generateQuickFeedback
};