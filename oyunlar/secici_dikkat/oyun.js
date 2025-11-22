// ==========================================================
// 🎯 Seçici Dikkat Oyunları - Ortak Oyun Mantığı
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
let aktifHedef = null; // Hedef bilgisi
let aktifSes = null; // İşitsel oyun için

// Ses dosyaları
let dogruSes = null;
let yanlisSes = null;

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // URL'den oyun ID'sini al
  const urlParams = new URLSearchParams(window.location.search);
  oyunId = urlParams.get("oyun") || localStorage.getItem("seciciDikkatOyunId");
  oyunAdi = localStorage.getItem("seciciDikkatOyunAdi") || "Seçici Dikkat Oyunu";

  if (!oyunId) {
    alert("Oyun seçilmedi. Lütfen oyun listesinden bir oyun seçin.");
    window.location.href = "menu.html";
    return;
  }

  // Ses dosyalarını yükle
  yukleSesler();

  // Game Engine'i başlat
  engine = new GameEngine({
    gameName: `secici_dikkat_${oyunId}`,
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
    case "hedefi_bul":
      yukleHedefiBul(oyunIcerik);
      break;
    case "farkli_olani_bul":
      yukleFarkliOlaniBul(oyunIcerik);
      break;
    case "gurultulu_alanda_hedef":
      yukleGurultuluAlandaHedef(oyunIcerik);
      break;
    case "cift_filtreli_secim":
      yukleCiftFiltreliSecim(oyunIcerik);
      break;
    case "dikkat_dagitici_yoksay":
      yukleDikkatDagiticiYoksay(oyunIcerik);
      break;
    case "benzerler_arasinda_dogru":
      yukleBenzerlerArasindaDogru(oyunIcerik);
      break;
    case "engelleyeni_gormezden_gel":
      yukleEngelleyeniGormezdenGel(oyunIcerik);
      break;
    case "arada_beliren_hedef":
      yukleAradaBelirenHedef(oyunIcerik);
      break;
    case "isitsel_gorsel_eslestirme":
      yukleIsitselGorselEslestirme(oyunIcerik);
      break;
    case "aynisini_bul":
      yukleAynisiniBul(oyunIcerik);
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
  tepkiBaslangic = null; // Her yeni turda tepki süresini sıfırla

  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);

  switch (oyunId) {
    case "hedefi_bul":
      turHedefiBul();
      break;
    case "farkli_olani_bul":
      turFarkliOlaniBul();
      break;
    case "gurultulu_alanda_hedef":
      turGurultuluAlandaHedef();
      break;
    case "cift_filtreli_secim":
      turCiftFiltreliSecim();
      break;
    case "dikkat_dagitici_yoksay":
      turDikkatDagiticiYoksay();
      break;
    case "benzerler_arasinda_dogru":
      turBenzerlerArasindaDogru();
      break;
    case "engelleyeni_gormezden_gel":
      turEngelleyeniGormezdenGel();
      break;
    case "arada_beliren_hedef":
      turAradaBelirenHedef();
      break;
    case "isitsel_gorsel_eslestirme":
      turIsitselGorselEslestirme();
      break;
    case "aynisini_bul":
      turAynisiniBul();
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
  }, 500);
}

