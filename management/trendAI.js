// ============================================================================
// 📌 trendAI.js — Zihin Platformu (v7.1 Final Ultra Stabil)
// Trend Analizi • Öğrencinin zaman içindeki gelişim eğrisi
// ============================================================================

console.log("trendAI.js (v7.1) yüklendi ✔");


// ============================================================================
// 🔐 Güvenli sayı fonksiyonu — her yerde kırılmayı engeller
// ============================================================================
function safe(val, fallback = 0) {
  return typeof val === "number" && !isNaN(val) ? val : fallback;
}


// ============================================================================
// 1) Ham veriden trend verisi seti oluştur
// ============================================================================
export function getTrendData(history) {
  if (!Array.isArray(history) || history.length === 0) return null;

  return {
    labels: history.map((_, i) => `Oyun ${i + 1}`),

    dogru: history.map(h => safe(h?.dogru)),
    yanlis: history.map(h => safe(h?.yanlis)),

    reaction: history.map(h => safe(h?.skorlar?.reaction_speed)),
    attention: history.map(h => safe(h?.skorlar?.sustained_attention)),
    inhibition: history.map(h => safe(h?.skorlar?.inhibitory_control))
  };
}


// ============================================================================
// 2) Trend Çizgi Grafiği — Chart.js (Ultra Stabil)
// ============================================================================
export function drawTrendLines(canvas, history) {
  // Canvas kontrolü
  if (!canvas) {
    console.warn("trendAI: canvas bulunamadı.");
    return;
  }

  if (!history || !Array.isArray(history) || history.length === 0) {
    console.warn("trendAI: boş history verisi.");
    return;
  }

  const dataset = getTrendData(history);
  if (!dataset) {
    console.warn("trendAI: dataset oluşturulamadı.");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("trendAI: canvas ctx alınamadı.");
    return;
  }

  new Chart(ctx, {
    type: "line",
    data: {
      labels: dataset.labels,
      datasets: [
        {
          label: "Tepki Hızı",
          data: dataset.reaction,
          borderColor: "#0066ff",
          backgroundColor: "rgba(0,102,255,0.15)",
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.35
        },
        {
          label: "Dikkat Sürekliliği",
          data: dataset.attention,
          borderColor: "#fbc02d",
          backgroundColor: "rgba(251,192,45,0.18)",
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.35
        },
        {
          label: "İnhibisyon",
          data: dataset.inhibition,
          borderColor: "#e53935",
          backgroundColor: "rgba(229,57,53,0.18)",
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.35
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "top",
          labels: { font: { size: 13 } }
        }
      },

      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  });

  console.log("📈 trendAI çizildi ✔");
}