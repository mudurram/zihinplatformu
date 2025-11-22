// ==========================================================
// 🎯 Hızlı Tepki Oyunları - Ortak Oyun Mantığı
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

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // URL'den oyun ID'sini al
  const urlParams = new URLSearchParams(window.location.search);
  oyunId = urlParams.get("oyun") || localStorage.getItem("hizliTepkiOyunId");
  oyunAdi = localStorage.getItem("hizliTepkiOyunAdi") || "Hızlı Tepki Oyunu";

  if (!oyunId) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  // Ses dosyalarını yükle
  yukleSesler();

  // Game Engine'i başlat
  engine = new GameEngine({
    gameName: `hizli_tepki_${oyunId}`,
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
    // Ses dosyalarının yolunu oyun klasörüne göre ayarla
    const sesYolu = "../../sesler/";
    dogruSes = new Audio(sesYolu + "dogru.mp3");
    yanlisSes = new Audio(sesYolu + "yanlis.mp3");
    
    // Ses yükleme hatalarını yakala
    dogruSes.onerror = () => console.warn("⚠ Doğru ses dosyası yüklenemedi:", sesYolu + "dogru.mp3");
    yanlisSes.onerror = () => console.warn("⚠ Yanlış ses dosyası yüklenemedi:", sesYolu + "yanlis.mp3");
    
    // Ses yükleme için preload
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
  cevapVerildi = false; // Oyun başladığında cevap verilmedi olarak işaretle
  
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
    case "isik_yandi_bas":
      yukleIsikYandiBas(oyunIcerik);
      break;
    case "hedef_belirince_bas":
      yukleHedefBelirinceBas(oyunIcerik);
      break;
    case "ses_gelince_bas":
      yukleSesGelinceBas(oyunIcerik);
      break;
    case "cift_sinyal":
      yukleCiftSinyal(oyunIcerik);
      break;
    case "kayan_cizgi":
      yukleKayanCizgi(oyunIcerik);
      break;
    case "daralan_cember":
      yukleDaralanCember(oyunIcerik);
      break;
    case "kirmizi_yesil":
      yukleKirmiziYesil(oyunIcerik);
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

  // Yeni tur başladığında cevap verilmedi olarak işaretle
  cevapVerildi = false;

  // Önceki timeout'ları temizle
  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);

  switch (oyunId) {
    case "isik_yandi_bas":
      turIsikYandiBas();
      break;
    case "hedef_belirince_bas":
      turHedefBelirinceBas();
      break;
    case "ses_gelince_bas":
      turSesGelinceBas();
      break;
    case "cift_sinyal":
      turCiftSinyal();
      break;
    case "kayan_cizgi":
      turKayanCizgi();
      break;
    case "daralan_cember":
      turDaralanCember();
      break;
    case "kirmizi_yesil":
      turKirmiziYesil();
      break;
  }
}

// ==========================================================
// ✅ CEVAP VER
// ==========================================================
function cevapVer(dogruMu, hataTuru = null) {
  // Oyun bitmişse veya bu turda zaten cevap verildiyse işleme alma
  if (engine.gameFinished || oyunState === "bitmis" || cevapVerildi) return;

  // Bu turda cevap verildi olarak işaretle (çift tıklamayı önle)
  cevapVerildi = true;

  const tepkiSuresi = tepkiBaslangic ? Math.round(performance.now() - tepkiBaslangic) : 0;

  // Ses çal
  if (dogruMu && dogruSes) {
    dogruSes.currentTime = 0;
    dogruSes.play().catch(() => {});
  } else if (!dogruMu && yanlisSes) {
    yanlisSes.currentTime = 0;
    yanlisSes.play().catch(() => {});
  }

  // Trial kaydet
  const trialData = {
    correct: dogruMu,
    reaction_ms: tepkiSuresi
  };

  if (hataTuru) {
    trialData.hata_turu = hataTuru;
  }

  engine.recordTrial(trialData);

  // Yeni tur başlat
  setTimeout(() => {
    yeniTur();
  }, 500);
}

