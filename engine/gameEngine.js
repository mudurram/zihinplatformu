// ======================================================================
// 📌 gameEngine.js — Zihin Platformu Oyun Motoru (Final v7.1 Ultra Stabil)
// ======================================================================
//
// Ortak oyun motoru:
//   • süre kontrolü
//   • trial kaydı
//   • tepki süresi hesaplama
//   • trial etiketleme
//   • ham bileşen çıkarma
//   • 0–100 normalize bileşen üretimi
//   • localStorage geçmişi yazma
//   • Firestore'a sonuç gönderme
//   • sonuç ekranına yönlendirme
//
// Tüm oyunlarla %100 uyumludur.
// ======================================================================

import { labelTrials } from "./trialLabeler.js";
import { calculateComponents } from "./componentCalculator.js";
import { normalizeComponents } from "./normalizer.js";
import { saveGameResult } from "../data/gameResultService.js";
import { GLOBAL } from "../platform/globalConfig.js";

console.log("gameEngine.js yüklendi ✔ v7.1");


// ======================================================================
// 🎮 GAME ENGINE SINIFI
// ======================================================================
export class GameEngine {
  constructor({ gameName, timeLimit = 30, gameMeta = null }) {
    this.gameName = gameName;
    this.timeLimit = timeLimit;
    this.timeElapsed = 0;

    this.score = 0;
    this.mistakes = 0;

    this.trials = [];
    this.timeLeft = timeLimit;

    this.timerInterval = null;
    this.updateUI = null;

    this.gameFinished = false; // Çift kayıt + çift yönlendirme koruması

    // gameMeta parametre olarak gelirse kullan, yoksa resolveGameMeta ile bul
    this.gameMeta = gameMeta || resolveGameMeta(gameName);
  }

  // ====================================================================
  // ▶️ Oyunu Başlat
  // ====================================================================
  start(updateUI) {
    this.updateUI = updateUI;
    this.startTimer();
  }


  // ====================================================================
  // 📝 Trial Kaydet
  // ====================================================================
  recordTrial({ correct, reaction_ms, ...extraData }) {
    if (this.gameFinished) return; // oyun bitmişse işleme alma

    const trial = { correct: !!correct, reaction_ms, ...extraData };
    this.trials.push(trial);

    if (correct) this.score++;
    else this.mistakes++;

    if (this.updateUI)
      this.updateUI(this.score, this.mistakes, this.timeLeft);
  }


  // ====================================================================
  // ⏱ Zamanlayıcı
  // ====================================================================
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.timeElapsed = Math.max(0, this.timeLimit - this.timeLeft);

