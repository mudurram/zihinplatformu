// ==========================================================
// 🎯 Engel Baskılama Oyunları - Ortak Oyun Mantığı
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

// Oyun özel değişkenler
let aktifGorev = null; // Görev değişti oyunu için
let aktifRenk = null; // Kırmızıda dur oyunu için

// Ses dosyaları
let dogruSes = null;
let yanlisSes = null;

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // URL'den oyun ID'sini al
  const urlParams = new URLSearchParams(window.location.search);
  oyunId = urlParams.get("oyun") || localStorage.getItem("engelBaskilamaOyunId");
  oyunAdi = localStorage.getItem("engelBaskilamaOyunAdi") || "Engel Baskılama Oyunu";

  if (!oyunId) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  // Ses dosyalarını yükle
  yukleSesler();

  // Game Engine'i başlat
  engine = new GameEngine({
    gameName: `engel_baskilama_${oyunId}`,
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
    case "kirmizida_dur_yesilde_bas":
      yukleKirmizidaDurYesildeBas(oyunIcerik);
      break;
    case "yaniltici_oklar":
      yukleYanilticiOklar(oyunIcerik);
      break;
    case "engelle_dusun":
      yukleEngelleDusun(oyunIcerik);
      break;
    case "aynisı_degil":
      yukleAynisiDegil(oyunIcerik);
      break;
    case "yanlis_aliskanlik":
      yukleYanlisAliskanlik(oyunIcerik);
      break;
    case "no_go_ses":
      yukleNoGoSes(oyunIcerik);
      break;
    case "ters_tepki":
      yukleTersTepki(oyunIcerik);
      break;
    case "hizli_seri_yasakli":
      yukleHizliSeriYasakli(oyunIcerik);
      break;
    case "gorev_degisti":
      yukleGorevDegisti(oyunIcerik);
      break;
    case "capraz_tepki":
      yukleCaprazTepki(oyunIcerik);
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
    case "kirmizida_dur_yesilde_bas":
      turKirmizidaDurYesildeBas();
      break;
    case "yaniltici_oklar":
      turYanilticiOklar();
      break;
    case "engelle_dusun":
      turEngelleDusun();
      break;
    case "aynisı_degil":
      turAynisiDegil();
      break;
    case "yanlis_aliskanlik":
      turYanlisAliskanlik();
      break;
    case "no_go_ses":
      turNoGoSes();
      break;
    case "ters_tepki":
      turTersTepki();
      break;
    case "hizli_seri_yasakli":
      turHizliSeriYasakli();
      break;
    case "gorev_degisti":
      turGorevDegisti();
      break;
    case "capraz_tepki":
      turCaprazTepki();
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

  // Süre bittiğinde oyunu bitir
  if (sure <= 0 && !engine.gameFinished) {
    oyunuBitir();
  }
}

// ==========================================================
// 🎮 OYUN 1: KIRMIZIDA DUR – YEŞİLDE BAS
// ==========================================================
function yukleKirmizidaDurYesildeBas(container) {
  container.innerHTML = `
    <p class="talimat-metni">Yeşil görünce bas, kırmızı görünce dur.</p>
    <div id="renkEkran" style="width: 100%; height: 400px; border-radius: 20px; cursor: pointer; transition: background 0.3s ease;"></div>
  `;

  const renkEkran = document.getElementById("renkEkran");
  renkEkran.onclick = () => {
    if (oyunState === "aktif") {
      if (aktifRenk === "yesil") {
        cevapVer(true);
      } else if (aktifRenk === "kirmizi") {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turKirmizidaDurYesildeBas() {
  const renkEkran = document.getElementById("renkEkran");
  if (!renkEkran) return;

  // Rastgele yeşil veya kırmızı seç
  aktifRenk = Math.random() < 0.5 ? "yesil" : "kirmizi";
  
  if (aktifRenk === "yesil") {
    renkEkran.style.background = "#2ecc71";
  } else {
    renkEkran.style.background = "#e74c3c";
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // Renk değişimi (1-2 saniye)
  const degisimSuresi = 1000 + Math.random() * 1000;
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turKirmizidaDurYesildeBas();
    }
  }, degisimSuresi);
}

// ==========================================================
// 🎮 OYUN 2: YANILTICI OKLAR
// ==========================================================
function yukleYanilticiOklar(container) {
  container.innerHTML = `
    <p class="talimat-metni">Okun yönüne değil, okun altında yazan yöne bas.</p>
    <div id="okAlani" style="display: flex; flex-direction: column; align-items: center; gap: 30px;">
      <div id="okGoster" style="font-size: 120px;">→</div>
      <div id="yaziGoster" style="font-size: 48px; font-weight: bold; color: #1b2d4a;">SAĞ</div>
      <div id="yonButonlari" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 400px;">
        <button class="yon-btn" data-yon="sol">← SOL</button>
        <button class="yon-btn" data-yon="sag">SAĞ →</button>
        <button class="yon-btn" data-yon="yukari">↑ YUKARI</button>
        <button class="yon-btn" data-yon="asagi">↓ AŞAĞI</button>
      </div>
    </div>
  `;

  const butonlar = container.querySelectorAll(".yon-btn");
  butonlar.forEach(btn => {
    btn.onclick = () => {
      const secilenYon = btn.dataset.yon;
      const dogruYon = container.querySelector("#yaziGoster").dataset.dogruYon;
      if (secilenYon === dogruYon) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    };
  });
}

function turYanilticiOklar() {
  const okGoster = document.getElementById("okGoster");
  const yaziGoster = document.getElementById("yaziGoster");
  if (!okGoster || !yaziGoster) return;

  const oklar = ["←", "→", "↑", "↓"];
  const yonler = ["sol", "sag", "yukari", "asagi"];
  const yonAdlari = ["SOL", "SAĞ", "YUKARI", "AŞAĞI"];

  // Rastgele ok seç
  const okIndex = Math.floor(Math.random() * 4);
  const ok = oklar[okIndex];
  
  // Rastgele yön yazısı seç (oktan farklı olabilir)
  const yaziIndex = Math.floor(Math.random() * 4);
  const dogruYon = yonler[yaziIndex];
  const yaziAdi = yonAdlari[yaziIndex];

  okGoster.textContent = ok;
  yaziGoster.textContent = yaziAdi;
  yaziGoster.dataset.dogruYon = dogruYon;

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 1.5 saniyede bir yenilenir
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turYanilticiOklar();
    }
  }, 1500);
}

