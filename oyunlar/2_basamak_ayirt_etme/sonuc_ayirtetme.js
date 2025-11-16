// =====================================================================
// 🎯 Renk Ayırt Etme — Oyun Sonucu Scripti (Final Stabil v6.7)
// Zihin Platformu global yapı + analiz sistemi ile %100 uyumlu
// =====================================================================

document.addEventListener("DOMContentLoaded", () => {

  const OYUN_KODU = "renk_ayirt_etme";

  // ================================================================
  // 📌 0) LocalStorage'dan son kayıt alınır
  // ================================================================
  let gecmis = [];

  try {
    gecmis = JSON.parse(localStorage.getItem("oyunGecmisi") || "[]");
  } catch (e) {
    console.warn("⚠ oyunGecmisi okunamadı:", e);
    gecmis = [];
  }

  if (!Array.isArray(gecmis) || gecmis.length === 0) {
    console.warn("⚠ oyunGecmisi boş.");
    return;
  }

  // 🎯 Son oyun verisi
  const data = gecmis[gecmis.length - 1];
  const skorlar = data?.skorlar ?? {};

  // Güvenli okuma
  const safe = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

  // ================================================================
  // 🏷 TEMEL BİLGİLER DOLDUR
  // ================================================================
  const dogru = data?.dogru ?? 0;
  const yanlis = data?.yanlis ?? 0;
  const sure = data?.sure ?? 0;
  const tarih = data?.tarih ? new Date(data.tarih) : new Date();

  document.getElementById("oyunBaslik").textContent = "Renk Ayırt Etme — Sonuç";
  document.getElementById("dogru").textContent = dogru;
  document.getElementById("yanlis").textContent = yanlis;
  document.getElementById("sure").textContent = sure + " sn";
  document.getElementById("tarih").textContent = tarih.toLocaleString("tr-TR");

  // ================================================================
  // 🧠 3 BİLİŞSEL BİLEŞEN
  // ================================================================
  const r = safe(skorlar.reaction_speed);
  const i = safe(skorlar.inhibitory_control);
  const s = safe(skorlar.sustained_attention);

  document.getElementById("reactionSpeed").textContent = `${r} / 100`;
  document.getElementById("inhibControl").textContent = `${i} / 100`;
  document.getElementById("sustainedAttention").textContent = `${s} / 100`;

  // ================================================================
  // 📶 SKILL BARLAR
  // ================================================================
  document.getElementById("speedBar").style.width = r + "%";
  document.getElementById("attentionBar").style.width = s + "%";
  document.getElementById("inhibitionBar").style.width = i + "%";

  // ================================================================
  // 📊 BAR GRAFİK — DOĞRU / YANLIŞ
  // ================================================================
  const skorCanvas = document.getElementById("skorGrafik");

  if (skorCanvas && window.Chart) {
    new Chart(skorCanvas, {
      type: "bar",
      data: {
        labels: ["Doğru", "Yanlış"],
        datasets: [{
          data: [dogru, yanlis],
          backgroundColor: ["#4a90e2", "#e53935"],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(dogru, yanlis) + 3
          }
        }
      }
    });
  }

  // ================================================================
  // 🌐 RADAR GRAFİK — Tepki / İnhibisyon / Süreklilik
  // ================================================================
  const radarCanvas = document.getElementById("radarGrafik");

  if (radarCanvas && window.Chart) {

    // Retina ekran düzeltmesi
    const scale = window.devicePixelRatio || 1;
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
          backgroundColor: "rgba(30,136,229,0.25)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  }

  // ================================================================
  // 🧠 NLP / Mini Performans Yorumu (AI'siz yorum)
  // ================================================================
  const yorumKart = document.getElementById("yorumKart");

  const yorum = (deger, zayif, iyi) =>
    deger < 50 ? zayif : iyi;

  yorumKart.innerHTML = `
    <h3>📌 Bireysel Performans Analizi</h3>

    <strong>⚡ Tepki Hızı</strong><br>
    • ${yorum(r, "Tepki hızı düşük veya dalgalı olabilir.", "Hızlı ve tutarlı tepkiler gözlendi.")}<br><br>

    <strong>🎯 Dikkat Sürekliliği</strong><br>
    • ${yorum(s, "Dikkat zaman zaman düşüş göstermiş olabilir.", "Görev boyunca dikkat seviyesi oldukça stabil.")}<br><br>

    <strong>🛑 İnhibisyon</strong><br>
    • ${yorum(i, "Bazı aceleci hamleler yapılmış olabilir.", "Kontrol ve karar verme davranışı güçlü.")}<br>
  `;

  // ================================================================
  // 🔁 TEKRAR OYNA
  // ================================================================
  const tekrarBtn = document.getElementById("tekrarBtnNav");
  if (tekrarBtn) {
    tekrarBtn.onclick = () => window.location.href = "./ayirtetme.html";
  }

  // ================================================================
  // 👨‍🏫 ÖĞRETMEN YORUMU (salt okunur mod)
  // ================================================================
  const yorumInput = document.getElementById("ogretmenYorumMetin");
  const yorumKey = "ogretmenYorumu_ayirtetme";

  if (yorumInput) {
    try {
      yorumInput.value = localStorage.getItem(yorumKey) || "";
    } catch (e) {
      yorumInput.value = "";
    }
    yorumInput.readOnly = true;
  }

});