      if (this.updateUI)
        this.updateUI(this.score, this.mistakes, this.timeLeft);

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        // Timer bitti, endGame() çağır
        // endGame() içinde gameFinished kontrolü var, bu yüzden burada set etmiyoruz
        // endGame() zaten gameFinished = true yapacak ve callback'i çağıracak
        console.log("⏰ Süre bitti, endGame() çağrılıyor...");
        // endGame() async bir fonksiyon, promise olarak handle et
        this.endGame().catch(err => {
          console.error("❌ endGame() hatası:", err);
          // Hata durumunda da yönlendirme yap
          const currentPath = window.location.pathname;
          let path = "../../platform/sonuc.html";
          if (currentPath.includes("/oyunlar/") || currentPath.includes("\\oyunlar\\")) {
            path = "../../platform/sonuc.html";
          }
          console.log("➡ Hata durumunda sonuç ekranına yönlendiriliyor:", path);
          window.location.href = path;
        });
      }
    }, 1000);
  }
  
  // ====================================================================
  // 📞 Oyun bitiş callback'i ayarla
  // ====================================================================
  setOnEndCallback(callback) {
    this.onEndCallback = callback;
  }


  // ====================================================================
  // 🔚 OYUN BİTİŞİ
  // ====================================================================
  async endGame() {
    if (this.gameFinished) {
      console.warn("⚠ Oyun zaten bitmiş, endGame() tekrar çağrıldı");
      return; // çift kaydı önle
    }
    
    console.log("🎯 endGame() başlatılıyor...");
    this.gameFinished = true;

    clearInterval(this.timerInterval);
    
    try {
      // Oyun bitiş callback'ini çağır (eğer varsa)
      // NOT: Callback'i await etmiyoruz çünkü yönlendirme için beklememize gerek yok
      // Callback sadece analiz hazırlıyor, yönlendirme endGame() içinde yapılıyor
      if (this.onEndCallback && typeof this.onEndCallback === 'function') {
        console.log("📞 Oyun bitiş callback'i çağrılıyor...");
        try {
          this.onEndCallback();
          console.log("✅ Oyun bitiş callback'i tamamlandı");
        } catch (err) {
          console.error("❌ Oyun bitiş callback hatası:", err);
          // Callback hatası oyun sonunu engellemez, devam et
        }
      } else {
        console.log("ℹ️ Oyun bitiş callback'i yok");
      }

      // ------------------------------------------------------------
      // 1) Trial Etiketleme (reaction / inhibition / sustained)
      // ------------------------------------------------------------
      const labeledTrials = labelTrials(this.trials);

    // ------------------------------------------------------------
    // 2) Ham bileşen skorları
    // ------------------------------------------------------------
    const rawComponents = calculateComponents(labeledTrials);

    // ------------------------------------------------------------
    // 3) Normalize edilmiş 0–100 skorlar
    // ------------------------------------------------------------
    const normalized = normalizeComponents(rawComponents);

    // ------------------------------------------------------------
    // 4) TAM SONUÇ OBJESİ (platform standardı)
    // ------------------------------------------------------------
    console.log("📊 Sonuç payload oluşturuluyor:", {
      gameName: this.gameName,
      score: this.score,
      mistakes: this.mistakes,
      timeLimit: this.timeLimit,
      timeElapsed: this.timeElapsed,
      trialSayisi: this.trials.length,
      labeledTrialSayisi: labeledTrials.length
    });
    
    const fullResult = buildResultPayload({
      gameName: this.gameName,
      meta: this.gameMeta,
      score: this.score,
      mistakes: this.mistakes,
      timeLimit: this.timeLimit,
      timeElapsed: this.timeElapsed,
      labeledTrials,
      rawComponents,
      normalized,
      oyunDetaylari: this.oyunDetaylari || {}
    });
    
    console.log("✅ Sonuç payload oluşturuldu:", {
      oyun: fullResult.oyun,
      dogru: fullResult.dogru,
      yanlis: fullResult.yanlis,
      temel_skor: fullResult.temel_skor,
      coklu_alan: Object.keys(fullResult.coklu_alan || {}).length,
      oyun_ozel: Object.keys(fullResult.oyun_ozel || {}).length
    });

    // ------------------------------------------------------------
    // 5) LOCALSTORAGE KAYIT
    // ------------------------------------------------------------
    try {
      let history = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
      history.push(fullResult);

      localStorage.setItem("oyunGecmisi", JSON.stringify(history));
      localStorage.setItem("sonOyun", this.gameName);
      localStorage.setItem("sonOyunSonuc", JSON.stringify(fullResult));
      
      console.log("✅ LocalStorage'a kaydedildi:", {
        oyun: this.gameName,
        dogru: this.score,
        yanlis: this.mistakes,
        trialSayisi: this.trials.length
      });
    } catch (err) {
      console.error("❌ LocalStorage kayıt hatası:", err);
    }

    // ------------------------------------------------------------
    // 6) FIRESTORE (opsiyonel)
    // ------------------------------------------------------------
    try {
      await saveGameResult(fullResult);
    } catch (err) {
      console.error("❌ Firestore kayıt hatası (devam ediliyor):", err);
      // Firestore hatası oyun sonunu engellemez, devam et
    }

    // ------------------------------------------------------------
    // 7) SONUÇ EKRANINA YÖNLENDİR (GLOBAL)
    // ------------------------------------------------------------
    // Oyun dosyasının konumuna göre doğru yolu hesapla
    const currentPath = window.location.pathname;
    let path = "../../platform/sonuc.html";
    
    // Eğer oyunlar klasöründen çağrılıyorsa
    if (currentPath.includes("/oyunlar/") || currentPath.includes("\\oyunlar\\")) {
      path = "../../platform/sonuc.html";
    } else {
      // Diğer durumlar için
      path = GLOBAL?.PLATFORM 
        ? GLOBAL.PLATFORM + "sonuc.html" 
        : "../../platform/sonuc.html";
    }

    console.log("➡ Sonuç ekranına yönlendiriliyor:", path);
    console.log("📊 Oyun sonu verileri hazır, yönlendirme yapılıyor...");

    // Yönlendirmeyi yap (try-catch ile güvenli hale getir)
    try {
      // Önce mevcut sayfanın yolunu kontrol et
      const currentPath = window.location.pathname;
      console.log("📍 Mevcut sayfa:", currentPath);
      console.log("📍 Hedef sayfa:", path);
      
      // Yönlendirmeyi yap
      window.location.href = path;
      
      // Yönlendirme başarılı olmazsa 500ms sonra tekrar dene
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          console.warn("⚠ İlk yönlendirme başarısız, replace() deneniyor...");
          try {
            window.location.replace(path);
          } catch (err2) {
            console.error("❌ window.location.replace() da başarısız:", err2);
            // Son çare: setTimeout ile dene
            setTimeout(() => {
              try {
                window.location.href = path;
              } catch (err3) {
                console.error("❌ Tüm yönlendirme yöntemleri başarısız:", err3);
              }
            }, 200);
          }
        }
      }, 500);
      
    } catch (err) {
      console.error("❌ Yönlendirme hatası:", err);
      // Alternatif yönlendirme yöntemi
      try {
        window.location.replace(path);
      } catch (err2) {
        console.error("❌ window.location.replace() da başarısız:", err2);
        // Son çare: setTimeout ile dene
        setTimeout(() => {
          try {
            window.location.href = path;
          } catch (err3) {
            console.error("❌ Tüm yönlendirme yöntemleri başarısız:", err3);
          }
        }, 200);
      }
    }
    } catch (err) {
      console.error("❌ endGame() içinde beklenmeyen hata:", err);
      // Hata durumunda da yönlendirme yap
      const currentPath = window.location.pathname;
      let path = "../../platform/sonuc.html";
      if (currentPath.includes("/oyunlar/") || currentPath.includes("\\oyunlar\\")) {
        path = "../../platform/sonuc.html";
      }
      console.log("➡ Hata durumunda sonuç ekranına yönlendiriliyor:", path);
      try {
        window.location.href = path;
      } catch (err2) {
        window.location.replace(path);
      }
    }
  }
}

