// =======================================================
// 📌 dikkat_menu.js — Dikkat Alanı Oyun Listesi (Final v6.4)
// =======================================================

import { GLOBAL } from "./globalConfig.js";

document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("dikkatGrid");
  if (!grid) {
    console.warn("⚠ dikkatGrid elementi bulunamadı. HTML kontrol edin.");
    return;
  }

  // Grid içini temizle
  grid.innerHTML = "";

  // ====================================
  // 1) Dikkat kategorisindeki oyunları al
  // ====================================
  const oyunlar = Object.values(GLOBAL.GAME_MAP || {}).filter(
    oyun => oyun.kategori === "Dikkat"
  );

  if (oyunlar.length === 0) {
    grid.innerHTML = `
      <p style="text-align:center;color:#777;">
        Bu kategori için henüz oyun bulunmuyor.
      </p>
    `;
    return;
  }

  // ====================================
  // 2) Kartları oluştur ve ekle
  // ====================================
  oyunlar.forEach(oyun => {
    const kart = document.createElement("div");
    kart.className = "menu-kart"; // HTML ile uyumlu

    kart.innerHTML = `
      <h2>${oyun.ad}</h2>
      <p>${oyun.aciklama || "Dikkat geliştirme oyunu"}</p>
    `;

    kart.addEventListener("click", () => {
      if (!oyun.path) {
        alert("Bu oyunun yolu tanımlanmamış.");
        return;
      }
      window.location.href = oyun.path;
    });

    grid.appendChild(kart);
  });

});