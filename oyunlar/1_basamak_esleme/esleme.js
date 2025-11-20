// ==========================================================
// 🎯 1. Basamak - Eşleme Oyunu (4 Bölüm)
// Final v9.0 — Zihin Platformu ile %100 uyumlu
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";
import { GameEngine } from "../../engine/gameEngine.js";

// ==========================================================
// 🎨 VERİ HAVUZLARI
// ==========================================================

// 1. RENK HAVUZU
const RENKLER = [
  { ad: "Kırmızı", kod: "#e53935" },
  { ad: "Mavi", kod: "#2962ff" },
  { ad: "Yeşil", kod: "#43a047" },
  { ad: "Sarı", kod: "#fdd835" },
  { ad: "Mor", kod: "#8e24aa" },
  { ad: "Turuncu", kod: "#fb8c00" },
  { ad: "Kahverengi", kod: "#6d4c41" },
  { ad: "Pembe", kod: "#f06292" }
];

// 2. ŞEKİL HAVUZU (SVG veya emoji kullanılabilir)
const SEKILLER = [
  { ad: "Üçgen", icon: "▲", svg: "triangle" },
  { ad: "Kare", icon: "■", svg: "square" },
  { ad: "Daire", icon: "●", svg: "circle" },
  { ad: "Yıldız", icon: "★", svg: "star" },
  { ad: "Kalp", icon: "♥", svg: "heart" },
  { ad: "Altıgen", icon: "⬡", svg: "hexagon" },
  { ad: "Beşgen", icon: "⬟", svg: "pentagon" },
  { ad: "Elmas", icon: "◆", svg: "diamond" }
];

// 3. NESNE-GÖLGE HAVUZU (örnek - gerçek uygulamada resimler kullanılabilir)
const NESNE_GOLGE = [
  { nesne: "Kedi", golge: "kedi_golge" },
  { nesne: "Köpek", golge: "kopek_golge" },
  { nesne: "Kuş", golge: "kus_golge" },
  { nesne: "Balık", golge: "balik_golge" },
  { nesne: "Araba", golge: "araba_golge" },
  { nesne: "Ev", golge: "ev_golge" },
  { nesne: "Ağaç", golge: "agac_golge" },
  { nesne: "Güneş", golge: "gunes_golge" }
];

// 4. PARÇA-BÜTÜN HAVUZU
const PARCA_BUTUN = [
  { parca: "araba_parca1", butun: "araba_butun" },
  { parca: "ev_parca1", butun: "ev_butun" },
  { parca: "agac_parca1", butun: "agac_butun" },
  { parca: "insan_parca1", butun: "insan_butun" },
  { parca: "hayvan_parca1", butun: "hayvan_butun" },
  { parca: "bitki_parca1", butun: "bitki_butun" },
  { parca: "nesne_parca1", butun: "nesne_butun" },
  { parca: "sekil_parca1", butun: "sekil_butun" }
];

// ==========================================================
// 🔊 SESLER
// ==========================================================
// Ses dosyalarının yolunu oyun klasörüne göre ayarla
const sesYolu = "../../sesler/";
const dogruSes = new Audio(sesYolu + "dogru.mp3");
const yanlisSes = new Audio(sesYolu + "yanlis.mp3");

// Ses yükleme hatalarını yakala
dogruSes.onerror = () => console.warn("⚠ Doğru ses dosyası yüklenemedi:", sesYolu + "dogru.mp3");
yanlisSes.onerror = () => console.warn("⚠ Yanlış ses dosyası yüklenemedi:", sesYolu + "yanlis.mp3");

// Ses yükleme için preload (opsiyonel ama önerilir)
dogruSes.preload = "auto";
yanlisSes.preload = "auto";

// ==========================================================
// 🎮 GAME ENGINE BAŞLAT
// ==========================================================
// Bölüm bazlı oyun kodları
const BOLUM_OYUN_KODLARI = {
  renk: GLOBAL.OYUN_KODLARI.RENK_ESLEME || "renk_esleme",
  sekil: GLOBAL.OYUN_KODLARI.RENK_ESLEME || "renk_esleme", // Aynı oyun, farklı bölüm
  golge: GLOBAL.OYUN_KODLARI.RENK_ESLEME || "renk_esleme",
  parca: GLOBAL.OYUN_KODLARI.RENK_ESLEME || "renk_esleme"
};

// GameEngine'i dinamik olarak oluştur (bölüm seçildiğinde)
let engine = null;

function engineOlustur(bolum) {
  const gameMeta = GLOBAL.GAME_MAP?.[GLOBAL.OYUN_KODLARI.RENK_ESLEME] || null;
  
  engine = new GameEngine({
    gameName: GLOBAL.OYUN_KODLARI.RENK_ESLEME || "renk_esleme",
    timeLimit: 30,
    gameMeta: gameMeta
  });
  
  console.log("🎮 GameEngine oluşturuldu, bölüm:", bolum);
}

// ==========================================================
// 🔀 FISHER-YATES SHUFFLE (Random karıştırma)
// ==========================================================
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==========================================================
// 🎮 OYUN DURUMU
// ==========================================================
let seciliBolum = null; // "renk", "sekil", "golge", "parca"
let secenekSayisi = 2; // 2, 3, veya 4
let soruStart = 0; // Soru başlama zamanı (ms)
let oyunBaslangicZamani = 0; // Oyun başlangıç zamanı (ms)
let mevcutHedef = null; // Mevcut sorunun hedef öğesi
let mevcutSecenekler = []; // Mevcut sorunun seçenekleri
let mevcutDogruCevap = null; // Mevcut sorunun doğru cevabı
let soruNumarasi = 0; // Toplam soru sayısı

// ==========================================================
// 🏠 ANA MENÜ
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎮 Eşleme oyunu yükleniyor...");
  
  // Bölüm kartlarına tıklama - Event delegation kullanarak daha güvenli
  const bolumKartlari = document.querySelectorAll(".bolum-kart");
  console.log("📋 Bulunan bölüm kartları:", bolumKartlari.length);
  
  if (bolumKartlari.length === 0) {
    console.error("❌ Bölüm kartları bulunamadı!");
    // Alternatif: Event delegation ile ana menüye ekle
    const anaMenu = document.getElementById("anaMenu");
    if (anaMenu) {
      anaMenu.addEventListener("click", (e) => {
        // Oyun başlamışsa veya oyun alanı görünürse işlem yapma
        const oyunAlani = document.getElementById("oyunAlani");
        if (oyunAlani && oyunAlani.style.display === "block") {
          console.log("⚠️ Oyun devam ediyor, bölüm seçimi yapılamaz");
          return;
        }
        
        // Engine varsa ve oyun bitmemişse işlem yapma
        if (engine && !engine.gameFinished) {
          console.log("⚠️ Oyun devam ediyor, bölüm seçimi yapılamaz");
          return;
        }
        
        const kart = e.target.closest(".bolum-kart");
        if (kart) {
          const bolum = kart.dataset.bolum;
          console.log("✅ Bölüm seçildi:", bolum);
          if (bolum) {
            seciliBolum = bolum;
            anaMenuGizle();
            seviyePopupGoster();
          }
        }
      });
      console.log("✅ Event delegation ile bölüm kartları dinleniyor");
    }
  } else {
    // Normal event listener'lar
    bolumKartlari.forEach((kart, index) => {
      const bolum = kart.dataset.bolum;
      console.log(`📋 Kart ${index + 1}: ${bolum}`);
      
      kart.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🖱️ Bölüm kartına tıklandı:", bolum);
        
        // Oyun başlamışsa veya oyun alanı görünürse işlem yapma
        const oyunAlani = document.getElementById("oyunAlani");
        if (oyunAlani && oyunAlani.style.display === "block") {
          console.log("⚠️ Oyun devam ediyor, bölüm seçimi yapılamaz");
          return;
        }
        
        // Engine varsa ve oyun bitmemişse işlem yapma
        if (engine && !engine.gameFinished) {
          console.log("⚠️ Oyun devam ediyor, bölüm seçimi yapılamaz");
          return;
        }
        
        if (!bolum) {
          console.error("❌ Bölüm bilgisi bulunamadı!");
          return;
        }
        
        seciliBolum = bolum;
        console.log("✅ Seçili bölüm:", seciliBolum);
        
        anaMenuGizle();
        seviyePopupGoster();
      });
      
      // Hover efekti için de kontrol
      kart.style.cursor = "pointer";
    });
    console.log("✅ Tüm bölüm kartlarına event listener eklendi");
  }

  // Seviye seçimi
  document.querySelectorAll(".seviyeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Oyun başlamışsa işlem yapma
      const oyunAlani = document.getElementById("oyunAlani");
      if (oyunAlani && oyunAlani.style.display === "block") {
        console.log("⚠️ Oyun devam ediyor, seviye seçimi yapılamaz");
        return;
      }
      
      // Engine varsa ve oyun bitmemişse işlem yapma
      if (engine && !engine.gameFinished) {
        console.log("⚠️ Oyun devam ediyor, seviye seçimi yapılamaz");
        return;
      }
      
      secenekSayisi = Number(btn.dataset.seviye);
      seviyePopupGizle();
      baslatPopupGoster();
    });
  });

  // Başlat düğmesi
  const baslatBtn = document.getElementById("baslatBtn");
  if (baslatBtn) {
    baslatBtn.addEventListener("click", () => {
      baslatPopupGizle();
      oyunBaslat();
    });
  }

  // Bitir düğmesi
  const bitirBtn = document.getElementById("bitirBtn");
  if (bitirBtn) {
    bitirBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("⛔ Bitir düğmesine tıklandı");
      
      // Oyun başlamamışsa veya zaten bitmişse işlem yapma
      if (!engine) {
        console.warn("⚠ Engine henüz oluşturulmamış");
        return;
      }
      
      if (engine.gameFinished) {
        console.warn("⚠ Oyun zaten bitmiş");
        return;
      }
      
      // Oyunu durdur (timer'ı durdur)
      if (engine.timerInterval) {
        clearInterval(engine.timerInterval);
        engine.timerInterval = null;
        console.log("🧹 Timer durduruldu");
      }
      
      // Oyun bitmiş olarak işaretle (çift kayıt önleme)
      engine.gameFinished = true;
      
      // Oyun sonu analizini hazırla
      try {
        oyunSonuAnaliziniHazirla();
      } catch (err) {
        console.error("❌ Oyun sonu analizi hatası:", err);
      }
      
      // endGame() fonksiyonunu direkt çağır (gameFinished kontrolü endGame içinde yapılıyor)
      // Kısa bir gecikme ile çağır (analiz tamamlansın)
      setTimeout(async () => {
        if (engine) {
          console.log("➡️ Bitir düğmesi: endGame() çağrılıyor...");
          try {
            await engine.endGame();
            console.log("✅ endGame() tamamlandı, yönlendirme yapılmalı");
          } catch (err) {
            console.error("❌ endGame() hatası:", err);
            // Hata durumunda manuel yönlendirme
            window.location.href = "../../platform/sonuc.html";
          }
        } else {
          console.warn("⚠ Engine yok");
          // Engine yoksa direkt yönlendir
          window.location.href = "../../platform/sonuc.html";
        }
      }, 300);
    });
  }
});

