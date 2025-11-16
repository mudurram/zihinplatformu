// =============================================================
// 📌 aiAdvisor.js — Yapay Zeka Performans Danışmanı
// Final v7.1 • Ultra Stabil • Zihin Platformu GLOBAL Uyumlu
// =============================================================
//
// Bu motor, oyun sonuçlarına göre kişiye özel yorum üretir.
// Veri yoksa güvenli fallback uygulanır.
// Tüm oyunların ortak skor şemasıyla %100 uyumludur.
//
// Kullanılan metrikler:
// - reaction_speed (0–100)
// - inhibitory_control (0–100)
// - sustained_attention (0–100)
// - dogru / yanlis (accuracy)
// =============================================================


export function aiAdvice(result) {

  // -------------------------------------------------------------
  // 📌 Güvenli veri kontrolü
  // -------------------------------------------------------------
  if (!result || !result.skorlar) {
    return "Yeterli veri bulunamadı. Birkaç oyun daha oynadıktan sonra analiz yapılabilir.";
  }

  const {
    reaction_speed = 0,
    inhibitory_control = 0,
    sustained_attention = 0
  } = result.skorlar;

  const dogru = Number(result.dogru ?? 0);
  const yanlis = Number(result.yanlis ?? 0);
  const total = dogru + yanlis;

  const accuracy = total > 0 ? (dogru / total) * 100 : 0;

  let messages = [];

  // -------------------------------------------------------------
  // ⚡ 1) Tepki Hızı Yorumu
  // -------------------------------------------------------------
  if (reaction_speed >= 80) {
    messages.push("⚡ **Tepki hızın çok iyi!** Görsel uyaranlara hızlı yanıt verebiliyorsun.");
  } else if (reaction_speed >= 50) {
    messages.push("⚡ **Tepki hızın orta seviyede.** Düzenli pratikle daha da gelişebilir.");
  } else {
    messages.push("⚡ **Tepki hızın düşük görünüyor.** Kısa süreli hızlı eşleme oyunlarıyla gelişim sağlayabilirsin.");
  }

  // -------------------------------------------------------------
  // 🟥 2) İnhibisyon (Dürtü Kontrolü)
  // -------------------------------------------------------------
  if (inhibitory_control >= 80) {
    messages.push("🟥 **İnhibisyonun çok güçlü!** Yanlış tepki verme olasılığın düşük.");
  } else if (inhibitory_control >= 50) {
    messages.push("🟥 **İnhibisyon ortalama seviyede.** Acele etmeden seçim yaparak gelişebilirsin.");
  } else {
    messages.push("🟥 **İnhibisyon düşük.** Hızlı karar verirken daha dikkatli olman faydalı olacaktır.");
  }

  // -------------------------------------------------------------
  // 🟨 3) Dikkat Sürekliliği
  // -------------------------------------------------------------
  if (sustained_attention >= 80) {
    messages.push("🟨 **Dikkatini uzun süre koruyabiliyorsun!** Çok iyi bir performans.");
  } else if (sustained_attention >= 50) {
    messages.push("🟨 **Dikkat sürekliliğin orta seviyede.** Daha uzun süre odak gerektiren egzersizler faydalı olabilir.");
  } else {
    messages.push("🟨 **Dikkat sürekliliğin düşük.** Odaklanma kayıpları görülmüş olabilir. Kısa aralıklarla tekrar etmek iyi gelir.");
  }

  // -------------------------------------------------------------
  // 🎯 4) Genel Başarı Değerlendirmesi
  // -------------------------------------------------------------
  if (accuracy >= 85) {
    messages.push("🎯 **Genel başarı çok yüksek!** Bu seviyeyi korumak için düzenli oynamaya devam et.");
  } else if (accuracy >= 60) {
    messages.push("🎯 **Genel başarı orta seviyede.** Birkaç tekrar ile daha da iyi sonuçlar elde edebilirsin.");
  } else {
    messages.push("🎯 **Genel başarı düşük.** Tekrar ve hedefe yönelik alıştırmalar gelişimine katkı sağlayacaktır.");
  }

  // -------------------------------------------------------------
  // 🧠 5) Profesyonel Özet (Ek)
  // -------------------------------------------------------------
  messages.push(
    "\n📌 **Özet:** Performansın analiz edildi. Aşağıdaki oyunları düzenli oynamak bilişsel ilerleme sağlar."
  );

  // -------------------------------------------------------------
  // 🔚 Son Mesaj
  // -------------------------------------------------------------
  return messages.join("\n");
}

console.log("aiAdvisor.js yüklendi ✔ (Final v7.1)");