function resolveGameMeta(gameName) {
  const map = GLOBAL.GAME_MAP || {};
  if (map[gameName]) return map[gameName];

  const aktif = localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_OYUN);
  if (aktif && map[aktif]) return map[aktif];

  return null;
}

function cloneSchema() {
  try {
    return structuredClone(GLOBAL.SONUC_SEMASI);
  } catch {
    return JSON.parse(JSON.stringify(GLOBAL.SONUC_SEMASI || {}));
  }
}

function buildResultPayload({
  gameName,
  meta,
  score,
  mistakes,
  timeLimit,
  timeElapsed,
  labeledTrials,
  rawComponents,
  normalized,
  oyunDetaylari = {}
}) {
  const base = cloneSchema();
  const alanId =
    meta?.alan ||
    localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALAN) ||
    "";
  const altId =
    meta?.altBeceri ||
    localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALT_BECERI) ||
    "";

  const accuracy = calcAccuracy(score, mistakes);
  const learningVelocity = calcLearningVelocity(score, mistakes, timeLimit, timeElapsed);
  const reactionAvg = rawComponents.reaction_speed || 0;
  
    // Eşleme oyunu için detaylı analiz verileri
    const detayliAnaliz = hesaplaDetayliAnaliz(labeledTrials, timeElapsed || timeLimit);
    
    // En hızlı ve en yavaş tepki hesaplama
    const dogruTrials = labeledTrials.filter(t => t.correct && typeof t.reaction_ms === "number" && t.reaction_ms > 0);
    const enHizliTepki = dogruTrials.length > 0 ? Math.min(...dogruTrials.map(t => t.reaction_ms)) : null;
    const enYavasTepki = dogruTrials.length > 0 ? Math.max(...dogruTrials.map(t => t.reaction_ms)) : null;
    
    // Başlangıç ve bitiş seviyesi
    const ilkTrial = labeledTrials[0];
    const sonTrial = labeledTrials[labeledTrials.length - 1];
    const baslangicSeviyesi = oyunDetaylari.baslangicSeviyesi || ilkTrial?.zorlukSeviyesi || (ilkTrial?.secenekSayisi === 2 ? "Kolay" : ilkTrial?.secenekSayisi === 3 ? "Orta" : ilkTrial?.secenekSayisi === 4 ? "Zor" : "Orta");
    const bitisSeviyesi = oyunDetaylari.bitisSeviyesi || sonTrial?.zorlukSeviyesi || (sonTrial?.secenekSayisi === 2 ? "Kolay" : sonTrial?.secenekSayisi === 3 ? "Orta" : sonTrial?.secenekSayisi === 4 ? "Zor" : "Orta");
    
    // Zorluk adaptasyonu
    let zorlukAdaptasyonu = "➖ Sabit";
    if (baslangicSeviyesi !== bitisSeviyesi) {
      const seviyeMap = { "Kolay": 1, "Orta": 2, "Zor": 3 };
      const baslangicDeger = seviyeMap[baslangicSeviyesi] || 2;
      const bitisDeger = seviyeMap[bitisSeviyesi] || 2;
      if (bitisDeger > baslangicDeger) {
        zorlukAdaptasyonu = "📈 Zorluk arttı (Gelişim var)";
      } else if (bitisDeger < baslangicDeger) {
        zorlukAdaptasyonu = "📉 Zorluk azaldı";
      }
    }
    
    // Öğrenme hızı skoru (0-100) - detaylı hesaplama
    let ogrenmeHiziSkoru = learningVelocity;
    if (detayliAnaliz.tepkiEgilimi && detayliAnaliz.ilkYariDogruOrani && detayliAnaliz.sonYariDogruOrani) {
      const hizArtisi = detayliAnaliz.tepkiEgilimi === "hizlanma" ? 20 : detayliAnaliz.tepkiEgilimi === "yavaslama" ? -20 : 0;
      const dogruArtisi = detayliAnaliz.sonYariDogruOrani > detayliAnaliz.ilkYariDogruOrani ? 20 : detayliAnaliz.sonYariDogruOrani < detayliAnaliz.ilkYariDogruOrani ? -20 : 0;
      ogrenmeHiziSkoru = Math.max(0, Math.min(100, learningVelocity + hizArtisi + dogruArtisi));
    }
    
    const temelSkor = {
      dogru: score,
      yanlis: mistakes,
      sure: timeElapsed || timeLimit, // Geçen süre (saniye)
      ortalamaTepki: reactionAvg, // ms cinsinden ortalama tepki süresi
      reaction_avg: reactionAvg, // Geriye uyumluluk için
      ogrenmeHizi: ogrenmeHiziSkoru, // 0-100 arası öğrenme hızı (güncellenmiş)
      learning_velocity: ogrenmeHiziSkoru, // Geriye uyumluluk için
      // Detaylı analiz verileri
      ...detayliAnaliz,
      // Ek veriler
      enHizliTepki: oyunDetaylari.enHizliTepki || enHizliTepki,
      enYavasTepki: oyunDetaylari.enYavasTepki || enYavasTepki,
      baslangicSeviyesi: baslangicSeviyesi,
      bitisSeviyesi: bitisSeviyesi,
      zorlukAdaptasyonu: zorlukAdaptasyonu,
      ilk5DogruOrani: oyunDetaylari.ilk5DogruOrani || detayliAnaliz.ilk5DogruOrani || 0,
      son5DogruOrani: oyunDetaylari.son5DogruOrani || detayliAnaliz.son5DogruOrani || 0,
      // Hata türleri (geriye uyumluluk için ayrıca ekle)
      hataTurleri: detayliAnaliz.hataTurleriDetay || {},
      // Hata türleri detay (yeni format)
      hataTurleriDetay: detayliAnaliz.hataTurleriDetay || {},
      // Baskın hata türü
      baskınHataTuru: oyunDetaylari.baskınHataTuru || null
    };
  
  console.log("📊 temel_skor oluşturuldu:", {
    dogru: temelSkor.dogru,
    yanlis: temelSkor.yanlis,
    sure: temelSkor.sure,
    ortalamaTepki: temelSkor.ortalamaTepki,
    ogrenmeHizi: temelSkor.ogrenmeHizi,
    toplamSoruSayisi: temelSkor.toplamSoruSayisi,
    hataTurleriDetay: temelSkor.hataTurleriDetay
  });

    const fullResult = {
      ...base,
      oyun: gameName,
      alan: alanId,
      altBeceri: altId,
      dogru: score,
      yanlis: mistakes,
      sure: timeLimit,
      tarih: new Date().toISOString(),
      trials: labeledTrials,
      skorlar: normalized,
      temel_skor: temelSkor,
      coklu_alan: buildMultiAreaScores(meta, accuracy, oyunDetaylari),
      oyun_ozel: buildGameSpecificMetrics(meta, { accuracy, rawComponents, normalized, labeledTrials }),
      hata_turleri: meta?.sonucMetrics?.hata_turleri || [],
      beceriler: meta?.performans || [],
      moduller: meta?.moduller || [],
    trendMeta: {
      timeLimit,
      timeElapsed,
      totalTrials: labeledTrials.length,
      // Eşleme oyunu için ek trend verileri
      ilk5OrtalamaTepki: temelSkor.ilk5OrtalamaTepki,
      son5OrtalamaTepki: temelSkor.son5OrtalamaTepki,
      tepkiEgilimi: temelSkor.tepkiEgilimi,
      ilkYariDogruOrani: temelSkor.ilkYariDogruOrani,
      sonYariDogruOrani: temelSkor.sonYariDogruOrani
    },
    wpm: null,
    // Eşleme oyunu için detaylı veriler
    oyunDetaylari: {
      toplamSoruSayisi: temelSkor.toplamSoruSayisi || labeledTrials.length,
      oyunBaslangicZamani: temelSkor.oyunBaslangicZamani,
      oyunBitisZamani: temelSkor.oyunBitisZamani,
      toplamOyunSuresi: temelSkor.toplamOyunSuresi || timeElapsed || timeLimit,
      hataTurleriDetay: temelSkor.hataTurleriDetay || {},
      baskınHataTuru: temelSkor.baskınHataTuru,
      ilk5OrtalamaTepki: temelSkor.ilk5OrtalamaTepki,
      son5OrtalamaTepki: temelSkor.son5OrtalamaTepki,
      tepkiEgilimi: temelSkor.tepkiEgilimi,
      ilkYariDogruOrani: temelSkor.ilkYariDogruOrani,
      sonYariDogruOrani: temelSkor.sonYariDogruOrani,
      ilk5DogruOrani: temelSkor.ilk5DogruOrani,
      son5DogruOrani: temelSkor.son5DogruOrani,
      enHizliTepki: temelSkor.enHizliTepki,
      enYavasTepki: temelSkor.enYavasTepki,
      baslangicSeviyesi: temelSkor.baslangicSeviyesi,
      bitisSeviyesi: temelSkor.bitisSeviyesi,
      zorlukAdaptasyonu: temelSkor.zorlukAdaptasyonu || oyunDetaylari.zorlukAdaptasyonu || "stabil",
      ogrenmeHiziSkoru: oyunDetaylari.ogrenmeHiziSkoru || 50,
      bolumSkorlari: oyunDetaylari.bolumSkorlari || {},
      zihinselAlanlar: oyunDetaylari.zihinselAlanlar || {}, // 7 zihinsel alan puanları
      ozelPerformansAlanlari: oyunDetaylari.ozelPerformansAlanlari || {}, // 8 özel performans alanı
      gunlukHayatKarsiligi: oyunDetaylari.gunlukHayatKarsiligi || {} // 6 başlık günlük hayat karşılığı
    }
  };

  return fullResult;
}