// ==========================================================
// ⏹️ OYUNU BİTİR
// ==========================================================
function oyunuBitir() {
  if (engine.gameFinished) return;

  oyunState = "bitmis";
  
  if (oyunTimeout) clearTimeout(oyunTimeout);
  if (oyunInterval) clearInterval(oyunInterval);

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
// 🎮 OYUN 1: HEDEFİ BUL
// ==========================================================
function yukleHedefiBul(container) {
  container.innerHTML = `
    <div id="hedefYonerge" class="hedef-yonerge" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1b2d4a;"></div>
    <div id="nesneAlani" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;"></div>
  `;
}

function turHedefiBul() {
  const hedefYonerge = document.getElementById("hedefYonerge");
  const nesneAlani = document.getElementById("nesneAlani");
  if (!hedefYonerge || !nesneAlani) return;

  nesneAlani.innerHTML = "";

  const renkler = ["Mavi", "Kırmızı", "Yeşil", "Sarı", "Mor", "Turuncu"];
  const sekiller = ["kare", "daire", "üçgen", "yıldız"];
  
  const hedefRenk = renkler[Math.floor(Math.random() * renkler.length)];
  const hedefSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
  aktifHedef = { renk: hedefRenk, sekil: hedefSekil };

  hedefYonerge.textContent = `${hedefRenk} ${hedefSekil}i seç.`;

  const renkEmojileri = { Mavi: "🔵", Kırmızı: "🔴", Yeşil: "🟢", Sarı: "🟡", Mor: "🟣", Turuncu: "🟠" };
  const sekilEmojileri = { kare: "⬛", daire: "⭕", üçgen: "🔺", yıldız: "⭐" };

  // 20-30 nesne oluştur
  const nesneSayisi = 20 + Math.floor(Math.random() * 11);
  for (let i = 0; i < nesneSayisi; i++) {
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];
    const rastgeleSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
    const dogruMu = rastgeleRenk === hedefRenk && rastgeleSekil === hedefSekil;

    const nesne = document.createElement("div");
    nesne.className = "nesne-kutu";
    nesne.style.cssText = "font-size: 60px; cursor: pointer; padding: 15px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;";
    nesne.innerHTML = renkEmojileri[rastgeleRenk] + sekilEmojileri[rastgeleSekil];
    nesne.dataset.dogru = dogruMu ? "true" : "false";
    
    nesne.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(dogruMu, dogruMu ? null : "karistirma");
      }
    };
    
    nesne.onmouseenter = () => nesne.style.transform = "scale(1.1)";
    nesne.onmouseleave = () => nesne.style.transform = "scale(1)";
    
    nesneAlani.appendChild(nesne);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // 3-4 saniyede yeni sahne
  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turHedefiBul();
    }
  }, 3000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 2: FARKLI OLANI BUL
// ==========================================================
function yukleFarkliOlaniBul(container) {
  container.innerHTML = `
    <p class="talimat-metni">Diğerlerinden farklı olan tek nesneyi bul ve seç.</p>
    <div id="farkliNesneAlani" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px;"></div>
  `;
}

function turFarkliOlaniBul() {
  const nesneAlani = document.getElementById("farkliNesneAlani");
  if (!nesneAlani) return;

  nesneAlani.innerHTML = "";

  const nesneler = ["🔴", "🔵", "🟢", "🟡", "🟣", "⚫", "⚪", "🟠"];
  const ayniNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  let farkliNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  while (farkliNesne === ayniNesne) {
    farkliNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  }

  // 5-6 aynı, 1 farklı
  const ayniSayisi = 5 + Math.floor(Math.random() * 2);
  const farkliIndex = Math.floor(Math.random() * (ayniSayisi + 1));

  for (let i = 0; i <= ayniSayisi; i++) {
    const nesne = document.createElement("div");
    nesne.className = "nesne-kutu";
    nesne.style.cssText = "font-size: 80px; cursor: pointer; padding: 20px; border-radius: 15px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s;";
    nesne.innerHTML = i === farkliIndex ? farkliNesne : ayniNesne;
    nesne.dataset.dogru = i === farkliIndex ? "true" : "false";
    
    nesne.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(i === farkliIndex, i === farkliIndex ? null : "karistirma");
      }
    };
    
    nesne.onmouseenter = () => nesne.style.transform = "scale(1.1)";
    nesne.onmouseleave = () => nesne.style.transform = "scale(1)";
    
    nesneAlani.appendChild(nesne);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turFarkliOlaniBul();
    }
  }, 3000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 3: GÜRÜLTÜLÜ ALANDA HEDEF ARA
// ==========================================================
function yukleGurultuluAlandaHedef(container) {
  container.innerHTML = `
    <div id="gurultuluYonerge" class="hedef-yonerge" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1b2d4a;"></div>
    <div id="gurultuluAlani" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 20px; max-height: 500px; overflow-y: auto;"></div>
  `;
}

function turGurultuluAlandaHedef() {
  const yonerge = document.getElementById("gurultuluYonerge");
  const alan = document.getElementById("gurultuluAlani");
  if (!yonerge || !alan) return;

  alan.innerHTML = "";

  const harfler = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const hedefHarf = harfler[Math.floor(Math.random() * harfler.length)];
  aktifHedef = hedefHarf;

  yonerge.textContent = `"${hedefHarf}" harflerini seç.`;

  // 50-80 karışık harf
  const harfSayisi = 50 + Math.floor(Math.random() * 31);
  for (let i = 0; i < harfSayisi; i++) {
    const rastgeleHarf = harfler[Math.floor(Math.random() * harfler.length)];
    const dogruMu = rastgeleHarf === hedefHarf;

    const harf = document.createElement("div");
    harf.className = "nesne-kutu";
    harf.style.cssText = "font-size: 32px; font-weight: bold; cursor: pointer; padding: 12px 20px; border-radius: 8px; background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: transform 0.2s; color: #1b2d4a;";
    harf.textContent = rastgeleHarf;
    harf.dataset.dogru = dogruMu ? "true" : "false";
    
    harf.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(dogruMu, dogruMu ? null : "karistirma");
      }
    };
    
    harf.onmouseenter = () => harf.style.transform = "scale(1.1)";
    harf.onmouseleave = () => harf.style.transform = "scale(1)";
    
    alan.appendChild(harf);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turGurultuluAlandaHedef();
    }
  }, 4000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 4: ÇİFT FİLTRELİ SEÇİM