// ==========================================================
// 🎮 OYUN 3: ENGELLE DÜŞÜN – HIZLI KARAR
// ==========================================================
function yukleEngelleDusun(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ekranda hangi nesne daha küçükse ona bas.</p>
    <div id="nesneAlani" style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap;">
      <div id="nesne1" class="nesne-kutu" style="cursor: pointer;"></div>
      <div id="nesne2" class="nesne-kutu" style="cursor: pointer;"></div>
    </div>
  `;

  const nesne1 = document.getElementById("nesne1");
  const nesne2 = document.getElementById("nesne2");
  
  nesne1.onclick = () => {
    if (oyunState === "aktif") {
      const kucukNesne = document.querySelector("[data-kucuk='true']");
      if (nesne1 === kucukNesne) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };

  nesne2.onclick = () => {
    if (oyunState === "aktif") {
      const kucukNesne = document.querySelector("[data-kucuk='true']");
      if (nesne2 === kucukNesne) {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turEngelleDusun() {
  const nesne1 = document.getElementById("nesne1");
  const nesne2 = document.getElementById("nesne2");
  if (!nesne1 || !nesne2) return;

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const nesne = nesneler[Math.floor(Math.random() * nesneler.length)];

  // Rastgele boyutlar (büyük ve küçük)
  const buyukBoyut = 150 + Math.random() * 50; // 150-200px
  const kucukBoyut = 80 + Math.random() * 30; // 80-110px

  // Hangi nesne küçük olacak?
  const kucukIndex = Math.random() < 0.5 ? 1 : 2;

  nesne1.innerHTML = `<div style="font-size: ${kucukIndex === 1 ? kucukBoyut : buyukBoyut}px;">${nesne}</div>`;
  nesne2.innerHTML = `<div style="font-size: ${kucukIndex === 2 ? kucukBoyut : buyukBoyut}px;">${nesne}</div>`;

  if (kucukIndex === 1) {
    nesne1.dataset.kucuk = "true";
    nesne2.dataset.kucuk = "false";
  } else {
    nesne1.dataset.kucuk = "false";
    nesne2.dataset.kucuk = "true";
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 1-1.5 saniyede değişir
  const degisimSuresi = 1000 + Math.random() * 500;
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turEngelleDusun();
    }
  }, degisimSuresi);
}

// ==========================================================
// 🎮 OYUN 4: AYNISI DEĞİL – FARKLIYA TIKLA
// ==========================================================
function yukleAynisiDegil(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ekranda 3 nesne göreceksin. İkisi aynı, biri farklı. Farklı olana tıkla.</p>
    <div id="ucNesneAlani" style="display: flex; justify-content: center; align-items: center; gap: 30px; flex-wrap: wrap;">
      <div class="nesne-kutu" data-index="0" style="cursor: pointer;"></div>
      <div class="nesne-kutu" data-index="1" style="cursor: pointer;"></div>
      <div class="nesne-kutu" data-index="2" style="cursor: pointer;"></div>
    </div>
  `;

  const nesneler = container.querySelectorAll(".nesne-kutu");
  nesneler.forEach((nesne, index) => {
    nesne.onclick = () => {
      if (oyunState === "aktif") {
        const farkliIndex = parseInt(container.querySelector("[data-farkli='true']").dataset.index);
        if (index === farkliIndex) {
          cevapVer(true);
        } else {
          cevapVer(false, "impulsivite");
        }
      }
    };
  });
}

