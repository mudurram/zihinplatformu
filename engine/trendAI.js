// =====================================================================
// 📌 trendAI.js — Trend Analiz Motoru (Final v7.1 Ultra Stabil)
// =====================================================================
//
// Bu modül oyun geçmişinden trend verilerini çıkarır ve
// Chart.js ile tepki hızı, dikkat sürekliliği ve inhibisyon grafiğini çizer.
//
// - Normalize edilmiş skorlarla uyumlu (0–100)
// - Eksik skorlar otomatik fallback
// - Mobil / Tablet / PC için responsive
// - retina / devicePixelRatio ölçek desteği
//
// =====================================================================


// ---------------------------------------------------------------------
// 🎯 1) Trend Veri Hazırlama
// ---------------------------------------------------------------------
export function getTrendData(history) {
  if (!Array.isArray(history) || history.length === 0) return null;

  return {
    labels: history.map((_, i) => `Oyun ${i + 1}`),

    dogru: history.map(h => h.dogru ?? 0),
    yanlis: history.map(h => h.yanlis ?? 0),

    // Normalize edilmiş 0-100 arası skorlar
    reaction: history.map(h => h.skorlar?.reaction_speed ?? 0),
    attention: history.map(h => h.skorlar?.sustained_attention ?? 0),
    inhibition: history.map(h => h.skorlar?.inhibitory_control ?? 0)
  };
}


// ---------------------------------------------------------------------
// 🖼 2) Canvas Retina Fix
// ---------------------------------------------------------------------
function fixCanvasScaling(canvas) {
  const style = getComputedStyle(canvas);
  const w = parseInt(style.width);
  const h = parseInt(style.height);

  canvas.width = w * devicePixelRatio;
  canvas.height = h * devicePixelRatio;

  const ctx = canvas.getContext("2d");
  ctx.scale(devicePixelRatio, devicePixelRatio);

  return ctx;
}


// ---------------------------------------------------------------------
// 📊 3) Trend Çizgi Grafiği
// ---------------------------------------------------------------------
export function drawTrendLines(canvas, history) {
  if (!canvas || !Array.isArray(history) || history.length === 0) return;

  const d = getTrendData(history);
  if (!d) return;

  fixCanvasScaling(canvas);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: d.labels,
      datasets: [
        {
          label: "Tepki Hızı",
          data: d.reaction,
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30,136,229,0.25)",
          borderWidth: 3,
          tension: 0.35
        },
        {
          label: "Dikkat Sürekliliği",
          data: d.attention,
          borderColor: "#FBC02D",
          backgroundColor: "rgba(251,192,45,0.25)",
          borderWidth: 3,
          tension: 0.35
        },
        {
          label: "İnhibisyon",
          data: d.inhibition,
          borderColor: "#E53935",
          backgroundColor: "rgba(229,57,53,0.25)",
          borderWidth: 3,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        y: { beginAtZero: true, max: 100 },
        x: { ticks: { maxRotation: 30, minRotation: 0 } }
      }
    }
  });

  console.log("📈 trendAI.js çizildi (Final v7.1 Ultra Stabil)");
}


// =====================================================================
console.log("📘 trendAI.js yüklendi (Final v7.1 Ultra Stabil)");
// =====================================================================