// ==========================================================
function yukleCiftFiltreliSecim(container) {
  container.innerHTML = `
    <div id="ciftFiltreYonerge" class="hedef-yonerge" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1b2d4a;"></div>
    <div id="ciftFiltreAlani" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;"></div>
  `;
}

function turCiftFiltreliSecim() {
  const yonerge = document.getElementById("ciftFiltreYonerge");
  const alan = document.getElementById("ciftFiltreAlani");
  if (!yonerge || !alan) return;

  alan.innerHTML = "";

  const renkler = ["Kırmızı", "Mavi", "Yeşil", "Sarı"];
  const sekiller = ["üçgen", "kare", "daire", "yıldız"];
  
  const hedefRenk = renkler[Math.floor(Math.random() * renkler.length)];
  const hedefSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
  aktifHedef = { renk: hedefRenk, sekil: hedefSekil };

  yonerge.textContent = `${hedefRenk} ${hedefSekil}leri seç.`;

  const renkEmojileri = { Kırmızı: "🔴", Mavi: "🔵", Yeşil: "🟢", Sarı: "🟡" };
  const sekilEmojileri = { üçgen: "🔺", kare: "⬛", daire: "⭕", yıldız: "⭐" };

  // 25-35 nesne
  const nesneSayisi = 25 + Math.floor(Math.random() * 11);
  for (let i = 0; i < nesneSayisi; i++) {
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];
    const rastgeleSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
    const dogruMu = rastgeleRenk === hedefRenk && rastgeleSekil === hedefSekil;

    const nesne = document.createElement("div");
    nesne.className = "nesne-kutu";
    nesne.style.cssText = "font-size: 50px; cursor: pointer; padding: 15px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;";
    nesne.innerHTML = renkEmojileri[rastgeleRenk] + sekilEmojileri[rastgeleSekil];
    nesne.dataset.dogru = dogruMu ? "true" : "false";
    
    nesne.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(dogruMu, dogruMu ? null : "karistirma");
      }
    };
    
    nesne.onmouseenter = () => nesne.style.transform = "scale(1.1)";
    nesne.onmouseleave = () => nesne.style.transform = "scale(1)";
    
    alan.appendChild(nesne);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turCiftFiltreliSecim();
    }
  }, 3500 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 5: DİKKAT DAĞITICIYI YOKSAY (FLANKER)
