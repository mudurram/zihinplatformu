// ==========================================================
// 🎯 Bölünmüş Dikkat Oyunları - Ortak Oyun Mantığı
// ==========================================================

import { GLOBAL } from "../../platform/globalConfig.js";
import { GameEngine } from "../../engine/gameEngine.js";

// ==========================================================
// 🎮 OYUN DEĞİŞKENLERİ
// ==========================================================
let engine = null;
let oyunId = null;
let oyunAdi = null;
let oyunState = "bekleme"; // bekleme, aktif, bitmis
let tepkiBaslangic = null;
let oyunInterval = null;
let oyunTimeout = null;
let cevapVerildi = false;

// Ses dosyaları
let dogruSes = null;
let yanlisSes = null;

// Oyun özel değişkenler
let mevcutRenkYazisi = null;
let mevcutRenkKodu = null;
let mevcutSembol = null;
let solSayac = 0;
let sagSayac = 30;
let sayacInterval = null;
let mevcutNesne = null;
let mevcutSes = null;
let solHarf = null;
let sagSayi = null;
let nesneBoyutu = null;
let metinIcerik = null;
let kacirilanHedef = 0;

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  oyunId = urlParams.get("oyun") || localStorage.getItem("bolunmusDikkatOyunId");
  oyunAdi = localStorage.getItem("bolunmusDikkatOyunAdi") || "Bölünmüş Dikkat Oyunu";

  if (!oyunId) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  yukleSesler();

  engine = new GameEngine({
    gameName: `bolunmus_dikkat_${oyunId}`,
    timeLimit: 30
  });

  engine.start((dogru, yanlis, sure) => {
    updateUI(dogru, yanlis, sure);
  });

  document.getElementById("bitirBtn").onclick = () => {
    oyunuBitir();
  };

  document.getElementById("hud").style.display = "flex";
  document.getElementById("oyunAlani").style.display = "flex";

  oyunuBaslat();
});

// ==========================================================
// 🔊 SES YÜKLEME
// ==========================================================
function yukleSesler() {
  try {
    const sesYolu = "../../sesler/";
    dogruSes = new Audio(sesYolu + "dogru.mp3");
    yanlisSes = new Audio(sesYolu + "yanlis.mp3");
    
    dogruSes.onerror = () => console.warn("⚠ Doğru ses dosyası yüklenemedi:", sesYolu + "dogru.mp3");
    yanlisSes.onerror = () => console.warn("⚠ Yanlış ses dosyası yüklenemedi:", sesYolu + "yanlis.mp3");
    
    dogruSes.preload = "auto";
    yanlisSes.preload = "auto";
  } catch (err) {
    console.warn("Ses dosyaları yüklenemedi:", err);
  }
}

// ==========================================================
// 🎮 OYUN BAŞLATMA
// ==========================================================
function oyunuBaslat() {
  oyunState = "aktif";
  cevapVerildi = false;
  tepkiBaslangic = null;
  kacirilanHedef = 0;
  
  oyunIceriginiYukle();
  yeniTur();
}

// ==========================================================
// 📦 OYUN İÇERİĞİNİ YÜKLE
// ==========================================================
function oyunIceriginiYukle() {
  const oyunIcerik = document.getElementById("oyunIcerik");
  oyunIcerik.innerHTML = "";

  switch (oyunId) {
    case "sekil_renk_uyumsuzlugu":
      yukleSekilRenkUyumsuzlugu(oyunIcerik);
      break;
    case "cift_gorev_iki_sayac":
      yukleCiftGorevIkiSayac(oyunIcerik);
      break;
    case "nesne_ses_esleme":
      yukleNesneSesEslestirme(oyunIcerik);
      break;
    case "sol_sag_bolunmus_ekran":
      yukleSolSagBolunmusEkran(oyunIcerik);
      break;
    case "buyuk_nesne_metin":
      yukleBuyukNesneMetin(oyunIcerik);
      break;
    default:
      oyunIcerik.innerHTML = "<p>Oyun bulunamadı.</p>";
  }
}

