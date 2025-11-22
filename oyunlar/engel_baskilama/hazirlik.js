// ==========================================================
// 🎯 Engel Baskılama Oyun Hazırlık Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN BİLGİLERİ
// ==========================================================
const OYUN_BILGILERI = {
  kirmizida_dur_yesilde_bas: {
    ad: "Kırmızıda Dur – Yeşilde Bas",
    amac: "Yeşil görünce bas, kırmızı görünce dur. 30 saniye içinde olabildiğince çok doğru tepki ver.",
    nasil: [
      "Ekranın arka planı yeşil/kırmızı olarak rastgele değişir.",
      "Yeşil ekranda ekrana dokunursan doğru sayılır.",
      "Kırmızıda dokunursan yanlış sayılır.",
      "Dokunmazsan nötr (puan yok)."
    ]
  },
  yaniltici_oklar: {
    ad: "Yanıltıcı Oklar",
    amac: "Okun yönüne değil, okun altında yazan yöne bas.",
    nasil: [
      "Bir ok görünür (← → ↑ ↓).",
      "Altında karışık bir yön kelimesi çıkar (SAĞ – SOL – YUKARI – AŞAĞI).",
      "Yazıya göre yön butonuna bas.",
      "Örnek: → (ok sağa) ama altında 'SOL' yazıyor → SOLa tıklanır."
    ]
  },
  engelle_dusun: {
    ad: "Engelle Düşün – Hızlı Karar",
    amac: "Ekranda hangi nesne daha küçükse ona bas. Bazen büyük nesne gözünü yanıltacak; sakın ona basma!",
    nasil: [
      "Ekranda aynı nesnenin büyük ve küçük versiyonu belirir.",
      "Küçüğe tıkla.",
      "Büyük olanı seçersen yanlış sayılır."
    ]
  },
  aynisı_degil: {
    ad: "Aynısı Değil – Farklıya Tıkla",
    amac: "Ekranda 3 nesne göreceksin. İkisi aynı, biri farklı. Görevin her zaman farklı olan nesneye tıklamak.",
    nasil: [
      "3 nesne görünür.",
      "2 tanesi aynı, biri farklı boyut/renk/şekilde.",
      "Farklı olana tıklarsan doğru sayılır.",
      "Yanlış nesneye tıklarsan yanlış sayılır."
    ]
  },
  yanlis_aliskanlik: {
    ad: "Yanlış Alışkanlığı Baskıla (Yasaklı Simge)",
    amac: "Bazı nesneler yasak işaretlidir. Yasaklı simgeye asla basma! Diğerlerine basabilirsin.",
    nasil: [
      "Nesneler tek tek ekrana gelir.",
      "Normal nesne → basınca doğru.",
      "Yasaklı kırmızı çerçeveli nesne → basılırsa yanlış.",
      "Yasaklı nesneye basmadan geçmek doğru sayılmaz (nötr)."
    ]
  },
  no_go_ses: {
    ad: "Ses Geldiğinde Değil – Gelmediğinde Bas",
    amac: "Ekran boşken ses yoksa ekrana bas. Sesli uyarı gelirse hiç basma!",
    nasil: [
      "Ekran sade bir renk olarak durur.",
      "Sessiz dönemde ekrana basmak → doğru.",
      "Ses çaldığı anda basarsan → yanlış.",
      "Ses geldiğinde hiç basmamak → doğru."
    ]
  },
  ters_tepki: {
    ad: "Ters Tepki Oyunu (BAS ↔ DUR)",
    amac: "Ekranda 'BAS' yazarsa dur. 'DUR' yazarsa bas. Her şey tam tersine!",
    nasil: [
      "Büyük yazı görünür: 'BAS' veya 'DUR'.",
      "BAS yazısı çıktıysa → dokunmazsan doğru, basarsan yanlış.",
      "DUR yazısı çıktıysa → basarsan doğru, basmazsan yanlış."
    ]
  },
  hizli_seri_yasakli: {
    ad: "Hızlı Seri İçinde Yasaklı Öğe",
    amac: "Gelen tüm nesnelere bas. Ama yasaklı nesne gelirse hiç basma!",
    nasil: [
      "Ardışık hızlı nesneler akar.",
      "Normal nesne → basınca doğru.",
      "Yasaklı nesne → basınca yanlış, basmazsa doğru."
    ]
  },
  gorev_degisti: {
    ad: "Hayır! Görev Değişti",
    amac: "Görev oynarken değişebilir. Görev değiştiğinde ekranda kısa bildirim göreceksin. Değişen kurala göre tepki ver.",
    nasil: [
      "Başlangıç görevi: 'KÜÇÜĞE BAS'.",
      "Görev değişebilir: 'BÜYÜĞE BAS', 'FARKLI OLAN NESNEYE BAS' vb.",
      "Her yeni kural geldiğinde hızlıca uyum sağlamalısın.",
      "Yanlış uyum = yanlış sayılır."
    ]
  },
  capraz_tepki: {
    ad: "Çapraz Tepki Hız Oyunu",
    amac: "Sol tarafta nesne görünürse sağa bas. Sağ tarafta nesne görünürse sola bas. Her şey ters!",
    nasil: [
      "Nesne ekranın sağ veya sol tarafında belirir.",
      "Nesne soldaysa → SAĞ taraf butonu doğru.",
      "Nesne sağdaysa → SOL taraf butonu doğru.",
      "Yanlış buton → yanlış sayılır."
    ]
  }
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const oyunId = localStorage.getItem("engelBaskilamaOyunId");
  
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
        const oyunId = localStorage.getItem("engelBaskilamaOyunId");
        window.location.href = `oyun.html?oyun=${oyunId}`;
      }, 500);
      clearInterval(interval);
    }
  }, 1000);
}

