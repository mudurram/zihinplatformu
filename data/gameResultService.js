// =====================================================================
// 📌 gameResultService.js — Zihin Platformu v8.0 (Yeni Şema Desteği)
// Tüm oyunların sonuç kayıt işlemlerini tek merkezden yönetir.
// Yeni şema: temel_skor, coklu_alan, oyun_ozel, trendMeta, alan/altBeceri
// =====================================================================

import { db, auth } from "./firebaseConfig.js";
import { GLOBAL, ROLES } from "../platform/globalConfig.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("gameResultService.js yüklendi ✔ v8.0");

// =====================================================================
// 🟦 1) Ortak Sonuç Kayıt Fonksiyonu (Yeni Şema Desteği)
// =====================================================================
export async function saveGameResult(sonuc) {
  try {
    if (!auth || !db) {
      console.error("❌ Firebase başlatılamadı! → sonuç kaydedilemez.");
      return false;
    }

    const user = auth.currentUser;

    if (!user) {
      console.error("❌ Kullanıcı giriş yapmamış! → sonuç kaydedilemez.");
      return false;
    }

    const role = localStorage.getItem("role");
    const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
    const teacherID = localStorage.getItem("teacherID");

    // Yeni şema: Seçilen alan/altBeceri bilgileri
    const secilenAlan = localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALAN) || null;
    const secilenAltBeceri = localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_ALT_BECERI) || null;
    const secilenOyunKodu = localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_OYUN) || sonuc.oyun || null;

    // Oyun meta bilgisi (GAME_MAP'ten)
    const oyunMeta = GLOBAL.GAME_MAP?.[secilenOyunKodu] || {};

    // Kurum ve öğretmen bilgileri
    let institutionID = null;
    let teacherIDs = [];

    try {
      const profileRef = doc(db, GLOBAL.FIRESTORE.PROFILES, user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        institutionID = profileData.institution?.id || null;
        // Aktif öğretmenleri al
        if (profileData.teachers) {
          teacherIDs = Object.keys(profileData.teachers).filter(
            tid => profileData.teachers[tid] === "kabul"
          );
        }
      }
    } catch (err) {
      console.warn("⚠ Profil bilgisi alınamadı:", err);
    }

    let hedefRef = null;

    // =================================================================
    // 🟩 2) Öğrenci — kendi profilinin altına kaydeder
    // Firestore: profiles / UID / oyunSonuclari
    // =================================================================
    if (role === ROLES.OGRENCI) {
      hedefRef = collection(
        db,
        GLOBAL.FIRESTORE.PROFILES,
        user.uid,
        "oyunSonuclari"
      );
    }

    // =================================================================
    // 🟦 3) Öğretmen — seçili öğrenciye kaydeder
    // ÖNEMLİ: Veri hem öğrencinin kendi profilinde hem öğretmen altında kaydedilir
    // Firestore: 
    //   - profiles / ogrenciID / oyunSonuclari (öğrencinin kendi profili)
    //   - profiles / teacherID / ogrenciler / ogrenciID / oyunSonuclari (öğretmen altında)
    // =================================================================
    else if (role === ROLES.OGRETMEN) {
      if (!teacherID) {
        console.warn("⚠ teacherID bulunamadı → kayıt yapılamaz.");
        return false;
      }

      if (!aktifOgrenciId) {
        console.warn("⚠ Öğretmen öğrencisiz sonuç kaydedemez.");
        return false;
      }

      // Öğretmen öğrenci verisi kaydederken, öğrencinin kendi profilinde de kaydedilmeli
      // Böylece kurum ve diğer öğretmenler de erişebilir
      // Önce öğrencinin kendi profilinde kaydet
      hedefRef = collection(
        db,
        GLOBAL.FIRESTORE.PROFILES,
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }

    // =================================================================
    // 🟥 4) Admin / Editor — sonuç kaydedemez
    // =================================================================
    else {
      console.warn("⛔ Admin / Editor oyun sonucu kaydedemez.");
      return false;
    }

    // =================================================================
    // 🔥 5) Yeni Şema ile Kaydedilecek Veri
    // =================================================================
    
    // Temel skor hesaplama (eğer yoksa)
    // Önce sonuc.temel_skor'dan al, yoksa hesapla
    let temelSkor = sonuc.temel_skor;
    
    if (!temelSkor || typeof temelSkor !== 'object') {
      const ortalamaTepki = hesaplaOrtalamaTepki(sonuc.trials || []);
      const ogrenmeHizi = hesaplaOgrenmeHizi(sonuc.trials || []);
      
      temelSkor = {
        dogru: sonuc.dogru || 0,
        yanlis: sonuc.yanlis || 0,
        sure: sonuc.sure || sonuc.timeElapsed || 0,
        ortalamaTepki: ortalamaTepki,
        reaction_avg: ortalamaTepki, // Geriye uyumluluk
        ogrenmeHizi: ogrenmeHizi,
        learning_velocity: ogrenmeHizi, // Geriye uyumluluk
        baslangicSeviye: null, // Geçmiş verilerden hesaplanacak
        bitisSeviye: null,
        zorlukAdaptasyonu: null,
        hataTurleri: analizEtHataTurleri(sonuc.trials || [])
      };
    } else {
      // temel_skor varsa ama eksik alanlar varsa tamamla
      if (!temelSkor.ortalamaTepki && temelSkor.reaction_avg) {
        temelSkor.ortalamaTepki = temelSkor.reaction_avg;
      }
      if (!temelSkor.reaction_avg && temelSkor.ortalamaTepki) {
        temelSkor.reaction_avg = temelSkor.ortalamaTepki;
      }
      if (!temelSkor.ogrenmeHizi && temelSkor.learning_velocity) {
        temelSkor.ogrenmeHizi = temelSkor.learning_velocity;
      }
      if (!temelSkor.learning_velocity && temelSkor.ogrenmeHizi) {
        temelSkor.learning_velocity = temelSkor.ogrenmeHizi;
      }
      if (!temelSkor.sure && sonuc.sure) {
        temelSkor.sure = sonuc.sure;
      }
    }

    // Çoklu alan skorları (oyun meta'dan modüllere göre)
    const cokluAlan = sonuc.coklu_alan || hesaplaCokluAlan(sonuc, oyunMeta);

    // Oyun özel metrikleri
    const oyunOzel = sonuc.oyun_ozel || hesaplaOyunOzel(sonuc, oyunMeta);

    // Trend meta (geçmiş verilerden hesaplanacak - şimdilik placeholder)
    const trendMeta = sonuc.trendMeta || {
      trend: "➖",
      oncekiSkor: null,
      gelisim: null,
      // Eşleme oyunu için ek trend verileri
      ilk5OrtalamaTepki: temelSkor.ilk5OrtalamaTepki,
      son5OrtalamaTepki: temelSkor.son5OrtalamaTepki,
      tepkiEgilimi: temelSkor.tepkiEgilimi,
      ilkYariDogruOrani: temelSkor.ilkYariDogruOrani,
      sonYariDogruOrani: temelSkor.sonYariDogruOrani
    };

    // Oyun detayları (eşleme oyunu için)
    const oyunDetaylari = sonuc.oyunDetaylari || {
      toplamSoruSayisi: temelSkor.toplamSoruSayisi || (sonuc.trials?.length || 0),
      oyunBaslangicZamani: temelSkor.oyunBaslangicZamani,
      oyunBitisZamani: temelSkor.oyunBitisZamani,
      toplamOyunSuresi: temelSkor.toplamOyunSuresi || sonuc.sure || 0,
      hataTurleriDetay: temelSkor.hataTurleriDetay || {}
    };

    const data = {
      // Eski alanlar (geriye uyumluluk)
      oyun: sonuc.oyun || secilenOyunKodu,
      dogru: sonuc.dogru || 0,
      yanlis: sonuc.yanlis || 0,
      sure: sonuc.sure || 0,
      tarih: sonuc.tarih || new Date().toISOString(),
      skorlar: sonuc.skorlar || {},
      trials: sonuc.trials || [],

      // Yeni şema alanları
      temel_skor: temelSkor,
      coklu_alan: cokluAlan,
      oyun_ozel: oyunOzel,
      trendMeta: trendMeta,
      oyunDetaylari: oyunDetaylari,

      // Meta bilgileri
      alan: secilenAlan || oyunMeta.alan || null,
      altBeceri: secilenAltBeceri || oyunMeta.altBeceri || null,
      moduller: oyunMeta.moduller || [],

      // Kurum ve öğretmen bilgileri
      institutionID: institutionID,
      teacherIDs: teacherIDs,
      studentID: role === ROLES.OGRENCI ? user.uid : aktifOgrenciId,
      teacherName: role === ROLES.OGRETMEN ? teacherID : null,

      // Sistem alanları
      uid: user.uid,
      role: role,
      kaydedildi: serverTimestamp()
    };

    const docRef = await addDoc(hedefRef, data);
    const resultId = docRef.id;

    // Öğrenci oyun oynadığında, sonuçları bağlı öğretmenlerin alt koleksiyonlarına da kaydet
    if (role === ROLES.OGRENCI && teacherIDs.length > 0) {
      const ogrenciId = user.uid;
      
      // Her bağlı öğretmen için sonucu kaydet
      const teacherPromises = teacherIDs.map(async (teacherId) => {
        try {
          const teacherOgrenciRef = collection(
            db,
            GLOBAL.FIRESTORE.PROFILES,
            teacherId,
            "ogrenciler",
            ogrenciId,
            "oyunSonuclari"
          );
          
          // Öğretmenin alt koleksiyonuna da kaydet
          await addDoc(teacherOgrenciRef, data);
          console.log(`📝 Sonuç öğretmen ${teacherId} alt koleksiyonuna kaydedildi`);
        } catch (err) {
          console.warn(`⚠ Öğretmen ${teacherId} alt koleksiyonuna kayıt yapılamadı:`, err);
        }
      });
      
      // Tüm öğretmen kayıtlarını bekle (hata olsa bile devam et)
      await Promise.allSettled(teacherPromises);
    }

    // Öğretmen öğrenci verisi kaydederken, öğrencinin kendi profilinde de kaydet
    // Ayrıca öğretmen altında da kaydet (çift kayıt: hem öğrenci profili hem öğretmen altı)
    if (role === ROLES.OGRETMEN && aktifOgrenciId) {
      try {
        // Öğrencinin kendi profilinde kaydet (zaten yukarıda kaydedildi, burada öğretmen altında da kaydet)
        const teacherOgrenciRef = collection(
          db,
          GLOBAL.FIRESTORE.PROFILES,
          teacherID,
          "ogrenciler",
          aktifOgrenciId,
          "oyunSonuclari"
        );
        
        // Öğretmenin alt koleksiyonuna da kaydet
        await addDoc(teacherOgrenciRef, data);
        console.log(`📝 Sonuç öğretmen ${teacherID} alt koleksiyonuna kaydedildi`);
      } catch (err) {
        console.warn(`⚠ Öğretmen ${teacherID} alt koleksiyonuna kayıt yapılamadı:`, err);
        // Hata olsa bile devam et, öğrenci profili zaten kaydedildi
      }
    }

    // Sonuç ID'sini localStorage'a kaydet (yorumlar için)
    const oyunGecmisi = JSON.parse(localStorage.getItem("oyunGecmisi") || "[]");
    if (oyunGecmisi.length > 0) {
      oyunGecmisi[oyunGecmisi.length - 1].id = resultId;
      localStorage.setItem("oyunGecmisi", JSON.stringify(oyunGecmisi));
    }

    console.log(`🎉 Oyun sonucu kaydedildi → ${sonuc.oyun || secilenOyunKodu} (ID: ${resultId})`);
    return true;

  } catch (err) {
    console.error("❌ Firestore kayıt hatası:", err);
    return false;
  }
}

