document.addEventListener("DOMContentLoaded", () => {

  const sonOyun = "renk_ayirt_etme";   // Bu sayfa sadece bu oyun için
  let gecmis = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];

  if (!gecmis.length) return;

  // Son kayıt alınır
  let data = gecmis[gecmis.length - 1];
  const skor = data.skorlar || {};

  // === Temel Bilgiler ===
  document.getElementById("oyunBaslik").textContent = `Renk Ayırt Etme Tamamlandı`;
  document.getElementById("dogru").textContent = data.dogru ?? "-";
  document.getElementById("yanlis").textContent = data.yanlis ?? "-";
  document.getElementById("sure").textContent = (data.sure ?? 0) + " sn";
  document.getElementById("tarih").textContent = new Date(data.tarih).toLocaleString("tr-TR");

  // === 3 Bileşen ===
  const r = skor.reaction_speed ?? 0;
  const i = skor.inhibitory_control ?? 0;
  const s = skor.sustained_attention ?? 0;

  document.getElementById("reactionSpeed").textContent = `${r} / 100`;
  document.getElementById("inhibControl").textContent = `${i} / 100`;
  document.getElementById("sustainedAttention").textContent = `${s} / 100`;

  // === Skill barlar ===
  document.getElementById("speedBar").style.width = r + "%";
  document.getElementById("attentionBar").style.width = s + "%";
  document.getElementById("inhibitionBar").style.width = i + "%";

  // ===============================
  // 📊 BAR GRAFİK (Doğru / Yanlış)
  // ===============================
  const skorCanvas = document.getElementById("skorGrafik");
  if (skorCanvas) {
    new Chart(skorCanvas, {
      type: "bar",
      data: {
        labels: ["Doğru", "Yanlış"],
        datasets: [{
          data: [data.dogru, data.yanlis],
          backgroundColor: ["#4a90e2", "#e53935"]
        }]
      },
      options: { plugins: { legend: { display: false } } }
    });
  }

  // ===============================
  // 📌 RADAR GRAFİĞİ
  // ===============================
  const radarCanvas = document.getElementById("radarGrafik");

  if (radarCanvas) {
    const scale = window.devicePixelRatio * 1.4;
    radarCanvas.width = radarCanvas.clientWidth * scale;
    radarCanvas.height = radarCanvas.clientHeight * scale;
    radarCanvas.getContext("2d").scale(scale, scale);

    new Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
        datasets: [{
          data: [r, i, s],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30,136,229,0.22)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }]
      },
      options: {
        scales: { r: { min: 0, max: 100 } },
        plugins: { legend: { display: false } }
      }
    });
  }

  // ===============================
  // 📌 PERFORMANS YORUM KARTI
  // ===============================
  const yorumKart = document.getElementById("yorumKart");

  function yorum(val, dusuk, iyi) {
    return val < 50 ? dusuk : iyi;
  }

  yorumKart.innerHTML = `
    <h3>Bireysel Performans Analizi</h3>

    <strong>⚡ Tepki Hızı</strong><br>
    • ${yorum(r, "Tepkiler zaman zaman gecikmiş olabilir.", "Refleksler hızlı ve net.")}<br><br>

    <strong>🎯 Dikkat Sürekliliği</strong><br>
    • ${yorum(s, "Dikkat belirli aralıklarla dağılmış olabilir.", "Dikkat süresi boyunca stabil performans.")}<br><br>

    <strong>🛑 İnhibisyon</strong><br>
    • ${yorum(i, "Aceleci karar verme eğilimi gözlemlenebilir.", "Kontrollü ve dengeli bir ilerleme sergilenmiş.")}<br>
  `;


  // ===============================
  // 🔁 Tekrar Oyna
  // ===============================
  document.getElementById("tekrarBtnNav").onclick = () => {
    window.location.href = "./ayirtetme.html";
  };

  // ===============================
  // 👨‍🏫 Öğretmen Yorumu (Oyun özel)
  // ===============================
  const yorumInput = document.getElementById("ogretmenYorumMetin");

  const yorumKey = "ogretmenYorumu_ayirtetme";
  const kayıtlı = localStorage.getItem(yorumKey);

  if (kayıtlı) yorumInput.value = kayıtlı;

  yorumInput.setAttribute("readonly", "true");
});