// ==========================================================
// 🎬 EKRAN YÖNETİMİ
// ==========================================================
function anaMenuGizle() {
  console.log("🔹 anaMenuGizle() çağrıldı");
  const anaMenu = document.getElementById("anaMenu");
  if (anaMenu) {
    anaMenu.classList.remove("show");
    console.log("✅ Ana menü gizlendi");
  } else {
    console.error("❌ Ana menü elementi bulunamadı!");
  }
}

function seviyePopupGoster() {
  console.log("🔹 seviyePopupGoster() çağrıldı, seciliBolum:", seciliBolum);
  const popup = document.getElementById("seviyePopup");
  const seciliBolumAdi = document.getElementById("seciliBolumAdi");
  
  if (popup) {
    popup.classList.add("show");
    console.log("✅ Seviye popup gösterildi");
  } else {
    console.error("❌ Seviye popup elementi bulunamadı!");
  }
  
  // Bölüm adını göster
  const bolumAdlari = {
    renk: "Renk Eşleme",
    sekil: "Şekil Eşleme",
    golge: "Nesne - Gölge Eşleme",
    parca: "Parça - Bütün Eşleme"
  };
  
  if (seciliBolumAdi) {
    seciliBolumAdi.textContent = bolumAdlari[seciliBolum] || "";
    console.log("✅ Bölüm adı güncellendi:", bolumAdlari[seciliBolum]);
  } else {
    console.error("❌ seciliBolumAdi elementi bulunamadı!");
  }
}

function seviyePopupGizle() {
  const popup = document.getElementById("seviyePopup");
  if (popup) popup.classList.remove("show");
}

function baslatPopupGoster() {
  const popup = document.getElementById("baslatPopup");
  if (popup) popup.classList.add("show");
}

function baslatPopupGizle() {
  const popup = document.getElementById("baslatPopup");
  if (popup) popup.classList.remove("show");
}

function oyunAlaniGoster() {
  const oyunAlani = document.getElementById("oyunAlani");
  const bitirBtnContainer = document.getElementById("bitirBtnContainer");
  
  if (oyunAlani) oyunAlani.style.display = "block";
  if (bitirBtnContainer) bitirBtnContainer.style.display = "block";
  
  // Oyun başladığında tüm popup'ları gizle
  seviyePopupGizle();
  baslatPopupGizle();
  
  // Başlığı güncelle
  const basliklar = {
    renk: "Renk Eşleme - Aynı Rengi Seç",
    sekil: "Şekil Eşleme - Aynı Şekli Seç",
    golge: "Nesne - Gölge Eşleme - Doğru Gölgeyi Seç",
    parca: "Parça - Bütün Eşleme - Doğru Bütünü Seç"
  };
  
  const oyunBaslik = document.getElementById("oyunBaslik");
  if (oyunBaslik) oyunBaslik.textContent = basliklar[seciliBolum] || "Eşleme Oyunu";
}

// ==========================================================
// ▶️ OYUN BAŞLAT
// ==========================================================
function oyunBaslat() {
  // Güvenlik kontrolü: Bölüm seçilmiş mi?
  if (!seciliBolum) {
    console.error("❌ Bölüm seçilmeden oyun başlatılamaz!");
    alert("Lütfen önce bir bölüm seçin.");
    seviyePopupGoster();
    return;
  }
  
  // Güvenlik kontrolü: Seçenek sayısı geçerli mi?
  if (!secenekSayisi || secenekSayisi < 2 || secenekSayisi > 4) {
    console.error("❌ Geçersiz seçenek sayısı:", secenekSayisi);
    alert("Lütfen geçerli bir seviye seçin.");
    seviyePopupGoster();
    return;
  }
  
  // Önceki oyundan kalan timer'ı temizle
  if (engine) {
    // Eğer önceki oyun hala çalışıyorsa, timer'ı durdur
    if (engine.timerInterval) {
      clearInterval(engine.timerInterval);
      engine.timerInterval = null;
      console.log("🧹 Önceki oyun timer'ı temizlendi");
    }
    // Engine'i sıfırla (yeni oyun için)
    engine.gameFinished = false;
    engine.score = 0;
    engine.mistakes = 0;
    engine.trials = [];
    engine.timeElapsed = 0;
    engine.timeLeft = 30; // 30 saniye
    engine.oyunDetaylari = null; // Önceki oyun detaylarını temizle
    console.log("🔄 Engine durumu sıfırlandı");
  } else {
    // GameEngine yoksa oluştur
    engineOlustur(seciliBolum);
  }
  
  // Oyun durumunu sıfırla
  mevcutHedef = null;
  mevcutSecenekler = [];
  mevcutDogruCevap = null;
  soruStart = 0;
  
  // Oyun başlangıç zamanını set et
  oyunBaslangicZamani = performance.now();
  console.log("🎮 Oyun başlatıldı, başlangıç zamanı:", oyunBaslangicZamani);
  
  // Soru sayacını sıfırla
  soruNumarasi = 0;
  
  oyunAlaniGoster();
  
  // Oyun bitiş callback'ini ayarla
  engine.setOnEndCallback(() => {
    console.log("⏰ Süre bitti, oyun sonu analizi hazırlanıyor...");
    // Oyun sonu analizini hazırla
    // NOT: gameFinished'i endGame() set edecek, burada set etmiyoruz
    oyunSonuAnaliziniHazirla();
  });
  
  try {
    engine.start(updateUI);
    yeniSoru();
    
    console.log("🎮 Oyun başlatıldı, engine durumu:", {
      gameName: engine.gameName,
      timeLimit: engine.timeLimit,
      trials: engine.trials.length
    });
  } catch (err) {
    console.error("❌ Oyun başlatma hatası:", err);
    alert("Oyun başlatılırken bir hata oluştu. Lütfen tekrar deneyin.");
    // Hata durumunda ana menüye dön
    anaMenuGizle();
    const anaMenu = document.getElementById("anaMenu");
    if (anaMenu) anaMenu.classList.add("show");
  }
}

// ==========================================================
// 🔄 UI Güncelleme
// ==========================================================
function updateUI(score, mistakes, timeLeft) {
  const skorEl = document.getElementById("skor");
  const yanlisEl = document.getElementById("yanlis");
  const sureEl = document.getElementById("sure");
  
  if (skorEl) skorEl.textContent = score;
  if (yanlisEl) yanlisEl.textContent = mistakes;
  if (sureEl) sureEl.textContent = timeLeft;
}

// ==========================================================
// 🎲 YENİ SORU OLUŞTUR
// ==========================================================
function yeniSoru() {
  // Güvenlik kontrolleri
  if (!seciliBolum) {
    console.error("❌ Bölüm seçilmeden soru üretilemez!");
    return;
  }
  
  // Oyun bitmişse yeni soru üretme
  if (engine && engine.gameFinished) {
    console.log("⛔ Oyun bitmiş, yeni soru üretilmiyor");
    return;
  }
  
  // Engine kontrolü
  if (!engine) {
    console.error("❌ Engine yok, soru üretilemez!");
    return;
  }
  
  soruStart = performance.now();
  
  try {
    switch (seciliBolum) {
      case "renk":
        yeniRenkSorusu();
        break;
      case "sekil":
        yeniSekilSorusu();
        break;
      case "golge":
        yeniGolgeSorusu();
        break;
      case "parca":
        yeniParcaSorusu();
        break;
      default:
        console.error("❌ Geçersiz bölüm:", seciliBolum);
        return;
    }
  } catch (err) {
    console.error("❌ Soru oluşturma hatası:", err);
    // Hata durumunda oyunu durdur
    if (engine) {
      engine.gameFinished = true;
      if (engine.timerInterval) {
        clearInterval(engine.timerInterval);
        engine.timerInterval = null;
      }
    }
    alert("Soru oluşturulurken bir hata oluştu. Oyun durduruldu.");
  }
}