function turAynisiDegil() {
  const nesneler = document.querySelectorAll("#ucNesneAlani .nesne-kutu");
  if (!nesneler || nesneler.length !== 3) return;

  const nesneListesi = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠", "🔶", "🔷"];
  const ayniNesne = nesneListesi[Math.floor(Math.random() * nesneListesi.length)];
  let farkliNesne = nesneListesi[Math.floor(Math.random() * nesneListesi.length)];
  while (farkliNesne === ayniNesne) {
    farkliNesne = nesneListesi[Math.floor(Math.random() * nesneListesi.length)];
  }

  // Farklı nesne hangi pozisyonda?
  const farkliIndex = Math.floor(Math.random() * 3);

  nesneler.forEach((nesne, index) => {
    if (index === farkliIndex) {
      nesne.innerHTML = `<div style="font-size: 100px;">${farkliNesne}</div>`;
      nesne.dataset.farkli = "true";
    } else {
      nesne.innerHTML = `<div style="font-size: 100px;">${ayniNesne}</div>`;
      nesne.dataset.farkli = "false";
    }
  });

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 2 saniyede yenilenir
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turAynisiDegil();
    }
  }, 2000);
}

// ==========================================================
// 🎮 OYUN 5: YANLIŞ ALIŞKANLIĞI BASKILA (YASAKLI SİMGE)
// ==========================================================
function yukleYanlisAliskanlik(container) {
  container.innerHTML = `
    <p class="talimat-metni">Bazı nesneler yasak işaretlidir. Yasaklı simgeye asla basma! Diğerlerine basabilirsin.</p>
    <div id="nesneGoster" style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
      <div id="nesneKutu" style="cursor: pointer; position: relative;"></div>
    </div>
  `;

  const nesneKutu = document.getElementById("nesneKutu");
  nesneKutu.onclick = () => {
    if (oyunState === "aktif") {
      const yasakliMi = nesneKutu.dataset.yasakli === "true";
      if (yasakliMi) {
        cevapVer(false, "impulsivite");
      } else {
        cevapVer(true);
      }
    }
  };
}

function turYanlisAliskanlik() {
  const nesneKutu = document.getElementById("nesneKutu");
  if (!nesneKutu) return;

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const nesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  const yasakliMi = Math.random() < 0.3; // %30 yasaklı

  if (yasakliMi) {
    nesneKutu.innerHTML = `
      <div style="font-size: 120px; position: relative;">
        <div style="position: absolute; top: -10px; right: -10px; font-size: 60px; color: #e74c3c;">🚫</div>
        <div>${nesne}</div>
      </div>
    `;
    nesneKutu.style.border = "4px solid #e74c3c";
    nesneKutu.style.borderRadius = "20px";
    nesneKutu.dataset.yasakli = "true";
  } else {
    nesneKutu.innerHTML = `<div style="font-size: 120px;">${nesne}</div>`;
    nesneKutu.style.border = "none";
    nesneKutu.dataset.yasakli = "false";
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 1-2 saniyede yeni nesne çıkar
  const degisimSuresi = 1000 + Math.random() * 1000;
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turYanlisAliskanlik();
    }
  }, degisimSuresi);
}

