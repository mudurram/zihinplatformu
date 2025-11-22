// ==========================================================
// 🎯 Sürdürülen Dikkat Oyun Sonuç Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // Son oyun sonucunu al
  const sonOyunSonuc = JSON.parse(localStorage.getItem("sonOyunSonuc") || "{}");
  const oyunGecmisi = JSON.parse(localStorage.getItem("oyunGecmisi") || "[]");
  
  // Oyun adını göster
  const oyunId = localStorage.getItem("surdurulenDikkatOyunId");
  const oyunAdi = localStorage.getItem("surdurulenDikkatOyunAdi") || "Sürdürülen Dikkat Oyunu";
  document.getElementById("oyunAdi").textContent = oyunAdi;

  // İstatistikleri göster
  if (sonOyunSonuc.oyun && sonOyunSonuc.oyun.includes("surdurulen_dikkat")) {
    document.getElementById("oynananSure").textContent = `${sonOyunSonuc.sure || 30} sn`;
    document.getElementById("dogruSayisi").textContent = sonOyunSonuc.dogru || 0;
    document.getElementById("yanlisSayisi").textContent = sonOyunSonuc.yanlis || 0;

    // Tepki süreleri varsa göster
    if (sonOyunSonuc.trials && sonOyunSonuc.trials.length > 0) {
      const dogruTrials = sonOyunSonuc.trials.filter(t => t.correct && t.reaction_ms);
      
      if (dogruTrials.length > 0) {
        const ortalamaTepki = Math.round(
          dogruTrials.reduce((sum, t) => sum + t.reaction_ms, 0) / dogruTrials.length
        );
        const enHizliTepki = Math.min(...dogruTrials.map(t => t.reaction_ms));

        document.getElementById("ortalamaTepki").textContent = `${ortalamaTepki} ms`;
        document.getElementById("ortalamaTepkiItem").style.display = "flex";
        
        document.getElementById("enHizliTepki").textContent = `${enHizliTepki} ms`;
        document.getElementById("enHizliTepkiItem").style.display = "flex";
      }
    }
  } else {
    // Sonuç bulunamadıysa varsayılan değerler
    document.getElementById("oynananSure").textContent = "30 sn";
    document.getElementById("dogruSayisi").textContent = "0";
    document.getElementById("yanlisSayisi").textContent = "0";
  }

  // Butonlar
  document.getElementById("tekrarOynaBtn").onclick = () => {
    window.location.href = "hazirlik.html";
  };

  document.getElementById("farkliOyunBtn").onclick = () => {
    window.location.href = "menu.html";
  };

  document.getElementById("dikkatMenuBtn").onclick = () => {
    localStorage.removeItem("surdurulenDikkatOyunId");
    localStorage.removeItem("surdurulenDikkatOyunAdi");
    window.location.href = "../../platform/index.html";
  };
});