// ==========================================================
// 🎨 RENK SORUSU
// ==========================================================
function yeniRenkSorusu() {
  // Güvenlik kontrolü: RENKLER dizisi boş mu?
  if (!RENKLER || RENKLER.length === 0) {
    console.error("❌ Renk havuzu boş!");
    return;
  }
  
  // Güvenlik kontrolü: Seçenek sayısı renk sayısından fazla mı?
  if (secenekSayisi > RENKLER.length) {
    console.warn("⚠ Seçenek sayısı renk sayısından fazla, seçenek sayısı düşürülüyor");
    secenekSayisi = Math.min(secenekSayisi, RENKLER.length);
  }
  
  const hedef = RENKLER[Math.floor(Math.random() * RENKLER.length)];
  soruNumarasi++;
  
  // Oyun durumunu güncelle
  mevcutHedef = hedef;
  mevcutDogruCevap = hedef;
  
  // Hedef alanını göster
  const hedefRenk = document.getElementById("hedefRenk");
  const hedefGorsel = document.getElementById("hedefGorsel");
  if (hedefRenk) hedefRenk.style.display = "flex";
  if (hedefGorsel) hedefGorsel.style.display = "none";
  
  const renkAdi = document.getElementById("renkAdi");
  const renkOrnegi = document.getElementById("renkOrnegi");
  if (renkAdi) renkAdi.textContent = hedef.ad;
  if (renkOrnegi) {
    renkOrnegi.style.backgroundColor = hedef.kod;
  }
  
  // Seçenekleri hazırla
  let secenekler = [...RENKLER]
    .filter(x => x.ad !== hedef.ad) // Hedefi hariç tut
    .slice(0, Math.min(secenekSayisi - 1, RENKLER.length - 1)); // Bir yer bırak, ama diziden taşma
  
  // Doğru cevabı ekle
  secenekler.push(hedef);
  
  // Fisher-Yates shuffle ile karıştır
  secenekler = shuffleArray(secenekler);
  
  // Oyun durumunu güncelle
  mevcutSecenekler = [...secenekler];
  
  secenekleriGoster(secenekler, (secim) => {
    const dogruMu = secim.ad === hedef.ad;
    cevapIsle(dogruMu, secim, hedef, secenekler, "renk");
  }, "renk");
}

// ==========================================================
// 🔺 ŞEKİL SORUSU
// ==========================================================
function yeniSekilSorusu() {
  // Güvenlik kontrolü: SEKILLER dizisi boş mu?
  if (!SEKILLER || SEKILLER.length === 0) {
    console.error("❌ Şekil havuzu boş!");
    return;
  }
  
  // Güvenlik kontrolü: Seçenek sayısı şekil sayısından fazla mı?
  if (secenekSayisi > SEKILLER.length) {
    console.warn("⚠ Seçenek sayısı şekil sayısından fazla, seçenek sayısı düşürülüyor");
    secenekSayisi = Math.min(secenekSayisi, SEKILLER.length);
  }
  
  const hedef = SEKILLER[Math.floor(Math.random() * SEKILLER.length)];
  soruNumarasi++;
  
  // Oyun durumunu güncelle
  mevcutHedef = hedef;
  mevcutDogruCevap = hedef;
  
  // Hedef alanını göster
  const hedefRenk = document.getElementById("hedefRenk");
  const hedefGorsel = document.getElementById("hedefGorsel");
  if (hedefRenk) hedefRenk.style.display = "none";
  if (hedefGorsel) hedefGorsel.style.display = "flex";
  
  const hedefResim = document.getElementById("hedefResim");
  if (hedefResim) {
    // SVG şekil oluştur
    hedefResim.innerHTML = sekilSVGOlustur(hedef);
  }
  
  // Seçenekleri hazırla
  let secenekler = [...SEKILLER]
    .filter(x => x.ad !== hedef.ad) // Hedefi hariç tut
    .slice(0, Math.min(secenekSayisi - 1, SEKILLER.length - 1)); // Bir yer bırak, ama diziden taşma
  
  // Doğru cevabı ekle
  secenekler.push(hedef);
  
  // Fisher-Yates shuffle ile karıştır
  secenekler = shuffleArray(secenekler);
  
  // Oyun durumunu güncelle
  mevcutSecenekler = [...secenekler];
  
  secenekleriGoster(secenekler, (secim) => {
    const dogruMu = secim.ad === hedef.ad;
    cevapIsle(dogruMu, secim, hedef, secenekler, "sekil");
  }, "sekil");
}

// ==========================================================
// 🖼️ GÖLGE SORUSU
// ==========================================================
function yeniGolgeSorusu() {
  // Güvenlik kontrolü: NESNE_GOLGE dizisi boş mu?
  if (!NESNE_GOLGE || NESNE_GOLGE.length === 0) {
    console.error("❌ Nesne-gölge havuzu boş!");
    return;
  }
  
  // Güvenlik kontrolü: Seçenek sayısı nesne sayısından fazla mı?
  if (secenekSayisi > NESNE_GOLGE.length) {
    console.warn("⚠ Seçenek sayısı nesne sayısından fazla, seçenek sayısı düşürülüyor");
    secenekSayisi = Math.min(secenekSayisi, NESNE_GOLGE.length);
  }
  
  const hedef = NESNE_GOLGE[Math.floor(Math.random() * NESNE_GOLGE.length)];
  soruNumarasi++;
  
  // Oyun durumunu güncelle
  mevcutHedef = hedef;
  mevcutDogruCevap = hedef;
  
  // Hedef alanını göster
  const hedefRenk = document.getElementById("hedefRenk");
  const hedefGorsel = document.getElementById("hedefGorsel");
  if (hedefRenk) hedefRenk.style.display = "none";
  if (hedefGorsel) hedefGorsel.style.display = "flex";
  
  const hedefResim = document.getElementById("hedefResim");
  if (hedefResim) {
    // Nesne göster - emoji ve SVG kullanarak görsel oluştur
    const nesneEmojiler = {
      "Kedi": "🐱",
      "Köpek": "🐶",
      "Kuş": "🐦",
      "Balık": "🐟",
      "Araba": "🚗",
      "Ev": "🏠",
      "Ağaç": "🌳",
      "Güneş": "☀️"
    };
    const emoji = nesneEmojiler[hedef.nesne] || "🖼️";
    hedefResim.innerHTML = `<div class="nesne-gorsel" style="font-size: 80px; margin: 20px 0;">${emoji}</div><div style="font-size: 24px; font-weight: 600; color: #1b2d4a; margin-top: 10px;">${hedef.nesne}</div>`;
  }
  
  // Seçenekleri hazırla (gölgeler)
  let secenekler = [...NESNE_GOLGE]
    .filter(x => x.nesne !== hedef.nesne) // Hedefi hariç tut
    .slice(0, Math.min(secenekSayisi - 1, NESNE_GOLGE.length - 1)); // Bir yer bırak, ama diziden taşma
  
  // Doğru cevabı ekle
  secenekler.push(hedef);
  
  // Fisher-Yates shuffle ile karıştır
  secenekler = shuffleArray(secenekler);
  
  // Oyun durumunu güncelle
  mevcutSecenekler = [...secenekler];
  
  secenekleriGoster(secenekler, (secim) => {
    const dogruMu = secim.nesne === hedef.nesne;
    cevapIsle(dogruMu, secim, hedef, secenekler, "golge");
  }, "golge");
}

