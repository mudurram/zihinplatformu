// ============================================================================
// 📘 teacherAI.js — Öğretmen AI Analiz Motoru (Final v7.1 Ultra Stabil)
// ============================================================================
// Bu motor öğretmen panelinde gelişmiş analiz, güçlü-zayıf alan belirleme,
// trend inceleme ve otomatik öneriler üretir.
// ============================================================================

console.log("teacherAI.js (Final v7.1) yüklendi ✔");

// ------------------------------------------------------------
// 🔐 SAFE NUMBER — her yerde güvenli kullanım
// ------------------------------------------------------------
function safe(v, fallback = 0) {
  return typeof v === "number" && !isNaN(v) ? v : fallback;
}

// ============================================================================
// 🧠 0) Öğretmen Ana Yorumu (KALITIM — eski sürüm korunarak geliştirildi)
// ============================================================================
export function teacherAI_generateAdvice(result) {
  if (!result || !result.skorlar) return "Veri bulunamadı.";

  const r = safe(result.skorlar.reaction_speed);
  const a = safe(result.skorlar.sustained_attention);
  const i = safe(result.skorlar.inhibitory_control);

  let advice = "🧠 <strong>Öğretmen Değerlendirmesi</strong>\n\n";

  // Tepki Hızı
  if (r < 40) advice += "⚡ <b>Tepki Hızı:</b> Düşük — hızlı eşleme oyunları önerilir.\n\n";
  else if (r < 70) advice += "⚡ <b>Tepki Hızı:</b> Orta — hız egzersizleri faydalı olur.\n\n";
  else advice += "⚡ <b>Tepki Hızı:</b> Güçlü refleks kontrolü.\n\n";

  // Dikkat Sürekliliği
  if (a < 40) advice += "🎯 <b>Dikkat Sürekliliği:</b> Düşük — odak kaybı gözleniyor.\n\n";
  else if (a < 70) advice += "🎯 <b>Dikkat Sürekliliği:</b> Orta — stabilite artırılabilir.\n\n";
  else advice += "🎯 <b>Dikkat Sürekliliği:</b> İyi seviyede.\n\n";

  // İnhibisyon
  if (i < 40) advice += "🛑 <b>İnhibisyon:</b> Aceleci davranışlar var — hata baskılama oyunları önerilir.\n\n";
  else if (i < 70) advice += "🛑 <b>İnhibisyon:</b> Kontrollü fakat geliştirilebilir.\n\n";
  else advice += "🛑 <b>İnhibisyon:</b> Güçlü hata kontrolü.\n\n";

  advice += "📌 Düzenli tekrar tüm becerileri dengeleyerek gelişimi hızlandırır.";

  return advice;
}

// ============================================================================
// 1) Son N oyunu çek
// ============================================================================
export function getLastGames(history, limit = 10) {
  if (!Array.isArray(history)) return [];
  return history.slice(-limit);
}

// ============================================================================
// 2) Ortalama hesaplama
// ============================================================================
function ortalama(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ============================================================================
// 3) Bileşen ortalamaları hesaplama
// ============================================================================
export function calculateComponentAverages(history) {
  if (!history || history.length === 0) return null;

  const comp = {
    reaction_speed: [],
    inhibitory_control: [],
    sustained_attention: []
  };

  history.forEach(h => {
    if (h?.skorlar) {
      comp.reaction_speed.push(safe(h.skorlar.reaction_speed));
      comp.inhibitory_control.push(safe(h.skorlar.inhibitory_control));
      comp.sustained_attention.push(safe(h.skorlar.sustained_attention));
    }
  });

  return {
    reaction_avg: ortalama(comp.reaction_speed),
    inhibition_avg: ortalama(comp.inhibitory_control),
    attention_avg: ortalama(comp.sustained_attention)
  };
}

// ============================================================================
// 4) Güçlü – Zayıf bileşen analizi
// ============================================================================
export function analyzeStrengthsWeakness(history) {
  const avg = calculateComponentAverages(history);
  if (!avg) return null;

  const entries = [
    { key: "Tepki Hızı", value: avg.reaction_avg },
    { key: "İnhibisyon", value: avg.inhibition_avg },
    { key: "Dikkat Sürekliliği", value: avg.attention_avg }
  ];

  const sorted = [...entries].sort((a, b) => a.value - b.value);

  return {
    weakest: sorted[0],
    middle: sorted[1],
    strongest: sorted[2]
  };
}

// ============================================================================
// 5) Trend Hesabı (son oyun - önceki oyun)
// ============================================================================
export function getImprovementTrend(history) {
  if (!history || history.length < 2) return "Veri yetersiz";

  const son = history.at(-1)?.skorlar;
  const onceki = history.at(-2)?.skorlar;

  if (!son || !onceki) return "Veri yetersiz";

  return {
    reaction: safe(son.reaction_speed) - safe(onceki.reaction_speed),
    attention: safe(son.sustained_attention) - safe(onceki.sustained_attention),
    inhibition: safe(son.inhibitory_control) - safe(onceki.inhibitory_control)
  };
}

// ============================================================================
// 6) Kritik Düşüş Algılama
// ============================================================================
export function detectDrop(history) {
  if (!history || history.length < 3) return null;

  const last = history.at(-1)?.skorlar;
  const prev = history.at(-2)?.skorlar;

  if (!last || !prev) return null;

  const drop = {
    reaction: safe(prev.reaction_speed) - safe(last.reaction_speed),
    attention: safe(prev.sustained_attention) - safe(last.sustained_attention),
    inhibition: safe(prev.inhibitory_control) - safe(last.inhibitory_control)
  };

  const critical = [];

  Object.keys(drop).forEach(k => {
    if (drop[k] >= 15) {
      critical.push({
        component: k,
        amount: drop[k]
      });
    }
  });

  return critical.length ? critical : null;
}

// ============================================================================
// 7) Öğretmen Odaklı Öneriler Üretme
// ============================================================================
export function generateRecommendations(history) {
  const avg = calculateComponentAverages(history);
  if (!avg) return [];

  const rec = [];

  if (avg.reaction_avg < 50)
    rec.push("⏱ Tepki hızını artırmak için hızlı eşleme oyunları önerilir.");

  if (avg.attention_avg < 50)
    rec.push("🎯 Dikkat sürekliliği düşük — uzun süreli odak oyunları önerilir.");

  if (avg.inhibition_avg < 50)
    rec.push("🛑 İnhibisyon zayıf — hata kontrolü gerektiren oyunlar uygulanabilir.");

  if (rec.length === 0)
    rec.push("📈 Tüm beceriler güçlü. Zorluk seviyesi artırılabilir.");

  return rec;
}

// ============================================================================
// 8) Ana Fonksiyon — Öğretmene Tam Analiz
// ============================================================================
export function fullTeacherAnalysis(history) {
  const last = getLastGames(history, 10);

  return {
    average: calculateComponentAverages(last),
    strengthsWeakness: analyzeStrengthsWeakness(last),
    trend: getImprovementTrend(last),
    criticalDrops: detectDrop(last),
    recommendations: generateRecommendations(last)
  };
}