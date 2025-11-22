// ==========================================================
// 🎯 Sürdürülen Dikkat Oyunları - Ortak Oyun Mantığı
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
let cevapVerildi = false; // Bir turda sadece bir kez cevap verilebilir

// Ses dosyaları
let dogruSes = null;
let yanlisSes = null;

// Oyun özel değişkenler
let mevcutGorsel = null;
let mevcutHarf = null;
let mevcutMeyve = null;
let mevcutSes = null;
let mevcutSayi = null;
let oncekiSayi = null;
let mevcutRenk = null;
let mevcutSekil = null;
let gorselNetlik = 0;
let netlesmeInterval = null;

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // URL'den oyun ID'sini al
  const urlParams = new URLSearchParams(window.location.search);
  oyunId = urlParams.get("oyun") || localStorage.getItem("surdurulenDikkatOyunId");
  oyunAdi = localStorage.getItem("surdurulenDikkatOyunAdi") || "Sürdürülen Dikkat Oyunu";

  if (!oyunId) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  // Ses dosyalarını yükle
  yukleSesler();

  // Game Engine'i başlat
  engine = new GameEngine({
    gameName: `surdurulen_dikkat_${oyunId}`,
    timeLimit: 30
  });

  // UI güncelleme fonksiyonu
  engine.start((dogru, yanlis, sure) => {
    updateUI(dogru, yanlis, sure);
  });

  // Bitir butonu
  document.getElementById("bitirBtn").onclick = () => {
    oyunuBitir();
  };

  // HUD ve oyun alanını göster
  document.getElementById("hud").style.display = "flex";
  document.getElementById("oyunAlani").style.display = "flex";

  // Oyunu başlat
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
  
  // Oyun içeriğini yükle
  oyunIceriginiYukle();
  
  // İlk turu başlat
  yeniTur();
}