// ==========================================================
// 🧩 PARÇA-BÜTÜN SORUSU
// ==========================================================
function yeniParcaSorusu() {
  // Güvenlik kontrolü: PARCA_BUTUN dizisi boş mu?
  if (!PARCA_BUTUN || PARCA_BUTUN.length === 0) {
    console.error("❌ Parça-bütün havuzu boş!");
    return;
  }
  
  // Güvenlik kontrolü: Seçenek sayısı parça sayısından fazla mı?
  if (secenekSayisi > PARCA_BUTUN.length) {
    console.warn("⚠ Seçenek sayısı parça sayısından fazla, seçenek sayısı düşürülüyor");
    secenekSayisi = Math.min(secenekSayisi, PARCA_BUTUN.length);
  }
  
  const hedef = PARCA_BUTUN[Math.floor(Math.random() * PARCA_BUTUN.length)];
  soruNumarasi++;
  
  // Oyun durumunu güncelle
  mevcutHedef = hedef;
  mevcutDogruCevap = hedef;
  
  // Hedef alanını göster (parça)
  const hedefRenk = document.getElementById("hedefRenk");
  const hedefGorsel = document.getElementById("hedefGorsel");
  if (hedefRenk) hedefRenk.style.display = "none";
  if (hedefGorsel) hedefGorsel.style.display = "flex";
  
  const hedefResim = document.getElementById("hedefResim");
  if (hedefResim) {
    // Parça göster - emoji kullanarak görsel oluştur
    const parcaEmojiler = {
      "araba_parca1": "🚗",
      "ev_parca1": "🏠",
      "agac_parca1": "🌳",
      "insan_parca1": "👤",
      "hayvan_parca1": "🐾",
      "bitki_parca1": "🌿",
      "nesne_parca1": "📦",
      "sekil_parca1": "🔷"
    };
    const emoji = parcaEmojiler[hedef.parca] || "🧩";
    hedefResim.innerHTML = `<div class="parca-gorsel" style="font-size: 80px; margin: 20px 0; opacity: 0.7;">${emoji}</div><div style="font-size: 18px; font-weight: 600; color: #1b2d4a; margin-top: 10px;">Parça</div>`;
  }
  
  // Seçenekleri hazırla (bütünler)
  let secenekler = [...PARCA_BUTUN]
    .filter(x => x.butun !== hedef.butun) // Hedefi hariç tut
    .slice(0, Math.min(secenekSayisi - 1, PARCA_BUTUN.length - 1)); // Bir yer bırak, ama diziden taşma
  
  // Doğru cevabı ekle
  secenekler.push(hedef);
  
  // Fisher-Yates shuffle ile karıştır
  secenekler = shuffleArray(secenekler);
  
  // Oyun durumunu güncelle
  mevcutSecenekler = [...secenekler];
  
  secenekleriGoster(secenekler, (secim) => {
    const dogruMu = secim.butun === hedef.butun;
    cevapIsle(dogruMu, secim, hedef, secenekler, "parca");
  }, "parca");
}

// ==========================================================
// 🎯 SEÇENEKLERİ GÖSTER
// ==========================================================
function secenekleriGoster(secenekler, onClick, tip) {
  const alan = document.getElementById("secenekAlani");
  if (!alan) {
    console.error("❌ Seçenek alanı bulunamadı!");
    return;
  }
  
  // Güvenlik kontrolü: Seçenekler boş mu?
  if (!secenekler || secenekler.length === 0) {
    console.error("❌ Seçenekler boş!");
    return;
  }
  
  // Güvenlik kontrolü: Tip geçerli mi?
  if (!tip || !["renk", "sekil", "golge", "parca"].includes(tip)) {
    console.error("❌ Geçersiz tip:", tip);
    return;
  }
  
  alan.innerHTML = "";
  
  // Seçenekler zaten karıştırılmış geliyor, tekrar karıştırmaya gerek yok
  
  secenekler.forEach((secenek, index) => {
    // Güvenlik kontrolü: Seçenek geçerli mi?
    if (!secenek) {
      console.warn("⚠ Geçersiz seçenek atlandı:", index);
      return;
    }
    
    const btn = document.createElement("button");
    btn.className = "secenek-btn";
    
    try {
      // Tip'e göre içerik
      if (tip === "renk") {
        if (!secenek.kod || !secenek.ad) {
          console.warn("⚠ Geçersiz renk seçeneği atlandı:", secenek);
          return;
        }
        btn.style.backgroundColor = secenek.kod;
        btn.textContent = secenek.ad;
        btn.style.color = "white";
      } else if (tip === "sekil") {
        if (!secenek.ad) {
          console.warn("⚠ Geçersiz şekil seçeneği atlandı:", secenek);
          return;
        }
        btn.innerHTML = sekilSVGOlustur(secenek);
        btn.className = "secenek-btn sekil-btn";
      } else if (tip === "golge") {
        if (!secenek.nesne) {
          console.warn("⚠ Geçersiz gölge seçeneği atlandı:", secenek);
          return;
        }
        // Gölge seçenekleri - emoji ile
        const nesneEmojiler = {
          "Kedi": "🐱",
          "Köpek": "🐶",
          "Kuş": "🐦",
          "Balık": "🐟",
          "Araba": "🚗",
          "Ev": "🏠",
          "Ağaç": "🌳",
          "Güneş": "☀️"
        };
        const emoji = nesneEmojiler[secenek.nesne] || "🖼️";
        btn.innerHTML = `<div class="golge-gorsel" style="font-size: 50px; margin-bottom: 8px; filter: brightness(0.3);">${emoji}</div><div style="font-size: 14px; font-weight: 600;">${secenek.nesne}</div>`;
        btn.className = "secenek-btn golge-btn";
      } else if (tip === "parca") {
        if (!secenek.butun) {
          console.warn("⚠ Geçersiz parça seçeneği atlandı:", secenek);
          return;
        }
        // Bütün seçenekleri - emoji ile
        const butunEmojiler = {
          "araba_butun": "🚗",
          "ev_butun": "🏠",
          "agac_butun": "🌳",
          "insan_butun": "👤",
          "hayvan_butun": "🐾",
          "bitki_butun": "🌿",
          "nesne_butun": "📦",
          "sekil_butun": "🔷"
        };
        const emoji = butunEmojiler[secenek.butun] || "🧩";
        btn.innerHTML = `<div class="butun-gorsel" style="font-size: 50px; margin-bottom: 8px;">${emoji}</div><div style="font-size: 14px; font-weight: 600;">Bütün</div>`;
        btn.className = "secenek-btn butun-btn";
      }
      
      // Oyun bitmişse onClick'i devre dışı bırak
      btn.onclick = () => {
        if (engine && engine.gameFinished) {
          console.log("⛔ Oyun bitmiş, seçim yapılamaz");
          return;
        }
        onClick(secenek);
      };
      
      alan.appendChild(btn);
    } catch (err) {
      console.error("❌ Seçenek oluşturma hatası:", err, secenek);
    }
  });
}