// =====================================================================
// 🧮 Yardımcı Fonksiyonlar
// =====================================================================

function hesaplaOrtalamaTepki(trials) {
  if (!Array.isArray(trials) || trials.length === 0) return null;
  const dogruTrials = trials.filter(t => t.correct && typeof t.reaction_ms === "number");
  if (dogruTrials.length === 0) return null;
  const toplam = dogruTrials.reduce((sum, t) => sum + t.reaction_ms, 0);
  return Math.round(toplam / dogruTrials.length);
}

function hesaplaOgrenmeHizi(trials) {
  if (!Array.isArray(trials) || trials.length < 4) return null;
  const ilkYari = trials.slice(0, Math.floor(trials.length / 2));
  const ikinciYari = trials.slice(Math.floor(trials.length / 2));
  const ilkDogru = ilkYari.filter(t => t.correct).length;
  const ikinciDogru = ikinciYari.filter(t => t.correct).length;
  const ilkOrt = ilkYari.length > 0 ? ilkDogru / ilkYari.length : 0;
  const ikinciOrt = ikinciYari.length > 0 ? ikinciDogru / ikinciYari.length : 0;
  const gelisim = ikinciOrt - ilkOrt;
  return Math.round(Math.max(0, Math.min(100, 50 + gelisim * 100)));
}