// ==========================================================
// 📦 OYUN İÇERİĞİNİ YÜKLE
// ==========================================================
function oyunIceriginiYukle() {
  const oyunIcerik = document.getElementById("oyunIcerik");
  oyunIcerik.innerHTML = "";

  switch (oyunId) {
    case "hedef_gorseli_yakalama":
      yukleHedefGorseliYakalama(oyunIcerik);
      break;
    case "harf_sayi_akisinda_hedef":
      yukleHarfSayiAkisindaHedef(oyunIcerik);
      break;
    case "dikkat_dagitici_arasinda_hedef":
      yukleDikkatDagiticiArasindaHedef(oyunIcerik);
      break;
    case "hiz_degisimli_hedef":
      yukleHizDegisimliHedef(oyunIcerik);
      break;
    case "ding_dong_ses":
      yukleDingDongSes(oyunIcerik);
      break;
    case "ses_yuksekligi_karsilastirma":
      yukleSesYuksekligiKarsilastirma(oyunIcerik);
      break;
    case "uzun_kenar_karsilastirma":
      yukleUzunKenarKarsilastirma(oyunIcerik);
      break;
    case "renk_akisinda_maviyi_bul":
      yukleRenkAkisindaMaviyiBul(oyunIcerik);
      break;
    case "art_arda_ayni_sayi":
      yukleArtArdaAyniSayi(oyunIcerik);
      break;
    case "cift_uyaranda_sadece_gorsel":
      yukleCiftUyarandaSadeceGorsel(oyunIcerik);
      break;
    case "netlesen_gorsel":
      yukleNetlesenGorsel(oyunIcerik);
      break;
    case "rastgele_surede_cikan_hedef":
      yukleRastgeleSuredeCikanHedef(oyunIcerik);
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
  if (netlesmeInterval) clearInterval(netlesmeInterval);

  switch (oyunId) {
    case "hedef_gorseli_yakalama":
      turHedefGorseliYakalama();
      break;
    case "harf_sayi_akisinda_hedef":
      turHarfSayiAkisindaHedef();
      break;
    case "dikkat_dagitici_arasinda_hedef":
      turDikkatDagiticiArasindaHedef();
      break;
    case "hiz_degisimli_hedef":
      turHizDegisimliHedef();
      break;
    case "ding_dong_ses":
      turDingDongSes();
      break;
    case "ses_yuksekligi_karsilastirma":
      turSesYuksekligiKarsilastirma();
      break;
    case "uzun_kenar_karsilastirma":
      turUzunKenarKarsilastirma();
      break;
    case "renk_akisinda_maviyi_bul":
      turRenkAkisindaMaviyiBul();
      break;
    case "art_arda_ayni_sayi":
      turArtArdaAyniSayi();
      break;
    case "cift_uyaranda_sadece_gorsel":
      turCiftUyarandaSadeceGorsel();
      break;
    case "netlesen_gorsel":
      turNetlesenGorsel();
      break;
    case "rastgele_surede_cikan_hedef":
      turRastgeleSuredeCikanHedef();
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

  // Yeni tur başlat (sürdürülen dikkat oyunlarında sürekli devam eder)
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
  if (netlesmeInterval) clearInterval(netlesmeInterval);

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
// 🎮 OYUN 1: HEDEF GÖRSELİ YAKALAMA
// ==========================================================
function yukleHedefGorseliYakalama(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sadece <strong>⭐</strong> görseli gördüğünde tıkla.</p>
    <div id="gorselAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 80px;"></div>
  `;

  const gorselAlani = document.getElementById("gorselAlani");
  gorselAlani.onclick = () => {
    if (oyunState === "aktif" && mevcutGorsel === "hedef") {
      cevapVer(true);
    } else if (oyunState === "aktif") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turHedefGorseliYakalama() {
  const gorselAlani = document.getElementById("gorselAlani");
  if (!gorselAlani) return;

  gorselAlani.innerHTML = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 500; // 1-1.5 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const gorseller = ["⭐", "🔴", "🟢", "🔵", "🟡", "🟣", "⚫", "⚪"];
    const hedefGorsel = "⭐";
    const rastgeleGorsel = Math.random() < 0.3 ? hedefGorsel : gorseller[Math.floor(Math.random() * gorseller.length)];

    mevcutGorsel = rastgeleGorsel === hedefGorsel ? "hedef" : "dikkat_dagitici";
    gorselAlani.textContent = rastgeleGorsel;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Görsel 1 sn sonra kaybolur
    oyunTimeout = setTimeout(() => {
      if (mevcutGorsel === "hedef" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 2: HARF / SAYI AKIŞI İÇİNDE HEDEF
// ==========================================================
function yukleHarfSayiAkisindaHedef(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sadece <strong>A</strong> harfine tıkla. Diğer harflere tıklama.</p>
    <div id="harfAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: bold;"></div>
  `;

  const harfAlani = document.getElementById("harfAlani");
  harfAlani.onclick = () => {
    if (oyunState === "aktif" && mevcutHarf === "A") {
      cevapVer(true);
    } else if (oyunState === "aktif") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turHarfSayiAkisindaHedef() {
  const harfAlani = document.getElementById("harfAlani");
  if (!harfAlani) return;

  harfAlani.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 800; // 0.8 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const harfler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const rastgeleHarf = harfler[Math.floor(Math.random() * harfler.length)];

    mevcutHarf = rastgeleHarf;
    harfAlani.textContent = rastgeleHarf;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Harf 0.8 sn sonra kaybolur
    oyunTimeout = setTimeout(() => {
      if (mevcutHarf === "A" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 800);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 3: DİKKAT DAĞITICILAR ARASINDA HEDEF BUL
// ==========================================================
function yukleDikkatDagiticiArasindaHedef(container) {
  container.innerHTML = `
    <p class="talimat-metni">Çileğe tıkla. Kiraz ve domates dikkat dağıtıcıdır.</p>
    <div id="meyveAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 100px;"></div>
  `;

  const meyveAlani = document.getElementById("meyveAlani");
  meyveAlani.onclick = () => {
    if (oyunState === "aktif" && mevcutMeyve === "cilek") {
      cevapVer(true);
    } else if (oyunState === "aktif") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turDikkatDagiticiArasindaHedef() {
  const meyveAlani = document.getElementById("meyveAlani");
  if (!meyveAlani) return;

  meyveAlani.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 700; // 0.7 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const meyveler = [
      { emoji: "🍓", tip: "cilek" },
      { emoji: "🍒", tip: "kiraz" },
      { emoji: "🍅", tip: "domates" }
    ];
    const rastgeleMeyve = meyveler[Math.floor(Math.random() * meyveler.length)];

    mevcutMeyve = rastgeleMeyve.tip;
    meyveAlani.textContent = rastgeleMeyve.emoji;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutMeyve === "cilek" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 700);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 4: HIZ DEĞİŞİMLİ HEDEF
// ==========================================================
function yukleHizDegisimliHedef(container) {
  container.innerHTML = `
    <p class="talimat-metni">Hedef bazen hızlı bazen yavaş çıkacak. Gördüğünde hemen tıkla.</p>
    <div id="hedefAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center;">
      <div id="hedefNokta" class="hedef-nokta" style="display: none; width: 80px; height: 80px; background: #4a90e2; border-radius: 50%; cursor: pointer;"></div>
    </div>
  `;

  const hedefNokta = document.getElementById("hedefNokta");
  hedefNokta.onclick = () => {
    if (oyunState === "aktif") {
      cevapVer(true);
    }
  };
}

function turHizDegisimliHedef() {
  const hedefNokta = document.getElementById("hedefNokta");
  if (!hedefNokta) return;

  hedefNokta.style.display = "none";
  oyunState = "bekleme";

  const beklemeSuresi = 300 + Math.random() * 1200; // 0.3-1.5 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    hedefNokta.style.display = "block";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Hedef 1.5 sn sonra kaybolur
    oyunTimeout = setTimeout(() => {
      if (!cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1500);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 5: DING – DONG SES OYUNU
// ==========================================================
function yukleDingDongSes(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sadece <strong>Ding</strong> sesi duyulduğunda tıkla. <strong>Dong</strong> duyarsan tıklama.</p>
    <div id="sesAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: bold; cursor: pointer;"></div>
  `;

  const sesAlani = document.getElementById("sesAlani");
  sesAlani.onclick = () => {
    if (oyunState === "aktif" && mevcutSes === "ding") {
      cevapVer(true);
    } else if (oyunState === "aktif" && mevcutSes === "dong") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turDingDongSes() {
  const sesAlani = document.getElementById("sesAlani");
  if (!sesAlani) return;

  sesAlani.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 1000; // 1-2 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const rastgeleSes = Math.random() < 0.5 ? "ding" : "dong";
    mevcutSes = rastgeleSes;
    sesAlani.textContent = rastgeleSes === "ding" ? "🔔 DING" : "🔕 DONG";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutSes === "ding" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1500);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 6: SES YÜKSEKLİĞİ KARŞILAŞTIRMA
// ==========================================================
function yukleSesYuksekligiKarsilastirma(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ses yüksek geldiğinde tıkla. Alçak seslerde tıklama.</p>
    <div id="sesYukseklikAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: bold; cursor: pointer;"></div>
  `;

  const sesYukseklikAlani = document.getElementById("sesYukseklikAlani");
  sesYukseklikAlani.onclick = () => {
    if (oyunState === "aktif") {
      const yuksekMi = mevcutSes >= 3; // 3, 4, 5 seviyeleri yüksek
      if (yuksekMi) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turSesYuksekligiKarsilastirma() {
  const sesYukseklikAlani = document.getElementById("sesYukseklikAlani");
  if (!sesYukseklikAlani) return;

  sesYukseklikAlani.textContent = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 1000; // 1-2 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    mevcutSes = Math.floor(Math.random() * 5) + 1; // 1-5 seviye
    const yukseklikGosterimi = "🔊".repeat(mevcutSes);
    sesYukseklikAlani.textContent = `${yukseklikGosterimi} (${mevcutSes}/5)`;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutSes >= 3 && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1500);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 7: UZUN KENAR KARŞILAŞTIRMA
// ==========================================================
function yukleUzunKenarKarsilastirma(container) {
  container.innerHTML = `
    <p class="talimat-metni">Alt kenarı uzun olan şekli gördüğünde tıkla.</p>
    <div id="sekilAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; cursor: pointer;"></div>
  `;

  const sekilAlani = document.getElementById("sekilAlani");
  sekilAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutSekil === "alt_uzun") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turUzunKenarKarsilastirma() {
  const sekilAlani = document.getElementById("sekilAlani");
  if (!sekilAlani) return;

  sekilAlani.innerHTML = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 500; // 1-1.5 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const altUzunMu = Math.random() < 0.5;
    mevcutSekil = altUzunMu ? "alt_uzun" : "ust_uzun";
    
    const sekil = document.createElement("div");
    sekil.style.width = altUzunMu ? "100px" : "150px";
    sekil.style.height = altUzunMu ? "150px" : "100px";
    sekil.style.background = "#4a90e2";
    sekil.style.border = "3px solid #1b2d4a";
    sekilAlani.appendChild(sekil);
    
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutSekil === "alt_uzun" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1200);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 8: RENK AKIŞI İÇİNDE MAVİYİ BUL
// ==========================================================
function yukleRenkAkisindaMaviyiBul(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sadece <strong>mavi</strong> karelere tıkla. Diğer renklerde tıklama.</p>
    <div id="renkAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; cursor: pointer;"></div>
  `;

  const renkAlani = document.getElementById("renkAlani");
  renkAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutRenk === "mavi") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turRenkAkisindaMaviyiBul() {
  const renkAlani = document.getElementById("renkAlani");
  if (!renkAlani) return;

  renkAlani.innerHTML = "";
  oyunState = "bekleme";

  const beklemeSuresi = 800 + Math.random() * 400; // 0.8-1.2 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const renkler = ["kirmizi", "sari", "yesil", "mavi"];
    mevcutRenk = renkler[Math.floor(Math.random() * renkler.length)];
    
    const renkKodu = {
      kirmizi: "#e74c3c",
      sari: "#f1c40f",
      yesil: "#2ecc71",
      mavi: "#3498db"
    };

    const kare = document.createElement("div");
    kare.style.width = "120px";
    kare.style.height = "120px";
    kare.style.background = renkKodu[mevcutRenk];
    kare.style.border = "3px solid #1b2d4a";
    kare.style.borderRadius = "8px";
    renkAlani.appendChild(kare);
    
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutRenk === "mavi" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 9: ART ARDA AYNI SAYI
// ==========================================================
function yukleArtArdaAyniSayi(container) {
  container.innerHTML = `
    <p class="talimat-metni">Arka arkaya aynı gelen sayıyı gördüğünde tıkla.</p>
    <div id="sayiAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: bold; cursor: pointer;"></div>
  `;

  const sayiAlani = document.getElementById("sayiAlani");
  sayiAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutSayi === oncekiSayi) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turArtArdaAyniSayi() {
  const sayiAlani = document.getElementById("sayiAlani");
  if (!sayiAlani) return;

  oyunState = "bekleme";

  const beklemeSuresi = 800 + Math.random() * 400; // 0.8-1.2 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    mevcutSayi = Math.floor(Math.random() * 10); // 0-9
    sayiAlani.textContent = mevcutSayi;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    oyunTimeout = setTimeout(() => {
      if (mevcutSayi === oncekiSayi && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      oncekiSayi = mevcutSayi;
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 10: ÇİFT UYARANDA SADECE GÖRSEL
// ==========================================================
function yukleCiftUyarandaSadeceGorsel(container) {
  container.innerHTML = `
    <p class="talimat-metni">Görseller akarken sesler karışacak. Sadece görsel hedefi gördüğünde tıkla.</p>
    <div id="ciftUyaranAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; font-size: 80px; cursor: pointer;"></div>
  `;

  const ciftUyaranAlani = document.getElementById("ciftUyaranAlani");
  ciftUyaranAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (mevcutGorsel === "hedef") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turCiftUyarandaSadeceGorsel() {
  const ciftUyaranAlani = document.getElementById("ciftUyaranAlani");
  if (!ciftUyaranAlani) return;

  ciftUyaranAlani.innerHTML = "";
  oyunState = "bekleme";

  const beklemeSuresi = 1000 + Math.random() * 500; // 1-1.5 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    const gorseller = ["⭐", "🔴", "🟢", "🔵", "🟡"];
    const hedefGorsel = "⭐";
    const rastgeleGorsel = Math.random() < 0.3 ? hedefGorsel : gorseller[Math.floor(Math.random() * gorseller.length)];

    mevcutGorsel = rastgeleGorsel === hedefGorsel ? "hedef" : "dikkat_dagitici";
    ciftUyaranAlani.textContent = rastgeleGorsel;
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Dikkat dağıtıcı ses (görsel hedef olsa da olmasa da)
    if (Math.random() < 0.5) {
      // Ses çal (görsel dikkat dağıtıcı)
    }

    oyunTimeout = setTimeout(() => {
      if (mevcutGorsel === "hedef" && !cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 11: NETLEŞEN GÖRSEL
// ==========================================================
function yukleNetlesenGorsel(container) {
  container.innerHTML = `
    <p class="talimat-metni">Görsel bulanık başlayacak. Netleştiğinde tıkla.</p>
    <div id="netlesenAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div id="netlesenGorsel" style="font-size: 100px; filter: blur(20px); transition: filter 2s;"></div>
    </div>
  `;

  const netlesenAlani = document.getElementById("netlesenAlani");
  netlesenAlani.onclick = () => {
    if (oyunState === "aktif") {
      if (gorselNetlik >= 0.8) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turNetlesenGorsel() {
  const netlesenGorsel = document.getElementById("netlesenGorsel");
  if (!netlesenGorsel) return;

  gorselNetlik = 0;
  netlesenGorsel.textContent = "⭐";
  netlesenGorsel.style.filter = "blur(20px)";
  oyunState = "bekleme";

  const beklemeSuresi = 500;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Netleşme animasyonu
    let netlikAdimi = 0;
    netlesmeInterval = setInterval(() => {
      netlikAdimi += 0.05;
      gorselNetlik = netlikAdimi;
      const blurMiktari = 20 * (1 - netlikAdimi);
      netlesenGorsel.style.filter = `blur(${blurMiktari}px)`;

      if (netlikAdimi >= 1) {
        clearInterval(netlesmeInterval);
        oyunTimeout = setTimeout(() => {
          if (!cevapVerildi) {
            cevapVer(false, "kaçırma");
          }
          yeniTur();
        }, 1000);
      }
    }, 100);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 12: RASTGELE SÜREDE ÇIKAN HEDEF
// ==========================================================
function yukleRastgeleSuredeCikanHedef(container) {
  container.innerHTML = `
    <p class="talimat-metni">Hedef düzensiz aralıklarla çıkacak. Her gördüğünde tıkla.</p>
    <div id="rastgeleHedefAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1; display: flex; align-items: center; justify-content: center;">
      <div id="rastgeleHedef" class="hedef-nokta" style="display: none; width: 80px; height: 80px; background: #4a90e2; border-radius: 50%; cursor: pointer;"></div>
    </div>
  `;

  const rastgeleHedef = document.getElementById("rastgeleHedef");
  rastgeleHedef.onclick = () => {
    if (oyunState === "aktif") {
      cevapVer(true);
    }
  };
}

function turRastgeleSuredeCikanHedef() {
  const rastgeleHedef = document.getElementById("rastgeleHedef");
  if (!rastgeleHedef) return;

  rastgeleHedef.style.display = "none";
  oyunState = "bekleme";

  const beklemeSuresi = 500 + Math.random() * 3500; // 0.5-4 sn

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    rastgeleHedef.style.display = "block";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Hedef 2 sn sonra kaybolur
    oyunTimeout = setTimeout(() => {
      if (!cevapVerildi) {
        cevapVer(false, "kaçırma");
      }
      yeniTur();
    }, 2000);
  }, beklemeSuresi);
}

