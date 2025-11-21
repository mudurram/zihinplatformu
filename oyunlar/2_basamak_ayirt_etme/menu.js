// ==========================================================
// 🎯 2. Basamak - Ayırt Etme Ana Menü
// Alt kategori seçim ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎨 ALT KATEGORİLER
// ==========================================================
const ALT_KATEGORILER = [
  { id: "boyut", ad: "Boyut Ayırt Etme", icon: "📏" },
  { id: "konum_yon", ad: "Konum – Yön Ayırt Etme", icon: "🧭" },
  { id: "miktar", ad: "Miktar Ayırt Etme", icon: "🔢" },
  { id: "sayi_tane", ad: "Sayı/Tane Ayırt Etme", icon: "🔢" },
  { id: "kategori", ad: "Kategori Ayırt Etme", icon: "📂" },
  { id: "duygu", ad: "Duygu Ayırt Etme", icon: "😊" },
  { id: "ses_isitsel", ad: "Ses / İşitsel Ayırt Etme", icon: "🔊" },
  { id: "mantiksal", ad: "Mantıksal Ayırt Etme", icon: "🧩" },
  { id: "doku_materyal", ad: "Doku / Materyal Ayırt Etme", icon: "🧵" },
  { id: "gunluk_yasam", ad: "Günlük Yaşam – Kavram Ayırt Etme", icon: "🏠" },
  { id: "sira_dizilim", ad: "Sıra / Dizilim Ayırt Etme", icon: "🔢" },
  { id: "renk", ad: "Renk Ayırt Etme", icon: "🎨" }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("kategoriListesi");
  if (!liste) return;

  liste.innerHTML = "";

  ALT_KATEGORILER.forEach(kategori => {
    const kart = document.createElement("div");
    kart.className = "kategori-kart";
    kart.innerHTML = `
      <div class="kategori-icon">${kategori.icon}</div>
      <div class="kategori-ad">${kategori.ad}</div>
    `;
    kart.onclick = () => {
      localStorage.setItem("ayirtEtmeKategori", kategori.id);
      window.location.href = "alt-oyun-secim.html";
    };
    liste.appendChild(kart);
  });
});

