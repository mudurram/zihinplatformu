// ==========================================================
// 🎯 Seçici Dikkat Oyun Listesi
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN LİSTESİ
// ==========================================================
const SECICI_DIKKAT_OYUNLARI = [
  {
    id: "hedefi_bul",
    ad: "Hedefi Bul",
    aciklama: "Ekranda verilen nesneler arasından sadece yönergede belirtilen hedefi seç.",
    icon: "🎯"
  },
  {
    id: "farkli_olani_bul",
    ad: "Farklı Olanı Bul",
    aciklama: "Diğerlerinden farklı olan tek nesneyi bul ve seç.",
    icon: "🔍"
  },
  {
    id: "gurultulu_alanda_hedef",
    ad: "Gürültülü Alanda Hedef Ara",
    aciklama: "Karmaşık ekrandaki çok sayıdaki öğe arasından sadece hedef nesneyi seç.",
    icon: "🌊"
  },
  {
    id: "cift_filtreli_secim",
    ad: "Çift Filtreli Seçim",
    aciklama: "Yönergede verilen hem renk hem şekil filtresine uyan öğeleri seç.",
    icon: "🎨"
  },
  {
    id: "dikkat_dagitici_yoksay",
    ad: "Dikkat Dağıtıcıyı Yoksay (Flanker)",
    aciklama: "Ortadaki okun yönüne göre cevap ver. Dikkat dağıtıcı okları göz ardı et.",
    icon: "↔️"
  },
  {
    id: "benzerler_arasinda_dogru",
    ad: "Benzerler Arasında Doğruyu Seç",
    aciklama: "Birbirine çok benzeyen nesneler arasından doğru hedefi seç.",
    icon: "🔎"
  },
  {
    id: "engelleyeni_gormezden_gel",
    ad: "Engelleyeni Görmezden Gel",
    aciklama: "Yönergede verilen 'DEĞİL' kuralına göre seçim yap.",
    icon: "🚫"
  },
  {
    id: "arada_beliren_hedef",
    ad: "Arada Beliren Hedefi Yakala",
    aciklama: "Ekranda sürekli hareket eden nesneler içinden ara ara beliren hedefi hızlıca seç.",
    icon: "⚡"
  },
  {
    id: "isitsel_gorsel_eslestirme",
    ad: "İşitsel–Görsel Eşleştirme",
    aciklama: "Duyduğun sesi temsil eden doğru harfe tıkla.",
    icon: "🔊"
  },
  {
    id: "aynisini_bul",
    ad: "Aynısını Bul",
    aciklama: "Yukarıdaki modeli dikkatle incele ve alttaki seçeneklerden birebir aynı olanı seç.",
    icon: "🔗"
  }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("oyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  SECICI_DIKKAT_OYUNLARI.forEach(oyun => {
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
      localStorage.setItem("seciciDikkatOyunId", oyun.id);
      localStorage.setItem("seciciDikkatOyunAdi", oyun.ad);
      window.location.href = "hazirlik.html";
    };
    
    liste.appendChild(kart);
  });
});