// ==========================================================
function yukleDikkatDagiticiYoksay(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ortadaki okun yönüne göre cevap ver. Dikkat dağıtıcı okları göz ardı et.</p>
    <div id="flankerAlani" style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 40px; font-size: 80px;"></div>
    <div id="flankerButonlari" style="display: flex; justify-content: center; gap: 30px; margin-top: 30px;">
      <button class="yon-btn" data-yon="sol">← SOL</button>
      <button class="yon-btn" data-yon="sag">SAĞ →</button>
    </div>
  `;

  const butonlar = container.querySelectorAll(".yon-btn");
  butonlar.forEach(btn => {
    btn.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        const secilenYon = btn.dataset.yon;
        const dogruYon = container.querySelector("#flankerAlani").dataset.dogruYon;
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(secilenYon === dogruYon, secilenYon === dogruYon ? null : "dikkat_dagitici");
      }
    };
  });
}

function turDikkatDagiticiYoksay() {
  const alan = document.getElementById("flankerAlani");
  if (!alan) return;

  alan.innerHTML = "";

  const oklar = ["←", "→"];
  const ortadakiOk = oklar[Math.floor(Math.random() * 2)];
  const yanOklar = oklar[Math.floor(Math.random() * 2)];

  // 5 ok: yan-yan-yan-orta-yan-yan-yan
  const okDizisi = [yanOklar, yanOklar, ortadakiOk, yanOklar, yanOklar];
  
  okDizisi.forEach(ok => {
    const okEl = document.createElement("span");
    okEl.textContent = ok;
    okEl.style.margin = "0 5px";
    alan.appendChild(okEl);
  });

  const dogruYon = ortadakiOk === "←" ? "sol" : "sag";
  alan.dataset.dogruYon = dogruYon;

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turDikkatDagiticiYoksay();
    }
  }, 2000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 6: BENZERLER ARASINDA DOĞRUYU SEÇ
// ==========================================================
function yukleBenzerlerArasindaDogru(container) {
  container.innerHTML = `
    <div id="benzerYonerge" class="hedef-yonerge" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1b2d4a;"></div>
    <div id="benzerAlani" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;"></div>
  `;
}

function turBenzerlerArasindaDogru() {
  const yonerge = document.getElementById("benzerYonerge");
  const alan = document.getElementById("benzerAlani");
  if (!yonerge || !alan) return;

  alan.innerHTML = "";

  const renkTonlari = {
    "Açık mavi": { emoji: "🔵", kod: "lightblue" },
    "Koyu mavi": { emoji: "🔵", kod: "darkblue" },
    "Açık kırmızı": { emoji: "🔴", kod: "lightred" },
    "Koyu kırmızı": { emoji: "🔴", kod: "darkred" },
    "Açık yeşil": { emoji: "🟢", kod: "lightgreen" },
    "Koyu yeşil": { emoji: "🟢", kod: "darkgreen" }
  };

  const tonlar = Object.keys(renkTonlari);
  const hedefTon = tonlar[Math.floor(Math.random() * tonlar.length)];
  aktifHedef = hedefTon;

  yonerge.textContent = `"${hedefTon} kareyi seç."`;

  // 8-12 benzer nesne
  const nesneSayisi = 8 + Math.floor(Math.random() * 5);
  const hedefIndex = Math.floor(Math.random() * nesneSayisi);

  for (let i = 0; i < nesneSayisi; i++) {
    let ton;
    if (i === hedefIndex) {
      ton = hedefTon;
    } else {
      let rastgeleTon = tonlar[Math.floor(Math.random() * tonlar.length)];
      while (rastgeleTon === hedefTon) {
        rastgeleTon = tonlar[Math.floor(Math.random() * tonlar.length)];
      }
      ton = rastgeleTon;
    }

    const nesne = document.createElement("div");
    nesne.className = "nesne-kutu";
    nesne.style.cssText = `font-size: 70px; cursor: pointer; padding: 20px; border-radius: 15px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; opacity: ${i === hedefIndex ? 1 : 0.7};`;
    nesne.innerHTML = renkTonlari[ton].emoji + "⬛";
    nesne.dataset.dogru = i === hedefIndex ? "true" : "false";
    
    nesne.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(i === hedefIndex, i === hedefIndex ? null : "karistirma");
      }
    };
    
    nesne.onmouseenter = () => nesne.style.transform = "scale(1.1)";
    nesne.onmouseleave = () => nesne.style.transform = "scale(1)";
    
    alan.appendChild(nesne);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turBenzerlerArasindaDogru();
    }
  }, 3000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 7: ENGELLEYENİ GÖRMEZDEN GEL
// ==========================================================
function yukleEngelleyeniGormezdenGel(container) {
  container.innerHTML = `
    <div id="engelYonerge" class="hedef-yonerge" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1b2d4a;"></div>
    <div id="engelAlani" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;"></div>
  `;
}

function turEngelleyeniGormezdenGel() {
  const yonerge = document.getElementById("engelYonerge");
  const alan = document.getElementById("engelAlani");
  if (!yonerge || !alan) return;

  alan.innerHTML = "";

  const renkler = ["Kırmızı", "Mavi", "Yeşil", "Sarı"];
  const sekiller = ["üçgen", "kare", "daire"];
  
  const engelRenk = renkler[Math.floor(Math.random() * renkler.length)];
  const hedefSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
  aktifHedef = { engelRenk, hedefSekil };

  yonerge.textContent = `${engelRenk} OLMAYAN ${hedefSekil}leri seç.`;

  const renkEmojileri = { Kırmızı: "🔴", Mavi: "🔵", Yeşil: "🟢", Sarı: "🟡" };
  const sekilEmojileri = { üçgen: "🔺", kare: "⬛", daire: "⭕" };

  // 20-30 nesne
  const nesneSayisi = 20 + Math.floor(Math.random() * 11);
  for (let i = 0; i < nesneSayisi; i++) {
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];
    const rastgeleSekil = sekiller[Math.floor(Math.random() * sekiller.length)];
    const dogruMu = rastgeleRenk !== engelRenk && rastgeleSekil === hedefSekil;

    const nesne = document.createElement("div");
    nesne.className = "nesne-kutu";
    nesne.style.cssText = "font-size: 50px; cursor: pointer; padding: 15px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;";
    nesne.innerHTML = renkEmojileri[rastgeleRenk] + sekilEmojileri[rastgeleSekil];
    nesne.dataset.dogru = dogruMu ? "true" : "false";
    
    nesne.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(dogruMu, dogruMu ? null : "karistirma");
      }
    };
    
    nesne.onmouseenter = () => nesne.style.transform = "scale(1.1)";
    nesne.onmouseleave = () => nesne.style.transform = "scale(1)";
    
    alan.appendChild(nesne);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turEngelleyeniGormezdenGel();
    }
  }, 3500 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 8: ARADA BELİREN HEDEFİ YAKALA
// ==========================================================
function yukleAradaBelirenHedef(container) {
  container.innerHTML = `
    <p class="talimat-metni">Ekranda sürekli hareket eden nesneler içinden ara ara beliren hedefi hızlıca seç.</p>
    <div id="aradaAlani" style="position: relative; width: 100%; height: 400px; border: 3px solid #34495e; border-radius: 10px; background: #ecf0f1; overflow: hidden;"></div>
  `;
}

function turAradaBelirenHedef() {
  const alan = document.getElementById("aradaAlani");
  if (!alan) return;

  // Arka plan nesneleri (dönen/yanıp sönen)
  const arkaPlanNesneleri = [];
  for (let i = 0; i < 10; i++) {
    const nesne = document.createElement("div");
    nesne.style.cssText = `position: absolute; font-size: 40px; opacity: 0.3; left: ${Math.random() * 90}%; top: ${Math.random() * 90}%; transition: all 0.5s;`;
    nesne.innerHTML = ["🔴", "🔵", "🟢", "🟡"][Math.floor(Math.random() * 4)];
    nesne.dataset.dogru = "false";
    alan.appendChild(nesne);
    arkaPlanNesneleri.push(nesne);

    // Yanıp sönme animasyonu
    setInterval(() => {
      nesne.style.opacity = Math.random() > 0.5 ? "0.3" : "0.1";
    }, 500 + Math.random() * 500);
  }

  // Hedef nesne (anlık belirir)
  const hedef = document.createElement("div");
  hedef.style.cssText = `position: absolute; font-size: 80px; font-weight: bold; left: ${20 + Math.random() * 60}%; top: ${20 + Math.random() * 60}%; cursor: pointer; z-index: 10; transition: transform 0.2s;`;
  hedef.innerHTML = "⭐";
  hedef.dataset.dogru = "true";
  
  hedef.onclick = () => {
    if (oyunState === "aktif" && !cevapVerildi) {
      tepkiBaslangic = tepkiBaslangic || performance.now();
      cevapVer(true);
      // Hedef kaybolur
      hedef.remove();
      arkaPlanNesneleri.forEach(n => n.remove());
    }
  };
  
  hedef.onmouseenter = () => hedef.style.transform = "scale(1.2)";
  hedef.onmouseleave = () => hedef.style.transform = "scale(1)";
  
  alan.appendChild(hedef);

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  // Hedef 2-3 saniye sonra kaybolur
  oyunTimeout = setTimeout(() => {
    if (hedef.parentNode) {
      hedef.remove();
      arkaPlanNesneleri.forEach(n => n.remove());
      if (!engine.gameFinished && oyunState !== "bitmis") {
        turAradaBelirenHedef();
      }
    }
  }, 2000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 9: İŞİTSEL–GÖRSEL EŞLEŞTİRME
// ==========================================================
function yukleIsitselGorselEslestirme(container) {
  container.innerHTML = `
    <p class="talimat-metni">Duyduğun sesi temsil eden doğru harfe tıkla.</p>
    <div id="isitselAlani" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;"></div>
  `;
}

function turIsitselGorselEslestirme() {
  const alan = document.getElementById("isitselAlani");
  if (!alan) return;

  alan.innerHTML = "";

  const harfler = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const hedefHarf = harfler[Math.floor(Math.random() * harfler.length)];
  aktifSes = hedefHarf;

  // Ses çal (harf adını söyle)
  const sesMetni = new SpeechSynthesisUtterance(hedefHarf);
  sesMetni.lang = "tr-TR";
  window.speechSynthesis.speak(sesMetni);

  // 12-16 harf göster
  const harfSayisi = 12 + Math.floor(Math.random() * 5);
  const hedefIndex = Math.floor(Math.random() * harfSayisi);

  for (let i = 0; i < harfSayisi; i++) {
    const harf = i === hedefIndex ? hedefHarf : harfler[Math.floor(Math.random() * harfler.length)];
    
    const harfEl = document.createElement("div");
    harfEl.className = "nesne-kutu";
    harfEl.style.cssText = "font-size: 48px; font-weight: bold; cursor: pointer; padding: 20px 30px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; color: #1b2d4a;";
    harfEl.textContent = harf;
    harfEl.dataset.dogru = i === hedefIndex ? "true" : "false";
    
    harfEl.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(i === hedefIndex, i === hedefIndex ? null : "karistirma");
      }
    };
    
    harfEl.onmouseenter = () => harfEl.style.transform = "scale(1.1)";
    harfEl.onmouseleave = () => harfEl.style.transform = "scale(1)";
    
    alan.appendChild(harfEl);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turIsitselGorselEslestirme();
    }
  }, 3000 + Math.random() * 1000);
}

// ==========================================================
// 🎮 OYUN 10: AYNISINI BUL
// ==========================================================
function yukleAynisiniBul(container) {
  container.innerHTML = `
    <p class="talimat-metni">Yukarıdaki modeli dikkatle incele ve alttaki seçeneklerden birebir aynı olanı seç.</p>
    <div id="modelAlani" style="display: flex; justify-content: center; margin-bottom: 30px; padding: 20px;">
      <div id="modelNesne" style="font-size: 120px; padding: 30px; background: white; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>
    </div>
    <div id="secenekAlani" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px;"></div>
  `;
}

function turAynisiniBul() {
  const modelNesne = document.getElementById("modelNesne");
  const secenekAlani = document.getElementById("secenekAlani");
  if (!modelNesne || !secenekAlani) return;

  secenekAlani.innerHTML = "";

  const nesneler = [
    { emoji: "🔴⬛", ad: "Kırmızı Kare" },
    { emoji: "🔵⭕", ad: "Mavi Daire" },
    { emoji: "🟢🔺", ad: "Yeşil Üçgen" },
    { emoji: "🟡⭐", ad: "Sarı Yıldız" },
    { emoji: "🟣⬛", ad: "Mor Kare" },
    { emoji: "🟠⭕", ad: "Turuncu Daire" }
  ];

  const hedefNesne = nesneler[Math.floor(Math.random() * nesneler.length)];
  modelNesne.innerHTML = hedefNesne.emoji;

  // 4-6 seçenek (1 doğru, diğerleri benzer)
  const secenekSayisi = 4 + Math.floor(Math.random() * 3);
  const dogruIndex = Math.floor(Math.random() * secenekSayisi);

  for (let i = 0; i < secenekSayisi; i++) {
    let secenekNesne;
    if (i === dogruIndex) {
      secenekNesne = hedefNesne;
    } else {
      // Benzer ama farklı nesne
      let benzer = nesneler[Math.floor(Math.random() * nesneler.length)];
      while (benzer.emoji === hedefNesne.emoji) {
        benzer = nesneler[Math.floor(Math.random() * nesneler.length)];
      }
      secenekNesne = benzer;
    }

    const secenek = document.createElement("div");
    secenek.className = "nesne-kutu";
    secenek.style.cssText = "font-size: 100px; cursor: pointer; padding: 25px; border-radius: 15px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s;";
    secenek.innerHTML = secenekNesne.emoji;
    secenek.dataset.dogru = i === dogruIndex ? "true" : "false";
    
    secenek.onclick = () => {
      if (oyunState === "aktif" && !cevapVerildi) {
        if (!tepkiBaslangic) tepkiBaslangic = performance.now();
        cevapVer(i === dogruIndex, i === dogruIndex ? null : "karistirma");
      }
    };
    
    secenek.onmouseenter = () => secenek.style.transform = "scale(1.1)";
    secenek.onmouseleave = () => secenek.style.transform = "scale(1)";
    
    secenekAlani.appendChild(secenek);
  }

  oyunState = "aktif";
  tepkiBaslangic = performance.now();

  oyunTimeout = setTimeout(() => {
    if (!engine.gameFinished && oyunState !== "bitmis") {
      turAynisiniBul();
    }
  }, 4000 + Math.random() * 1000);
}

