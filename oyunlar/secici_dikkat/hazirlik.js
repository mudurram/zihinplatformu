// ==========================================================
// 🎯 Seçici Dikkat Oyun Hazırlık Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN BİLGİLERİ
// ==========================================================
const OYUN_BILGILERI = {
  hedefi_bul: {
    ad: "Hedefi Bul",
    amac: "Ekranda verilen nesneler arasından sadece yönergede belirtilen hedefi seç.",
    nasil: [
      "Ekranda çok sayıda nesne görünecek.",
      "Üstte hedef yazısı olacak (ör: 'Mavi kareyi seç').",
      "Doğru nesneye tıklarsan doğru sayılır.",
      "Yanlış nesneye tıklarsan yanlış sayılır."
    ]
  },
  farkli_olani_bul: {
    ad: "Farklı Olanı Bul",
    amac: "Diğerlerinden farklı olan tek nesneyi bul ve seç.",
    nasil: [
      "5-6 benzer nesne ve 1 farklı nesne gösterilecek.",
      "Farklı olanı bulup seç.",
      "Doğru seçim doğru sayılır."
    ]
  },
  gurultulu_alanda_hedef: {
    ad: "Gürültülü Alanda Hedef Ara",
    amac: "Karmaşık ekrandaki çok sayıdaki öğe arasından sadece hedef nesneyi seç.",
    nasil: [
      "50-80 karışık şekil gösterilecek.",
      "Üstte hedef belirtilecek (ör: 'A harflerini seç').",
      "Hızlıca doğru hedefleri seç."
    ]
  },
  cift_filtreli_secim: {
    ad: "Çift Filtreli Seçim",
    amac: "Yönergede verilen hem renk hem şekil filtresine uyan öğeleri seç.",
    nasil: [
      "Örnek: 'Kırmızı üçgenleri seç'.",
      "Ekranda çok sayıda karışık renk/şekil olacak.",
      "Doğru kombinasyonları seç."
    ]
  },
  dikkat_dagitici_yoksay: {
    ad: "Dikkat Dağıtıcıyı Yoksay (Flanker)",
    amac: "Ortadaki okun yönüne göre cevap ver. Dikkat dağıtıcı okları göz ardı et.",
    nasil: [
      "Ortadaki okun yönüne göre cevap ver.",
      "Yan taraftaki dikkat dağıtıcı okları göz ardı et.",
      "Doğru yöne tıklarsan doğru sayılır."
    ]
  },
  benzerler_arasinda_dogru: {
    ad: "Benzerler Arasında Doğruyu Seç",
    amac: "Birbirine çok benzeyen nesneler arasından doğru hedefi seç.",
    nasil: [
      "Çok benzer renk tonları veya şekiller gösterilecek.",
      "Üstte hedef belirtilecek (ör: 'Açık mavi kareyi seç').",
      "Doğru hedefi seç."
    ]
  },
  engelleyeni_gormezden_gel: {
    ad: "Engelleyeni Görmezden Gel",
    amac: "Yönergede verilen 'DEĞİL' kuralına göre seçim yap.",
    nasil: [
      "Örnek: 'Kırmızı OLMAYAN üçgenleri seç'.",
      "Ekranda karışık şekiller görünecek.",
      "Sadece şartı sağlayanları seç."
    ]
  },
  arada_beliren_hedef: {
    ad: "Arada Beliren Hedefi Yakala",
    amac: "Ekranda sürekli hareket eden nesneler içinden ara ara beliren hedefi hızlıca seç.",
    nasil: [
      "Arka planda dönen/yanıp sönen öğeler olacak.",
      "Hedef nesne anlık olarak belirecek.",
      "Hızlıca hedefe tıkla."
    ]
  },
  isitsel_gorsel_eslestirme: {
    ad: "İşitsel–Görsel Eşleştirme",
    amac: "Duyduğun sesi temsil eden doğru harfe tıkla.",
    nasil: [
      "Sistem bir harf sesi oynatacak (ör: 'B').",
      "Ekranda karışık harfler görünecek.",
      "Duyduğun harfe tıkla."
    ]
  },
  aynisini_bul: {
    ad: "Aynısını Bul",
    amac: "Yukarıdaki modeli dikkatle incele ve alttaki seçeneklerden birebir aynı olanı seç.",
    nasil: [
      "Üstte bir örnek şekil/nesne gösterilecek.",
      "Altta çok benzeyen 4-6 seçenek olacak.",
      "Birebir aynı olanı seç."
    ]
  }
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const oyunId = localStorage.getItem("seciciDikkatOyunId");
  
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
        const oyunId = localStorage.getItem("seciciDikkatOyunId");
        window.location.href = `oyun.html?oyun=${oyunId}`;
      }, 500);
      clearInterval(interval);
    }
  }, 1000);
}

