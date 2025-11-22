// ==========================================================
// 🎯 Sürdürülen Dikkat Oyun Hazırlık Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN BİLGİLERİ
// ==========================================================
const OYUN_BILGILERI = {
  hedef_gorseli_yakalama: {
    ad: "Hedef Görseli Yakalama",
    amac: "Ekranda sürekli farklı görseller akacak. Sadece hedef görseli gördüğünde tıkla.",
    nasil: [
      "Ekranda sürekli farklı görseller akacak.",
      "Sadece hedef görseli gördüğünde tıkla.",
      "Diğer görsellere tıklama.",
      "Görsel yokken tıklarsan yanlış sayılır."
    ]
  },
  harf_sayi_akisinda_hedef: {
    ad: "Harf / Sayı Akışı İçinde Hedef",
    amac: "Sürekli akan harflerden sadece A harfine tıkla. Diğer harflere tıklama.",
    nasil: [
      "Sürekli akan harflerden sadece A harfine tıkla.",
      "Diğer harflere tıklarsan yanlış sayılır.",
      "A gelir ama tıklanmazsa kaçırma/yanlış sayılır."
    ]
  },
  dikkat_dagitici_arasinda_hedef: {
    ad: "Dikkat Dağıtıcılar Arasında Hedef Bul",
    amac: "Çileğe tıkla. Kiraz ve domates dikkat dağıtıcıdır, tıklama.",
    nasil: [
      "Çileğe tıklarsan doğru sayılır.",
      "Kiraz/domates = yanlış sayılır.",
      "Boş tıklama = yanlış sayılır."
    ]
  },
  hiz_degisimli_hedef: {
    ad: "Hız Değişimli Hedef",
    amac: "Hedef bazen hızlı bazen yavaş çıkacak. Gördüğünde hemen tıkla.",
    nasil: [
      "Hedef 0.3–1.5 sn aralıklarla rastgele belirir.",
      "Hedefi zamanında tıklarsan doğru sayılır.",
      "Çok geç tıklarsan / kaçırırsan yanlış sayılır."
    ]
  },
  ding_dong_ses: {
    ad: "Ding – Dong Ses Oyunu",
    amac: "Sadece 'Ding' sesi duyulduğunda tıkla. 'Dong' duyarsan tıklama.",
    nasil: [
      "Ses akışı başlar (Ding / Dong karışık).",
      "Ding'de tıklarsan doğru sayılır.",
      "Dong'da tıklarsan yanlış sayılır.",
      "Ding gelir ama tıklamazsa kaçırma/yanlış sayılır."
    ]
  },
  ses_yuksekligi_karsilastirma: {
    ad: "Ses Yüksekliği Karşılaştırma",
    amac: "Ses yüksek geldiğinde tıkla. Alçak seslerde tıklama.",
    nasil: [
      "5 seviyeli ses rastgele çalar.",
      "Eşik üzeri ses = tıklama doğru sayılır.",
      "Eşik altı ses = tıklanırsa yanlış sayılır."
    ]
  },
  uzun_kenar_karsilastirma: {
    ad: "Uzun Kenar Karşılaştırma",
    amac: "Alt kenarı uzun olan şekli gördüğünde tıkla.",
    nasil: [
      "Kare/dikdörtgen görüntüleri akar.",
      "Alt kenarı uzun olan şekle tıklama = doğru sayılır.",
      "Yanlış şekle tıklama = yanlış sayılır."
    ]
  },
  renk_akisinda_maviyi_bul: {
    ad: "Renk Akışı İçinde Maviyi Bul",
    amac: "Sadece mavi karelere tıkla. Diğer renklerde tıklama.",
    nasil: [
      "Kırmızı – Sarı – Yeşil – Mavi akar.",
      "Mavi → doğru sayılır.",
      "Diğerleri → yanlış sayılır."
    ]
  },
  art_arda_ayni_sayi: {
    ad: "Art Arda Aynı Sayı",
    amac: "Arka arkaya aynı gelen sayıyı gördüğünde tıkla.",
    nasil: [
      "Sayı dizisi akar.",
      "Örnek: 7 → 4 → 4 → tıklama doğru sayılır.",
      "Eşleşme yokken tıklarsan yanlış sayılır.",
      "Eşleşmeyi kaçırırsan yanlış sayılır."
    ]
  },
  cift_uyaranda_sadece_gorsel: {
    ad: "Çift Uyaranda Sadece Görsel",
    amac: "Görseller akarken sesler karışacak. Sadece görsel hedefi gördüğünde tıkla.",
    nasil: [
      "Görsel akış + dikkat dağıtıcı sesler.",
      "Hedef görsel → doğru sayılır.",
      "Yanlış görsel → yanlış sayılır.",
      "Boş tıklama → yanlış sayılır."
    ]
  },
  netlesen_gorsel: {
    ad: "Netleşen Görsel",
    amac: "Görsel bulanık başlayacak. Netleştiğinde tıkla.",
    nasil: [
      "Görsel bulanık → yarı net → net.",
      "Netleştiğinde tıklama → doğru sayılır.",
      "Çok erken / çok geç → yanlış sayılır."
    ]
  },
  rastgele_surede_cikan_hedef: {
    ad: "Rastgele Sürede Çıkan Hedef",
    amac: "Hedef düzensiz aralıklarla çıkacak. Her gördüğünde tıkla.",
    nasil: [
      "Hedef 0.5–4 sn rastgele aralıklarla belirir.",
      "Tıklama → doğru sayılır.",
      "Erken tıklama → yanlış sayılır.",
      "Hedefi kaçırma → yanlış sayılır."
    ]
  }
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const oyunId = localStorage.getItem("surdurulenDikkatOyunId");
  
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
        const oyunId = localStorage.getItem("surdurulenDikkatOyunId");
        window.location.href = `oyun.html?oyun=${oyunId}`;
      }, 500);
      clearInterval(interval);
    }
  }, 1000);
}

