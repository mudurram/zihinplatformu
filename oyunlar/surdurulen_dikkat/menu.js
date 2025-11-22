// ==========================================================
// 🎯 Sürdürülen Dikkat Oyun Listesi
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN LİSTESİ
// ==========================================================
const SURDURULEN_DIKKAT_OYUNLARI = [
  {
    id: "hedef_gorseli_yakalama",
    ad: "Hedef Görseli Yakalama",
    aciklama: "Sürekli akan görsellerden sadece hedef görseli gördüğünde tıkla.",
    icon: "🎯"
  },
  {
    id: "harf_sayi_akisinda_hedef",
    ad: "Harf / Sayı Akışı İçinde Hedef",
    aciklama: "Sürekli akan harflerden sadece A harfine tıkla.",
    icon: "🔤"
  },
  {
    id: "dikkat_dagitici_arasinda_hedef",
    ad: "Dikkat Dağıtıcılar Arasında Hedef Bul",
    aciklama: "Çileğe tıkla. Kiraz ve domates dikkat dağıtıcıdır, tıklama.",
    icon: "🍓"
  },
  {
    id: "hiz_degisimli_hedef",
    ad: "Hız Değişimli Hedef",
    aciklama: "Hedef bazen hızlı bazen yavaş çıkacak. Gördüğünde hemen tıkla.",
    icon: "⚡"
  },
  {
    id: "ding_dong_ses",
    ad: "Ding – Dong Ses Oyunu",
    aciklama: "Sadece 'Ding' sesi duyulduğunda tıkla. 'Dong' duyarsan tıklama.",
    icon: "🔔"
  },
  {
    id: "ses_yuksekligi_karsilastirma",
    ad: "Ses Yüksekliği Karşılaştırma",
    aciklama: "Ses yüksek geldiğinde tıkla. Alçak seslerde tıklama.",
    icon: "🔊"
  },
  {
    id: "uzun_kenar_karsilastirma",
    ad: "Uzun Kenar Karşılaştırma",
    aciklama: "Alt kenarı uzun olan şekli gördüğünde tıkla.",
    icon: "📐"
  },
  {
    id: "renk_akisinda_maviyi_bul",
    ad: "Renk Akışı İçinde Maviyi Bul",
    aciklama: "Sadece mavi karelere tıkla. Diğer renklerde tıklama.",
    icon: "🔵"
  },
  {
    id: "art_arda_ayni_sayi",
    ad: "Art Arda Aynı Sayı",
    aciklama: "Arka arkaya aynı gelen sayıyı gördüğünde tıkla.",
    icon: "🔢"
  },
  {
    id: "cift_uyaranda_sadece_gorsel",
    ad: "Çift Uyaranda Sadece Görsel",
    aciklama: "Görseller akarken sesler karışacak. Sadece görsel hedefi gördüğünde tıkla.",
    icon: "👁️"
  },
  {
    id: "netlesen_gorsel",
    ad: "Netleşen Görsel",
    aciklama: "Görsel bulanık başlayacak. Netleştiğinde tıkla.",
    icon: "👓"
  },
  {
    id: "rastgele_surede_cikan_hedef",
    ad: "Rastgele Sürede Çıkan Hedef",
    aciklama: "Hedef düzensiz aralıklarla çıkacak. Her gördüğünde tıkla.",
    icon: "⏰"
  }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("oyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  SURDURULEN_DIKKAT_OYUNLARI.forEach(oyun => {
    const kart = document.createElement("div");
    kart.className = "oyun-kart";
    kart.innerHTML = `
      <div class="oyun-bilgi">
        <h3 class="oyun-adi">${oyun.icon} ${oyun.ad}</h3>
        <p class="oyun-aciklama">${oyun.aciklama}</p>
      </div>
      <button class="oyna-btn" data-oyun-id="${oyun.id}">Oyna</button>
    `;
    
    const oynaBtn = kart.querySelector(".oyna-btn");
    oynaBtn.onclick = () => {
      localStorage.setItem("surdurulenDikkatOyunId", oyun.id);
      localStorage.setItem("surdurulenDikkatOyunAdi", oyun.ad);
      window.location.href = "hazirlik.html";
    };
    
    liste.appendChild(kart);
  });
});