// ==========================================================
// ⏹️ OYUNU BİTİR
// ==========================================================
function oyunuBitir() {
  if (engine.gameFinished) return;

  oyunState = "bitmis";
  
  // Tüm timeout'ları temizle
  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);

  // Oyun içeriğini temizle
  const oyunIcerik = document.getElementById("oyunIcerik");
  oyunIcerik.innerHTML = "<h2>Oyun Bitti</h2>";

  // Engine'i bitir
  // GameEngine otomatik olarak platform/sonuc.html'e yönlendirecek
  // Ama biz özel sonuç ekranımızı kullanacağız
  // Bu yüzden endGame() çağrıldıktan sonra yönlendirmeyi override ediyoruz
  
  // endGame() async, bu yüzden promise olarak handle ediyoruz
  engine.endGame().then(() => {
    // GameEngine yönlendirme yaptıktan sonra bizim sonuç ekranımıza yönlendir
    setTimeout(() => {
      if (window.location.pathname.includes("platform/sonuc.html")) {
        window.location.href = "sonuc.html";
      } else if (!window.location.pathname.includes("sonuc.html")) {
        window.location.href = "sonuc.html";
      }
    }, 100);
  }).catch(() => {
    // Hata durumunda da sonuç ekranına git
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

  // Süre bittiğinde oyunu bitir
  if (sure <= 0 && !engine.gameFinished) {
    oyunuBitir();
  }
}

// ==========================================================
// 🎮 OYUN 1: IŞIK YANDI → BAS
// ==========================================================
function yukleIsikYandiBas(container) {
  container.innerHTML = `
    <p class="talimat-metni">Işık yeşile döndüğünde hemen bas.</p>
    <div id="isikPanel" class="isik-panel gri">BAS</div>
  `;

  const isikPanel = document.getElementById("isikPanel");
  isikPanel.onclick = () => {
    if (oyunState === "aktif" && isikPanel.classList.contains("yesil")) {
      cevapVer(true);
    } else if (oyunState === "aktif" && isikPanel.classList.contains("gri")) {
      cevapVer(false, "impulsivite");
    }
  };
}

function turIsikYandiBas() {
  const isikPanel = document.getElementById("isikPanel");
  if (!isikPanel) return;

  isikPanel.classList.remove("yesil");
  isikPanel.classList.add("gri");
  oyunState = "bekleme";

  // Rastgele bekleme süresi (1-3 saniye)
  const beklemeSuresi = 1000 + Math.random() * 2000;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    isikPanel.classList.remove("gri");
    isikPanel.classList.add("yesil");
    oyunState = "aktif";
    tepkiBaslangic = performance.now();
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 2: HEDEF BELİRİNCE BAS
// ==========================================================
function yukleHedefBelirinceBas(container) {
  container.innerHTML = `
    <p class="talimat-metni">Hedef göründüğünde hemen tıkla. Hedef yokken tıklama.</p>
    <div id="hedefAlani" style="position: relative; width: 100%; height: 400px; border: 2px solid #34495e; border-radius: 10px; background: #ecf0f1;"></div>
  `;

  const hedefAlani = document.getElementById("hedefAlani");
  hedefAlani.onclick = (e) => {
    if (e.target.classList.contains("hedef")) {
      cevapVer(true);
    } else {
      cevapVer(false, "impulsivite");
    }
  };
}

function turHedefBelirinceBas() {
  const hedefAlani = document.getElementById("hedefAlani");
  if (!hedefAlani) return;

  // Önceki hedefi temizle
  const eskiHedef = hedefAlani.querySelector(".hedef");
  if (eskiHedef) eskiHedef.remove();

  oyunState = "bekleme";

  // Rastgele bekleme süresi (0.8-2 saniye)
  const beklemeSuresi = 800 + Math.random() * 1200;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    // Rastgele pozisyon
    const x = Math.random() * (hedefAlani.offsetWidth - 80);
    const y = Math.random() * (hedefAlani.offsetHeight - 80);

    const hedef = document.createElement("div");
    hedef.className = "hedef";
    hedef.style.left = `${x}px`;
    hedef.style.top = `${y}px`;
    hedefAlani.appendChild(hedef);

    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Hedef belirli süre içinde tıklanmazsa kaybolur
    oyunTimeout = setTimeout(() => {
      if (hedef.parentNode) {
        hedef.remove();
        cevapVer(false, "dikkatsizlik");
      }
    }, 1000);
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 3: SES GELİNCE BAS
// ==========================================================
function yukleSesGelinceBas(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ses duyduğunda hemen bas. Sessizken tıklama.</p>
    <div class="ses-ikon">🔊</div>
    <button id="basButonu" class="bas-butonu">BAS</button>
  `;

  const basButonu = document.getElementById("basButonu");
  basButonu.onclick = () => {
    if (oyunState === "aktif") {
      cevapVer(true);
    } else if (oyunState === "bekleme") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turSesGelinceBas() {
  oyunState = "bekleme";

  // Rastgele bekleme süresi (1-4 saniye)
  const beklemeSuresi = 1000 + Math.random() * 3000;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    // Ses çal
    if (dogruSes) {
      dogruSes.currentTime = 0;
      dogruSes.play().catch(() => {});
    }

    oyunState = "aktif";
    tepkiBaslangic = performance.now();
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 4: ÇİFT SİNYAL
// ==========================================================
function yukleCiftSinyal(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ses veya ışık geldiğinde hemen bas. Hiç uyaran yokken basma.</p>
    <div id="ciftSinyalAlani" style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <div id="ciftIsikPanel" class="isik-panel gri" style="width: 200px; height: 200px;">IŞIK</div>
      <div class="ses-ikon" style="font-size: 80px;">🔊</div>
      <button id="ciftBasButonu" class="bas-butonu">BAS</button>
    </div>
  `;

  const basButonu = document.getElementById("ciftBasButonu");
  basButonu.onclick = () => {
    if (oyunState === "aktif") {
      cevapVer(true);
    } else if (oyunState === "bekleme") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turCiftSinyal() {
  const isikPanel = document.getElementById("ciftIsikPanel");
  if (!isikPanel) return;

  isikPanel.classList.remove("yesil");
  isikPanel.classList.add("gri");
  oyunState = "bekleme";

  // Rastgele bekleme süresi (1-3 saniye)
  const beklemeSuresi = 1000 + Math.random() * 2000;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    // Rastgele ses veya ışık seç
    const sinyalTipi = Math.random() < 0.5 ? "isik" : "ses";

    if (sinyalTipi === "isik") {
      isikPanel.classList.remove("gri");
      isikPanel.classList.add("yesil");
    } else {
      // Ses çal
      if (dogruSes) {
        dogruSes.currentTime = 0;
        dogruSes.play().catch(() => {});
      }
    }

    oyunState = "aktif";
    tepkiBaslangic = performance.now();
  }, beklemeSuresi);
}

// ==========================================================
// 🎮 OYUN 5: KAYAN ÇİZGİ
// ==========================================================
function yukleKayanCizgi(container) {
  container.innerHTML = `
    <p class="talimat-metni">Çizgi hareket ederken bekle. Çizgi durduğu anda hemen bas.</p>
    <div id="cizgiContainer" class="cizgi-container">
      <div id="kayanCizgi" class="kayan-cizgi"></div>
    </div>
  `;

  const cizgiContainer = document.getElementById("cizgiContainer");
  cizgiContainer.onclick = () => {
    const cizgi = document.getElementById("kayanCizgi");
    if (cizgi.classList.contains("durdu")) {
      cevapVer(true);
    } else {
      cevapVer(false, "impulsivite");
    }
  };
}

function turKayanCizgi() {
  const cizgi = document.getElementById("kayanCizgi");
  const container = document.getElementById("cizgiContainer");
  if (!cizgi || !container) return;

  cizgi.classList.remove("durdu");
  oyunState = "hareketli";

  let pozisyon = 0;
  let yon = 1; // 1: sağa, -1: sola
  const hiz = 2;

  oyunInterval = setInterval(() => {
    if (engine.gameFinished || oyunState === "bitmis") {
      clearInterval(oyunInterval);
      return;
    }

    pozisyon += hiz * yon;
    
    if (pozisyon <= 0) {
      pozisyon = 0;
      yon = 1;
    } else if (pozisyon >= container.offsetWidth - 150) {
      pozisyon = container.offsetWidth - 150;
      yon = -1;
    }

    cizgi.style.left = `${pozisyon}px`;
  }, 10);

  // Rastgele durma zamanı (1-3 saniye)
  const durmaSuresi = 1000 + Math.random() * 2000;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") {
      clearInterval(oyunInterval);
      return;
    }

    clearInterval(oyunInterval);
    cizgi.classList.add("durdu");
    oyunState = "durdu";
    tepkiBaslangic = performance.now();

    // Çizgi tekrar hareket etmeye başlar
    setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turKayanCizgi();
      }
    }, 2000);
  }, durmaSuresi);
}

