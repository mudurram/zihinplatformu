// ==========================================================
// 🎯 Bölünmüş Dikkat Oyun Hazırlık Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN BİLGİLERİ
// ==========================================================
const OYUN_BILGILERI = {
  sekil_renk_uyumsuzlugu: {
    ad: "Şekil – Renk Uyumsuzluğu",
    amac: "Renk isimleri farklı renkte yazılı olacak. Sadece 'Kırmızı' yazısı göründüğünde tıkla. Üçgen sembolü görürsen tıklama.",
    nasil: [
      "Ekranda renk isimleri farklı renkte yazılı olarak görünecek.",
      "Sadece 'Kırmızı' yazısı göründüğünde tıkla.",
      "Ekranın bir köşesinde semboller akacak.",
      "Sembol üçgen olduğunda tıklama."
    ]
  },
  cift_gorev_iki_sayac: {
    ad: "Çift Görev – İki Sayaç",
    amac: "Sol sayaç 5 olduğunda tıkla. Sağ sayaç 15 olduğunda sakın tıklama.",
    nasil: [
      "Ekranda iki sayaç göreceksin.",
      "Sol sayaç yukarı sayacak, sağ sayaç aşağı sayacak.",
      "Sol sayaç 5 olduğunda tıkla.",
      "Sağ sayaç 15 olduğunda sakın tıklama."
    ]
  },
  nesne_ses_esleme: {
    ad: "Nesne – Ses Eşleme",
    amac: "Görünen nesne ile duyduğun ses aynıysa tıkla. Farklıysa tıklama.",
    nasil: [
      "Ekranda nesneler göreceksin (kalem, kitap, top vb.).",
      "Aynı anda bir ses duyacaksın.",
      "Görünen nesne ile duyduğun ses aynıysa tıkla.",
      "Farklıysa tıklama."
    ]
  },
  sol_sag_bolunmus_ekran: {
    ad: "Sol – Sağ Bölünmüş Ekran",
    amac: "Solda 'B' harfi gelirse tıkla. Sağda çift sayı gelirse sakın tıklama.",
    nasil: [
      "Ekran ikiye bölünecek.",
      "Solda harfler, sağda sayılar akacak.",
      "Solda 'B' harfi gelirse tıkla.",
      "Sağda çift sayı gelirse sakın tıklama."
    ]
  },
  buyuk_nesne_metin: {
    ad: "Büyük Nesne + Metin Görevi",
    amac: "Nesne büyükse tıkla. Metinde 'küçük' yazıyorsa da tıkla. Diğer durumlarda tıklama.",
    nasil: [
      "Ekranda hem nesne hem yazı göreceksin.",
      "Nesne büyükse tıkla.",
      "Metinde 'küçük' yazıyorsa da tıkla.",
      "Diğer durumlarda tıklama."
    ]
  }
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const oyunId = localStorage.getItem("bolunmusDikkatOyunId");
  
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
        const oyunId = localStorage.getItem("bolunmusDikkatOyunId");
        window.location.href = `oyun.html?oyun=${oyunId}`;
      }, 500);
      clearInterval(interval);
    }
  }, 1000);
}