function analizEtHataTurleri(trials) {
  if (!Array.isArray(trials) || trials.length === 0) return {};
  const hataliTrials = trials.filter(t => !t.correct);
  
  // Eğer trial'larda hataTuru bilgisi varsa onu kullan (eşleme oyunu için)
  const hataTurleriDetay = {
    impulsivite: 0,
    dikkatsizlik: 0,
    karistirma: 0,
    kategori_hatasi: 0,
    toplam: hataliTrials.length
  };
  
  hataliTrials.forEach(trial => {
    if (trial.hataTuru && hataTurleriDetay.hasOwnProperty(trial.hataTuru)) {
      hataTurleriDetay[trial.hataTuru]++;
    } else {
      // Hata türü yoksa tepki süresine göre tahmin et
      if (trial.reaction_ms < 300) {
        hataTurleriDetay.impulsivite++;
      } else if (trial.reaction_ms >= 800) {
        hataTurleriDetay.dikkatsizlik++;
      } else {
        hataTurleriDetay.karistirma++;
      }
    }
  });
  
  return hataTurleriDetay;
}

function hesaplaCokluAlan(sonuc, oyunMeta) {
  const cokluAlan = {};
  const moduller = oyunMeta.moduller || [];
  const skorlar = sonuc.skorlar || {};
  const temelSkor = sonuc.temel_skor || {};
  
  // Toplam doğru/yanlış oranı (0-1 arası)
  const total = (sonuc.dogru || 0) + (sonuc.yanlis || 0);
  const accuracy = total > 0 ? (sonuc.dogru || 0) / total : 0;
  
  // Ortalama tepki süresi (ms cinsinden, düşük = iyi)
  const avgReaction = temelSkor.ortalamaTepki || hesaplaOrtalamaTepki(sonuc.trials || []) || 1000;
  const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20))); // 0-2000ms → 0-100 skor
  
  // Her modül için skor hesapla (0-100 arası)
  moduller.forEach(modul => {
    // Modül adlarını BRAIN_AREAS key'lerine çevir
    let brainAreaKey = modul;
    
    // Türkçe modül adlarını İngilizce key'lere çevir
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
      "comprehension": "comprehension",
      "anlama": "comprehension"
    };
    
    brainAreaKey = modulMap[modul] || modul;
    
    // Her modül için skor hesaplama (accuracy ve reaction time'a göre)
    if (brainAreaKey === "attention") {
      // Dikkat: %60 accuracy, %40 reaction time
      cokluAlan[brainAreaKey] = Math.round(accuracy * 60 + reactionScore * 0.4);
    } else if (brainAreaKey === "perception") {
      // Algısal: %70 accuracy, %30 reaction time
      cokluAlan[brainAreaKey] = Math.round(accuracy * 70 + reactionScore * 0.3);
    } else if (brainAreaKey === "executive") {
      // Yürütücü: %50 accuracy, %50 reaction time (kontrol önemli)
      cokluAlan[brainAreaKey] = Math.round(accuracy * 50 + reactionScore * 0.5);
    } else if (brainAreaKey === "logic") {
      // Mantık: %80 accuracy, %20 reaction time (doğruluk önemli)
      cokluAlan[brainAreaKey] = Math.round(accuracy * 80 + reactionScore * 0.2);
    } else {
      // Diğer modüller için varsayılan: %70 accuracy, %30 reaction time
      cokluAlan[brainAreaKey] = Math.round(accuracy * 70 + reactionScore * 0.3);
    }
    
    // Skorları 0-100 aralığına sınırla
    cokluAlan[brainAreaKey] = Math.max(0, Math.min(100, cokluAlan[brainAreaKey]));
  });

  return cokluAlan;
}