function calcAccuracy(score, mistakes) {
  const total = Math.max(1, score + mistakes);
  return Math.max(0, Math.min(100, (score / total) * 100));
}

function calcLearningVelocity(score, mistakes, timeLimit, timeElapsed) {
  const elapsed = Math.max(1, timeElapsed || timeLimit);
  const netScore = Math.max(0, score - mistakes * 0.5);
  const velocity = (netScore / elapsed) * 60; // dakikada skor
  return Math.round(Math.max(0, Math.min(100, velocity)));
}

function buildMultiAreaScores(meta, accuracyPercent, oyunDetaylari = {}) {
  // Önce oyunDetaylari.zihinselAlanlar'dan veri al (eşleme oyunu için)
  const zihinselAlanlar = oyunDetaylari?.zihinselAlanlar || {};
  
  // zihinselAlanlar key'lerini BRAIN_AREAS key'lerine map et
  const zihinselAlanMap = {
    "dikkat": "attention",
    "algisal_islemleme": "perception",
    "hafiza": "memory",
    "yuruteci_islev": "executive",
    "mantik": "logic",
    "okuma_dil": "literacy",
    "sosyal_bilis": "social"
  };
  
  // Eğer zihinselAlanlar varsa, onu kullan
  if (Object.keys(zihinselAlanlar).length > 0) {
    const result = {};
    Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
      const brainAreaKey = zihinselAlanMap[key];
      if (brainAreaKey) {
        result[brainAreaKey] = Math.round(skor);
      }
    });
    console.log("✅ buildMultiAreaScores: zihinselAlanlar kullanıldı:", result);
    return result;
  }
  
  // Eğer zihinselAlanlar yoksa, eski yöntemle hesapla
  const weights = meta?.sonucMetrics?.coklu_alan || {};
  const result = {};
  
  // Eğer ağırlıklar tanımlıysa kullan
  if (Object.keys(weights).length > 0) {
    Object.entries(weights).forEach(([areaId, weight]) => {
      const base = typeof weight === "number" ? weight : 1;
      result[areaId] = Math.round(
        Math.max(0, Math.min(100, accuracyPercent * base * 100))
      );
    });
  } else {
    // Ağırlıklar yoksa modüllerden hesapla
    const moduller = meta?.moduller || [];
    moduller.forEach(modul => {
      // Modül adlarını BRAIN_AREAS key'lerine çevir
      let brainAreaKey = modul;
      const modulMap = {
        "attention": "attention",
        "dikkat": "attention",
        "perception": "perception",
        "algisal_islemleme": "perception",
        "algisal": "perception",
        "executive": "executive",
        "yuruteci_islev": "executive",
        "yuruteci": "executive",
        "logic": "logic",
        "mantik": "logic",
        "mantiksal": "logic",
        "memory": "memory",
        "hafiza": "memory",
        "literacy": "literacy",
        "okuma": "literacy",
        "okuma_dil": "literacy",
        "dyslexia": "dyslexia",
        "disleksi": "dyslexia",
        "writing": "writing",
        "yazi": "writing",
        "math": "math",
        "matematik": "math",
        "emotional": "emotional",
        "duygusal": "emotional",
        "social": "social",
        "sosyal": "social",
        "sosyal_bilis": "social",
        "comprehension": "comprehension",
        "anlama": "comprehension"
      };
      brainAreaKey = modulMap[modul] || modul;
      result[brainAreaKey] = Math.round(accuracyPercent * 100);
    });
  }
  
  return result;
}

