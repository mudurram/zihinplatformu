// ======================================================================
// 📌 normalizer.js — Bilişsel Bileşen Normalizasyon Motoru
// Final v7.1 • Ultra Stabil • Platform Geneli ile Tam Uyumlu
// ======================================================================
//
// Bu modül reaction_speed, inhibitory_control ve sustained_attention
// değerlerini 0–100 arası normalize eder.
//
// ÖNEMLİ NOT (v7.1):
// - reaction_speed = düşük ms → yüksek performans olduğu için artık
//   "ters normalizasyon" modeli kullanılıyor. (daha doğru sonuç)
// - inhibitory_control ve sustained_attention klasik z-score ile normalize edilir.
//
// Hiçbir veri türü kırılmaz. Null, NaN, undefined durumlarında fallback vardır.
//
// ======================================================================


// ----------------------------------------------------------------------
// 🔬 1) Klinik Referans Modeli
// ----------------------------------------------------------------------
const NORM = {
  reaction_speed: { mean: 500, std: 150 },        // ms cinsinden
  inhibitory_control: { mean: 70, std: 20 },      // % başarı
  sustained_attention: { mean: 75, std: 12 }      // % stabilite
};


// ----------------------------------------------------------------------
// 📌 2) Güvenli Z-Score Hesaplama
// ----------------------------------------------------------------------
function safeNormalize(value, mean, std) {
  if (value === undefined || value === null || isNaN(value)) return 50;
  if (std <= 0) return 50;

  const z = (value - mean) / std;
  const scaled = 50 + z * 15;

  return Math.round(Math.max(0, Math.min(100, scaled)));
}


// ----------------------------------------------------------------------
// ⚡ 3) Reaction Speed → TERS NORMALİZASYON
// ----------------------------------------------------------------------
// ms düşükse performans yüksek → yani (mean - value)
function normalizeReactionSpeed(ms) {
  if (ms === undefined || ms === null || isNaN(ms)) return 50;

  const { mean, std } = NORM.reaction_speed;
  const z = (mean - ms) / std;  // ters mantık uygulanıyor
  const scaled = 50 + z * 15;

  return Math.round(Math.max(0, Math.min(100, scaled)));
}


// ----------------------------------------------------------------------
// 🎯 4) ANA NORMALİZASYON FONKSİYONU
// ----------------------------------------------------------------------
export function normalizeComponents(components = {}) {

  const r = components.reaction_speed ?? 0;
  const i = components.inhibitory_control ?? 0;
  const s = components.sustained_attention ?? 0;

  return {
    reaction_speed: normalizeReactionSpeed(r),
    inhibitory_control: safeNormalize(i, NORM.inhibitory_control.mean, NORM.inhibitory_control.std),
    sustained_attention: safeNormalize(s, NORM.sustained_attention.mean, NORM.sustained_attention.std)
  };
}


console.log("📘 normalizer.js yüklendi (Final v7.1 Ultra Stabil)");