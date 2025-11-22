// ==========================================================
// 🎯 Bölünmüş Dikkat Oyun Listesi
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN LİSTESİ
// ==========================================================
const BOLUNMUS_DIKKAT_OYUNLARI = [
  {
    id: "sekil_renk_uyumsuzlugu",
    ad: "Şekil – Renk Uyumsuzluğu",
    aciklama: "Renk isimleri farklı renkte yazılı olacak. 'Kırmızı' yazısı göründüğünde tıkla. Üçgen sembolü görürsen tıklama.",
    icon: "🎨"
  },
  {
    id: "cift_gorev_iki_sayac",
    ad: "Çift Görev – İki Sayaç",
    aciklama: "Sol sayaç 5 olduğunda tıkla. Sağ sayaç 15 olduğunda sakın tıklama.",
    icon: "🔢"
  },
  {
    id: "nesne_ses_esleme",
    ad: "Nesne – Ses Eşleme",
    aciklama: "Görünen nesne ile duyduğun ses aynıysa tıkla. Farklıysa tıklama.",
    icon: "🔊"
  },
  {
    id: "sol_sag_bolunmus_ekran",
    ad: "Sol – Sağ Bölünmüş Ekran",
    aciklama: "Solda 'B' harfi gelirse tıkla. Sağda çift sayı gelirse sakın tıklama.",
    icon: "📱"
  },
  {
    id: "buyuk_nesne_metin",
    ad: "Büyük Nesne + Metin Görevi",
    aciklama: "Nesne büyükse tıkla. Metinde 'küçük' yazıyorsa da tıkla. Diğer durumlarda tıklama.",
    icon: "📦"
  }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("oyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  BOLUNMUS_DIKKAT_OYUNLARI.forEach(oyun => {
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
      localStorage.setItem("bolunmusDikkatOyunId", oyun.id);
      localStorage.setItem("bolunmusDikkatOyunAdi", oyun.ad);
      window.location.href = "hazirlik.html";
    };
    
    liste.appendChild(kart);
  });
});