// ==========================================================
// 🔄 YENİ TUR
// ==========================================================
function yeniTur() {
  if (engine.gameFinished || oyunState === "bitmis") return;

  cevapVerildi = false;
  tepkiBaslangic = null;

  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);
  if (sayacInterval) clearInterval(sayacInterval);

  switch (oyunId) {
    case "sekil_renk_uyumsuzlugu":
      turSekilRenkUyumsuzlugu();
      break;
    case "cift_gorev_iki_sayac":
      turCiftGorevIkiSayac();
      break;
    case "nesne_ses_esleme":
      turNesneSesEslestirme();
      break;
    case "sol_sag_bolunmus_ekran":
      turSolSagBolunmusEkran();
      break;
    case "buyuk_nesne_metin":
      turBuyukNesneMetin();
      break;
  }
}

// ==========================================================
// ✅ CEVAP VER
// ==========================================================
function cevapVer(dogruMu, hataTuru = null) {
  if (engine.gameFinished || oyunState === "bitmis" || cevapVerildi) return;

  cevapVerildi = true;

  const tepkiSuresi = tepkiBaslangic ? Math.round(performance.now() - tepkiBaslangic) : 0;

  if (dogruMu && dogruSes) {
    dogruSes.currentTime = 0;
    dogruSes.play().catch(() => {});
  } else if (!dogruMu && yanlisSes) {
    yanlisSes.currentTime = 0;
    yanlisSes.play().catch(() => {});
  }

  const trialData = {
    correct: dogruMu,
    reaction_ms: tepkiSuresi
  };

  if (hataTuru) {
    trialData.hata_turu = hataTuru;
  }

  engine.recordTrial(trialData);

  setTimeout(() => {
    yeniTur();
  }, 300);
}

// ==========================================================
// ⏹️ OYUNU BİTİR
// ==========================================================
function oyunuBitir() {
  if (engine.gameFinished) return;

  oyunState = "bitmis";
  
  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);
  if (sayacInterval) clearInterval(sayacInterval);

  const oyunIcerik = document.getElementById("oyunIcerik");
  oyunIcerik.innerHTML = "<h2>Oyun Bitti</h2>";

  engine.endGame().then(() => {
    setTimeout(() => {
      if (window.location.pathname.includes("platform/sonuc.html")) {
        window.location.href = "sonuc.html";
      } else if (!window.location.pathname.includes("sonuc.html")) {
        window.location.href = "sonuc.html";
      }
    }, 100);
  }).catch(() => {
    setTimeout(() => {
      window.location.href = "sonuc.html";
    }, 100);
  });
}

// ==========================================================
// 📊 UI GÜNCELLEME
// ==========================================================
function updateUI(dogru, yanlis, sure) {
  document.getElementById("dogruSayac").textContent = dogru;
  document.getElementById("yanlisSayac").textContent = yanlis;
  document.getElementById("sureSayac").textContent = `${sure} sn`;

  if (sure <= 0 && !engine.gameFinished) {
    oyunuBitir();
  }
}

