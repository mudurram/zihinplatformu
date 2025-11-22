// ==========================================================
// 🎯 Hızlı Tepki Oyun Listesi
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN LİSTESİ
// ==========================================================
const HIZLI_TEPKI_OYUNLARI = [
  {
    id: "isik_yandi_bas",
    ad: "Işık Yandı → Bas",
    aciklama: "Işık yeşile döndüğünde hemen bas. Erken basma, doğru zamanda bas.",
    icon: "💡"
  },
  {
    id: "hedef_belirince_bas",
    ad: "Hedef Belirince Bas",
    aciklama: "Hedef göründüğünde hemen tıkla. Hedef yokken tıklama.",
    icon: "🎯"
  },
  {
    id: "ses_gelince_bas",
    ad: "Ses Gelince Bas",
    aciklama: "Ses duyduğunda hemen bas. Sessizken tıklama.",
    icon: "🔊"
  },
  {
    id: "cift_sinyal",
    ad: "Çift Sinyal (Ses veya Işık)",
    aciklama: "Ses veya ışık geldiğinde hemen bas. Hiç uyaran yokken basma.",
    icon: "⚡"
  },
  {
    id: "kayan_cizgi",
    ad: "Kayan Çizgi Durunca Bas",
    aciklama: "Çizgi hareket ederken bekle. Çizgi durduğu anda hemen bas.",
    icon: "📏"
  },
  {
    id: "daralan_cember",
    ad: "Daralan Çember",
    aciklama: "Daire belirli büyüklüğe geldiğinde bas. Çok erken basma.",
    icon: "⭕"
  },
  {
    id: "kirmizi_yesil",
    ad: "Kırmızı–Yeşil (Hızlı Go/No-Go)",
    aciklama: "Yeşil olduğunda bas. Kırmızı olduğunda sakın basma.",
    icon: "🚦"
  }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("oyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  HIZLI_TEPKI_OYUNLARI.forEach(oyun => {
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
      localStorage.setItem("hizliTepkiOyunId", oyun.id);
      localStorage.setItem("hizliTepkiOyunAdi", oyun.ad);
      window.location.href = "hazirlik.html";
    };
    
    liste.appendChild(kart);
  });
});

