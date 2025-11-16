// ======================================================================
// 📌 heatmap.js — Renk Hataları HeatMap Motoru (Final v7.1 Ultra Stabil)
// ======================================================================
//
// Bu modül özellikle Ayırt Etme türü oyunlarda renk bazlı hata
// dağılımını görselleştirmek için kullanılır.
//
// ✓ Retina ekran uyumlu
// ✓ Responsive canvas ölçekleme
// ✓ Bozuk veya eksik veri olsa bile kırılmaz
// ✓ Tüm analiz motoru (analiz.js v7.1) ile %100 uyumlu
//
// ======================================================================

export function drawHeatmap(canvas, renkBazliVeri) {
  // -------------------------------------------------------------
  // 📌 0) Güvenlik Kontrolleri
  // -------------------------------------------------------------
  if (!canvas) {
    console.warn("⚠ heatmap: Canvas bulunamadı.");
    return;
  }
  if (!renkBazliVeri || typeof renkBazliVeri !== "object") {
    console.warn("⚠ heatmap: Veri geçersiz.");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("⚠ heatmap: Canvas context alınamadı.");
    return;
  }

  // -------------------------------------------------------------
  // 📌 1) Retina / Responsive Boyutlama
  // -------------------------------------------------------------
  const style = getComputedStyle(canvas);
  const displayWidth = Math.max(parseInt(style.width) || canvas.clientWidth, 50);
  const displayHeight = Math.max(parseInt(style.height) || canvas.clientHeight, 50);

  const ratio = window.devicePixelRatio || 1;

  canvas.width = displayWidth * ratio;
  canvas.height = displayHeight * ratio;

  ctx.scale(ratio, ratio);

  ctx.clearRect(0, 0, displayWidth, displayHeight);

  // -------------------------------------------------------------
  // 📌 2) Veri Kontrolü
  // -------------------------------------------------------------
  const renkler = Object.keys(renkBazliVeri || {});
  if (renkler.length === 0) {
    console.warn("⚠ heatmap: Gösterilecek veri yok.");
    return;
  }

  const maxHata = Math.max(...Object.values(renkBazliVeri), 1);
  const colWidth = displayWidth / renkler.length;

  // -------------------------------------------------------------
  // 📌 3) Heatmap Çizimi
  // -------------------------------------------------------------
  renkler.forEach((renk, i) => {
    const hataSayisi = renkBazliVeri[renk] ?? 0;
    const oran = hataSayisi / maxHata;

    // 🔥 Renk karışımı: Kırmızı (yüksek hata) → Sarı (düşük hata)
    const r = Math.round(255 * oran);
    const g = Math.round(220 * (1 - oran));
    const b = Math.round(60 * (1 - oran));

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.92)`;

    ctx.fillRect(
      i * colWidth,
      0,
      colWidth - 4,
      displayHeight - 34
    );

    // ---------------------------------------------------------
    // 📌 Hata Sayısı Etiketi
    // ---------------------------------------------------------
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(
      hataSayisi,
      i * colWidth + colWidth / 2,
      22
    );

    // ---------------------------------------------------------
    // 📌 Renk Adı Etiketi
    // ---------------------------------------------------------
    ctx.fillStyle = "#222";
    ctx.font = "13px Segoe UI";
    ctx.fillText(
      renk,
      i * colWidth + colWidth / 2,
      displayHeight - 8
    );
  });

  console.log("🎨 heatmap çizildi (v7.1 Ultra Stabil) ✔");
}