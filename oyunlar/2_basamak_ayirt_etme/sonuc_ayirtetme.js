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

  // Oyun bilgilerini al
  const aktifKategori = localStorage.getItem("ayirtEtmeKategori");
  const aktifAltOyun = localStorage.getItem("ayirtEtmeAltOyun");
  const secenekSayisi = localStorage.getItem("ayirtEtmeSecenekSayisi") || "2";
  
  // Oyun adını belirle
  const altOyunAdlari = {
    renk_ayirt: "Renk Ayırt Etme",
    buyuk_kucuk: "Büyük – Küçük",
    uzun_kisa: "Uzun – Kısa",
    ince_kalin: "İnce – Kalın",
    sag_sol: "Sağ – Sol",
    yukari_asagi: "Yukarı – Aşağı",
    on_arka: "Ön – Arka",
    yon_ok: "Yön (Ok)",
    az_cok: "Az – Çok",
    bos_dolu: "Boş – Dolu",
    yarim_tam: "Yarım – Tam",
    sayi_karsilastirma: "Sayı Karşılaştırma",
    tane_sayma: "Tane Sayma",
    esit_fazla_az: "Eşit / Fazla / Az",
    hayvan_bitki: "Hayvan – Bitki",
    yiyecek_icecek: "Yiyecek – İçecek",
    tasit_esya: "Taşıt – Eşya",
    renk_sekil: "Renk – Şekil",
    mutlu_uzgun: "Mutlu – Üzgün",
    kizgin_sakin: "Kızgın – Sakin",
    korkulu_guvenli: "Korkulu – Güvenli",
    yuksek_alcak: "Yüksek – Alçak",
    hizli_yavas: "Hızlı – Yavaş",
    uzun_kisa_ses: "Uzun – Kısa Ses",
    benzer_farkli: "Benzer – Farklı",
    ayni_farkli: "Aynı – Farklı",
    mantik_ornegi: "Mantık Örneği",
    yumusak_sert: "Yumuşak – Sert",
    purlu_dusuk: "Pürüzlü – Düz",
    isikli_karanlik: "Işıklı – Karanlık",
    temiz_kirli: "Temiz – Kirli",
    soguk_sicak: "Soğuk – Sıcak",
    ac_tok: "Aç – Tok",
    uykulu_uyanik: "Uykulu – Uyanık",
    sira_sayisi: "Sıra Sayısı",
    once_sonra: "Önce – Sonra",
    ilk_son: "İlk – Son"
  };
  
  const oyunAdi = altOyunAdlari[aktifAltOyun] || "Ayırt Etme";
  
  document.getElementById("oyunBaslik").textContent = `${oyunAdi} — Sonuç`;
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
  // 🔁 NAVİGASYON BUTONLARI
  // ================================================================
  
  // Tekrar Oyna (aynı oyun, aynı seviye)
  const tekrarOynaBtn = document.getElementById("tekrarOynaBtn");
  if (tekrarOynaBtn) {
    tekrarOynaBtn.onclick = () => {
      // Seçenek sayısını koru
      localStorage.setItem("ayirtEtmeSecenekSayisi", secenekSayisi);
      window.location.href = "./ayirtetme.html";
    };
  }
  
  // Seviye Seçimine Dön
  const seviyeSecimBtn = document.getElementById("seviyeSecimBtn");
  if (seviyeSecimBtn) {
    seviyeSecimBtn.onclick = () => {
      // Kategori ve alt oyunu koru, sadece seviye seçimine dön
      window.location.href = "./ayirtetme.html";
    };
  }
  
  // Alt Alana Dön
  const altAlanaDonBtn = document.getElementById("altAlanaDonBtn");
  if (altAlanaDonBtn) {
    altAlanaDonBtn.onclick = () => {
      // Kategoriyi koru, alt oyun seçimine dön
      window.location.href = "./alt-oyun-secim.html";
    };
  }
  
  // Ana Menüye Dön
  const anaMenuBtn = document.getElementById("anaMenuBtn");
  if (anaMenuBtn) {
    anaMenuBtn.onclick = () => {
      window.location.href = "./menu.html";
    };
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