// ==========================================================
// 🎮 OYUN 6: SES GELDİĞİNDE DEĞİL – GELMEDİĞİNDE BAS
// ==========================================================
function yukleNoGoSes(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ekran boşken ses yoksa ekrana bas. Sesli uyarı gelirse hiç basma!</p>
    <div id="sesEkran" style="width: 100%; height: 400px; background: #ecf0f1; border-radius: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 80px;">🔇</div>
  `;

  const sesEkran = document.getElementById("sesEkran");
  sesEkran.onclick = () => {
    if (oyunState === "aktif") {
      // Sessiz dönemde basmak doğru
      cevapVer(true);
    } else if (oyunState === "sesli") {
      // Sesli dönemde basmak yanlış
      cevapVer(false, "impulsivite");
    }
  };
}

function turNoGoSes() {
  const sesEkran = document.getElementById("sesEkran");
  if (!sesEkran) return;

  // Rastgele sessiz veya sesli dönem
  const sesliMi = Math.random() < 0.5;

  if (sesliMi) {
    sesEkran.style.background = "#f39c12";
    sesEkran.innerHTML = "🔊";
    oyunState = "sesli";
    
    // Ses çal
    if (dogruSes) {
      dogruSes.currentTime = 0;
      dogruSes.play().catch(() => {});
    }

    // Sesli dönemde basılmamalı, süre sonunda yeni tur
    oyunTimeout = setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turNoGoSes();
      }
    }, 1000);
  } else {
    sesEkran.style.background = "#ecf0f1";
    sesEkran.innerHTML = "🔇";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Sessiz dönemde basılabilir
    oyunTimeout = setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turNoGoSes();
      }
    }, 1000);
  }
}

// ==========================================================
// 🎮 OYUN 7: TERS TEPKİ OYUNU (BAS ↔ DUR)
// ==========================================================
function yukleTersTepki(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ekranda 'BAS' yazarsa dur. 'DUR' yazarsa bas. Her şey tam tersine!</p>
    <div id="metinGoster" style="font-size: 72px; font-weight: bold; color: #1b2d4a; padding: 40px; cursor: pointer; min-height: 200px; display: flex; align-items: center; justify-content: center;"></div>
  `;

  const metinGoster = document.getElementById("metinGoster");
  metinGoster.onclick = () => {
    if (oyunState === "aktif") {
      const metin = metinGoster.textContent.trim();
      if (metin === "DUR") {
        // DUR yazıyorsa basmak doğru
        cevapVer(true);
      } else if (metin === "BAS") {
        // BAS yazıyorsa basmak yanlış
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turTersTepki() {
  const metinGoster = document.getElementById("metinGoster");
  if (!metinGoster) return;

  // Rastgele BAS veya DUR
  const metin = Math.random() < 0.5 ? "BAS" : "DUR";
  metinGoster.textContent = metin;

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // BAS yazıyorsa basılmamalı, süre sonunda yeni tur
  if (metin === "BAS") {
    oyunTimeout = setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turTersTepki();
      }
    }, 1000);
  } else {
    // DUR yazıyorsa basılmalı, süre sonunda yanlış sayılır
    oyunTimeout = setTimeout(() => {
      if (metinGoster.textContent === "DUR" && oyunState === "aktif") {
        cevapVer(false, "dikkatsizlik");
      }
    }, 1000);
  }
}

// ==========================================================
// 🎮 OYUN 8: HIZLI SERİ İÇİNDE YASAKLI ÖĞE
// ==========================================================
function yukleHizliSeriYasakli(container) {
  container.innerHTML = `
    <p class="talimat-metni">Gelen tüm nesnelere bas. Ama yasaklı nesne gelirse hiç basma!</p>
    <div id="seriNesneGoster" style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
      <div id="seriNesne" style="cursor: pointer; position: relative;"></div>
    </div>
  `;

  const seriNesne = document.getElementById("seriNesne");
  seriNesne.onclick = () => {
    if (oyunState === "aktif") {
      const yasakliMi = seriNesne.dataset.yasakli === "true";
      if (yasakliMi) {
        cevapVer(false, "impulsivite");
      } else {
        cevapVer(true);
      }
    }
  };
}

function turHizliSeriYasakli() {
  const seriNesne = document.getElementById("seriNesne");
  if (!seriNesne) return;

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const nesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  const yasakliMi = Math.random() < 0.2; // %20 yasaklı

  if (yasakliMi) {
    seriNesne.innerHTML = `
      <div style="font-size: 120px; position: relative;">
        <div style="position: absolute; top: -10px; right: -10px; font-size: 60px; color: #e74c3c;">🚫</div>
        <div>${nesne}</div>
      </div>
    `;
    seriNesne.style.border = "4px solid #e74c3c";
    seriNesne.style.borderRadius = "20px";
    seriNesne.dataset.yasakli = "true";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Yasaklı nesne basılmamalı, süre sonunda yeni tur
    oyunTimeout = setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turHizliSeriYasakli();
      }
    }, 1000);
  } else {
    seriNesne.innerHTML = `<div style="font-size: 120px;">${nesne}</div>`;
    seriNesne.style.border = "none";
    seriNesne.dataset.yasakli = "false";
    oyunState = "aktif";
    tepkiBaslangic = performance.now();

    // Normal nesne basılmalı, süre sonunda yeni tur
    oyunTimeout = setTimeout(() => {
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turHizliSeriYasakli();
      }
    }, 700 + Math.random() * 300);
  }
}