// ==========================================================
// 🎮 OYUN 1: ŞEKİL – RENK UYUMSUZLUĞU
// ==========================================================
function yukleSekilRenkUyumsuzlugu(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sadece <strong>'Kırmızı'</strong> yazısı göründüğünde tıkla. Üçgen sembolü görürsen tıklama.</p>
    <div style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div id="renkYazisi" style="font-size: 80px; font-weight: bold;"></div>
      <div id="sembolAlani" style="position: absolute; top: 20px; right: 20px; font-size: 60px;"></div>
    </div>
  `;

  const oyunAlani = container.querySelector("div[style*='position: relative']");
  oyunAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutRenkYazisi === "Kırmızı" && mevcutSembol !== "üçgen") {
        cevapVer(true);
      } else if (mevcutSembol === "üçgen") {
        cevapVer(false, "impulsivite");
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turSekilRenkUyumsuzlugu() {
  const renkYazisi = document.getElementById("renkYazisi");
  const sembolAlani = document.getElementById("sembolAlani");
  if (!renkYazisi || !sembolAlani) return;

  renkYazisi.textContent = "";
  sembolAlani.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 800 + Math.random() * 200; // 0.8-1 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const renkIsimleri = ["Kırmızı", "Mavi", "Sarı", "Yeşil", "Mor"];
    const renkKodlari = {
      "Kırmızı": "#e74c3c",
      "Mavi": "#3498db",
      "Sarı": "#f1c40f",
      "Yeşil": "#2ecc71",
      "Mor": "#9b59b6"
    };
    const semboller = ["daire", "kare", "üçgen"];
    const sembolEmojileri = {
      "daire": "⭕",
      "kare": "⬜",
      "üçgen": "🔺"
    };

    const rastgeleRenk = renkIsimleri[Math.floor(Math.random() * renkIsimleri.length)];
    const rastgeleRenkKodu = renkKodlari[renkIsimleri[Math.floor(Math.random() * renkIsimleri.length)]];
    const rastgeleSembol = semboller[Math.floor(Math.random() * semboller.length)];

    mevcutRenkYazisi = rastgeleRenk;
    mevcutRenkKodu = rastgeleRenkKodu;
    mevcutSembol = rastgeleSembol;

    renkYazisi.textContent = rastgeleRenk;
    renkYazisi.style.color = rastgeleRenkKodu;
    sembolAlani.textContent = sembolEmojileri[rastgeleSembol];

    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutRenkYazisi === "Kırmızı" && mevcutSembol !== "üçgen" && !cevapVerildi) {
        kacirilanHedef++;
      }
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 2: ÇİFT GÖREV – İKİ SAYAÇ
// ==========================================================
function yukleCiftGorevIkiSayac(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sol sayaç <strong>5</strong> olduğunda tıkla. Sağ sayaç <strong>15</strong> olduğunda sakın tıklama.</p>
    <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; cursor: pointer;">
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">Sol Sayaç</div>
        <div id="solSayac" style="font-size: 120px; font-weight: bold; color: #3498db;">0</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">Sağ Sayaç</div>
        <div id="sagSayac" style="font-size: 120px; font-weight: bold; color: #e74c3c;">30</div>
      </div>
    </div>
  `;

  const oyunAlani = container.querySelector("div[style*='display: flex']");
  oyunAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (solSayac === 5) {
        cevapVer(true);
      } else if (sagSayac === 15) {
        cevapVer(false, "impulsivite");
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turCiftGorevIkiSayac() {
  const solSayacEl = document.getElementById("solSayac");
  const sagSayacEl = document.getElementById("sagSayac");
  if (!solSayacEl || !sagSayacEl) return;

  solSayac = 0;
  sagSayac = 30;
  solSayacEl.textContent = solSayac;
  sagSayacEl.textContent = sagSayac;
  oyunState = "aktif";

  sayacInterval = setInterval(() => {
    if (engine.gameFinished || oyunState === "bitmis") {
      clearInterval(sayacInterval);
      return;
    }

    solSayac++;
    sagSayac--;

    solSayacEl.textContent = solSayac;
    sagSayacEl.textContent = sagSayac;

    if (solSayac === 5 && !cevapVerildi) {
      tepkiBaslangic = performance.now();
    }
  }, 1000);
}

// ==========================================================
// 🎮 OYUN 3: NESNE – SES EŞLEME
// ==========================================================
function yukleNesneSesEslestirme(container) {
  container.innerHTML = `
    <p class="talimat-metni">Görünen nesne ile duyduğun ses aynıysa tıkla. Farklıysa tıklama.</p>
    <div id="nesneAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 100px; cursor: pointer;"></div>
  `;

  const nesneAlani = document.getElementById("nesneAlani");
  nesneAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutNesne === mevcutSes) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turNesneSesEslestirme() {
  const nesneAlani = document.getElementById("nesneAlani");
  if (!nesneAlani) return;

  nesneAlani.innerHTML = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 500; // 1-1.5 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const nesneler = ["kalem", "kitap", "top", "masa", "sandalye"];
    const nesneEmojileri = {
      "kalem": "✏️",
      "kitap": "📚",
      "top": "⚽",
      "masa": "🪑",
      "sandalye": "🪑"
    };

    const rastgeleNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
    const eslesmeMi = Math.random() < 0.5;
    const rastgeleSes = eslesmeMi ? rastgeleNesne : nesneler[Math.floor(Math.random() * nesneler.length)];

    mevcutNesne = rastgeleNesne;
    mevcutSes = rastgeleSes;

    nesneAlani.textContent = nesneEmojileri[rastgeleNesne];
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Ses simülasyonu (gerçek uygulamada ses dosyası çalınabilir)
    // Şimdilik görsel gösterim yapıyoruz
    const sesGosterimi = document.createElement("div");
    sesGosterimi.style.position = "absolute";
    sesGosterimi.style.top = "20px";
    sesGosterimi.style.left = "50%";
    sesGosterimi.style.transform = "translateX(-50%)";
    sesGosterimi.style.fontSize = "24px";
    sesGosterimi.style.color = "#2ecc71";
    sesGosterimi.textContent = `🔊 Ses: ${rastgeleSes}`;
    nesneAlani.appendChild(sesGosterimi);

    oyunTimeout = setTimeout(() => {
      if (mevcutNesne === mevcutSes && !cevapVerildi) {
        kacirilanHedef++;
      }
      yeniTur();
    }, 1500);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 4: SOL – SAĞ BÖLÜNMÜŞ EKRAN
// ==========================================================
function yukleSolSagBolunmusEkran(container) {
  container.innerHTML = `
    <p class="talimat-metni">Solda <strong>'B'</strong> harfi gelirse tıkla. Sağda çift sayı gelirse sakın tıklama.</p>
    <div style="display: flex; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; cursor: pointer;">
      <div id="solAlan" style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: bold; border-right: 3px solid #34495e; background: #fff;"></div>
      <div id="sagAlan" style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: bold; background: #fff;"></div>
    </div>
  `;

  const oyunAlani = container.querySelector("div[style*='display: flex']");
  oyunAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (solHarf === "B" && sagSayi % 2 !== 0) {
        cevapVer(true);
      } else if (sagSayi % 2 === 0) {
        cevapVer(false, "impulsivite");
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turSolSagBolunmusEkran() {
  const solAlan = document.getElementById("solAlan");
  const sagAlan = document.getElementById("sagAlan");
  if (!solAlan || !sagAlan) return;

  solAlan.textContent = "";
  sagAlan.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 800 + Math.random() * 200; // 0.8-1 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const harfler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const sayilar = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    solHarf = harfler[Math.floor(Math.random() * harfler.length)];
    sagSayi = sayilar[Math.floor(Math.random() * sayilar.length)];

    solAlan.textContent = solHarf;
    sagAlan.textContent = sagSayi;

    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (solHarf === "B" && sagSayi % 2 !== 0 && !cevapVerildi) {
        kacirilanHedef++;
      }
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 5: BÜYÜK NESNE + METİN GÖREVİ
// ==========================================================
function yukleBuyukNesneMetin(container) {
  container.innerHTML = `
    <p class="talimat-metni">Nesne <strong>büyük</strong>se tıkla. Metinde <strong>'küçük'</strong> yazıyorsa da tıkla. Diğer durumlarda tıklama.</p>
    <div id="nesneMetinAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
      <div id="nesneGorsel" style="font-size: 150px; margin-bottom: 20px;"></div>
      <div id="metinIcerik" style="font-size: 36px; font-weight: bold; color: #1b2d4a;"></div>
    </div>
  `;

  const nesneMetinAlani = document.getElementById("nesneMetinAlani");
  nesneMetinAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (nesneBoyutu === "büyük" || metinIcerik === "küçük") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turBuyukNesneMetin() {
  const nesneGorsel = document.getElementById("nesneGorsel");
  const metinIcerikEl = document.getElementById("metinIcerik");
  if (!nesneGorsel || !metinIcerikEl) return;

  nesneGorsel.textContent = "";
  metinIcerikEl.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 200; // 1-1.2 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const nesneler = ["📦", "📚", "⚽", "🪑", "✏️"];
    const boyutlar = ["büyük", "küçük"];
    const metinler = ["büyük", "küçük", "orta"];

    const rastgeleNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
    nesneBoyutu = boyutlar[Math.floor(Math.random() * boyutlar.length)];
    metinIcerik = metinler[Math.floor(Math.random() * metinler.length)];

    nesneGorsel.textContent = rastgeleNesne;
    nesneGorsel.style.fontSize = nesneBoyutu === "büyük" ? "200px" : "100px";
    metinIcerikEl.textContent = metinIcerik;

    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if ((nesneBoyutu === "büyük" || metinIcerik === "küçük") && !cevapVerildi) {
        kacirilanHedef++;
      }
      yeniTur();
    }, 1200);
  }, beklemeSuresi);
}