function buildGameSpecificMetrics(meta, { accuracy, rawComponents, normalized, labeledTrials = [] }) {
  const metrics = {};
  const metaList = meta?.sonucMetrics?.oyun_ozel || [];
  
  // Eğer metaList yoksa performansKeys'den oluştur
  const keysToProcess = Array.isArray(metaList) && metaList.length > 0 
    ? metaList 
    : (meta?.performansKeys || []);
  
  keysToProcess.forEach(key => {
    // Bölüm bazlı skorlar için özel hesaplama
    if (key === "renk_esleme_skor" || key === "sekil_esleme_skor" || 
        key === "golge_esleme_skor" || key === "parca_butun_skor") {
      const bolumMap = {
        "renk_esleme_skor": "renk",
        "sekil_esleme_skor": "sekil",
        "golge_esleme_skor": "golge",
        "parca_butun_skor": "parca"
      };
      const bolum = bolumMap[key];
      const bolumTrials = labeledTrials.filter(t => t.bolum === bolum);
      const bolumDogru = bolumTrials.filter(t => t.correct).length;
      metrics[key] = bolumTrials.length > 0 
        ? Math.round((bolumDogru / bolumTrials.length) * 100) 
        : 0;
    } else if (key === "gorsel_tamamlama") {
      // Parça-bütün skorunu kullan
      const parcaTrials = labeledTrials.filter(t => t.bolum === "parca");
      const parcaDogru = parcaTrials.filter(t => t.correct).length;
      metrics[key] = parcaTrials.length > 0 
        ? Math.round((parcaDogru / parcaTrials.length) * 100) 
        : 0;
    } else {
      metrics[key] = deriveMetricValue(key, { accuracy, rawComponents, normalized });
    }
  });
  
  return metrics;
}