// ==========================================================
// 🎮 OYUN 9: HAYIR! GÖREV DEĞİŞTİ
// ==========================================================
function yukleGorevDegisti(container) {
  container.innerHTML = `
    <p class="talimat-metni">Görev oynarken değişebilir. Görev değiştiğinde ekranda kısa bildirim göreceksin.</p>
    <div id="gorevBildirim" style="font-size: 32px; font-weight: bold; color: #e67e22; margin-bottom: 20px; min-height: 50px;"></div>
    <div id="nesneAlaniGorev" style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap;">
      <div id="nesneGorev1" class="nesne-kutu" style="cursor: pointer;"></div>
      <div id="nesneGorev2" class="nesne-kutu" style="cursor: pointer;"></div>
    </div>
  `;

  const nesne1 = document.getElementById("nesneGorev1");
  const nesne2 = document.getElementById("nesneGorev2");

  nesne1.onclick = () => {
    if (oyunState === "aktif") {
      kontrolGorev(nesne1);
    }
  };

  nesne2.onclick = () => {
    if (oyunState === "aktif") {
      kontrolGorev(nesne2);
    }
  };
}

function kontrolGorev(secim) {
  if (!aktifGorev) return;

  let dogruMu = false;
  if (aktifGorev === "kucuk") {
    const kucukNesne = document.querySelector("#nesneAlaniGorev [data-kucuk='true']");
    dogruMu = secim === kucukNesne;
  } else if (aktifGorev === "buyuk") {
    const buyukNesne = document.querySelector("#nesneAlaniGorev [data-buyuk='true']");
    dogruMu = secim === buyukNesne;
  } else if (aktifGorev === "farkli") {
    const farkliNesne = document.querySelector("#nesneAlaniGorev [data-farkli='true']");
    dogruMu = secim === farkliNesne;
  }

  if (dogruMu) {
    cevapVer(true);
  } else {
    cevapVer(false, "impulsivite");
  }
}