// ==========================================================
// 🎮 OYUN 6: DARALAN ÇEMBER
// ==========================================================
function yukleDaralanCember(container) {
  container.innerHTML = `
    <p class="talimat-metni">Daire belirli büyüklüğe geldiğinde bas. Çok erken basma.</p>
    <div id="cemberContainer" class="cember-container">
      <div id="daralanCember" class="daralan-cember"></div>
    </div>
  `;

  const cember = document.getElementById("daralanCember");
  cember.onclick = () => {
    if (oyunState === "aktif") {
      cevapVer(true);
    } else if (oyunState === "kuculme") {
      cevapVer(false, "impulsivite");
    }
  };
}

function turDaralanCember() {
  const cember = document.getElementById("daralanCember");
  if (!cember) return;

  // Başlangıç boyutu
  let boyut = 400;
  cember.style.width = `${boyut}px`;
  cember.style.height = `${boyut}px`;
  oyunState = "kuculme";

  const hedefMin = 120; // %30
  const hedefMax = 160; // %40

  oyunInterval = setInterval(() => {
    if (engine.gameFinished || oyunState === "bitmis") {
      clearInterval(oyunInterval);
      return;
    }

    boyut -= 2;
    cember.style.width = `${boyut}px`;
    cember.style.height = `${boyut}px`;

    // Hedef aralıkta mı?
    if (boyut >= hedefMin && boyut <= hedefMax) {
      oyunState = "aktif";
    } else if (boyut < hedefMin) {
      oyunState = "kuculme";
    }

    // Çok küçüldüyse kaybolur
    if (boyut <= 50) {
      clearInterval(oyunInterval);
      cevapVer(false, "dikkatsizlik");
      setTimeout(() => {
        if (!engine.gameFinished && oyunState !== "bitmis") {
          turDaralanCember();
        }
      }, 500);
    }
  }, 50);
}