function deriveMetricValue(key = "", { accuracy, rawComponents, normalized }) {
  const lower = key.toLowerCase();

  if (lower.includes("accuracy") || lower.includes("dogru") || lower.includes("score")) {
    return Math.round(accuracy);
  }

  if (lower.includes("reaction") || lower.includes("time")) {
    return Math.round(rawComponents.reaction_speed || 0);
  }

  if (lower.includes("speed") || lower.includes("processing")) {
    return normalized.reaction_speed || 0;
  }

  if (lower.includes("memory") || lower.includes("sequence")) {
    return normalized.sustained_attention || 0;
  }

  if (lower.includes("inhibition") || lower.includes("control")) {
    return normalized.inhibitory_control || 0;
  }

  return normalized.sustained_attention || 0;
}

// ====================================================================
// 📊 DETAYLI ANALİZ HESAPLAMA (Eşleme Oyunu için)
// ====================================================================
function hesaplaDetayliAnaliz(trials, oyunSuresi) {
  if (!Array.isArray(trials) || trials.length === 0) {
    return {
      ilk5OrtalamaTepki: null,
      son5OrtalamaTepki: null,
      tepkiEgilimi: "stabil",
      ilkYariDogruOrani: 0,
      sonYariDogruOrani: 0,
      toplamSoruSayisi: 0,
      oyunBaslangicZamani: null,
      oyunBitisZamani: null,
      toplamOyunSuresi: oyunSuresi,
      hataTurleriDetay: {}
    };
  }
  
  const totalTrials = trials.length;
  const ilk5 = trials.slice(0, Math.min(5, totalTrials));
  const son5 = trials.slice(Math.max(0, totalTrials - 5));
  
  // İlk 5 ve son 5 ortalama tepki süresi
  const ilk5Tepkiler = ilk5
    .filter(t => typeof t.reaction_ms === "number" && t.reaction_ms > 0)
    .map(t => t.reaction_ms);
  const son5Tepkiler = son5
    .filter(t => typeof t.reaction_ms === "number" && t.reaction_ms > 0)
    .map(t => t.reaction_ms);
  
  const ilk5Ortalama = ilk5Tepkiler.length > 0 
    ? Math.round(ilk5Tepkiler.reduce((a, b) => a + b, 0) / ilk5Tepkiler.length)
    : null;
  const son5Ortalama = son5Tepkiler.length > 0
    ? Math.round(son5Tepkiler.reduce((a, b) => a + b, 0) / son5Tepkiler.length)
    : null;
  
  // Tepki eğilimi
  let tepkiEgilimi = "stabil";
  if (ilk5Ortalama && son5Ortalama) {
    const fark = son5Ortalama - ilk5Ortalama;
    if (fark < -100) tepkiEgilimi = "hizlanma";
    else if (fark > 100) tepkiEgilimi = "yavaslama";
  }
  
  // İlk yarı ve son yarı doğru oranı
  const yariNokta = Math.floor(totalTrials / 2);
  const ilkYari = trials.slice(0, yariNokta);
  const sonYari = trials.slice(yariNokta);
  
  const ilkYariDogru = ilkYari.filter(t => t.correct).length;
  const sonYariDogru = sonYari.filter(t => t.correct).length;
  const ilkYariDogruOrani = ilkYari.length > 0 ? Math.round((ilkYariDogru / ilkYari.length) * 100) : 0;
  const sonYariDogruOrani = sonYari.length > 0 ? Math.round((sonYariDogru / sonYari.length) * 100) : 0;
  
  // Hata türleri detaylı analizi
  const hataTurleriDetay = {
    impulsivite: 0,
    dikkatsizlik: 0,
    karistirma: 0,
    kategori_hatasi: 0,
    toplam: 0
  };
  
  trials.forEach(trial => {
    if (!trial.correct && trial.hataTuru) {
      if (hataTurleriDetay.hasOwnProperty(trial.hataTuru)) {
        hataTurleriDetay[trial.hataTuru]++;
      }
      hataTurleriDetay.toplam++;
    }
  });
  
  // Oyun zaman bilgileri
  const ilkTrial = trials[0];
  const sonTrial = trials[trials.length - 1];
  let oyunBaslangicZamani = ilkTrial?.oyunBaslangicZamani || null;
  const oyunBitisZamani = sonTrial?.cevapZamani || null;
  
  // Eğer oyunBaslangicZamani yoksa veya 0 ise, ilk trial'ın soruBaslamaZamani'ndan hesapla
  if (!oyunBaslangicZamani || oyunBaslangicZamani === 0) {
    if (ilkTrial?.soruBaslamaZamani) {
      oyunBaslangicZamani = ilkTrial.soruBaslamaZamani;
      console.log("⚠️ oyunBaslangicZamani ilk trial'dan alındı:", oyunBaslangicZamani);
    }
  }
  
  return {
    ilk5OrtalamaTepki: ilk5Ortalama,
    son5OrtalamaTepki: son5Ortalama,
    tepkiEgilimi: tepkiEgilimi,
    ilkYariDogruOrani: ilkYariDogruOrani,
    sonYariDogruOrani: sonYariDogruOrani,
    toplamSoruSayisi: totalTrials,
    oyunBaslangicZamani: oyunBaslangicZamani,
    oyunBitisZamani: oyunBitisZamani,
    toplamOyunSuresi: oyunSuresi,
    hataTurleriDetay: hataTurleriDetay
  };
}