function hesaplaOyunOzel(sonuc, oyunMeta) {
  const oyunOzel = {};
  const performansKeys = oyunMeta.performansKeys || [];
  const trials = sonuc.trials || [];
  const total = (sonuc.dogru || 0) + (sonuc.yanlis || 0);

  // Her performans key'i için değer hesapla
  performansKeys.forEach(key => {
    switch (key) {
      case "match_accuracy":
        // Eşleme doğruluğu (%)
        oyunOzel.match_accuracy = total > 0 ? Math.round((sonuc.dogru / total) * 100) : 0;
        break;
        
      case "match_time":
        // Eşleme süresi (ms)
        oyunOzel.match_time = hesaplaOrtalamaTepki(trials) || 0;
        break;
        
      case "visual_discrimination_score":
        // Görsel ayırt etme skoru (0-100)
        const dogruOran = total > 0 ? (sonuc.dogru / total) : 0;
        oyunOzel.visual_discrimination_score = Math.round(dogruOran * 100);
        break;
        
      case "difference_detect_accuracy":
        // Fark tespit doğruluğu (%)
        oyunOzel.difference_detect_accuracy = total > 0 ? Math.round((sonuc.dogru / total) * 100) : 0;
        break;
        
      case "micro_discrimination":
        // Mikro ayırt etme (küçük farkları bulma) - hızlı ve doğru cevaplar
        const hizliDogru = trials.filter(t => t.correct && t.reaction_ms < 500).length;
        oyunOzel.micro_discrimination = total > 0 ? Math.round((hizliDogru / total) * 100) : 0;
        break;
        
      case "visual_discrimination":
        // Görsel ayırt etme (genel)
        oyunOzel.visual_discrimination = total > 0 ? Math.round((sonuc.dogru / total) * 100) : 0;
        break;
        
      case "reaction_time":
        // Tepki süresi (ms)
        oyunOzel.reaction_time = hesaplaOrtalamaTepki(trials) || 0;
        break;
        
      case "processing_speed":
        // İşlem hızı (saniyede işlem sayısı)
        const sure = sonuc.sure || 30;
        oyunOzel.processing_speed = sure > 0 ? Math.round((total / sure) * 10) / 10 : 0;
        break;
        
      // Eşleme oyunu özel metrikleri
      case "renk_esleme_skor":
        // Renk eşleme bölümü skoru
        const renkTrials = trials.filter(t => t.bolum === "renk");
        const renkDogru = renkTrials.filter(t => t.correct).length;
        oyunOzel.renk_esleme_skor = renkTrials.length > 0 ? Math.round((renkDogru / renkTrials.length) * 100) : 0;
        break;
        
      case "sekil_esleme_skor":
        // Şekil eşleme bölümü skoru
        const sekilTrials = trials.filter(t => t.bolum === "sekil");
        const sekilDogru = sekilTrials.filter(t => t.correct).length;
        oyunOzel.sekil_esleme_skor = sekilTrials.length > 0 ? Math.round((sekilDogru / sekilTrials.length) * 100) : 0;
        break;
        
      case "golge_esleme_skor":
        // Gölge eşleme bölümü skoru
        const golgeTrials = trials.filter(t => t.bolum === "golge");
        const golgeDogru = golgeTrials.filter(t => t.correct).length;
        oyunOzel.golge_esleme_skor = golgeTrials.length > 0 ? Math.round((golgeDogru / golgeTrials.length) * 100) : 0;
        break;
        
      case "parca_butun_skor":
        // Parça-bütün eşleme bölümü skoru
        const parcaTrials = trials.filter(t => t.bolum === "parca");
        const parcaDogru = parcaTrials.filter(t => t.correct).length;
        oyunOzel.parca_butun_skor = parcaTrials.length > 0 ? Math.round((parcaDogru / parcaTrials.length) * 100) : 0;
        break;
        
      case "gorsel_tamamlama":
        // Görsel tamamlama (parça-bütün özel)
        const parcaTrials2 = trials.filter(t => t.bolum === "parca");
        const parcaDogru2 = parcaTrials2.filter(t => t.correct).length;
        oyunOzel.gorsel_tamamlama = parcaTrials2.length > 0 ? Math.round((parcaDogru2 / parcaTrials2.length) * 100) : 0;
        break;
        
      default:
        // Bilinmeyen key için varsayılan hesaplama
        if (key.includes("accuracy") || key.includes("doğruluk")) {
          oyunOzel[key] = total > 0 ? Math.round((sonuc.dogru / total) * 100) : 0;
        } else if (key.includes("time") || key.includes("süre")) {
          oyunOzel[key] = hesaplaOrtalamaTepki(trials) || 0;
        } else if (key.includes("score") || key.includes("skor")) {
          oyunOzel[key] = total > 0 ? Math.round((sonuc.dogru / total) * 100) : 0;
        }
    }
  });

  return oyunOzel;
}