// ==========================================================
// 🎮 OYUN 7: KIRMIZI-YEŞİL
// ==========================================================
function yukleKirmiziYesil(container) {
  container.innerHTML = `
    <p class="talimat-metni">Yeşil olduğunda bas. Kırmızı olduğunda sakın basma.</p>
    <div id="renkIsik" class="renk-isik gri"></div>
  `;

  const renkIsik = document.getElementById("renkIsik");
  renkIsik.onclick = () => {
    if (renkIsik.classList.contains("yesil")) {
      cevapVer(true);
    } else if (renkIsik.classList.contains("kirmizi")) {
      cevapVer(false, "impulsivite");
    }
  };
}

function turKirmiziYesil() {
  const renkIsik = document.getElementById("renkIsik");
  if (!renkIsik) return;

  renkIsik.classList.remove("yesil", "kirmizi");
  renkIsik.classList.add("gri");
  oyunState = "bekleme";

  // Rastgele bekleme süresi (1-3 saniye)
  const beklemeSuresi = 1000 + Math.random() * 2000;

  oyunTimeout = setTimeout(() => {
    if (engine.gameFinished || oyunState === "bitmis") return;

    // Rastgele yeşil veya kırmızı
    const renk = Math.random() < 0.5 ? "yesil" : "kirmizi";

    renkIsik.classList.remove("gri");
    renkIsik.classList.add(renk);
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Yeşil ise belirli süre içinde basılmalı
    if (renk === "yesil") {
      oyunTimeout = setTimeout(() => {
        if (renkIsik.classList.contains("yesil")) {
          cevapVer(false, "dikkatsizlik");
        }
      }, 2000);
    } else {
      // Kırmızı ise basılmamalı, süre sonunda yeni tur
      oyunTimeout = setTimeout(() => {
        if (!engine.gameFinished && oyunState !== "bitmis") {
          turKirmiziYesil();
        }
      }, 2000);
    }
  }, beklemeSuresi);
}