// ==========================================================
// 🔺 ŞEKİL SVG OLUŞTUR
// ==========================================================
function sekilSVGOlustur(sekil) {
  const size = 80;
  const svgMap = {
    triangle: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <polygon points="50,10 90,90 10,90" fill="#4a90e2" />
    </svg>`,
    square: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" fill="#4a90e2" />
    </svg>`,
    circle: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#4a90e2" />
    </svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <path d="M50,10 L60,40 L90,40 L68,60 L78,90 L50,70 L22,90 L32,60 L10,40 L40,40 Z" fill="#4a90e2" />
    </svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <path d="M50,75 L25,50 Q20,45 20,40 Q20,30 30,30 Q35,30 50,45 Q65,30 70,30 Q80,30 80,40 Q80,45 75,50 Z" fill="#e53935" />
    </svg>`,
    hexagon: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#43a047" />
    </svg>`,
    pentagon: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <polygon points="50,5 90,35 75,85 25,85 10,35" fill="#fdd835" />
    </svg>`,
    diamond: `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <polygon points="50,10 90,50 50,90 10,50" fill="#8e24aa" />
    </svg>`
  };
  
  return svgMap[sekil.svg] || `<div style="font-size: 60px;">${sekil.icon}</div>`;
}

// ==========================================================
// 🟩 CEVAP İŞLE - DETAYLI VERİ KAYDI
// ==========================================================
function cevapIsle(dogruMu, secilenSecenek, hedef, secenekler, bolumTipi) {
  // A) TEMEL ZAMAN VERİLERİ
  const soruBaslamaZamani = soruStart; // Soru başlama zamanı (ms)
  const cevapZamani = performance.now(); // Cevap zamanı (ms)
  const tepkiSuresi = Math.round(cevapZamani - soruBaslamaZamani); // Tepki süresi (ms)
  
  // B) SEÇİLEN SEÇENEK BİLGİSİ
  let secilenSecenekBilgisi = "";
  if (bolumTipi === "renk") {
    secilenSecenekBilgisi = secilenSecenek.ad || "";
  } else if (bolumTipi === "sekil") {
    secilenSecenekBilgisi = secilenSecenek.ad || "";
  } else if (bolumTipi === "golge") {
    secilenSecenekBilgisi = secilenSecenek.nesne || "";
  } else if (bolumTipi === "parca") {
    secilenSecenekBilgisi = secilenSecenek.butun || "";
  }
  
  // C) HEDEF ÖĞE BİLGİSİ
  let hedefBilgisi = "";
  if (bolumTipi === "renk") {
    hedefBilgisi = hedef.ad || "";
  } else if (bolumTipi === "sekil") {
    hedefBilgisi = hedef.ad || "";
  } else if (bolumTipi === "golge") {
    hedefBilgisi = hedef.nesne || "";
  } else if (bolumTipi === "parca") {
    hedefBilgisi = hedef.parca || "";
  }
  
  // D) DOĞRU CEVAP BİLGİSİ
  let dogruCevapBilgisi = "";
  if (bolumTipi === "renk") {
    dogruCevapBilgisi = hedef.ad || "";
  } else if (bolumTipi === "sekil") {
    dogruCevapBilgisi = hedef.ad || "";
  } else if (bolumTipi === "golge") {
    dogruCevapBilgisi = hedef.nesne || "";
  } else if (bolumTipi === "parca") {
    dogruCevapBilgisi = hedef.butun || "";
  }
  
  // E) GÖSTERİLEN SEÇENEKLER LİSTESİ
  const gosterilenSecenekler = secenekler.map(sec => {
    if (bolumTipi === "renk") return sec.ad;
    if (bolumTipi === "sekil") return sec.ad;
    if (bolumTipi === "golge") return sec.nesne;
    if (bolumTipi === "parca") return sec.butun;
    return "";
  });
  
  // F) ZORLUK SEVİYESİ
  const zorlukSeviyesi = secenekSayisi === 2 ? "Kolay" : 
                         secenekSayisi === 3 ? "Orta" : "Zor";
  
  // G) HATA TÜRÜ ANALİZİ
  let hataTuru = null;
  if (!dogruMu) {
    if (tepkiSuresi < 300) {
      hataTuru = "impulsivite"; // Çok hızlı cevap → yanlış
    } else if (tepkiSuresi >= 800) {
      hataTuru = "dikkatsizlik"; // Normal hız + yanlış (bariz doğruyu kaçırma)
    } else {
      // Benzer görsel seçimi kontrolü
      if (bolumTipi === "golge" || bolumTipi === "sekil" || bolumTipi === "parca") {
        hataTuru = "karistirma"; // Görsel olarak benzer yanlış seçilmesi
      } else {
        hataTuru = "kategori_hatasi"; // Farklı sınıfa ait şeyi seçme
      }
    }
  }
  
  // H) SES ÇALMA (hata yönetimi ile)
  try {
    if (dogruMu) {
      dogruSes.currentTime = 0;
      dogruSes.play().catch(err => console.warn("⚠ Ses çalınamadı:", err));
    } else {
      yanlisSes.currentTime = 0;
      yanlisSes.play().catch(err => console.warn("⚠ Ses çalınamadı:", err));
    }
  } catch (err) {
    console.warn("⚠ Ses çalma hatası:", err);
  }
  
  // I) DETAYLI TRIAL KAYDI
  // Oyun başlangıç zamanını kontrol et (eğer set edilmemişse şimdi set et)
  if (oyunBaslangicZamani === 0) {
    oyunBaslangicZamani = performance.now();
    console.log("⚠️ oyunBaslangicZamani otomatik set edildi:", oyunBaslangicZamani);
  }
  
  const trialData = {
    // Temel veriler
    correct: dogruMu,
    reaction_ms: tepkiSuresi,
    
    // Zaman verileri
    soruBaslamaZamani: soruBaslamaZamani,
    cevapZamani: cevapZamani,
    
    // Soru bilgileri
    soruNumarasi: soruNumarasi,
    hedefOge: hedefBilgisi,
    dogruCevap: dogruCevapBilgisi,
    secilenSecenek: secilenSecenekBilgisi,
    gosterilenSecenekler: gosterilenSecenekler,
    secenekSayisi: secenekSayisi,
    zorlukSeviyesi: zorlukSeviyesi,
    
    // Oyun bilgileri
    bolum: seciliBolum,
    bolumAdi: bolumTipi === "renk" ? "Renk Eşleme" :
              bolumTipi === "sekil" ? "Şekil Eşleme" :
              bolumTipi === "golge" ? "Nesne - Gölge Eşleme" :
              bolumTipi === "parca" ? "Parça - Bütün Eşleme" : "",
    bolumTipi: bolumTipi,
    oyunBaslangicZamani: oyunBaslangicZamani, // Artık doğru değer set ediliyor
    
    // Hata analizi
    hataTuru: hataTuru,
    
    // Bölüm özel veriler
    ...(bolumTipi === "renk" && {
      hedefRenk: hedef.ad,
      secilenRenk: secilenSecenek.ad,
      renkKodu: hedef.kod
    }),
    ...(bolumTipi === "sekil" && {
      hedefSekil: hedef.ad,
      secilenSekil: secilenSecenek.ad
    }),
    ...(bolumTipi === "golge" && {
      hedefNesne: hedef.nesne,
      secilenGolge: secilenSecenek.nesne
    }),
    ...(bolumTipi === "parca" && {
      hedefParca: hedef.parca,
      secilenButun: secilenSecenek.butun
    })
  };
  
  // GAME ENGINE Trial Kaydı
  if (engine) {
    // Oyun bitmişse trial kaydetme ve yeni soru üretme
    if (engine.gameFinished) {
      console.log("⛔ Oyun bitmiş, trial kaydedilmiyor ve yeni soru üretilmiyor");
      return;
    }
    
    try {
      engine.recordTrial(trialData);
    } catch (err) {
      console.error("❌ Trial kaydetme hatası:", err);
      // Hata durumunda oyunu durdur
      engine.gameFinished = true;
      if (engine.timerInterval) {
        clearInterval(engine.timerInterval);
        engine.timerInterval = null;
      }
      alert("Veri kaydedilirken bir hata oluştu. Oyun durduruldu.");
      return;
    }
  } else {
    console.error("❌ Engine henüz oluşturulmamış!");
    return;
  }
  
  // Oyun bitmişse yeni soru üretme
  if (engine && engine.gameFinished) {
    console.log("⛔ Oyun bitmiş, yeni soru üretilmiyor");
    return;
  }
  
  // Kısa bir gecikme ile yeni soru üret (UI güncellemesi için)
  setTimeout(() => {
    // Tekrar kontrol et (oyun bitmiş olabilir)
    if (engine && !engine.gameFinished) {
      yeniSoru();
    }
  }, 100);
}

// ==========================================================
// 🎯 OYUN SONU ANALİZİNİ HAZIRLA
// ==========================================================
function oyunSonuAnaliziniHazirla() {
  console.log("📊 Oyun sonu analizi hazırlanıyor...");
  
  // Güvenlik kontrolleri
  if (!engine) {
    console.error("❌ Engine yok, analiz yapılamaz!");
    return null;
  }
  
  if (!engine.trials || engine.trials.length === 0) {
    console.warn("⚠ Oyun sonu analizi için yeterli veri yok", {
      engine: !!engine,
      trials: engine?.trials?.length || 0
    });
    return null;
  }
  
  // Minimum trial sayısı kontrolü
  if (engine.trials.length < 1) {
    console.warn("⚠ En az 1 trial gerekli, analiz yapılamaz");
    return null;
  }
  
  const trials = engine.trials;
  const oyunBitisZamani = performance.now();
  
  // Oyun başlangıç zamanını kontrol et
  if (oyunBaslangicZamani === 0) {
    console.warn("⚠️ oyunBaslangicZamani 0, ilk trial'dan alınıyor...");
    const ilkTrial = trials[0];
    if (ilkTrial && ilkTrial.oyunBaslangicZamani) {
      oyunBaslangicZamani = ilkTrial.oyunBaslangicZamani;
    } else {
      // Eğer hiçbiri yoksa şimdi set et (geç de olsa)
      oyunBaslangicZamani = performance.now() - (engine.timeElapsed * 1000);
      console.warn("⚠️ oyunBaslangicZamani geriye dönük hesaplandı:", oyunBaslangicZamani);
    }
  }
  
  const toplamOyunSuresi = Math.round((oyunBitisZamani - oyunBaslangicZamani) / 1000); // saniye
  
  console.log("📊 Oyun zaman bilgileri:", {
    oyunBaslangicZamani,
    oyunBitisZamani,
    toplamOyunSuresi,
    engineTimeElapsed: engine.timeElapsed
  });
  
  // 1. Temel skorları hesapla
  const toplamSoruSayisi = trials.length;
  const toplamDogru = trials.filter(t => t.correct).length;
  const toplamYanlis = trials.filter(t => !t.correct).length;
  
  // 2. Ortalama tepki süresi
  const dogruTrials = trials.filter(t => t.correct && typeof t.reaction_ms === "number");
  const toplamTepkiSuresi = dogruTrials.reduce((sum, t) => sum + (t.reaction_ms || 0), 0);
  const ortalamaTepkiSuresi = dogruTrials.length > 0 
    ? Math.round(toplamTepkiSuresi / dogruTrials.length) 
    : 0;
  
  // 3. Hata türü dağılımı
  const hataTurleriDetay = {
    impulsivite: 0,
    dikkatsizlik: 0,
    karistirma: 0,
    kategori_hatasi: 0,
    toplam: toplamYanlis
  };
  
  trials.forEach(trial => {
    if (!trial.correct && trial.hataTuru) {
      if (hataTurleriDetay.hasOwnProperty(trial.hataTuru)) {
        hataTurleriDetay[trial.hataTuru]++;
      }
    }
  });
  
  // 4. Öğrenme hızı analizi (ilk 5 vs son 5)
  const ilk5 = trials.slice(0, Math.min(5, trials.length));
  const son5 = trials.slice(Math.max(0, trials.length - 5));
  
  const ilk5OrtalamaTepki = ilk5.length > 0 && ilk5.some(t => t.reaction_ms)
    ? Math.round(ilk5.filter(t => t.reaction_ms).reduce((sum, t) => sum + (t.reaction_ms || 0), 0) / ilk5.filter(t => t.reaction_ms).length)
    : null;
  const son5OrtalamaTepki = son5.length > 0 && son5.some(t => t.reaction_ms)
    ? Math.round(son5.filter(t => t.reaction_ms).reduce((sum, t) => sum + (t.reaction_ms || 0), 0) / son5.filter(t => t.reaction_ms).length)
    : null;
  
  // Tepki eğilimi
  let tepkiEgilimi = "stabil";
  if (ilk5OrtalamaTepki && son5OrtalamaTepki) {
    const fark = son5OrtalamaTepki - ilk5OrtalamaTepki;
    if (fark < -100) tepkiEgilimi = "hizlanma";
    else if (fark > 100) tepkiEgilimi = "yavaslama";
  }
  
  // İlk yarı ve son yarı doğru oranı
  const yariNokta = Math.floor(trials.length / 2);
  const ilkYari = trials.slice(0, yariNokta);
  const sonYari = trials.slice(yariNokta);
  const ilkYariDogru = ilkYari.filter(t => t.correct).length;
  const sonYariDogru = sonYari.filter(t => t.correct).length;
  const ilkYariDogruOrani = ilkYari.length > 0 ? Math.round((ilkYariDogru / ilkYari.length) * 100) : 0;
  const sonYariDogruOrani = sonYari.length > 0 ? Math.round((sonYariDogru / sonYari.length) * 100) : 0;
  
  // 5. Bölüm bazlı skorlar
  const bolumSkorlari = {
    renk: { toplam: 0, dogru: 0 },
    sekil: { toplam: 0, dogru: 0 },
    golge: { toplam: 0, dogru: 0 },
    parca: { toplam: 0, dogru: 0 }
  };
  
  trials.forEach(trial => {
    if (trial.bolum && bolumSkorlari[trial.bolum]) {
      bolumSkorlari[trial.bolum].toplam++;
      if (trial.correct) {
        bolumSkorlari[trial.bolum].dogru++;
      }
    }
  });
  
  // 6. Zorluk seviyesi bilgisi
  const zorlukSeviyesi = secenekSayisi === 2 ? "Kolay" : 
                         secenekSayisi === 3 ? "Orta" : "Zor";
  
  // 7. Baskın hata türü
  let baskınHataTuru = null;
  let enYuksekHata = 0;
  Object.entries(hataTurleriDetay).forEach(([tur, sayi]) => {
    if (tur !== "toplam" && sayi > enYuksekHata) {
      enYuksekHata = sayi;
      baskınHataTuru = tur;
    }
  });
  
  // 8. İlk 5 ve son 5 doğru oranı (mikro-gelişim için)
  const ilk5Dogru = ilk5.filter(t => t.correct).length;
  const son5Dogru = son5.filter(t => t.correct).length;
  const ilk5DogruOrani = ilk5.length > 0 ? Math.round((ilk5Dogru / ilk5.length) * 100) : 0;
  const son5DogruOrani = son5.length > 0 ? Math.round((son5Dogru / son5.length) * 100) : 0;
  
  // ==========================================================
  // 11. 7 ZİHİNSEL ALAN PUANLARI HESAPLAMA
  // ==========================================================
  
  // 1️⃣ DİKKAT (Attention) Puanı
  function hesaplaDikkatSkoru() {
    // Veri azsa orta puan dön
    if (toplamSoruSayisi < 8) {
      return 50;
    }
    
    let puan = 35; // Başlangıç puanı (düşürüldü)
    
    // Doğru oranı katkısı (max +25, kötüye ceza var)
    const dogruOrani = toplamSoruSayisi > 0 ? (toplamDogru / toplamSoruSayisi) * 100 : 0;
    if (dogruOrani >= 80) puan += 25;
    else if (dogruOrani >= 60) puan += 15;
    else if (dogruOrani >= 40) puan += 5;
    else if (dogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük doğru oranı
    
    // Ortalama tepki süresi (max +10, yavaşsa ceza)
    if (ortalamaTepkiSuresi > 0) {
      if (ortalamaTepkiSuresi < 1000) puan += 10; // Çok hızlı
      else if (ortalamaTepkiSuresi < 2000) puan += 5; // Normal
      else if (ortalamaTepkiSuresi >= 3000) puan -= 10; // Çok yavaş
    }
    
    // Dikkatsizlik ve impulsivite oranı (max +10, yüksekse ceza)
    const toplamHata = hataTurleriDetay.dikkatsizlik + hataTurleriDetay.impulsivite;
    const hataOrani = toplamYanlis > 0 ? (toplamHata / toplamYanlis) * 100 : 0;
    if (hataOrani < 30) puan += 10;
    else if (hataOrani < 50) puan += 5;
    else if (hataOrani >= 70) puan -= 10; // Çok fazla hata
    
    // Oyun içinde gelişim varsa (max +5, düşürüldü)
    if (son5DogruOrani > ilk5DogruOrani) {
      const gelisimFarki = son5DogruOrani - ilk5DogruOrani;
      if (gelisimFarki >= 20) puan += 5;
      else if (gelisimFarki >= 10) puan += 3;
    }
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 2️⃣ ALGISAL İŞLEMLEME (Perceptual Processing) Puanı
  function hesaplaAlgisalIslemlemeSkoru() {
    // Sadece şekil, gölge, parça trial'larına bak
    const algisalTrials = trials.filter(t => 
      t.bolum === "sekil" || t.bolum === "golge" || t.bolum === "parca"
    );
    
    // Veri azsa orta puan dön
    if (algisalTrials.length < 5) {
      return 50;
    }
    
    if (algisalTrials.length === 0) return 50; // Varsayılan puan
    
    const algisalDogru = algisalTrials.filter(t => t.correct).length;
    const algisalDogruOrani = (algisalDogru / algisalTrials.length) * 100;
    
    // Ortalama tepki süresi
    const algisalTepkiler = algisalTrials
      .filter(t => t.correct && t.reaction_ms)
      .map(t => t.reaction_ms);
    const algisalOrtalamaTepki = algisalTepkiler.length > 0
      ? algisalTepkiler.reduce((a, b) => a + b, 0) / algisalTepkiler.length
      : 0;
    
    // Karıştırma hatası oranı
    const algisalKaristirma = algisalTrials.filter(t => 
      !t.correct && t.hataTuru === "karistirma"
    ).length;
    const karistirmaOrani = algisalTrials.length > 0
      ? (algisalKaristirma / algisalTrials.length) * 100
      : 0;
    
    // Puan hesaplama
    let puan = 35; // Başlangıç puanı (düşürüldü)
    
    // Doğru oran (max +25, kötüye ceza)
    if (algisalDogruOrani >= 80) puan += 25;
    else if (algisalDogruOrani >= 60) puan += 15;
    else if (algisalDogruOrani >= 40) puan += 5;
    else if (algisalDogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük doğru oranı
    
    // Hızlı tepki (max +5, düşürüldü)
    if (algisalOrtalamaTepki > 0 && algisalOrtalamaTepki < 1500) {
      puan += 5;
    } else if (algisalOrtalamaTepki < 2500) {
      puan += 3;
    } else if (algisalOrtalamaTepki >= 3000) {
      puan -= 5; // Çok yavaş
    }
    
    // Karıştırma hatası (düşükse +8, yüksekse -15)
    if (karistirmaOrani < 20) puan += 8;
    else if (karistirmaOrani < 40) puan += 4;
    else if (karistirmaOrani >= 50) puan -= 15; // Çok fazla karıştırma
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 3️⃣ HAFIZA (Memory) Puanı
  function hesaplaHafizaSkoru() {
    // Tekrar eden hedefleri tespit et
    const hedefMap = new Map();
    const tekrarEdenTrials = [];
    
    trials.forEach((trial, index) => {
      const hedefKey = trial.hedefOge || trial.hedefRenk || trial.hedefSekil || 
                       trial.hedefNesne || trial.hedefParca;
      if (hedefKey) {
        if (hedefMap.has(hedefKey)) {
          tekrarEdenTrials.push({ trial, index, oncekiIndex: hedefMap.get(hedefKey) });
        } else {
          hedefMap.set(hedefKey, index);
        }
      }
    });
    
    // Veri azsa orta puan dön
    if (tekrarEdenTrials.length < 3) {
      return 50;
    }
    
    // Tekrar eden hedeflerde doğru oran
    const tekrarDogru = tekrarEdenTrials.filter(t => t.trial.correct).length;
    const tekrarDogruOrani = tekrarEdenTrials.length > 0
      ? (tekrarDogru / tekrarEdenTrials.length) * 100
      : 0;
    
    // Seri doğru sayısı (arka arkaya doğru cevaplar)
    let enUzunSeri = 0;
    let mevcutSeri = 0;
    trials.forEach(trial => {
      if (trial.correct) {
        mevcutSeri++;
        enUzunSeri = Math.max(enUzunSeri, mevcutSeri);
      } else {
        mevcutSeri = 0;
      }
    });
    
    // Oyunun sonuna doğru hızlanma (tekrar eden hedeflerde)
    let sonTekrarlardaHizlanma = false;
    if (tekrarEdenTrials.length >= 2) {
      const sonTekrarlar = tekrarEdenTrials.slice(-3);
      const sonTekrarlarHizli = sonTekrarlar.filter(t => 
        t.trial.correct && t.trial.reaction_ms && t.trial.reaction_ms < 1500
      ).length;
      if (sonTekrarlarHizli >= 2) sonTekrarlardaHizlanma = true;
    }
    
    // Puan hesaplama
    let puan = 35; // Başlangıç puanı (düşürüldü)
    
    // Tekrar eden hedeflerde doğru oran (max +25, kötüye ceza)
    if (tekrarDogruOrani >= 80) puan += 25;
    else if (tekrarDogruOrani >= 60) puan += 15;
    else if (tekrarDogruOrani >= 40) puan += 8;
    else if (tekrarDogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük tekrar doğru oranı
    
    // Seri doğru (max +15)
    if (enUzunSeri >= 5) puan += 15;
    else if (enUzunSeri >= 3) puan += 10;
    else if (enUzunSeri >= 2) puan += 5;
    
    // Son tekrarlarda hızlanma (max +10)
    if (sonTekrarlardaHizlanma) puan += 10;
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 4️⃣ YÜRÜTÜCÜ İŞLEV (Executive Function) Puanı
  function hesaplaYuruteciIslevSkoru() {
    // Veri azsa orta puan dön
    if (toplamSoruSayisi < 8) {
      return 70;
    }
    
    let puan = 70; // Başlangıç puanı (100'den düşürüldü)
    
    // İmpulsivite oranına göre düşür (daha güçlü ceza)
    const impulsiviteOrani = toplamYanlis > 0
      ? (hataTurleriDetay.impulsivite / toplamYanlis) * 100
      : 0;
    if (impulsiviteOrani >= 50) puan -= 30;
    else if (impulsiviteOrani >= 30) puan -= 20;
    else if (impulsiviteOrani >= 15) puan -= 10;
    else if (impulsiviteOrani < 10) puan += 5; // Çok az impulsivite
    
    // Dikkatsizlik oranına göre düşür (daha güçlü ceza)
    const dikkatsizlikOrani = toplamYanlis > 0
      ? (hataTurleriDetay.dikkatsizlik / toplamYanlis) * 100
      : 0;
    if (dikkatsizlikOrani >= 50) puan -= 25;
    else if (dikkatsizlikOrani >= 30) puan -= 15;
    else if (dikkatsizlikOrani >= 15) puan -= 8;
    else if (dikkatsizlikOrani < 10) puan += 5; // Çok az dikkatsizlik
    
    // Gelişim varsa bonus (max +10, düşürüldü)
    const ilk5Yanlis = ilk5.filter(t => !t.correct).length;
    const son5Yanlis = son5.filter(t => !t.correct).length;
    if (ilk5Yanlis > son5Yanlis) {
      const gelisim = ilk5Yanlis - son5Yanlis;
      if (gelisim >= 3) puan += 10;
      else if (gelisim >= 2) puan += 7;
      else if (gelisim >= 1) puan += 3;
    }
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 5️⃣ MANTIK (Logic) Puanı
  function hesaplaMantikSkoru() {
    // Sadece şekil ve parça trial'larına bak
    const mantikTrials = trials.filter(t => 
      t.bolum === "sekil" || t.bolum === "parca"
    );
    
    // Veri azsa orta puan dön
    if (mantikTrials.length < 5) {
      return 50;
    }
    
    if (mantikTrials.length === 0) return 50; // Varsayılan puan
    
    const mantikDogru = mantikTrials.filter(t => t.correct).length;
    const mantikDogruOrani = (mantikDogru / mantikTrials.length) * 100;
    
    // Ortalama tepki süresi
    const mantikTepkiler = mantikTrials
      .filter(t => t.correct && t.reaction_ms)
      .map(t => t.reaction_ms);
    const mantikOrtalamaTepki = mantikTepkiler.length > 0
      ? mantikTepkiler.reduce((a, b) => a + b, 0) / mantikTepkiler.length
      : 0;
    
    // Kategori hatası ve karıştırma oranı
    const mantikHatalar = mantikTrials.filter(t => 
      !t.correct && (t.hataTuru === "kategori_hatasi" || t.hataTuru === "karistirma")
    ).length;
    const mantikHataOrani = mantikTrials.length > 0
      ? (mantikHatalar / mantikTrials.length) * 100
      : 0;
    
    // Puan hesaplama
    let puan = 35; // Başlangıç puanı (düşürüldü)
    
    // Doğru oran (max +25, kötüye ceza)
    if (mantikDogruOrani >= 80) puan += 25;
    else if (mantikDogruOrani >= 60) puan += 15;
    else if (mantikDogruOrani >= 40) puan += 5;
    else if (mantikDogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük doğru oranı
    
    // Tepki süresi (max +10, yavaşsa ceza)
    if (mantikOrtalamaTepki > 0 && mantikOrtalamaTepki < 2500) {
      puan += 10;
    } else if (mantikOrtalamaTepki < 3500) {
      puan += 5;
    } else if (mantikOrtalamaTepki >= 4000) {
      puan -= 10; // Çok yavaş
    }
    
    // Hata oranı (düşükse +10, yüksekse -15)
    if (mantikHataOrani < 20) puan += 10;
    else if (mantikHataOrani < 40) puan += 5;
    else if (mantikHataOrani >= 50) puan -= 15; // Çok fazla hata
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 6️⃣ OKUMA-DİL (Reading-Language) Puanı
  function hesaplaOkumaDilSkoru() {
    // Renk ve gölge (nesne) trial'larına bak
    const okumaTrials = trials.filter(t => 
      t.bolum === "renk" || t.bolum === "golge"
    );
    
    // Veri azsa orta puan dön
    if (okumaTrials.length < 5) {
      return 50;
    }
    
    if (okumaTrials.length === 0) return 50; // Varsayılan puan
    
    const okumaDogru = okumaTrials.filter(t => t.correct).length;
    const okumaDogruOrani = (okumaDogru / okumaTrials.length) * 100;
    
    // Ortalama tepki süresi
    const okumaTepkiler = okumaTrials
      .filter(t => t.correct && t.reaction_ms)
      .map(t => t.reaction_ms);
    const okumaOrtalamaTepki = okumaTepkiler.length > 0
      ? okumaTepkiler.reduce((a, b) => a + b, 0) / okumaTepkiler.length
      : 0;
    
    // Puan hesaplama
    let puan = 30; // Başlangıç puanı (düşürüldü)
    
    // Doğru oran (max +20, düşürüldü, kötüye ceza)
    if (okumaDogruOrani >= 80) puan += 20;
    else if (okumaDogruOrani >= 60) puan += 15;
    else if (okumaDogruOrani >= 40) puan += 5;
    else if (okumaDogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük doğru oranı
    
    // Hızlı ve doğru (max +10, düşürüldü, yavaşsa ceza)
    if (okumaOrtalamaTepki > 0 && okumaOrtalamaTepki < 1200 && okumaDogruOrani >= 70) {
      puan += 10;
    } else if (okumaOrtalamaTepki < 1800 && okumaDogruOrani >= 60) {
      puan += 5;
    } else if (okumaOrtalamaTepki >= 3000) {
      puan -= 10; // Çok yavaş
    }
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // 7️⃣ SOSYAL BİLİŞ (Social Cognition) Puanı
  function hesaplaSosyalBilisSkoru() {
    // Sadece gölge trial'larına bak
    const golgeTrials = trials.filter(t => t.bolum === "golge");
    
    // Veri azsa orta puan dön
    if (golgeTrials.length < 5) {
      return 50;
    }
    
    if (golgeTrials.length === 0) return 50; // Varsayılan puan
    
    const golgeDogru = golgeTrials.filter(t => t.correct).length;
    const golgeDogruOrani = (golgeDogru / golgeTrials.length) * 100;
    
    // Ortalama tepki süresi
    const golgeTepkiler = golgeTrials
      .filter(t => t.correct && t.reaction_ms)
      .map(t => t.reaction_ms);
    const golgeOrtalamaTepki = golgeTepkiler.length > 0
      ? golgeTepkiler.reduce((a, b) => a + b, 0) / golgeTepkiler.length
      : 0;
    
    // Karıştırma hataları (figür-zemin zorluğu)
    const golgeKaristirma = golgeTrials.filter(t => 
      !t.correct && t.hataTuru === "karistirma"
    ).length;
    const golgeKaristirmaOrani = golgeTrials.length > 0
      ? (golgeKaristirma / golgeTrials.length) * 100
      : 0;
    
    // Puan hesaplama
    let puan = 35; // Başlangıç puanı (düşürüldü)
    
    // Doğru oran (max +25, düşürüldü, kötüye ceza)
    if (golgeDogruOrani >= 80) puan += 25;
    else if (golgeDogruOrani >= 60) puan += 15;
    else if (golgeDogruOrani >= 40) puan += 5;
    else if (golgeDogruOrani >= 20) puan -= 5;
    else puan -= 10; // Çok düşük doğru oranı
    
    // Hızlı tepki (max +8, düşürüldü)
    if (golgeOrtalamaTepki > 0 && golgeOrtalamaTepki < 1500) {
      puan += 8;
    } else if (golgeOrtalamaTepki < 2500) {
      puan += 4;
    } else if (golgeOrtalamaTepki >= 3000) {
      puan -= 5; // Çok yavaş
    }
    
    // Karıştırma hatası (düşükse +8, yüksekse -15)
    if (golgeKaristirmaOrani < 20) puan += 8;
    else if (golgeKaristirmaOrani < 40) puan += 4;
    else if (golgeKaristirmaOrani >= 50) puan -= 15; // Çok fazla karıştırma
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  // Tüm zihinsel alan puanlarını hesapla
  const zihinselAlanlar = {
    dikkat: hesaplaDikkatSkoru(),
    algisal_islemleme: hesaplaAlgisalIslemlemeSkoru(),
    hafiza: hesaplaHafizaSkoru(),
    yuruteci_islev: hesaplaYuruteciIslevSkoru(),
    mantik: hesaplaMantikSkoru(),
    okuma_dil: hesaplaOkumaDilSkoru(),
    sosyal_bilis: hesaplaSosyalBilisSkoru()
  };
  
  console.log("🧠 Zihinsel Alan Puanları:", zihinselAlanlar);
  
  // 9. En hızlı ve en yavaş tepki
  const dogruTepkiler = dogruTrials.map(t => t.reaction_ms).filter(ms => ms > 0);
  const enHizliTepki = dogruTepkiler.length > 0 ? Math.min(...dogruTepkiler) : null;
  const enYavasTepki = dogruTepkiler.length > 0 ? Math.max(...dogruTepkiler) : null;
  
  // 10. Başlangıç ve bitiş seviyesi
  const ilkTrial = trials[0];
  const sonTrial = trials[trials.length - 1];
  const baslangicSeviyesi = ilkTrial?.zorlukSeviyesi || (ilkTrial?.secenekSayisi === 2 ? "Kolay" : ilkTrial?.secenekSayisi === 3 ? "Orta" : ilkTrial?.secenekSayisi === 4 ? "Zor" : zorlukSeviyesi);
  const bitisSeviyesi = sonTrial?.zorlukSeviyesi || (sonTrial?.secenekSayisi === 2 ? "Kolay" : sonTrial?.secenekSayisi === 3 ? "Orta" : sonTrial?.secenekSayisi === 4 ? "Zor" : zorlukSeviyesi);
  
  // 11. Zorluk Adaptasyonu (zorlaştıkça performans düşüyor mu yükseliyor mu?)
  let zorlukAdaptasyonu = "stabil"; // "artti" | "azaldi" | "stabil"
  const baslangicSecenekSayisi = ilkTrial?.secenekSayisi || secenekSayisi;
  const bitisSecenekSayisi = sonTrial?.secenekSayisi || secenekSayisi;
  
  if (bitisSecenekSayisi > baslangicSecenekSayisi) {
    // Zorlaştı, performans nasıl?
    const ilkYariDogruOraniYukari = ilkYariDogruOrani;
    const sonYariDogruOraniYukari = sonYariDogruOrani;
    if (sonYariDogruOraniYukari >= ilkYariDogruOraniYukari + 5) {
      zorlukAdaptasyonu = "artti"; // Zorlaştıkça performans arttı
    } else if (sonYariDogruOraniYukari <= ilkYariDogruOraniYukari - 5) {
      zorlukAdaptasyonu = "azaldi"; // Zorlaştıkça performans düştü
    } else {
      zorlukAdaptasyonu = "stabil"; // Zorlaştı ama performans aynı kaldı
    }
  } else if (bitisSecenekSayisi < baslangicSecenekSayisi) {
    // Kolaylaştı, performans nasıl?
    const ilkYariDogruOraniAsagi = ilkYariDogruOrani;
    const sonYariDogruOraniAsagi = sonYariDogruOrani;
    if (sonYariDogruOraniAsagi >= ilkYariDogruOraniAsagi + 5) {
      zorlukAdaptasyonu = "artti"; // Kolaylaştı ve performans arttı
    } else if (sonYariDogruOraniAsagi <= ilkYariDogruOraniAsagi - 5) {
      zorlukAdaptasyonu = "azaldi"; // Kolaylaştı ama performans düştü (garip ama olabilir)
    } else {
      zorlukAdaptasyonu = "stabil";
    }
  } else {
    // Seviye aynı kaldı, performans trendine bak
    if (son5DogruOrani > ilk5DogruOrani + 10) {
      zorlukAdaptasyonu = "artti"; // Aynı seviyede performans arttı
    } else if (son5DogruOrani < ilk5DogruOrani - 10) {
      zorlukAdaptasyonu = "azaldi"; // Aynı seviyede performans düştü
    } else {
      zorlukAdaptasyonu = "stabil";
    }
  }
  
  // 12. Öğrenme Hızı Skoru (0-100)
  function hesaplaOgrenmeHiziSkoru() {
    let puan = 50; // Başlangıç puanı
    
    // İlk 5 vs son 5 doğru oranı farkı (+0-30)
    const dogruOraniFarki = son5DogruOrani - ilk5DogruOrani;
    if (dogruOraniFarki >= 30) puan += 30;
    else if (dogruOraniFarki >= 20) puan += 20;
    else if (dogruOraniFarki >= 10) puan += 10;
    else if (dogruOraniFarki < -10) puan -= 10; // Gerileme varsa düşür
    
    // Tepki hızı eğilimi (+0-20)
    if (tepkiEgilimi === "hizlanma") {
      puan += 20;
    } else if (tepkiEgilimi === "yavaslama") {
      puan -= 10;
    }
    
    // İlk yarı vs son yarı doğru oranı (+0-20)
    const yariFarki = sonYariDogruOrani - ilkYariDogruOrani;
    if (yariFarki >= 20) puan += 20;
    else if (yariFarki >= 10) puan += 10;
    else if (yariFarki < -10) puan -= 10;
    
    // Zorluk adaptasyonu (+0-10)
    if (zorlukAdaptasyonu === "artti") {
      puan += 10;
    } else if (zorlukAdaptasyonu === "azaldi") {
      puan -= 10;
    }
    
    // Toplam doğru oranı yüksekse bonus (+0-10)
    const genelDogruOrani = toplamSoruSayisi > 0 ? (toplamDogru / toplamSoruSayisi) * 100 : 0;
    if (genelDogruOrani >= 70 && dogruOraniFarki > 0) {
      puan += 10; // Hem yüksek performans hem gelişim
    }
    
    return Math.max(0, Math.min(100, Math.round(puan)));
  }
  
  const ogrenmeHiziSkoru = hesaplaOgrenmeHiziSkoru();
  
  // Analiz sonuçlarını console'a yazdır
  console.log("📊 Oyun Sonu Analizi:", {
    toplamSoruSayisi,
    toplamDogru,
    toplamYanlis,
    ortalamaTepkiSuresi,
    toplamOyunSuresi,
    zorlukSeviyesi,
    hataTurleriDetay,
    baskınHataTuru,
    ilk5OrtalamaTepki,
    son5OrtalamaTepki,
    tepkiEgilimi,
    ilkYariDogruOrani,
    sonYariDogruOrani,
    ilk5DogruOrani,
    son5DogruOrani,
    enHizliTepki,
    enYavasTepki,
    baslangicSeviyesi,
    bitisSeviyesi,
    zorlukAdaptasyonu,
    ogrenmeHiziSkoru,
    bolumSkorlari,
    oyunBaslangicZamani,
    oyunBitisZamani
  });
  
  // Engine'in timeElapsed değerini güncelle (eğer yanlışsa)
  if (engine && toplamOyunSuresi > 0) {
    engine.timeElapsed = toplamOyunSuresi;
    console.log("✅ Engine timeElapsed güncellendi:", engine.timeElapsed);
  }
  
  // Bu veriler zaten engine.trials içinde kaydediliyor
  // GameEngine'in buildResultPayload fonksiyonu bu verileri kullanacak
  // Ancak oyunBaslangicZamani'nin her trial'a eklenmesi gerekiyor (zaten yapılıyor)
  
  // Bu verileri engine'e ekstra data olarak ekle
  // Engine'in buildResultPayload fonksiyonu bu verileri kullanacak
  if (engine) {
    // Engine'in oyunDetaylari'na bu verileri ekle
    engine.oyunDetaylari = {
      toplamSoruSayisi,
      toplamDogru,
      toplamYanlis,
      ortalamaTepkiSuresi,
      toplamOyunSuresi,
      zorlukSeviyesi,
      hataTurleriDetay,
      baskınHataTuru,
      ilk5OrtalamaTepki,
      son5OrtalamaTepki,
      tepkiEgilimi,
      ilkYariDogruOrani,
      sonYariDogruOrani,
      ilk5DogruOrani,
      son5DogruOrani,
      enHizliTepki,
      enYavasTepki,
      baslangicSeviyesi,
      bitisSeviyesi,
      zorlukAdaptasyonu,
      ogrenmeHiziSkoru,
      bolumSkorlari,
      oyunBaslangicZamani,
      oyunBitisZamani,
      zihinselAlanlar // 7 zihinsel alan puanları
    };
    console.log("✅ Engine'e oyunDetaylari eklendi:", engine.oyunDetaylari);
  }
  
  return {
    toplamSoruSayisi,
    toplamDogru,
    toplamYanlis,
    ortalamaTepkiSuresi,
    toplamOyunSuresi,
    zorlukSeviyesi,
    hataTurleriDetay,
    baskınHataTuru,
    ilk5OrtalamaTepki,
    son5OrtalamaTepki,
    tepkiEgilimi,
    ilkYariDogruOrani,
    sonYariDogruOrani,
    ilk5DogruOrani,
    son5DogruOrani,
    enHizliTepki,
    enYavasTepki,
    baslangicSeviyesi,
    bitisSeviyesi,
    zorlukAdaptasyonu,
    ogrenmeHiziSkoru,
    bolumSkorlari,
    oyunBaslangicZamani,
    oyunBitisZamani
  };
}

// ==========================================================
// Dışarıya endGame aç
// ==========================================================
window.endGame = () => {
  oyunSonuAnaliziniHazirla();
  if (engine) {
    engine.endGame();
  }
};
