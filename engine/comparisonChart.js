// ======================================================================
// 📌 comparisonChart.js — Radar Karşılaştırma Grafiği
// Final v7.1 — Ultra Stabil • Zihin Platformu Analiz Motoru ile Tam Uyumlu
// ======================================================================
//
// Bu grafik SON OYUN skorları ile GENEL ORTALAMA skorlarını karşılaştırır.
// Şu 3 bilişsel alanı kıyaslar:
//  - Tepki Hızı (reaction_speed)
//  - Dikkat Sürekliliği (sustained_attention)
//  - İnhibisyon (inhibitory_control)
//
// Her oyun sonucu GLOBAL.SONUC_SEMASI ile aynı yapıyı kullandığı için
// tüm oyunlarla uyumludur.
// ======================================================================

export function drawComparisonChart(canvas, son, ortalama) {
  // ------------------------------------------------------------
  // 1) Güvenli Kontroller
  // ------------------------------------------------------------
  if (!canvas) {
    console.warn("❗ comparisonChart: canvas bulunamadı.");
    return;
  }

  if (!son || !ortalama) {
    console.warn("❗ comparisonChart: veri eksik (son veya ortalama yok).");
    return;
  }

  // ------------------------------------------------------------
  // 2) Güvenli değerler (fallback)
  // ------------------------------------------------------------
  const A = {
    reaction_speed: Number(son.reaction_speed ?? 0),
    sustained_attention: Number(son.sustained_attention ?? 0),
    inhibitory_control: Number(son.inhibitory_control ?? 0)
  };

  const B = {
    reaction_speed: Number(ortalama.reaction_speed ?? 0),
    sustained_attention: Number(ortalama.sustained_attention ?? 0),
    inhibitory_control: Number(ortalama.inhibitory_control ?? 0)
  };

  // ------------------------------------------------------------
  // 3) Çizim Alanı
  // ------------------------------------------------------------
  const ctx = canvas.getContext("2d");

  // Retina desteği (grafiği kaliteli gösterir)
  const scale = window.devicePixelRatio * 1.2;
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;
  ctx.scale(scale, scale);

  // ------------------------------------------------------------
  // 4) Radar Grafiği
  // ------------------------------------------------------------
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "Dikkat Sürekliliği", "İnhibisyon"],
      datasets: [
        {
          label: "Son Oyun",
          data: [
            A.reaction_speed,
            A.sustained_attention,
            A.inhibitory_control
          ],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#1E88E5"
        },
        {
          label: "Genel Ortalama",
          data: [
            B.reaction_speed,
            B.sustained_attention,
            B.inhibitory_control
          ],
          borderColor: "#8E24AA",
          backgroundColor: "rgba(142, 36, 170, 0.22)",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#8E24AA"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 },
          grid: {
            color: "rgba(0,0,0,0.1)"
          }
        }
      }
    }
  });

  console.log("📘 comparisonChart.js çizildi (Final v7.1 — Ultra Stabil)");
}