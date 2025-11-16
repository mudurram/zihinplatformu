// ===================================================================
// 🎨 Renk – Kelime Eşleme Oyunu Sonuç Sayfası — STABİL FINAL
// globalConfig + standart sonuç formatı ile tam uyumlu
// ===================================================================

import { GLOBAL } from "../../platform/globalConfig.js";

document.addEventListener("DOMContentLoaded", () => {

  // ================================================================
  // 1) SON OYUN VERİSİNİ ÇEK
  // ================================================================
  let gecmis = JSON.parse(localStorage.getItem(GLOBAL.STORAGE_KEYS.GAME_HISTORY)) || [];
  let data = gecmis[gecmis.length - 1];

  if (!data) {
    console.error("⚠️ Sonuç verisi bulunamadı");
    return;
  }

  // Bileşen skoru
  const b = data.beceriler || {
    reaction_speed: 0,
    inhibitory_control: 0,
    sustained_attention: 0
  };

  // ================================================================
  // 2) TEMEL METİNLERİ YAZDIR
  // ================================================================
  document.getElementById("oyunBaslik").textContent = "Renk – Kelime Eşleme Sonuçları";
  document.getElementById("dogru").textContent = data.dogru ?? 0;
  document.getElementById("yanlis").textContent = data.yanlis ?? 0;
  document.getElementById("tarih").textContent = new Date(data.tarih).toLocaleString("tr-TR");

  document.getElementById("reactionSpeed").textContent = `${b.reaction_speed} / 100`;
  document.getElementById("inhibControl").textContent = `${b.inhibitory_control} / 100`;
  document.getElementById("sustainedAttention").textContent = `${b.sustained_attention} / 100`;

  // Bar grafikleri
  document.getElementById("speedBar").style.width = b.reaction_speed + "%";
  document.getElementById("attentionBar").style.width = b.sustained_attention + "%";
  document.getElementById("inhibitionBar").style.width = b.inhibitory_control + "%";

  // ================================================================
  // 3) SKOR BARI (Doğru – Yanlış)
  // ================================================================
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
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // ================================================================
  // 4) RADAR GRAFİĞİ
  // ================================================================
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
          data: [
            b.reaction_speed,
            b.inhibitory_control,
            b.sustained_attention
          ],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30,136,229,0.22)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { r: { min: 0, max: 100 } }
      }
    });
  }

  // ================================================================
  // 5) PERFORMANS ANALİZ – YORUM KARTI
  // ================================================================
  const yorumKart = document.getElementById("yorumKart");

  function yorum(d, k) { return d < 50 ? k.kotu : k.iyi; }

  yorumKart.innerHTML = `
    <h3>Bireysel Performans Analizi</h3>

    <strong>⚡ Tepki Hızı</strong><br>
    • ${yorum(b.reaction_speed, {
      kotu:"Reflekslerde gecikme olabilir.",
      iyi:"Tepki hızı dengeli ve yeterli."
    })}<br><br>

    <strong>🎯 Dikkat Sürekliliği</strong><br>
    • ${yorum(b.sustained_attention, {
      kotu:"Odaklanma aralıklı kesilmiş olabilir.",
      iyi:"Dikkat kontrolü başarılı."
    })}<br><br>

    <strong>🛑 İnhibisyon</strong><br>
    • ${yorum(b.inhibitory_control, {
      kotu:"Aceleciliğe bağlı hata oranı artmış.",
      iyi:"İnhibisyon kontrolü güçlü."
    })}<br>
  `;

  // ================================================================
  // 6) TEKRAR OYNA BUTONU
  // ================================================================
  document.getElementById("tekrarBtnNav").onclick = () => {
    window.location.href = "./esleme.html";
  };

  // ================================================================
  // 7) ÖĞRETMEN YORUMU — OYUNA ÖZEL
  // ================================================================
  const yorumInput = document.getElementById("ogretmenYorumMetin");
  const yorumKey = GLOBAL.STORAGE_KEYS.TEACHER_COMMENT + "_esleme";

  const saved = localStorage.getItem(yorumKey);
  if (saved) yorumInput.value = saved;

  yorumInput.setAttribute("readonly", "true");

});