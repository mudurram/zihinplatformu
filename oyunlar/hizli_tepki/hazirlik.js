// ==========================================================
// 🎯 Hızlı Tepki Oyun Hazırlık Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN BİLGİLERİ
// ==========================================================
const OYUN_BILGILERI = {
  isik_yandi_bas: {
    ad: "Işık Yandı → Bas",
    amac: "Işık yeşile döndüğünde olabildiğince hızlı tepki vererek bas.",
    nasil: [
      "Ekranda gri bir ışık paneli göreceksin.",
      "Işık yeşile döndüğünde hemen bas.",
      "Yeşil yanmadan önce basarsan yanlış sayılır."
    ]
  },
  hedef_belirince_bas: {
    ad: "Hedef Belirince Bas",
    amac: "Ekranda beliren hedefe olabildiğince hızlı tepki ver.",
    nasil: [
      "Ekranda rastgele konumlarda hedefler belirecek.",
      "Hedef göründüğünde hemen tıkla.",
      "Hedef yokken tıklarsan yanlış sayılır."
    ]
  },
  ses_gelince_bas: {
    ad: "Ses Gelince Bas",
    amac: "Ses duyduğunda olabildiğince hızlı tepki vererek bas.",
    nasil: [
      "Sessizlik dönemlerinde bekle.",
      "Ses duyduğunda hemen bas.",
      "Ses çalmadan basarsan yanlış sayılır."
    ]
  },
  cift_sinyal: {
    ad: "Çift Sinyal (Ses veya Işık)",
    amac: "Ses veya ışık uyaranına olabildiğince hızlı tepki ver.",
    nasil: [
      "Ses veya ışık uyaranı gelebilir.",
      "Herhangi bir uyaran geldiğinde hemen bas.",
      "Uyaran yokken basarsan yanlış sayılır."
    ]
  },
  kayan_cizgi: {
    ad: "Kayan Çizgi Durunca Bas",
    amac: "Hareket eden çizgi durduğu anda hemen bas.",
    nasil: [
      "Çizgi sürekli sağ-sol hareket edecek.",
      "Çizgi durduğu anda hemen bas.",
      "Çizgi hareket ederken basarsan yanlış sayılır."
    ]
  },
  daralan_cember: {
    ad: "Daralan Çember",
    amac: "Daire belirli büyüklüğe geldiğinde bas.",
    nasil: [
      "Ekranda büyük bir daire göreceksin.",
      "Daire yavaş yavaş küçülecek.",
      "Belirli büyüklüğe geldiğinde bas (çok erken basma)."
    ]
  },
  kirmizi_yesil: {
    ad: "Kırmızı–Yeşil (Hızlı Go/No-Go)",
    amac: "Yeşil olduğunda bas, kırmızı olduğunda basma.",
    nasil: [
      "Işık yeşil veya kırmızı olabilir.",
      "Yeşil olduğunda hemen bas.",
      "Kırmızı olduğunda basma (yanlış sayılır)."
    ]
  }
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const oyunId = localStorage.getItem("hizliTepkiOyunId");
  
  if (!oyunId || !OYUN_BILGILERI[oyunId]) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  const oyunBilgi = OYUN_BILGILERI[oyunId];
  
  // Oyun bilgilerini göster
  document.getElementById("oyunBaslik").textContent = oyunBilgi.ad;
  document.getElementById("oyunAmac").textContent = oyunBilgi.amac;
  
  const nasilListe = document.getElementById("oyunNasil");
  nasilListe.innerHTML = "";
  oyunBilgi.nasil.forEach(madde => {
    const li = document.createElement("li");
    li.textContent = madde;
    nasilListe.appendChild(li);
  });

  // Başla butonu
  const baslaBtn = document.getElementById("baslaBtn");
  baslaBtn.onclick = () => {
    // Hazırlık ekranını göster
    const hazirlikEkrani = document.getElementById("hazirlikEkrani");
    hazirlikEkrani.style.display = "flex";
    
    // Geri sayım başlat
    geriSayimBaslat();
  };
});

// ==========================================================
// 🔄 GERİ SAYIM
// ==========================================================
function geriSayimBaslat() {
  const geriSayimEl = document.getElementById("geriSayim");
  let sayac = 3;
  
  geriSayimEl.textContent = sayac;
  
  const interval = setInterval(() => {
    sayac--;
    
    if (sayac > 0) {
      geriSayimEl.textContent = sayac;
    } else if (sayac === 0) {
      geriSayimEl.textContent = "BAŞLA!";
      setTimeout(() => {
        // Oyun ekranına geç
        const oyunId = localStorage.getItem("hizliTepkiOyunId");
        window.location.href = `oyun.html?oyun=${oyunId}`;
      }, 500);
      clearInterval(interval);
    }
  }, 1000);
}