function turGorevDegisti() {
  const gorevBildirim = document.getElementById("gorevBildirim");
  const nesne1 = document.getElementById("nesneGorev1");
  const nesne2 = document.getElementById("nesneGorev2");
  if (!gorevBildirim || !nesne1 || !nesne2) return;

  // Görevler: kucuk, buyuk, farkli
  const gorevler = ["kucuk", "buyuk", "farkli"];
  aktifGorev = gorevler[Math.floor(Math.random() * gorevler.length)];

  const gorevAdlari = {
    kucuk: "KÜÇÜĞE BAS",
    buyuk: "BÜYÜĞE BAS",
    farkli: "FARKLI OLAN NESNEYE BAS"
  };

  gorevBildirim.textContent = gorevAdlari[aktifGorev];

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const nesne = nesneler[Math.floor(Math.random() * nesneler.length)];

  if (aktifGorev === "farkli") {
    // Farklı nesne görevi için iki farklı nesne
    let nesne2Tip = nesneler[Math.floor(Math.random() * nesneler.length)];
    while (nesne2Tip === nesne) {
      nesne2Tip = nesneler[Math.floor(Math.random() * nesneler.length)];
    }
    nesne1.innerHTML = `<div style="font-size: 120px;">${nesne}</div>`;
    nesne2.innerHTML = `<div style="font-size: 120px;">${nesne2Tip}</div>`;
    nesne1.dataset.farkli = "true";
    nesne2.dataset.farkli = "true";
    nesne1.dataset.kucuk = "false";
    nesne2.dataset.kucuk = "false";
    nesne1.dataset.buyuk = "false";
    nesne2.dataset.buyuk = "false";
  } else {
    // Büyük/küçük görevi için aynı nesne farklı boyutlarda
    const buyukBoyut = 150 + Math.random() * 50;
    const kucukBoyut = 80 + Math.random() * 30;
    const kucukIndex = Math.random() < 0.5 ? 1 : 2;

    nesne1.innerHTML = `<div style="font-size: ${kucukIndex === 1 ? kucukBoyut : buyukBoyut}px;">${nesne}</div>`;
    nesne2.innerHTML = `<div style="font-size: ${kucukIndex === 2 ? kucukBoyut : buyukBoyut}px;">${nesne}</div>`;

    if (kucukIndex === 1) {
      nesne1.dataset.kucuk = "true";
      nesne1.dataset.buyuk = "false";
      nesne2.dataset.kucuk = "false";
      nesne2.dataset.buyuk = "true";
    } else {
      nesne1.dataset.kucuk = "false";
      nesne1.dataset.buyuk = "true";
      nesne2.dataset.kucuk = "true";
      nesne2.dataset.buyuk = "false";
    }
    nesne1.dataset.farkli = "false";
    nesne2.dataset.farkli = "false";
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // Görev 2-3 saniyede değişir
  const degisimSuresi = 2000 + Math.random() * 1000;
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turGorevDegisti();
    }
  }, degisimSuresi);
}

// ==========================================================
// 🎮 OYUN 10: ÇAPRAZ TEPKİ HIZ OYUNU
// ==========================================================
function yukleCaprazTepki(container) {
  container.innerHTML = `
    <p class="talimat-metni">Sol tarafta nesne görünürse sağa bas. Sağ tarafta nesne görünürse sola bas. Her şey ters!</p>
    <div id="caprazAlani" style="position: relative; width: 100%; height: 400px; border: 3px solid #34495e; border-radius: 10px; background: #ecf0f1;">
      <div id="caprazNesne" style="position: absolute; font-size: 120px; cursor: pointer;"></div>
    </div>
    <div id="caprazButonlari" style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
      <button id="solButon" class="yon-btn" style="padding: 20px 40px; font-size: 24px; cursor: pointer;">← SOL</button>
      <button id="sagButon" class="yon-btn" style="padding: 20px 40px; font-size: 24px; cursor: pointer;">SAĞ →</button>
    </div>
  `;

  const solButon = document.getElementById("solButon");
  const sagButon = document.getElementById("sagButon");

  solButon.onclick = () => {
    if (oyunState === "aktif") {
      const nesnePozisyon = document.getElementById("caprazNesne").dataset.pozisyon;
      // Nesne sağdaysa sol buton doğru
      if (nesnePozisyon === "sag") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };

  sagButon.onclick = () => {
    if (oyunState === "aktif") {
      const nesnePozisyon = document.getElementById("caprazNesne").dataset.pozisyon;
      // Nesne soldaysa sağ buton doğru
      if (nesnePozisyon === "sol") {
        cevapVer(true);
      } else {
        cevapVer(false, "impulsivite");
      }
    }
  };
}

function turCaprazTepki() {
  const caprazAlani = document.getElementById("caprazAlani");
  const caprazNesne = document.getElementById("caprazNesne");
  if (!caprazAlani || !caprazNesne) return;

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const nesne = nesneler[Math.floor(Math.random() * nesneler.length)];

  // Rastgele sol veya sağ pozisyon
  const pozisyon = Math.random() < 0.5 ? "sol" : "sag";

  caprazNesne.innerHTML = nesne;
  caprazNesne.dataset.pozisyon = pozisyon;

  if (pozisyon === "sol") {
    caprazNesne.style.left = "20px";
    caprazNesne.style.top = "50%";
    caprazNesne.style.transform = "translateY(-50%)";
  } else {
    caprazNesne.style.right = "20px";
    caprazNesne.style.top = "50%";
    caprazNesne.style.transform = "translateY(-50%)";
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 1 saniyede bir yeni nesne çıkar
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turCaprazTepki();
    }
  }, 1000);
}
