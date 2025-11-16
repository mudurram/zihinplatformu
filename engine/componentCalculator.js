// ======================================================================
// 📌 componentCalculator.js — Bilişsel Bileşen Hesaplayıcı
// Final v7.1 • Ultra Stabil • Tüm Oyunlarla Uyumlu
// ======================================================================
//
// Trial verilerini analiz ederek 3 ham skor üretir:
//
//   • reaction_speed        → doğru cevapların ortalama tepki süresi (ms)
//   • inhibitory_control    → hata oranına göre 0–100 ham skor
//   • sustained_attention   → ikinci yarı hata artışına göre dikkat düşüşü
//
// Bu ham skorlar daha sonra normalizer.js ile 0–100 aralığına ölçeklenir.
// ======================================================================


// -------------------------------------------------------------
// 🧮 Güvenli ortalama
// -------------------------------------------------------------
function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const clean = arr.filter(x => typeof x === "number" && !isNaN(x));
  if (clean.length === 0) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}


// -------------------------------------------------------------
// 🎯 Ana Hesaplama Motoru
// -------------------------------------------------------------
export function calculateComponents(trials) {
  if (!Array.isArray(trials) || trials.length === 0) {
    return {
      reaction_speed: 0,
      inhibitory_control: 0,
      sustained_attention: 0
    };
  }

  // -----------------------------------------------------------
  // 1) Reaction Speed — sadece DOĞRU cevapların tepki süresi
  // -----------------------------------------------------------
  const reactionArr = trials
    .filter(t => t?.correct === true && typeof t.reaction_ms === "number")
    .map(t => t.reaction_ms);

  const reaction_speed = avg(reactionArr) || 0;


  // -----------------------------------------------------------
  // 2) Inhibitory Control — hata oranı
  // -----------------------------------------------------------
  const totalTrials = trials.length;
  const errors = trials.filter(t => t?.correct === false).length;

  // 0 hata = 100 puan
  // %100 hata = 0 puan
  const inhibitory_control = totalTrials > 0
    ? Math.max(0, 100 - (errors / totalTrials) * 100)
    : 0;


  // -----------------------------------------------------------
  // 3) Sustained Attention — ikinci yarıdaki performans düşüşü
  // -----------------------------------------------------------
  const mid = Math.floor(totalTrials / 2);

  const firstHalf = trials.slice(0, mid);
  const secondHalf = trials.slice(mid);

  const fErr = firstHalf.filter(t => t?.correct === false).length;
  const sErr = secondHalf.filter(t => t?.correct === false).length;

  const dikkatKaybi = sErr - fErr;  // pozitif → ikinci yarıda daha kötü

  // Ham skor (normalize öncesi)
  // 100 → mükemmel, dikkat kaybı yok
  // her ekstra hata için -15 puan
  let sustained_attention = 100 - (dikkatKaybi * 15);

  // Güvenli aralık
  sustained_attention = Math.max(0, Math.min(100, sustained_attention));


  // -----------------------------------------------------------
  // 4) Çok az trial varsa fallback (çok stabil)
  // -----------------------------------------------------------
  if (totalTrials < 2) {
    return {
      reaction_speed: reaction_speed || 0,
      inhibitory_control: inhibitory_control || 0,
      sustained_attention: 70   // nötr-stabil başlangıç değeri
    };
  }


  // -----------------------------------------------------------
  // 5) TAM ÇIKTI (HAM SKORLAR)
  // -----------------------------------------------------------
  return {
    reaction_speed,
    inhibitory_control,
    sustained_attention
  };
}

console.log("📘 componentCalculator.js yüklendi (Final v7.1 — Ultra Stabil)");