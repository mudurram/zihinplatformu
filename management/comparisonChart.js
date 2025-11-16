// ============================================================================
// 📌 comparisonChart.js — Zihin Platformu (Final v7.1 Ultra Stabil)
// Son Oyun vs Genel Ortalama Radar Grafiği
// Chart.js ile tam uyumlu — KIRILMA İHTİMALİ YOK
// ============================================================================

// -------------------------------------------------------------
// 🔧 Güvenli sayı okuma
// -------------------------------------------------------------
function safe(v) {
  return typeof v === "number" && !isNaN(v) ? v : 0;
}


// -------------------------------------------------------------
// 🎯 Radar Grafik Çizimi
// -------------------------------------------------------------
export function drawComparisonChart(canvas, son, ortalama) {

  // Tüm girişler güvenli mi?
  if (!canvas) {
    console.warn("comparisonChart: Canvas bulunamadı.");
    return;
  }

  if (!son || typeof son !== "object") {
    console.warn("comparisonChart: Son oyun verisi eksik.");
    return;
  }

  if (!ortalama || typeof ortalama !== "object") {
    console.warn("comparisonChart: Ortalama verisi eksik.");
    return;
  }

  if (typeof Chart === "undefined") {
    console.warn("comparisonChart: Chart.js yüklenmemiş!");
    return;
  }

  const ctx = canvas.getContext("2d");

  // ------------------------------
  // 🔒 Veri güvenli hale getirildi
  // ------------------------------
  const last = {
    r: safe(son.reaction_speed),
    i: safe(son.inhibitory_control),
    s: safe(son.sustained_attention)
  };

  const avg = {
    r: safe(ortalama.reaction_speed),
    i: safe(ortalama.inhibitory_control),
    s: safe(ortalama.sustained_attention)
  };

  // ------------------------------
  // 📊 Radar Grafik
  // ------------------------------
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
      datasets: [
        {
          label: "Son Oyun",
          data: [last.r, last.i, last.s],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30,136,229,0.22)",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#1E88E5",
          fill: true
        },
        {
          label: "Genel Ortalama",
          data: [avg.r, avg.i, avg.s],
          borderColor: "#8e24aa",
          backgroundColor: "rgba(142,36,170,0.22)",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#8e24aa",
          fill: true
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
        r: {
          min: 0,
          max: 100,

          ticks: {
            stepSize: 20,
            backdropColor: "transparent"
          },

          grid: { circular: true },

          pointLabels: { font: { size: 14 } }
        }
      }
    }
  });

  console.log("📘 comparisonChart.js çizildi (Final v7.1)");
}