// ==================================================================
// 📌 Zihin Platformu — Ortak Sonuç JS (v8.0 - Yeni Şema Desteği)
// 4 Sekmeli Analiz: Temel Skor, Çoklu Alan, Oyun Özel, Performans
// ==================================================================

import { GLOBAL, ROLES, BRAIN_AREAS, GUNLUK_HAYAT_KARSILIKLARI } from "./globalConfig.js";
import { aiAdvice } from "../engine/aiAdvisor.js";
import { addComment, getCommentsByGameResult, updateComment, deleteComment } from "../data/commentService.js";
import { db } from "../data/firebaseConfig.js";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==================================================================
// 🔵 GLOBAL SEKME DEĞİŞTİRME FONKSİYONU (HTML onclick için)
// ==================================================================
// Not: Bu fonksiyon artık sonuc.html'de inline script olarak tanımlı
// Burada sadece referans olarak bırakıldı (gerekirse kullanılabilir)

// -------------------------------------------------------------
// 1) 📌 Rol & Öğrenci Erişim Kontrolü
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");

// Öğrenci seçimi zorunlu değil, opsiyonel
// Eğer öğrenci seçilmemişse, kullanıcıya uyarı ver ama sayfa kırılmasın
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  console.warn("⚠ Öğrenci seçilmemiş. Sonuç verileri gösterilemeyecek.");
  // Sayfa kırılmasın, sadece uyarı ver
}

// Editor için erişim kapalı
if (role === ROLES.EDITOR) {
  alert("⛔ Bu ekran editor için kapalıdır.");
  window.location.href = "index.html";
  throw new Error("Editor yetkisiz sonuç ekranı erişimi.");
}

// -------------------------------------------------------------
// 2) 📌 Veri Yükleme - Rol Bazlı
// -------------------------------------------------------------
let gecmis = [];
let son = null;
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid");

// Öğretmen/Kurum/Admin için Firestore'dan veri çek
async function yukleFirestoreSonuc() {
  try {
    if (!db || !aktifOgrenciId) {
      console.warn("⚠ Firestore veya öğrenci bilgisi eksik.");
      return null;
    }

    let yol = null;

    // Öğretmen için: Öğrencinin kendi profilinden veri çek (tüm veriler burada)
    if (role === ROLES.OGRETMEN && teacherID) {
      // Öğrencinin öğretmene bağlı olup olmadığını kontrol et (zorunlu değil)
      try {
        const teacherRef = doc(db, "profiles", teacherID);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          const students = teacherData.students || {};
          if (students[aktifOgrenciId] !== "kabul") {
            console.warn("⚠ Öğrenci öğretmene bağlı değil veya onay bekliyor.");
          }
        }
      } catch (err) {
        console.warn("⚠ Öğretmen-öğrenci bağlantı kontrolü yapılamadı:", err);
      }
      
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }
    // Kurum ve Admin için: profiles/{ogrenciID}/oyunSonuclari (direkt öğrenci profili)
    else if (role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
      // Kurum için: Öğrencinin kuruma bağlı olup olmadığını kontrol et (zorunlu değil)
      if (role === ROLES.INSTITUTION) {
        try {
          const institutionID = localStorage.getItem("institutionID");
          if (institutionID) {
            const studentRef = doc(db, "profiles", aktifOgrenciId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              if (studentData.institution?.id !== institutionID || studentData.institution?.status !== "kabul") {
                console.warn("⚠ Öğrenci kuruma bağlı değil veya onay bekliyor.");
              }
            }
          }
        } catch (err) {
          console.warn("⚠ Kurum-öğrenci bağlantı kontrolü yapılamadı:", err);
        }
      }
      
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    } else {
      console.warn("⚠ Geçersiz rol veya eksik bilgi.");
      return null;
    }

    if (!yol) {
      console.warn("⚠ Firestore yolu oluşturulamadı.");
      return null;
    }

    // En son kaydı al
    const q = query(yol, orderBy("kaydedildi", "desc"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("⚠ Firestore'da sonuç bulunamadı.");
      return null;
    }

    const data = snap.docs[0].data();
    console.log("📥 Firestore'dan sonuç yüklendi:", data);
    return data;

  } catch (err) {
    console.error("❌ Firestore sonuç okunamadı:", err);
    return null;
  }
}

// Öğrenci için LocalStorage'dan veri çek
function yukleLocalSonuc() {
  try {
    // Önce sonOyunSonuc'u kontrol et (daha güncel)
    const sonOyunSonucStr = localStorage.getItem("sonOyunSonuc");
    if (sonOyunSonucStr) {
      try {
        const sonOyunSonuc = JSON.parse(sonOyunSonucStr);
        if (sonOyunSonuc && typeof sonOyunSonuc === 'object') {
          console.log("📦 localStorage'dan sonOyunSonuc okundu:", sonOyunSonuc);
          return sonOyunSonuc;
        }
      } catch (err) {
        console.warn("⚠ sonOyunSonuc parse hatası:", err);
      }
    }
    
    // sonOyunSonuc yoksa oyunGecmisi'nden son kaydı al
    const gecmisStr = localStorage.getItem("oyunGecmisi");
    if (gecmisStr) {
      gecmis = JSON.parse(gecmisStr);
      if (!Array.isArray(gecmis)) {
        console.warn("⚠ oyunGecmisi dizi değil, sıfırlandı.");
        gecmis = [];
      } else {
        console.log("📦 localStorage'dan oyunGecmisi okundu:", gecmis.length, "kayıt");
        if (gecmis.length > 0) {
          const sonKayit = gecmis[gecmis.length - 1];
          console.log("📦 Son kayıt:", sonKayit);
          return sonKayit;
        }
      }
    } else {
      console.warn("⚠ localStorage'da oyunGecmisi bulunamadı.");
      gecmis = [];
    }
  } catch (err) {
    console.error("❌ localStorage okuma hatası:", err);
    console.warn("⚠ localStorage verileri bozuk → sıfırlandı.");
    gecmis = [];
  }

  return null;
}

// Öğrenci için Firestore'dan sonuç çek
async function yukleOgrenciSonuc() {
  // Önce localStorage'dan kontrol et (daha hızlı)
  const localSonuc = yukleLocalSonuc();
  if (localSonuc) {
    console.log("📦 Öğrenci sonucu localStorage'dan yüklendi:", localSonuc);
    return localSonuc;
  }
  
  try {
    if (db && uid) {
      const yol = collection(
        db,
        "profiles",
        uid,
        "oyunSonuclari"
      );
      
      // En son kaydı al
      const q = query(yol, orderBy("kaydedildi", "desc"), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const data = snap.docs[0].data();
        console.log("📥 Firestore'dan sonuç yüklendi (öğrenci):", data);
        return data;
      }
    }
  } catch (err) {
    console.warn("⚠ Firestore'dan veri çekilemedi, LocalStorage deneniyor:", err);
  }
  
  // Firestore'da yoksa LocalStorage'dan çek
  return yukleLocalSonuc();
}

// Veri yükleme - rol bazlı
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  // Öğretmen/Kurum/Admin için önce localStorage (daha hızlı), sonra Firestore
  son = yukleLocalSonuc();
  if (son) {
    console.log("📊 Son oyun sonucu (LocalStorage - öncelikli):", son);
    baslatSayfa();
  } else {
    // Firestore'dan dene
    yukleFirestoreSonuc().then(firestoreSonuc => {
      if (firestoreSonuc) {
        son = firestoreSonuc;
        console.log("📊 Son oyun sonucu (Firestore):", son);
        baslatSayfa();
      } else {
        alert("Henüz bir oyun sonucu kayıtlı değil.");
        if (role === ROLES.INSTITUTION) {
          window.location.href = "institution_panel.html";
        } else if (role === ROLES.ADMIN) {
          window.location.href = "admin_panel.html";
        } else {
          window.location.href = "analiz.html";
        }
      }
    });
  }
} else if (role === ROLES.OGRENCI) {
  // Öğrenci için önce localStorage, sonra Firestore
  yukleOgrenciSonuc().then(ogrenciSonuc => {
    if (ogrenciSonuc) {
      son = ogrenciSonuc;
      console.log("📊 Son oyun sonucu (öğrenci):", son);
      baslatSayfa();
    } else {
      alert("Henüz bir oyun sonucu kayıtlı değil.");
      window.location.href = "index.html";
    }
  });
} else {
  // Diğer roller için LocalStorage'dan yükle
  son = yukleLocalSonuc();
  console.log("📊 Son oyun sonucu:", son);

  if (!son) {
    alert("Henüz bir oyun sonucu kayıtlı değil.");
    window.location.href = "index.html";
    throw new Error("Sonuç bulunamadı.");
  }
  
  baslatSayfa();
}

// -------------------------------------------------------------
// 3) 📌 Oyun Adı & Meta (son değişkeni hazır olduğunda)
// -------------------------------------------------------------
// Oyun bilgisi için global değişken (yukleOyunOzel ve yukleCokluAlan için)
let oyunMeta = {};
let oyunKod = "";

function yukleOyunBilgisi() {
  if (!son) return {};
  
  oyunKod = son.oyun || "bilinmiyor";
  const oyunAdi = GLOBAL.OYUN_ADLARI?.[oyunKod] || 
                  (oyunKod && oyunKod !== "bilinmiyor" ? oyunKod.replace(/_/g, " ").toUpperCase() : "Oyun Sonucu");
  const oyunBaslikEl = document.getElementById("oyunBaslik");
  if (oyunBaslikEl) oyunBaslikEl.textContent = oyunAdi;

  // Oyun meta bilgisi (GAME_MAP'ten)
  oyunMeta = GLOBAL.GAME_MAP?.[oyunKod] || {};
  return oyunMeta;
}

// -------------------------------------------------------------
// 4) 📌 Sekme Yönetimi ve Tüm İçerik Yükleme
// -------------------------------------------------------------
function initSonucSayfasi() {
  if (!son) {
    console.error("❌ Sonuç verisi yüklenmedi!");
    return;
  }
  
  // Oyun bilgisini yükle
  oyunMeta = yukleOyunBilgisi();
  
  // İçerikleri yükle (Yeni yapı: 4 sekme)
  yukleOzet();
  yukleZihinselProfil();
  yukleOyunDetay();
  yukleGunlukHayat();
  
  // Yorum sistemini başlat
  yukleYorumSistemi();
}

// -------------------------------------------------------------
// 🟦 ÖZET SEKMESİ (Temel Skorlar + Mini Özetler)
// -------------------------------------------------------------
function yukleOzet() {
  console.log("🟦 ÖZET sekmesi yükleniyor...");
  
  // Temel skorları yükle (mevcut yukleTemelSkor fonksiyonunu kullan)
  yukleTemelSkor();
  
  // Mini Zihinsel Profil Şeridi
  yukleMiniZihinselProfil();
  
  // Mini Günlük Hayat Özetleri
  yukleMiniGunlukHayat();
}

// Mini Zihinsel Profil Şeridi (Sadece seviye etiketleri)
function yukleMiniZihinselProfil() {
  const miniProfilEl = document.getElementById("miniZihinselProfil");
  if (!miniProfilEl) return;
  
  const zihinselAlanlar = son.oyunDetaylari?.zihinselAlanlar || {};
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  let html = "";
  Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
    const seviye = skor >= 80 ? "Yüksek" : skor >= 50 ? "Orta" : "Düşük";
    const renk = skor >= 80 ? "#4caf50" : skor >= 50 ? "#ff9800" : "#f44336";
    
    html += `<span style="display:inline-block; padding:6px 12px; margin:4px; background:${renk}20; color:${renk}; border-radius:20px; font-size:13px; font-weight:600; border:1px solid ${renk}40;">
      ${alanAdlari[key] || key}: ${seviye}
    </span>`;
  });
  
  miniProfilEl.innerHTML = html || "<p style='color:#999;'>Zihinsel alan verisi bulunamadı.</p>";
}

// Mini Günlük Hayat Özetleri (İkon + Tek Cümle)
function yukleMiniGunlukHayat() {
  const miniGunlukHayatEl = document.getElementById("miniGunlukHayat");
  if (!miniGunlukHayatEl) return;
  
  const gunlukHayat = son.oyunDetaylari?.gunlukHayatKarsiligi || {};
  
  let html = "";
  
  // Karar Verme Hızı
  if (gunlukHayat.kararVermeHizi) {
    const seviye = gunlukHayat.kararVermeHizi.seviye || "Orta";
    html += `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:#f0f8ff; border-radius:8px; margin-bottom:8px;">
      <span style="font-size:24px;">⚡</span>
      <span><strong>Karar verme hızın:</strong> ${seviye}</span>
    </div>`;
  }
  
  // Hata Tipi Analizi
  if (gunlukHayat.hataTipiAnalizi) {
    const profil = gunlukHayat.hataTipiAnalizi.profil || "Dengeli";
    html += `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:#fff3cd; border-radius:8px; margin-bottom:8px;">
      <span style="font-size:24px;">⚠️</span>
      <span><strong>Hata tipi profili:</strong> ${profil}</span>
    </div>`;
  }
  
  // Görsel Tarama
  if (gunlukHayat.gorselTarama) {
    const seviye = gunlukHayat.gorselTarama.seviye || "Orta";
    html += `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:#e8f5e9; border-radius:8px; margin-bottom:8px;">
      <span style="font-size:24px;">👁️</span>
      <span><strong>Görsel tarama:</strong> ${seviye}</span>
    </div>`;
  }
  
  miniGunlukHayatEl.innerHTML = html || "<p style='color:#999;'>Günlük hayat verisi bulunamadı.</p>";
}

// -------------------------------------------------------------
// 5) 📌 1. TEMEL SKOR SEKMESİ (Eski - ÖZET içinde kullanılıyor)
// -------------------------------------------------------------
function yukleTemelSkor() {
  console.log("yukleTemelSkor çağrıldı, son:", son);
  
  const temelSkor = son.temel_skor || {};
  const dogruEl = document.getElementById("dogru");
  const yanlisEl = document.getElementById("yanlis");
  const sureEl = document.getElementById("sure");
  const ortalamaTepkiEl = document.getElementById("ortalamaTepki");
  const ogrenmeHiziEl = document.getElementById("ogrenmeHizi");
  const tarihEl = document.getElementById("tarih");

  console.log("Elementler:", { dogruEl, yanlisEl, sureEl, ortalamaTepkiEl, ogrenmeHiziEl, tarihEl });

  // Doğru ve yanlış sayıları
  // Önce oyunDetaylari'ndan, sonra temel_skor'dan, sonra ana objeden
  const dogruSayi = son.oyunDetaylari?.toplamDogru ?? temelSkor.dogru ?? son.dogru ?? 0;
  const yanlisSayi = son.oyunDetaylari?.toplamYanlis ?? temelSkor.yanlis ?? son.yanlis ?? 0;
  
  if (dogruEl) {
    dogruEl.textContent = dogruSayi;
    console.log("Doğru sayısı yazıldı:", dogruSayi);
  } else {
    console.error("dogru elementi bulunamadı!");
  }
  
  if (yanlisEl) {
    yanlisEl.textContent = yanlisSayi;
    console.log("Yanlış sayısı yazıldı:", yanlisSayi);
  } else {
    console.error("yanlis elementi bulunamadı!");
  }
  
  // Süre (saniye cinsinden)
  // Önce oyunDetaylari'ndan, sonra temel_skor'dan, sonra ana objeden
  let sureDegeri = son.oyunDetaylari?.toplamOyunSuresi ?? temelSkor.toplamOyunSuresi ?? temelSkor.sure ?? son.sure ?? son.timeElapsed ?? 0;
  
  // Eğer hiçbiri yoksa, timeLimit'ten hesapla (varsa)
  if (!sureDegeri && son.timeLimit) {
    sureDegeri = son.timeLimit;
  }
  
  if (sureEl) {
    sureEl.textContent = sureDegeri > 0 ? `${Math.round(sureDegeri)} saniye` : "-";
    console.log("Süre yazıldı:", sureDegeri);
  }
  
  // Ortalama tepki süresi (ms cinsinden)
  // Önce oyunDetaylari'ndan, sonra temel_skor'dan, sonra trials'dan hesapla
  let ortalamaTepkiMs = son.oyunDetaylari?.ortalamaTepkiSuresi ?? temelSkor.ortalamaTepki ?? temelSkor.reaction_avg ?? null;
  
  // En hızlı ve en yavaş tepki süreleri
  let enHizliTepkiMs = null;
  let enYavasTepkiMs = null;
  
  // Eğer temel_skor'da yoksa, trials'dan hesapla
  if (!ortalamaTepkiMs && Array.isArray(son.trials) && son.trials.length > 0) {
    const dogruTrials = son.trials.filter(t => t.correct && typeof t.reaction_ms === "number" && t.reaction_ms > 0);
    if (dogruTrials.length > 0) {
      const tepkiler = dogruTrials.map(t => t.reaction_ms);
      const toplam = tepkiler.reduce((sum, t) => sum + t, 0);
      ortalamaTepkiMs = Math.round(toplam / tepkiler.length);
      enHizliTepkiMs = Math.min(...tepkiler);
      enYavasTepkiMs = Math.max(...tepkiler);
      console.log("Ortalama tepki trials'dan hesaplandı:", ortalamaTepkiMs);
    }
  } else if (Array.isArray(son.trials) && son.trials.length > 0) {
    // Ortalama varsa ama en hızlı/yavaş yoksa, trials'dan al
    const dogruTrials = son.trials.filter(t => t.correct && typeof t.reaction_ms === "number" && t.reaction_ms > 0);
    if (dogruTrials.length > 0) {
      const tepkiler = dogruTrials.map(t => t.reaction_ms);
      enHizliTepkiMs = Math.min(...tepkiler);
      enYavasTepkiMs = Math.max(...tepkiler);
    }
  }
  
  if (ortalamaTepkiEl) {
    ortalamaTepkiEl.textContent = ortalamaTepkiMs ? `${Math.round(ortalamaTepkiMs)} ms` : "-";
    console.log("Ortalama tepki yazıldı:", ortalamaTepkiMs);
  }
  
  // En hızlı tepki
  const enHizliTepkiEl = document.getElementById("enHizliTepki");
  if (enHizliTepkiEl) {
    enHizliTepkiEl.textContent = enHizliTepkiMs ? `${Math.round(enHizliTepkiMs)} ms` : "-";
  }
  
  // En yavaş tepki
  const enYavasTepkiEl = document.getElementById("enYavasTepki");
  if (enYavasTepkiEl) {
    enYavasTepkiEl.textContent = enYavasTepkiMs ? `${Math.round(enYavasTepkiMs)} ms` : "-";
  }
  
  // Öğrenme hızı (0-100 arası)
  // Önce temel_skor'dan al (zaten hesaplanmış)
  let ogrenmeHiziDegeri = temelSkor.ogrenmeHizi || temelSkor.learning_velocity || null;
  
  // Eğer temel_skor'da yoksa, oyunDetaylari'dan veya hesapla
  if (ogrenmeHiziDegeri === null) {
    // oyunDetaylari'dan ilk/son yarı bilgilerini kullan
    if (son.oyunDetaylari?.ilkYariDogruOrani !== undefined && son.oyunDetaylari?.sonYariDogruOrani !== undefined) {
      const gelisim = (son.oyunDetaylari.sonYariDogruOrani - son.oyunDetaylari.ilkYariDogruOrani) / 100;
      const hizEtkisi = son.oyunDetaylari.tepkiEgilimi === "hizlanma" ? 0.2 : son.oyunDetaylari.tepkiEgilimi === "yavaslama" ? -0.2 : 0;
      ogrenmeHiziDegeri = Math.round(Math.max(0, Math.min(100, 50 + gelisim * 50 + hizEtkisi * 50)));
      console.log("Öğrenme hızı oyunDetaylari'dan hesaplandı:", ogrenmeHiziDegeri);
    } else if (Array.isArray(son.trials) && son.trials.length >= 4) {
      const ilkYari = son.trials.slice(0, Math.floor(son.trials.length / 2));
      const ikinciYari = son.trials.slice(Math.floor(son.trials.length / 2));
      const ilkDogru = ilkYari.filter(t => t.correct).length;
      const ikinciDogru = ikinciYari.filter(t => t.correct).length;
      const ilkOrt = ilkYari.length > 0 ? ilkDogru / ilkYari.length : 0;
      const ikinciOrt = ikinciYari.length > 0 ? ikinciDogru / ikinciYari.length : 0;
      const gelisim = ikinciOrt - ilkOrt;
      ogrenmeHiziDegeri = Math.round(Math.max(0, Math.min(100, 50 + gelisim * 100)));
      console.log("Öğrenme hızı hesaplandı:", ogrenmeHiziDegeri);
    }
  }
  
  if (ogrenmeHiziEl) {
    ogrenmeHiziEl.textContent = ogrenmeHiziDegeri !== null ? `${ogrenmeHiziDegeri} / 100` : "-";
    console.log("Öğrenme hızı yazıldı:", ogrenmeHiziDegeri);
  }
  
  // Tarih
  if (tarihEl) {
    const tarih = son.tarih ? new Date(son.tarih) : new Date();
    tarihEl.textContent = tarih.toLocaleString("tr-TR");
    console.log("Tarih yazıldı:", tarih);
  }

  // Bilişsel bileşenler
  const skor = son.skorlar || {};
  const reaction = Math.round(skor.reaction_speed ?? 0);
  const inhib = Math.round(skor.inhibitory_control ?? 0);
  const sustain = Math.round(skor.sustained_attention ?? 0);

  const reactionSpeedEl = document.getElementById("reactionSpeed");
  const inhibControlEl = document.getElementById("inhibControl");
  const sustainedAttentionEl = document.getElementById("sustainedAttention");

  if (reactionSpeedEl) {
    reactionSpeedEl.textContent = `${reaction} / 100`;
    console.log("Tepki hızı yazıldı:", reaction);
  }
  if (inhibControlEl) {
    inhibControlEl.textContent = `${inhib} / 100`;
    console.log("İnhibisyon yazıldı:", inhib);
  }
  if (sustainedAttentionEl) {
    sustainedAttentionEl.textContent = `${sustain} / 100`;
    console.log("Dikkat sürekliliği yazıldı:", sustain);
  }

  // Başlangıç ve bitiş seviyesi
  const baslangicSeviyesiEl = document.getElementById("baslangicSeviyesi");
  const bitisSeviyesiEl = document.getElementById("bitisSeviyesi");
  const zorlukAdaptasyonuEl = document.getElementById("zorlukAdaptasyonu");
  
  // Seviye bilgilerini önce oyunDetaylari'dan, sonra temel_skor'dan, sonra trials'dan al
  let baslangicSeviyesi = son.oyunDetaylari?.baslangicSeviyesi ?? temelSkor.baslangicSeviyesi ?? "-";
  let bitisSeviyesi = son.oyunDetaylari?.bitisSeviyesi ?? temelSkor.bitisSeviyesi ?? "-";
  let zorlukAdaptasyonu = son.oyunDetaylari?.zorlukAdaptasyonu ?? temelSkor.zorlukAdaptasyonu ?? "-";
  
  // Eğer hala "-" ise, trials'dan hesapla
  if (baslangicSeviyesi === "-" && Array.isArray(son.trials) && son.trials.length > 0) {
    const ilkTrial = son.trials[0];
    baslangicSeviyesi = ilkTrial?.zorlukSeviyesi || (ilkTrial?.secenekSayisi === 2 ? "Kolay" : 
                        ilkTrial?.secenekSayisi === 3 ? "Orta" : 
                        ilkTrial?.secenekSayisi === 4 ? "Zor" : "-");
  }
  
  if (bitisSeviyesi === "-" && Array.isArray(son.trials) && son.trials.length > 0) {
    const sonTrial = son.trials[son.trials.length - 1];
    bitisSeviyesi = sonTrial?.zorlukSeviyesi || (sonTrial?.secenekSayisi === 2 ? "Kolay" : 
                    sonTrial?.secenekSayisi === 3 ? "Orta" : 
                    sonTrial?.secenekSayisi === 4 ? "Zor" : "-");
  }
  
  // Zorluk adaptasyonu
  if (zorlukAdaptasyonu === "-" && baslangicSeviyesi !== "-" && bitisSeviyesi !== "-") {
    const seviyeMap = { "Kolay": 1, "Orta": 2, "Zor": 3 };
    const baslangicDeger = seviyeMap[baslangicSeviyesi] || 2;
    const bitisDeger = seviyeMap[bitisSeviyesi] || 2;
    
    if (bitisDeger > baslangicDeger) {
      zorlukAdaptasyonu = "📈 Zorluk arttı (Gelişim var)";
    } else if (bitisDeger < baslangicDeger) {
      zorlukAdaptasyonu = "📉 Zorluk azaldı";
    } else {
      zorlukAdaptasyonu = "➖ Zorluk sabit kaldı";
    }
  }
  
  if (baslangicSeviyesiEl) baslangicSeviyesiEl.textContent = baslangicSeviyesi;
  if (bitisSeviyesiEl) bitisSeviyesiEl.textContent = bitisSeviyesi;
  if (zorlukAdaptasyonuEl) zorlukAdaptasyonuEl.textContent = zorlukAdaptasyonu;
  
  // Hata tipleri listesi ve grafik (ÖZET sekmesi için)
  yukleHataTipleriOzet(temelSkor, son);
  
  // Günlük hayat karşılığı (Temel) - Genişletilmiş
  // hataTurleri değişkenini yukleHataTipleri'nden sonra kullan
  const hataTurleri = temelSkor.hataTurleriDetay || temelSkor.hataTurleri || {};
  const gunlukHayatTemel = document.getElementById("gunlukHayatTemel");
  if (gunlukHayatTemel) {
    let yorumlar = [];
    
    // Tepki süresi → Karar verme hızı
    if (ortalamaTepkiMs) {
      const ms = ortalamaTepkiMs;
      if (ms < 400) {
        yorumlar.push("⚡ <strong>Karar verme hızı:</strong> Çok iyi. Günlük hayatta hızlı tepki gerektiren durumlarda başarılısın.");
      } else if (ms < 600) {
        yorumlar.push("⚡ <strong>Karar verme hızı:</strong> Normal seviyede. Pratikle daha da gelişebilir.");
      } else {
        yorumlar.push("⚡ <strong>Karar verme hızı:</strong> Düşük. Acele etmeden düşünerek karar vermek faydalı olacaktır.");
      }
    }
    
    // Hata tipi → Acelecilik / dikkatsizlik ayrımı
    if (hataTurleri && hataTurleri.toplam > 0) {
      const impulsiviteYuzde = Math.round((hataTurleri.impulsivite / hataTurleri.toplam) * 100);
      const dikkatsizlikYuzde = Math.round((hataTurleri.dikkatsizlik / hataTurleri.toplam) * 100);
      
      if (impulsiviteYuzde > 40) {
        yorumlar.push("⚠️ <strong>Acelecilik:</strong> Hata türü analizi aceleci kararlar verdiğini gösteriyor. Sınıf içi performansta düşünmeden cevap verme görülebilir.");
      }
      if (dikkatsizlikYuzde > 40) {
        yorumlar.push("⚠️ <strong>Dikkatsizlik:</strong> Dikkatsizlik hataları yüksek. Sınıf içi performansta sık dalgınlık görülebilir.");
      }
    }
    
    // Görsel tarama → Okuma sırasında satır takibi
    const temelSkor = son.temel_skor || {};
    const ogrenmeHizi = temelSkor.ogrenmeHizi || temelSkor.learning_velocity || 0;
    if (ogrenmeHizi > 70) {
      yorumlar.push("📚 <strong>Görsel tarama:</strong> Öğrenme hızı yüksek. Okuma sırasında satır takibi ve harf atlama sorunları azalabilir.");
    }
    
    if (yorumlar.length > 0) {
      gunlukHayatTemel.innerHTML = "<h4>💡 Günlük Hayat Karşılığı</h4>" + yorumlar.map(y => `<p>${y}</p>`).join("");
      gunlukHayatTemel.style.display = "block";
    }
  }

  // Bar Grafik
  const skorCanvas = document.getElementById("skorGrafik");
  if (skorCanvas && window.Chart) {
    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(skorCanvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(skorCanvas, {
      type: "bar",
      data: {
        labels: ["Doğru", "Yanlış"],
        datasets: [{
            data: [dogruSayi, yanlisSayi],
            backgroundColor: ["#4A90E2", "#E53935"],
            borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  
  console.log("✅ yukleTemelSkor tamamlandı");
}

// -------------------------------------------------------------
// HATA TİPLERİ YÜKLEME (ÖZET sekmesi için)
// -------------------------------------------------------------
function yukleHataTipleriOzet(temelSkor, son) {
  const hataTurleriGrafikCanvas = document.getElementById("hataTurleriGrafikOzet");
  
  // Hata türleri verilerini al
  let hataTurleri = temelSkor.hataTurleriDetay || temelSkor.hataTurleri || {};
  
  // Eğer hataTurleri boşsa, trials'dan hesapla
  if (!hataTurleri || Object.keys(hataTurleri).length === 0 || !hataTurleri.toplam) {
    const trials = son.trials || [];
    const hataliTrials = trials.filter(t => !t.correct);
    hataTurleri = {
      impulsivite: hataliTrials.filter(t => t.hataTuru === "impulsivite" || (t.reaction_ms < 300 && !t.correct)).length,
      karistirma: hataliTrials.filter(t => t.hataTuru === "karistirma" || (t.reaction_ms >= 300 && t.reaction_ms < 800 && !t.correct)).length,
      dikkatsizlik: hataliTrials.filter(t => t.hataTuru === "dikkatsizlik" || (t.reaction_ms >= 800 && !t.correct)).length,
      kategori_hatasi: hataliTrials.filter(t => t.hataTuru === "kategori_hatasi").length,
      toplam: hataliTrials.length
    };
  }
  
  // Hata türleri grafiği (ÖZET sekmesi için)
  if (hataTurleriGrafikCanvas && window.Chart) {
    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(hataTurleriGrafikCanvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    if (hataTurleri.toplam > 0) {
      new Chart(hataTurleriGrafikCanvas, {
        type: "doughnut",
        data: {
          labels: ["İmpulsivite", "Karıştırma", "Dikkatsizlik", "Kategori Hatası"],
          datasets: [{
            data: [
              hataTurleri.impulsivite || 0,
              hataTurleri.karistirma || 0,
              hataTurleri.dikkatsizlik || 0,
              hataTurleri.kategori_hatasi || 0
            ],
            backgroundColor: ["#ff9800", "#ff5722", "#f44336", "#9c27b0"]
          }]
        },
        options: {
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    } else {
      hataTurleriGrafikCanvas.parentElement.innerHTML = "<p style='color:#4caf50; text-align:center; padding:20px;'>✅ Hiç hata yapılmadı, harika!</p>";
    }
  }
}

// -------------------------------------------------------------
// HATA TİPLERİ YÜKLEME (OYUN DETAYI sekmesi için)
// -------------------------------------------------------------
function yukleHataTipleri(temelSkor, son) {
  const hataTipleriListe = document.getElementById("hataTipleriListe");
  const hataTurleriGrafikCanvas = document.getElementById("hataTurleriGrafik");
  
  // Hata türleri verilerini al
  let hataTurleri = temelSkor.hataTurleriDetay || temelSkor.hataTurleri || {};
  
  // Eğer hataTurleri boşsa, trials'dan hesapla
  if (!hataTurleri || Object.keys(hataTurleri).length === 0 || !hataTurleri.toplam) {
    const trials = son.trials || [];
    const hataliTrials = trials.filter(t => !t.correct);
    hataTurleri = {
      impulsivite: hataliTrials.filter(t => t.hataTuru === "impulsivite" || (t.reaction_ms < 300 && !t.correct)).length,
      karistirma: hataliTrials.filter(t => t.hataTuru === "karistirma" || (t.reaction_ms >= 300 && t.reaction_ms < 800 && !t.correct)).length,
      dikkatsizlik: hataliTrials.filter(t => t.hataTuru === "dikkatsizlik" || (t.reaction_ms >= 800 && !t.correct)).length,
      kategori_hatasi: hataliTrials.filter(t => t.hataTuru === "kategori_hatasi").length,
      toplam: hataliTrials.length
    };
  }
  
  // Hata tipleri listesi
  if (hataTipleriListe) {
    if (hataTurleri.toplam > 0) {
      let html = "";
      const hataTurleriMap = {
        impulsivite: { ad: "İmpulsivite (Acelecilik)", renk: "#ffc107", icon: "⚡" },
        dikkatsizlik: { ad: "Dikkatsizlik", renk: "#f44336", icon: "⚠️" },
        karistirma: { ad: "Karıştırma", renk: "#ff9800", icon: "🔄" },
        kategori_hatasi: { ad: "Kategori Hatası", renk: "#9c27b0", icon: "📂" }
      };
      
      Object.entries(hataTurleriMap).forEach(([key, info]) => {
        const sayi = hataTurleri[key] || 0;
        const yuzde = hataTurleri.toplam > 0 ? Math.round((sayi / hataTurleri.toplam) * 100) : 0;
        
        if (sayi > 0) {
          html += `
            <div style="padding: 10px; margin: 8px 0; background: ${info.renk}15; border-left: 4px solid ${info.renk}; border-radius: 6px;">
              <strong>${info.icon} ${info.ad}:</strong> ${sayi} hata (${yuzde}%)
            </div>
          `;
        }
      });
      
      if (html === "") {
        html = "<p style='color:#4caf50;'>✅ Hiç hata yapılmadı, harika!</p>";
      }
      
      hataTipleriListe.innerHTML = html;
    } else {
      hataTipleriListe.innerHTML = "<p style='color:#4caf50;'>✅ Hiç hata yapılmadı, harika!</p>";
    }
  }
  
  // Hata türleri grafiği
  if (hataTurleriGrafikCanvas && window.Chart && hataTurleri.toplam > 0) {
    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(hataTurleriGrafikCanvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const labels = [];
    const data = [];
    const colors = [];
    
    if (hataTurleri.impulsivite > 0) {
      labels.push("İmpulsivite");
      data.push(hataTurleri.impulsivite);
      colors.push("#ffc107");
    }
    if (hataTurleri.dikkatsizlik > 0) {
      labels.push("Dikkatsizlik");
      data.push(hataTurleri.dikkatsizlik);
      colors.push("#f44336");
    }
    if (hataTurleri.karistirma > 0) {
      labels.push("Karıştırma");
      data.push(hataTurleri.karistirma);
      colors.push("#ff9800");
    }
    if (hataTurleri.kategori_hatasi > 0) {
      labels.push("Kategori Hatası");
      data.push(hataTurleri.kategori_hatasi);
      colors.push("#9c27b0");
    }
    
    if (labels.length > 0) {
      new Chart(hataTurleriGrafikCanvas, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#fff"
          }]
        },
        options: {
          plugins: {
            legend: {
              position: "bottom"
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }
}

// -------------------------------------------------------------
// 6) 📌 2. ÇOKLU ALAN SEKMESİ
// -------------------------------------------------------------
function yukleCokluAlan() {
  console.log("🔵 yukleCokluAlan çağrıldı");
  console.log("📊 son.coklu_alan:", son.coklu_alan);
  
  const cokluAlan = son.coklu_alan || {};
  const cokluAlanListe = document.getElementById("cokluAlanListe");
  
  console.log("📋 cokluAlan objesi:", cokluAlan);
  console.log("📋 cokluAlanListe elementi:", cokluAlanListe);
  console.log("📋 BRAIN_AREAS:", BRAIN_AREAS);

  if (cokluAlanListe) {
    // Oyunun modüllerini al (hangi alanlara veri gönderiyor)
    let moduller = oyunMeta.moduller || [];
    
    // Eğer moduller boşsa, son.moduller'den al
    if (moduller.length === 0) {
      moduller = son.moduller || [];
    }
    
    console.log("📋 Oyunun modulleri:", moduller);
    
    // Modül adlarını BRAIN_AREAS key'lerine çevir
    const modulMap = {
      "attention": "attention", "dikkat": "attention",
      "perception": "perception", "algisal_islemleme": "perception", "algisal": "perception",
      "executive": "executive", "yuruteci_islev": "executive", "yuruteci": "executive",
      "logic": "logic", "mantik": "logic", "mantiksal": "logic",
      "memory": "memory", "hafiza": "memory",
      "literacy": "literacy", "okuma": "literacy",
      "dyslexia": "dyslexia", "disleksi": "dyslexia",
      "writing": "writing", "yazi": "writing",
      "math": "math", "matematik": "math",
      "emotional": "emotional", "duygusal": "emotional",
      "social": "social", "sosyal": "social",
      "comprehension": "comprehension", "anlama": "comprehension"
    };
    
    // Sadece oyunun veri gönderdiği alanları filtrele
    const gosterilecekAlanlar = moduller.map(modul => {
      return modulMap[modul] || modul;
    }).filter(alanKey => {
      // BRAIN_AREAS'ta bu alan var mı kontrol et
      return BRAIN_AREAS[alanKey] !== undefined;
    });
    
    console.log("📋 Gösterilecek alanlar:", gosterilecekAlanlar);
    
    if (gosterilecekAlanlar.length === 0) {
      console.warn("⚠ Gösterilecek alan bulunamadı!");
      cokluAlanListe.innerHTML = "<p>Bu oyun için çoklu alan verisi bulunamadı.</p>";
    } else {
      // Önce oyunDetaylari.zihinselAlanlar'dan veri al (eşleme oyunu için)
      const zihinselAlanlar = son.oyunDetaylari?.zihinselAlanlar || {};
      console.log("🧠 zihinselAlanlar:", zihinselAlanlar);
      
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
      
      let gosterilecekAlan = {};
      
      // Önce zihinselAlanlar'dan veri al (eğer varsa)
      if (Object.keys(zihinselAlanlar).length > 0) {
        console.log("✅ zihinselAlanlar verisi bulundu, kullanılıyor...");
        Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
          const brainAreaKey = zihinselAlanMap[key];
          if (brainAreaKey && gosterilecekAlanlar.includes(brainAreaKey)) {
            gosterilecekAlan[brainAreaKey] = Math.round(skor);
          }
        });
        console.log("✅ zihinselAlanlar'dan alınan skorlar:", gosterilecekAlan);
      }
      
      // Eğer zihinselAlanlar'dan veri alınamadıysa, mevcut coklu_alan'dan al
      if (Object.keys(gosterilecekAlan).length === 0) {
        gosterilecekAlanlar.forEach(alanKey => {
          if (cokluAlan[alanKey] !== undefined) {
            gosterilecekAlan[alanKey] = cokluAlan[alanKey];
          }
        });
      }
      
      // Eğer hala hiç veri yoksa, fallback hesaplama yap
      if (Object.keys(gosterilecekAlan).length === 0) {
        console.log("⚠ coklu_alan ve zihinselAlanlar boş, fallback hesaplama yapılıyor...");
        const total = (son.dogru || 0) + (son.yanlis || 0);
        const accuracy = total > 0 ? (son.dogru || 0) / total : 0;
        const temelSkor = son.temel_skor || {};
        const avgReaction = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 1000;
        const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
        
        gosterilecekAlanlar.forEach(alanKey => {
          let skor = 0;
          
          if (alanKey === "attention") {
            skor = Math.round(accuracy * 60 + reactionScore * 0.4);
          } else if (alanKey === "perception") {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          } else if (alanKey === "executive") {
            skor = Math.round(accuracy * 50 + reactionScore * 0.5);
          } else if (alanKey === "logic") {
            skor = Math.round(accuracy * 80 + reactionScore * 0.2);
          } else {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          }
          
          gosterilecekAlan[alanKey] = Math.max(0, Math.min(100, skor));
        });
        
        console.log("✅ Fallback hesaplanan coklu_alan:", gosterilecekAlan);
      }
      
      let html = "<ul style='list-style:none; padding:0;'>";
      gosterilecekAlanlar.forEach(alanKey => {
        const skor = gosterilecekAlan[alanKey] || 0;
        const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
        html += `<li style='padding:8px; margin:5px 0; background:#f5f5f5; border-radius:6px;'>
          <strong>${alanAd}:</strong> ${Math.round(skor)} / 100
        </li>`;
      });
      html += "</ul>";
      cokluAlanListe.innerHTML = html;
      console.log("✅ Çoklu alan listesi oluşturuldu,", gosterilecekAlanlar.length, "alan gösterildi");
    }
  } else {
    console.error("❌ cokluAlanListe elementi bulunamadı!");
  }

  // Radar Grafiği - Sadece oyunun veri gönderdiği alanlar
  const cokluAlanRadar = document.getElementById("cokluAlanRadar");
  console.log("📊 cokluAlanRadar elementi:", cokluAlanRadar);
  
  if (cokluAlanRadar && window.Chart) {
    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(cokluAlanRadar);
    if (existingChart) {
      existingChart.destroy();
    }

    // Oyunun modüllerini al (yukarıda zaten hesaplandı)
    let moduller = oyunMeta.moduller || [];
    if (moduller.length === 0) {
      moduller = son.moduller || [];
    }
    
    const modulMap = {
      "attention": "attention", "dikkat": "attention",
      "perception": "perception", "algisal_islemleme": "perception", "algisal": "perception",
      "executive": "executive", "yuruteci_islev": "executive", "yuruteci": "executive",
      "logic": "logic", "mantik": "logic", "mantiksal": "logic",
      "memory": "memory", "hafiza": "memory",
      "literacy": "literacy", "okuma": "literacy",
      "dyslexia": "dyslexia", "disleksi": "dyslexia",
      "writing": "writing", "yazi": "writing",
      "math": "math", "matematik": "math",
      "emotional": "emotional", "duygusal": "emotional",
      "social": "social", "sosyal": "social",
      "comprehension": "comprehension", "anlama": "comprehension"
    };
    
    // Sadece oyunun veri gönderdiği alanları filtrele
    const gosterilecekAlanlarRadar = moduller.map(modul => {
      return modulMap[modul] || modul;
    }).filter(alanKey => {
      return BRAIN_AREAS[alanKey] !== undefined;
    });

    // Önce zihinselAlanlar'dan veri al (eşleme oyunu için)
    const zihinselAlanlarRadar = son.oyunDetaylari?.zihinselAlanlar || {};
    const zihinselAlanMapRadar = {
      "dikkat": "attention",
      "algisal_islemleme": "perception",
      "hafiza": "memory",
      "yuruteci_islev": "executive",
      "mantik": "logic",
      "okuma_dil": "literacy",
      "sosyal_bilis": "social"
    };
    
    let gosterilecekAlanRadar = {};
    
    // Önce zihinselAlanlar'dan veri al (eğer varsa)
    if (Object.keys(zihinselAlanlarRadar).length > 0) {
      Object.entries(zihinselAlanlarRadar).forEach(([key, skor]) => {
        const brainAreaKey = zihinselAlanMapRadar[key];
        if (brainAreaKey && gosterilecekAlanlarRadar.includes(brainAreaKey)) {
          gosterilecekAlanRadar[brainAreaKey] = Math.round(skor);
        }
      });
    }
    
    // Eğer zihinselAlanlar'dan veri alınamadıysa, mevcut coklu_alan'dan al
    if (Object.keys(gosterilecekAlanRadar).length === 0) {
      gosterilecekAlanlarRadar.forEach(alanKey => {
        if (cokluAlan[alanKey] !== undefined) {
          gosterilecekAlanRadar[alanKey] = cokluAlan[alanKey];
        }
      });
    }
    
    // Eğer hala hiç veri yoksa, fallback hesaplama yap
    if (Object.keys(gosterilecekAlanRadar).length === 0) {
      const total = (son.dogru || 0) + (son.yanlis || 0);
      const accuracy = total > 0 ? (son.dogru || 0) / total : 0;
      const temelSkor = son.temel_skor || {};
      const avgReaction = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 1000;
      const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
      
      gosterilecekAlanlarRadar.forEach(alanKey => {
        let skor = 0;
        
        if (alanKey === "attention") {
          skor = Math.round(accuracy * 60 + reactionScore * 0.4);
        } else if (alanKey === "perception") {
          skor = Math.round(accuracy * 70 + reactionScore * 0.3);
        } else if (alanKey === "executive") {
          skor = Math.round(accuracy * 50 + reactionScore * 0.5);
        } else if (alanKey === "logic") {
          skor = Math.round(accuracy * 80 + reactionScore * 0.2);
        } else {
          skor = Math.round(accuracy * 70 + reactionScore * 0.3);
        }
        
        gosterilecekAlanRadar[alanKey] = Math.max(0, Math.min(100, skor));
      });
    }

    // Sadece gösterilecek alanlar için labels ve data oluştur
    const labels = gosterilecekAlanlarRadar.map(k => BRAIN_AREAS[k]?.ad || k);
    const data = gosterilecekAlanlarRadar.map(k => gosterilecekAlanRadar[k] || 0);
    
    console.log("📊 Radar grafik verileri:", { labels, data });

    new Chart(cokluAlanRadar, {
      type: "radar",
      data: {
        labels,
        datasets: [{
          label: "Zihin Alanları",
          data,
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  }

  // Günlük hayat karşılığı (Çoklu) - Sadece gösterilen alanlar için
  const gunlukHayatCoklu = document.getElementById("gunlukHayatCoklu");
  
  // Oyunun modüllerini al (yukarıda zaten hesaplandı)
  let modullerFinal = oyunMeta.moduller || [];
  if (modullerFinal.length === 0) {
    modullerFinal = son.moduller || [];
  }
  
  const modulMapFinal = {
    "attention": "attention", "dikkat": "attention",
    "perception": "perception", "algisal_islemleme": "perception", "algisal": "perception",
    "executive": "executive", "yuruteci_islev": "executive", "yuruteci": "executive",
    "logic": "logic", "mantik": "logic", "mantiksal": "logic",
    "memory": "memory", "hafiza": "memory",
    "literacy": "literacy", "okuma": "literacy",
    "dyslexia": "dyslexia", "disleksi": "dyslexia",
    "writing": "writing", "yazi": "writing",
    "math": "math", "matematik": "math",
    "emotional": "emotional", "duygusal": "emotional",
    "social": "social", "sosyal": "social",
    "comprehension": "comprehension", "anlama": "comprehension"
  };
  
  // Sadece oyunun veri gönderdiği alanları filtrele
  const gosterilecekAlanlarFinal = modullerFinal.map(modul => {
    return modulMapFinal[modul] || modul;
  }).filter(alanKey => {
    return BRAIN_AREAS[alanKey] !== undefined;
  });
  
  // Önce zihinselAlanlar'dan veri al (eşleme oyunu için)
  const zihinselAlanlarFinal = son.oyunDetaylari?.zihinselAlanlar || {};
  const zihinselAlanMapFinal = {
    "dikkat": "attention",
    "algisal_islemleme": "perception",
    "hafiza": "memory",
    "yuruteci_islev": "executive",
    "mantik": "logic",
    "okuma_dil": "literacy",
    "sosyal_bilis": "social"
  };
  
  // Sadece gösterilecek alanlar için veri topla
  let gosterilecekAlanFinal = {};
  
  // Önce zihinselAlanlar'dan veri al (eğer varsa)
  if (Object.keys(zihinselAlanlarFinal).length > 0) {
    Object.entries(zihinselAlanlarFinal).forEach(([key, skor]) => {
      const brainAreaKey = zihinselAlanMapFinal[key];
      if (brainAreaKey && gosterilecekAlanlarFinal.includes(brainAreaKey)) {
        gosterilecekAlanFinal[brainAreaKey] = Math.round(skor);
      }
    });
  }
  
  // Eğer zihinselAlanlar'dan veri alınamadıysa, mevcut coklu_alan'dan al
  if (Object.keys(gosterilecekAlanFinal).length === 0) {
    gosterilecekAlanlarFinal.forEach(alanKey => {
      if (cokluAlan[alanKey] !== undefined) {
        gosterilecekAlanFinal[alanKey] = cokluAlan[alanKey];
      }
    });
  }
  
  // Eğer hala hiç veri yoksa, fallback hesaplama yap
  if (Object.keys(gosterilecekAlanFinal).length === 0) {
    const total = (son.dogru || 0) + (son.yanlis || 0);
    const accuracy = total > 0 ? (son.dogru || 0) / total : 0;
    const temelSkor = son.temel_skor || {};
    const avgReaction = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 1000;
    const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
    
    gosterilecekAlanlarFinal.forEach(alanKey => {
      let skor = 0;
      
      if (alanKey === "attention") {
        skor = Math.round(accuracy * 60 + reactionScore * 0.4);
      } else if (alanKey === "perception") {
        skor = Math.round(accuracy * 70 + reactionScore * 0.3);
      } else if (alanKey === "executive") {
        skor = Math.round(accuracy * 50 + reactionScore * 0.5);
      } else if (alanKey === "logic") {
        skor = Math.round(accuracy * 80 + reactionScore * 0.2);
      } else {
        skor = Math.round(accuracy * 70 + reactionScore * 0.3);
      }
      
      gosterilecekAlanFinal[alanKey] = Math.max(0, Math.min(100, skor));
    });
  }
  
  if (gunlukHayatCoklu && Object.keys(gosterilecekAlanFinal).length > 0) {
    let gunlukHayatMetni = "<h4 style='margin-top:0;'>💡 Günlük Hayat Karşılığı</h4>";
    
    // Her alan için açıklama
    const alanAciklamalari = {
      "attention": "Dikkat puanı düşük → görsel tarama ve tepki stabilitesi zayıflayabilir. Yüksek → odaklanma ve dikkat gerektiren görevlerde başarılı olursun.",
      "perception": "Görsel algı puanı düşük → görsel bilgileri işlemede zorlanabilirsin. Yüksek → görsel görevlerde hızlı ve doğru tepki verirsin.",
      "memory": "Bellek puanı yüksek → yönerge takipte güçlüdür. Düşük → çok adımlı görevlerde zorlanabilirsin.",
      "executive": "Yürütücü işlev puanı yüksek → planlama ve problem çözmede başarılısın. Düşük → görevleri organize etmede zorlanabilirsin.",
      "logic": "Mantık puanı yüksek → mantıksal düşünme ve problem çözmede güçlüsün. Düşük → mantıksal ilişkileri kurmada zorlanabilirsin.",
      "literacy": "Okuma-dil puanı yüksek → okuma ve dil becerilerinde başarılısın. Düşük → okuma ve anlama görevlerinde destek gerekebilir.",
      "social": "Sosyal biliş puanı yüksek → sosyal durumları anlama ve empati kurmada güçlüsün. Düşük → sosyal ipuçlarını algılamada zorlanabilirsin."
    };
    
    Object.entries(gosterilecekAlanFinal).forEach(([alanKey, skor]) => {
      const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
      const aciklama = alanAciklamalari[alanKey] || "Bu alan günlük hayattaki bilişsel görevlerde önemlidir.";
      const seviye = skor >= 70 ? "Yüksek" : skor >= 50 ? "Orta" : "Düşük";
      const renk = skor >= 70 ? "#4caf50" : skor >= 50 ? "#ff9800" : "#f44336";
      
      gunlukHayatMetni += `<div style='padding:10px; margin:8px 0; background:${renk}15; border-left:4px solid ${renk}; border-radius:6px;'>
        <strong>${alanAd} (${Math.round(skor)}/100 - ${seviye}):</strong> ${aciklama}
      </div>`;
    });
    
    gunlukHayatCoklu.innerHTML = gunlukHayatMetni;
    gunlukHayatCoklu.style.display = "block";
    console.log("✅ Günlük hayat karşılığı gösterildi");
  }
  
  console.log("✅ yukleCokluAlan tamamlandı");
}

// -------------------------------------------------------------
// 7) 📌 3. OYUN ÖZEL SEKMESİ
// -------------------------------------------------------------
function yukleOyunOzel() {
  console.log("🔵 yukleOyunOzel çağrıldı");
  console.log("📊 son.oyun_ozel:", son.oyun_ozel);
  
  let oyunOzel = son.oyun_ozel || {};
  const oyunOzelListe = document.getElementById("oyunOzelListe");
  const temelSkor = son.temel_skor || {};
  
  console.log("📋 oyunOzel objesi:", oyunOzel);
  console.log("📋 oyunOzelListe elementi:", oyunOzelListe);
  console.log("📋 oyunMeta:", oyunMeta);
  console.log("📋 oyunKod:", oyunKod);

  // Eğer oyun_ozel boşsa, oyun meta'dan hesapla
  if (Object.keys(oyunOzel).length === 0) {
    console.log("⚠ oyun_ozel boş, oyun meta'dan hesaplanıyor...");
    // gameResultService.js'deki hesaplaOyunOzel mantığını kullan
    const performansKeys = oyunMeta.performansKeys || [];
    const trials = son.trials || [];
    const total = (son.dogru || 0) + (son.yanlis || 0);
    
    performansKeys.forEach(key => {
      switch (key) {
        case "match_accuracy":
          oyunOzel.match_accuracy = total > 0 ? Math.round((son.dogru / total) * 100) : 0;
          break;
        case "match_time":
          const avgReaction = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 0;
          oyunOzel.match_time = avgReaction;
          break;
        case "visual_discrimination_score":
          const dogruOran = total > 0 ? (son.dogru / total) : 0;
          oyunOzel.visual_discrimination_score = Math.round(dogruOran * 100);
          break;
        case "difference_detect_accuracy":
          oyunOzel.difference_detect_accuracy = total > 0 ? Math.round((son.dogru / total) * 100) : 0;
          break;
        case "micro_discrimination":
          const hizliDogru = trials.filter(t => t.correct && t.reaction_ms < 500).length;
          oyunOzel.micro_discrimination = total > 0 ? Math.round((hizliDogru / total) * 100) : 0;
          break;
        case "visual_discrimination":
          oyunOzel.visual_discrimination = total > 0 ? Math.round((son.dogru / total) * 100) : 0;
          break;
        case "reaction_time":
          const reactionTime = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 0;
          oyunOzel.reaction_time = reactionTime;
          break;
        case "processing_speed":
          const sure = son.sure || son.timeElapsed || 30;
          oyunOzel.processing_speed = sure > 0 ? Math.round((total / sure) * 10) / 10 : 0;
          break;
        // Eşleme oyunu özel metrikleri
        case "renk_esleme_skor":
          const renkTrials = trials.filter(t => t.bolum === "renk");
          const renkDogru = renkTrials.filter(t => t.correct).length;
          oyunOzel.renk_esleme_skor = renkTrials.length > 0 ? Math.round((renkDogru / renkTrials.length) * 100) : 0;
          break;
        case "sekil_esleme_skor":
          const sekilTrials = trials.filter(t => t.bolum === "sekil");
          const sekilDogru = sekilTrials.filter(t => t.correct).length;
          oyunOzel.sekil_esleme_skor = sekilTrials.length > 0 ? Math.round((sekilDogru / sekilTrials.length) * 100) : 0;
          break;
        case "golge_esleme_skor":
          const golgeTrials = trials.filter(t => t.bolum === "golge");
          const golgeDogru = golgeTrials.filter(t => t.correct).length;
          oyunOzel.golge_esleme_skor = golgeTrials.length > 0 ? Math.round((golgeDogru / golgeTrials.length) * 100) : 0;
          break;
        case "parca_butun_skor":
          const parcaTrials = trials.filter(t => t.bolum === "parca");
          const parcaDogru = parcaTrials.filter(t => t.correct).length;
          oyunOzel.parca_butun_skor = parcaTrials.length > 0 ? Math.round((parcaDogru / parcaTrials.length) * 100) : 0;
          break;
        case "gorsel_tamamlama":
          const parcaTrials2 = trials.filter(t => t.bolum === "parca");
          const parcaDogru2 = parcaTrials2.filter(t => t.correct).length;
          oyunOzel.gorsel_tamamlama = parcaTrials2.length > 0 ? Math.round((parcaDogru2 / parcaTrials2.length) * 100) : 0;
          break;
        default:
          if (key.includes("accuracy") || key.includes("doğruluk")) {
            oyunOzel[key] = total > 0 ? Math.round((son.dogru / total) * 100) : 0;
          } else if (key.includes("time") || key.includes("süre")) {
            const timeValue = temelSkor.ortalamaTepki || temelSkor.reaction_avg || 0;
            oyunOzel[key] = timeValue;
          } else if (key.includes("score") || key.includes("skor")) {
            oyunOzel[key] = total > 0 ? Math.round((son.dogru / total) * 100) : 0;
          }
      }
    });
    
    console.log("✅ Hesaplanan oyun_ozel:", oyunOzel);
  }

  // Hata türleri hesaplama (eğer yoksa) - önce hesapla, sonra kullan
  // Önce hataTurleriDetay formatını kontrol et (yeni format)
  let hataTurleri = temelSkor.hataTurleriDetay || temelSkor.hataTurleri || {};
  
  // Eğer hataTurleriDetay formatındaysa, hataTurleri'ne çevir (geriye uyumluluk)
  if (hataTurleri && hataTurleri.impulsivite !== undefined && !hataTurleri.toplam) {
    // hataTurleriDetay formatı, toplam hesapla
    hataTurleri.toplam = (hataTurleri.impulsivite || 0) + 
                         (hataTurleri.dikkatsizlik || 0) + 
                         (hataTurleri.karistirma || 0) + 
                         (hataTurleri.kategori_hatasi || 0);
  }
  
  if (!hataTurleri || Object.keys(hataTurleri).length === 0 || !hataTurleri.toplam) {
    console.log("⚠ hataTurleri boş, trials'dan hesaplanıyor...");
    const trials = son.trials || [];
    const hataliTrials = trials.filter(t => !t.correct);
    hataTurleri = {
      impulsivite: hataliTrials.filter(t => t.hataTuru === "impulsivite" || (t.reaction_ms < 300 && !t.correct)).length,
      karistirma: hataliTrials.filter(t => t.hataTuru === "karistirma" || (t.reaction_ms >= 300 && t.reaction_ms < 800 && !t.correct)).length,
      dikkatsizlik: hataliTrials.filter(t => t.hataTuru === "dikkatsizlik" || (t.reaction_ms >= 800 && !t.correct)).length,
      kategori_hatasi: hataliTrials.filter(t => t.hataTuru === "kategori_hatasi").length,
      toplam: hataliTrials.length
    };
    console.log("✅ Hesaplanan hataTurleri:", hataTurleri);
  }

  // Performans metrikleri - Sadece oyunun performansKeys'inde belirtilen metrikler
  const performansKeys = oyunMeta.performansKeys || [];
  let gosterilecekMetrikler = {};
  
  // Sadece oyunun performansKeys'inde olan metrikleri filtrele
  performansKeys.forEach(key => {
    if (oyunOzel[key] !== undefined && oyunOzel[key] !== null) {
      gosterilecekMetrikler[key] = oyunOzel[key];
    }
  });
  
  console.log("📋 performansKeys:", performansKeys);
  console.log("📋 gosterilecekMetrikler:", gosterilecekMetrikler);

  if (oyunOzelListe) {
    // Oyun özel becerileri göster
    const oyunOzelBeceriler = oyunMeta.oyunOzelBeceriler || [];
    
    console.log("📋 oyunOzelBeceriler:", oyunOzelBeceriler);
    console.log("📋 hataTurleri:", hataTurleri);
  
    let html = "";
  
    // 8 Özel Performans Alanları (ozelPerformansAlanlari)
    const ozelPerformans = son.oyunDetaylari?.ozelPerformansAlanlari || {};
    if (Object.keys(ozelPerformans).length > 0) {
      html += "<h4 style='margin-top:0;'>🎯 8 Özel Performans Alanı</h4>";
      html += "<ul style='list-style:none; padding:0;'>";
      
      // Beceri adları ve açıklamaları
      const beceriAdlari = {
        renk_ayirt_etme: "Renk Ayırt Etme",
        sekil_tanima: "Şekil Tanıma",
        gorsel_kalip_algisi: "Görsel Kalıp Algısı",
        kategori_sinif_esleme: "Kategori / Sınıf Eşleme",
        gorsel_tamamlama: "Görsel Tamamlama (Parça-Bütün)",
        benzer_farkli_ayirt_etme: "Benzer – Farklı Ayırt Etme",
        detay_tarama_hizi: "Detay Tarama Hızı",
        yonluk_figur_zemin: "Yönlük / Figür–Zemin Algısı"
      };
      
      Object.entries(ozelPerformans).forEach(([key, deger]) => {
        if (deger && typeof deger === "object" && deger.seviye) {
          const seviyeRenk = deger.seviye === "Yüksek" ? "#4caf50" : deger.seviye === "Düşük" ? "#f44336" : "#ff9800";
          const seviyeIcon = deger.seviye === "Yüksek" ? "✅" : deger.seviye === "Düşük" ? "⚠️" : "➖";
          
          html += `<li style='padding:12px; margin:10px 0; background:#f0f8ff; border-radius:8px; border-left:4px solid ${seviyeRenk}; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>
            <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;'>
              <strong style='color:#1e3d59; font-size:16px;'>${beceriAdlari[key] || key}</strong>
              <div style='display:flex; align-items:center; gap:8px;'>
                <span style='color:${seviyeRenk};font-weight:600;font-size:18px;'>${seviyeIcon} ${deger.seviye}</span>
              </div>
            </div>`;
          
          // Detay bilgileri
          if (deger.dogruOran !== undefined) {
            html += `<div style='font-size:13px;color:#666;margin-top:4px;'>Doğru Oranı: <strong>%${deger.dogruOran}</strong></div>`;
          }
          if (deger.ortalamaRT !== undefined && deger.ortalamaRT > 0) {
            html += `<div style='font-size:13px;color:#666;margin-top:4px;'>Ortalama Tepki Süresi: <strong>${deger.ortalamaRT}ms</strong></div>`;
          }
          if (deger.karistirmaOrani !== undefined) {
            html += `<div style='font-size:13px;color:#666;margin-top:4px;'>Karıştırma Oranı: <strong>%${deger.karistirmaOrani}</strong></div>`;
          }
          if (deger.kategoriHataOrani !== undefined) {
            html += `<div style='font-size:13px;color:#666;margin-top:4px;'>Kategori Hata Oranı: <strong>%${deger.kategoriHataOrani}</strong></div>`;
          }
          if (deger.soruSayisi !== undefined) {
            html += `<div style='font-size:13px;color:#666;margin-top:4px;'>Soru Sayısı: <strong>${deger.soruSayisi}</strong></div>`;
          }
          
          html += `</li>`;
        }
      });
      html += "</ul>";
    }
  
    // Oyun özel beceriler - Sadece performansKeys'de olan beceriler
    const performansKeysForBeceriler = performansKeys;
    
    if (oyunOzelBeceriler.length > 0) {
      html += "<h4 style='margin-top:20px;'>🎯 Oyun Özel Beceriler (Eski Format)</h4>";
      html += "<h4 style='margin-top:0;'>🎯 Oyun Özel Beceriler</h4>";
      html += "<ul style='list-style:none; padding:0;'>";
      oyunOzelBeceriler.forEach(beceri => {
        // Performans key'lerinden ilgili değeri bul
        // Beceri ID'sini performans key'lerine eşleştir
        let deger = "-";
        let ilgiliKey = null;
        
        // Eşleme oyunu için özel eşleştirme
        const beceriKeyMap = {
          "renk_ayirt": "renk_esleme_skor",
          "sekil_tanima": "sekil_esleme_skor",
          "gorsel_kalip": "visual_discrimination_score",
          "kategori_esleme": "kategori_esleme",
          "gorsel_tamamlama": "parca_butun_skor",
          "figur_zemin": "golge_esleme_skor",
          "benzer_farkli": "match_accuracy",
          "detay_tarama": "match_time"
        };
        
        // Önce doğrudan eşleşme dene (beceri.id performansKeys'de var mı?)
        if (performansKeysForBeceriler.includes(beceri.id)) {
          ilgiliKey = beceri.id;
          deger = oyunOzel[beceri.id];
        } else if (beceriKeyMap[beceri.id]) {
          // Özel eşleştirme kullan
          ilgiliKey = beceriKeyMap[beceri.id];
          deger = oyunOzel[ilgiliKey];
        } else {
          // Performans key'lerinden ilgili olanı bul (içerik eşleşmesi)
          ilgiliKey = performansKeysForBeceriler.find(k => 
            k.includes(beceri.id) || 
            beceri.id.includes(k.split('_')[0]) ||
            k.includes(beceri.id.split('_')[0])
          );
          if (ilgiliKey && oyunOzel[ilgiliKey] !== undefined) {
            deger = oyunOzel[ilgiliKey];
          }
        }
        
        // Eğer değer bulunduysa ve performansKeys'de varsa göster
        if (deger !== "-" && ilgiliKey && (performansKeysForBeceriler.includes(ilgiliKey) || beceriKeyMap[beceri.id])) {
          const skor = typeof deger === 'number' ? Math.round(deger) : deger;
          const birim = typeof deger === 'number' && (ilgiliKey.includes('accuracy') || ilgiliKey.includes('score') || ilgiliKey.includes('discrimination') || ilgiliKey.includes('skor')) ? '%' : 
                        ilgiliKey.includes('time') ? ' ms' : 
                        ilgiliKey.includes('speed') ? ' işlem/sn' : '';
          
          // Günlük hayat açıklaması
          const gunlukHayatAciklamalari = {
            "renk_ayirt": "Renkleri ayırt etme becerisi, günlük hayatta renk kodlu görevlerde (trafik işaretleri, harita okuma) başarı sağlar.",
            "sekil_tanima": "Şekil tanıma becerisi, geometri ve görsel okuma-yazma becerilerine katkı sağlar.",
            "gorsel_kalip": "Görsel kalıp tanıma, örüntü tanıma ve problem çözme becerilerini destekler.",
            "kategori_esleme": "Kategori eşleme, sınıflandırma ve organizasyon becerilerini geliştirir.",
            "gorsel_tamamlama": "Görsel tamamlama, parça-bütün ilişkisi kurma ve görsel hafıza becerilerini güçlendirir.",
            "figur_zemin": "Figür-zemin ayırma, dikkat ve odaklanma becerilerini geliştirir, okuma sırasında satır takibine yardımcı olur.",
            "benzer_farkli": "Benzer-farklı ayırt etme, detay farkındalığı ve analitik düşünme becerilerini destekler.",
            "detay_tarama": "Detay tarama hızı, görsel tarama ve hızlı karar verme becerilerini geliştirir."
          };
          
          const aciklama = gunlukHayatAciklamalari[beceri.id] || "Bu beceri günlük hayattaki görsel işleme görevlerinde önemlidir.";
          
          // Gelişim sinyali (önceki oyunlarla karşılaştırma - basit versiyon)
          let gelisimSinyali = "➖";
          if (typeof deger === 'number') {
            if (deger >= 80) gelisimSinyali = "📈 Yüksek";
            else if (deger >= 60) gelisimSinyali = "➖ Orta";
            else gelisimSinyali = "📉 Geliştirilmeli";
          }
          
          html += `<li style='padding:12px; margin:10px 0; background:#f0f8ff; border-radius:8px; border-left:4px solid #4a90e2; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>
            <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;'>
              <strong style='color:#1e3d59; font-size:16px;'>${beceri.ad}</strong>
              <div style='display:flex; align-items:center; gap:8px;'>
                <span style='color:#1e88e5;font-weight:600;font-size:18px;'>${skor}${birim}</span>
                <span style='font-size:14px;'>${gelisimSinyali}</span>
              </div>
            </div>
            <div style='font-size:13px;color:#666;line-height:1.5;padding-top:6px;border-top:1px solid #e0e0e0;'>
              💡 ${aciklama}
            </div>
          </li>`;
        }
      });
      html += "</ul>";
    }
  
    // Performans metrikleri - Sadece oyunun performansKeys'inde belirtilen metrikler
    if (Object.keys(gosterilecekMetrikler).length > 0) {
    html += "<h4 style='margin-top:20px;'>📊 Performans Metrikleri</h4>";
    html += "<ul style='list-style:none; padding:0;'>";
    Object.entries(gosterilecekMetrikler).forEach(([key, value]) => {
      const keyAd = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const skor = typeof value === 'number' ? Math.round(value) : value;
      const birim = key.includes('accuracy') || key.includes('score') || key.includes('discrimination') ? '%' : 
                    key.includes('time') ? ' ms' : 
                    key.includes('speed') ? ' işlem/sn' : '';
      html += `<li style='padding:8px; margin:5px 0; background:#f5f5f5; border-radius:6px;'>
        <strong>${keyAd}:</strong> ${skor}${birim}
      </li>`;
    });
    html += "</ul>";
  }
  
  // Hata türleri analizi
  if (Object.keys(hataTurleri).length > 0 && hataTurleri.toplam > 0) {
    html += "<h4 style='margin-top:20px;'>⚠️ Hata Türleri Analizi</h4>";
    html += "<ul style='list-style:none; padding:0;'>";
    if (hataTurleri.impulsivite > 0) {
      const yuzde = Math.round((hataTurleri.impulsivite / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#fff3cd; border-radius:6px; border-left:4px solid #ffc107;'>
        <strong>İmpulsivite (Acelecilik):</strong> ${hataTurleri.impulsivite} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Çok hızlı tepki vererek hata yapma</div>
      </li>`;
    }
    if (hataTurleri.karistirma > 0) {
      const yuzde = Math.round((hataTurleri.karistirma / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#ffe0b2; border-radius:6px; border-left:4px solid #ff9800;'>
        <strong>Karıştırma:</strong> ${hataTurleri.karistirma} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Benzer öğeleri ayırt edememe</div>
      </li>`;
    }
    if (hataTurleri.dikkatsizlik > 0) {
      const yuzde = Math.round((hataTurleri.dikkatsizlik / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#ffcdd2; border-radius:6px; border-left:4px solid #f44336;'>
        <strong>Dikkatsizlik:</strong> ${hataTurleri.dikkatsizlik} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Odaklanma eksikliği</div>
      </li>`;
    }
    html += "</ul>";
  }
  
    // Bölüm Skorları (Renk, Şekil, Gölge, Parça-Bütün) - Eşleme oyunu için
    if (oyunKod === "renk_esleme" || oyunKod === "esleme") {
      const bolumSkorlari = son.oyunDetaylari?.bolumSkorlari || {};
      
      if (Object.keys(bolumSkorlari).length > 0) {
        html += "<h4 style='margin-top:20px;'>📊 Bölüm Bazlı Performans</h4>";
        html += "<div style='overflow-x:auto;'>";
        html += "<table style='width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>";
        html += "<thead>";
        html += "<tr style='background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color:white;'>";
        html += "<th style='padding:12px; text-align:left; border-radius:8px 0 0 0;'>Bölüm</th>";
        html += "<th style='padding:12px; text-align:center;'>Toplam Soru</th>";
        html += "<th style='padding:12px; text-align:center;'>Doğru</th>";
        html += "<th style='padding:12px; text-align:center;'>Yanlış</th>";
        html += "<th style='padding:12px; text-align:center;'>Doğru Oranı</th>";
        html += "<th style='padding:12px; text-align:center; border-radius:0 8px 0 0;'>Seviye</th>";
        html += "</tr>";
        html += "</thead>";
        html += "<tbody>";
        
        const bolumAdlari = {
          renk: "🎨 Renk Eşleme",
          sekil: "🔷 Şekil Eşleme",
          golge: "🌑 Nesne-Gölge Eşleme",
          parca: "🧩 Parça-Bütün Eşleme"
        };
        
        Object.entries(bolumSkorlari).forEach(([bolumKey, skor], index) => {
          if (skor && typeof skor === "object" && skor.toplam > 0) {
            const toplam = skor.toplam || 0;
            const dogru = skor.dogru || 0;
            const yanlis = toplam - dogru;
            const dogruOrani = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
            
            let seviye = "Düşük";
            let seviyeRenk = "#f44336";
            if (dogruOrani >= 80) {
              seviye = "Yüksek";
              seviyeRenk = "#4caf50";
            } else if (dogruOrani >= 50) {
              seviye = "Orta";
              seviyeRenk = "#ff9800";
            }
            
            const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
            
            html += `<tr style='background:${satirRengi};'>`;
            html += `<td style='padding:12px; font-weight:600; color:#2c3e50;'>${bolumAdlari[bolumKey] || bolumKey}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#333;'>${toplam}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#4caf50; font-weight:600;'>${dogru}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>${yanlis}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#1e88e5; font-weight:600;'>%${dogruOrani}</td>`;
            html += `<td style='padding:12px; text-align:center; color:${seviyeRenk}; font-weight:600;'>${seviye}</td>`;
            html += `</tr>`;
          }
        });
        
        html += "</tbody>";
        html += "</table>";
        html += "</div>";
        html += "<p style='margin-top:10px; font-size:12px; color:#666; font-style:italic;'>💡 Bu tablo, oyunun 4 farklı bölümündeki (Renk, Şekil, Gölge, Parça-Bütün) performansınızı gösterir.</p>";
        
        // Bölüm bazlı hata analizi
        const trials = son.trials || [];
        if (trials.length > 0) {
          html += "<h4 style='margin-top:20px;'>⚠️ Bölüm Bazlı Hata Analizi</h4>";
          html += "<div style='overflow-x:auto;'>";
          html += "<table style='width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>";
          html += "<thead>";
          html += "<tr style='background:linear-gradient(135deg, #e53935 0%, #c62828 100%); color:white;'>";
          html += "<th style='padding:12px; text-align:left; border-radius:8px 0 0 0;'>Bölüm</th>";
          html += "<th style='padding:12px; text-align:center;'>İmpulsivite</th>";
          html += "<th style='padding:12px; text-align:center;'>Dikkatsizlik</th>";
          html += "<th style='padding:12px; text-align:center;'>Karıştırma</th>";
          html += "<th style='padding:12px; text-align:center;'>Kategori Hatası</th>";
          html += "<th style='padding:12px; text-align:center; border-radius:0 8px 0 0;'>Toplam Hata</th>";
          html += "</tr>";
          html += "</thead>";
          html += "<tbody>";
          
          Object.entries(bolumSkorlari).forEach(([bolumKey, skor], index) => {
            if (skor && typeof skor === "object" && skor.toplam > 0) {
              const bolumTrials = trials.filter(t => t.bolum === bolumKey);
              const bolumHataliTrials = bolumTrials.filter(t => !t.correct);
              
              const impulsivite = bolumHataliTrials.filter(t => t.hataTuru === "impulsivite").length;
              const dikkatsizlik = bolumHataliTrials.filter(t => t.hataTuru === "dikkatsizlik").length;
              const karistirma = bolumHataliTrials.filter(t => t.hataTuru === "karistirma").length;
              const kategoriHatasi = bolumHataliTrials.filter(t => t.hataTuru === "kategori_hatasi").length;
              const toplamHata = bolumHataliTrials.length;
              
              const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
              
              html += `<tr style='background:${satirRengi};'>`;
              html += `<td style='padding:12px; font-weight:600; color:#2c3e50;'>${bolumAdlari[bolumKey] || bolumKey}</td>`;
              html += `<td style='padding:12px; text-align:center; color:#ff9800;'>${impulsivite}</td>`;
              html += `<td style='padding:12px; text-align:center; color:#f44336;'>${dikkatsizlik}</td>`;
              html += `<td style='padding:12px; text-align:center; color:#ff5722;'>${karistirma}</td>`;
              html += `<td style='padding:12px; text-align:center; color:#9c27b0;'>${kategoriHatasi}</td>`;
              html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>${toplamHata}</td>`;
              html += `</tr>`;
            }
          });
          
          html += "</tbody>";
          html += "</table>";
          html += "</div>";
          html += "<p style='margin-top:10px; font-size:12px; color:#666; font-style:italic;'>💡 Bu tablo, her bölümde yapılan hata türlerini gösterir. Hangi bölümde hangi tür hataların daha fazla yapıldığını görebilirsiniz.</p>";
        }
        
        // En çok hata yapılan renkler/şekiller tablosu
        const hataAnalizi = son.oyunDetaylari?.hataAnalizi || {};
        if (hataAnalizi.enCokHataRenkler && hataAnalizi.enCokHataRenkler.length > 0) {
          html += "<h4 style='margin-top:20px;'>🎨 En Çok Hata Yapılan Renkler</h4>";
          html += "<div style='overflow-x:auto;'>";
          html += "<table style='width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>";
          html += "<thead>";
          html += "<tr style='background:linear-gradient(135deg, #e53935 0%, #c62828 100%); color:white;'>";
          html += "<th style='padding:12px; text-align:left; border-radius:8px 0 0 0;'>Renk</th>";
          html += "<th style='padding:12px; text-align:center;'>Toplam Soru</th>";
          html += "<th style='padding:12px; text-align:center;'>Doğru</th>";
          html += "<th style='padding:12px; text-align:center;'>Hata</th>";
          html += "<th style='padding:12px; text-align:center; border-radius:0 8px 0 0;'>Hata Oranı</th>";
          html += "</tr>";
          html += "</thead>";
          html += "<tbody>";
          
          const renkKodlari = {
            "Kırmızı": "#e53935",
            "Mavi": "#2962ff",
            "Yeşil": "#43a047",
            "Sarı": "#fdd835",
            "Mor": "#8e24aa",
            "Turuncu": "#fb8c00",
            "Kahverengi": "#6d4c41",
            "Pembe": "#f06292"
          };
          
          hataAnalizi.enCokHataRenkler.forEach((renk, index) => {
            const renkKodu = renkKodlari[renk.renk] || "#cccccc";
            const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
            
            html += `<tr style='background:${satirRengi};'>`;
            html += `<td style='padding:12px; font-weight:600; color:#2c3e50; display:flex; align-items:center; gap:10px;'>`;
            html += `<div style='width:30px; height:30px; background:${renkKodu}; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border:2px solid ${renkKodu};'></div>`;
            html += `<span>${renk.renk}</span>`;
            html += `</td>`;
            html += `<td style='padding:12px; text-align:center; color:#333;'>${renk.toplam}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#4caf50; font-weight:600;'>${renk.dogru}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>${renk.hata}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>%${renk.hataOrani}</td>`;
            html += `</tr>`;
          });
          
          html += "</tbody>";
          html += "</table>";
          html += "</div>";
          html += "<p style='margin-top:10px; font-size:12px; color:#666; font-style:italic;'>💡 Bu tablo, hangi renklerde daha fazla hata yapıldığını gösterir. Yüksek hata oranı olan renkler için ekstra pratik önerilir.</p>";
        }
        
        if (hataAnalizi.enCokHataSekiller && hataAnalizi.enCokHataSekiller.length > 0) {
          html += "<h4 style='margin-top:20px;'>🔷 En Çok Hata Yapılan Şekiller</h4>";
          html += "<div style='overflow-x:auto;'>";
          html += "<table style='width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>";
          html += "<thead>";
          html += "<tr style='background:linear-gradient(135deg, #2962ff 0%, #1e40af 100%); color:white;'>";
          html += "<th style='padding:12px; text-align:left; border-radius:8px 0 0 0;'>Şekil</th>";
          html += "<th style='padding:12px; text-align:center;'>Toplam Soru</th>";
          html += "<th style='padding:12px; text-align:center;'>Doğru</th>";
          html += "<th style='padding:12px; text-align:center;'>Hata</th>";
          html += "<th style='padding:12px; text-align:center; border-radius:0 8px 0 0;'>Hata Oranı</th>";
          html += "</tr>";
          html += "</thead>";
          html += "<tbody>";
          
          const sekilIconlari = {
            "Üçgen": "▲",
            "Kare": "■",
            "Daire": "●",
            "Yıldız": "★",
            "Kalp": "♥",
            "Altıgen": "⬡",
            "Beşgen": "⬟",
            "Elmas": "◆"
          };
          
          hataAnalizi.enCokHataSekiller.forEach((sekil, index) => {
            const sekilIcon = sekilIconlari[sekil.sekil] || "■";
            const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
            
            html += `<tr style='background:${satirRengi};'>`;
            html += `<td style='padding:12px; font-weight:600; color:#2c3e50; display:flex; align-items:center; gap:10px;'>`;
            html += `<span style='font-size:24px;'>${sekilIcon}</span>`;
            html += `<span>${sekil.sekil}</span>`;
            html += `</td>`;
            html += `<td style='padding:12px; text-align:center; color:#333;'>${sekil.toplam}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#4caf50; font-weight:600;'>${sekil.dogru}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>${sekil.hata}</td>`;
            html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>%${sekil.hataOrani}</td>`;
            html += `</tr>`;
          });
          
          html += "</tbody>";
          html += "</table>";
          html += "</div>";
          html += "<p style='margin-top:10px; font-size:12px; color:#666; font-style:italic;'>💡 Bu tablo, hangi şekillerde daha fazla hata yapıldığını gösterir. Yüksek hata oranı olan şekiller için ekstra pratik önerilir.</p>";
        }
      }
    }
    
    // Renk hataları tablosu (sadece ayirt_etme oyunu için)
    if (oyunKod === "renk_ayirt_etme" || oyunKod === "ayirt_etme") {
      const renkHatalari = analizEtRenkHatalari(son.trials || []);
      if (renkHatalari && renkHatalari.length > 0) {
        html += "<h4 style='margin-top:20px;'>🎨 En Çok Hata Yapılan Renkler</h4>";
        html += "<div style='overflow-x:auto;'>";
        html += "<table style='width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>";
        html += "<thead>";
        html += "<tr style='background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color:white;'>";
        html += "<th style='padding:12px; text-align:left; border-radius:8px 0 0 0;'>Renk</th>";
        html += "<th style='padding:12px; text-align:center;'>Hata Sayısı</th>";
        html += "<th style='padding:12px; text-align:center;'>Hata Oranı</th>";
        html += "<th style='padding:12px; text-align:center; border-radius:0 8px 0 0;'>Görsel</th>";
        html += "</tr>";
        html += "</thead>";
        html += "<tbody>";
        
        renkHatalari.forEach((renk, index) => {
          const renkKodlari = {
            "Kırmızı": "#e53935",
            "Mavi": "#2962ff",
            "Yeşil": "#43a047",
            "Sarı": "#fdd835",
            "Mor": "#8e24aa",
            "Turuncu": "#fb8c00",
            "Kahverengi": "#6d4c41",
            "Pembe": "#f06292"
          };
          const renkKodu = renkKodlari[renk.renk] || "#cccccc";
          const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
          
          html += `<tr style='background:${satirRengi};'>`;
          html += `<td style='padding:12px; font-weight:600; color:#2c3e50;'>${renk.renk}</td>`;
          html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>${renk.hataSayisi}</td>`;
          html += `<td style='padding:12px; text-align:center; color:#e74c3c; font-weight:600;'>%${renk.hataOrani}</td>`;
          html += `<td style='padding:12px; text-align:center;'>`;
          html += `<div style='width:40px; height:40px; background:${renkKodu}; border-radius:8px; margin:0 auto; box-shadow:0 2px 4px rgba(0,0,0,0.2); border:2px solid ${renkKodu};'></div>`;
          html += `</td>`;
          html += `</tr>`;
        });
        
        html += "</tbody>";
        html += "</table>";
        html += "</div>";
        html += "<p style='margin-top:10px; font-size:12px; color:#666; font-style:italic;'>💡 Bu tablo, hangi renklerde daha fazla hata yapıldığını gösterir. Yüksek hata oranı olan renkler için ekstra pratik önerilir.</p>";
      }
    }
    
    if (html === "") {
      html = "<p>Bu oyun için özel performans metrikleri henüz hesaplanmadı.</p>";
    }
    
    oyunOzelListe.innerHTML = html;
    console.log("✅ Oyun özel liste oluşturuldu, HTML uzunluğu:", html.length);
  } else {
    console.error("❌ oyunOzelListe elementi bulunamadı!");
  }

  // Günlük hayat karşılığı (Oyun Özel) - Genişletilmiş
  const gunlukHayatOyun = document.getElementById("gunlukHayatOyun");
  if (gunlukHayatOyun) {
    let gunlukHayatMetni = "<h4 style='margin-top:0;'>💡 Günlük Hayat Karşılığı</h4>";
    
    // Eşleme oyunu için özel günlük hayat karşılıkları - 6 başlık
    if (oyunKod === "renk_esleme" || oyunKod === "esleme") {
      // gunlukHayatKarsiligi verilerini al
      const gunlukHayat = son.oyunDetaylari?.gunlukHayatKarsiligi || {};
      
      console.log("📊 gunlukHayatKarsiligi verisi:", gunlukHayat);
      console.log("📊 son.oyunDetaylari:", son.oyunDetaylari);
      
      // Verileri doğrudan gunlukHayatKarsiligi objesinden al
      // Bu veriler engine.oyunDetaylari.gunlukHayatKarsiligi içinde olmalı
      const kararVermeHizi = gunlukHayat.kararVermeHizi;
      const hataTipiAnalizi = gunlukHayat.hataTipiAnalizi;
      const gorselTarama = gunlukHayat.gorselTarama;
      const calismaBellegi = gunlukHayat.calismaBellegi;
      const mantik = gunlukHayat.mantik;
      const sosyalDuygusal = gunlukHayat.sosyalDuygusal;
      
      // Eğer veriler yoksa uyarı ver
      if (!gunlukHayat || Object.keys(gunlukHayat).length === 0) {
        console.warn("⚠ gunlukHayatKarsiligi verisi bulunamadı! Oyun sonu analizinde hesaplanmamış olabilir.");
      }
      
      // 6 başlık için günlük hayat karşılıkları
      const gunlukHayatListesi = [];
      
      // 1️⃣ Tepki Süresi → Karar Verme Hızı
      if (kararVermeHizi && kararVermeHizi.ortalamaMs !== undefined) {
        let aciklama = `Ortalama tepki süren ${kararVermeHizi.ortalamaMs}ms. `;
        // Seviye kontrolü: Hızlı/Orta/Yavaş
        if (kararVermeHizi.seviye === "Hızlı" || (kararVermeHizi.ortalamaMs < 1500)) {
          aciklama += "Hızlı tepki, acil durumlarda avantaj sağlar.";
        } else if (kararVermeHizi.seviye === "Yavaş" || (kararVermeHizi.ortalamaMs > 3000)) {
          aciklama += "Yavaş tepki, karar verme sürecinde zorlanma olabilir.";
        } else {
          aciklama += "Normal seviyede tepki hızı.";
        }
        gunlukHayatListesi.push({
          baslik: "Tepki Süresi → Karar Verme Hızı",
          aciklama,
          veri: kararVermeHizi
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Tepki Süresi → Karar Verme Hızı",
          aciklama: "Ortalama tepki süren, günlük hayatta karar verme hızını gösterir. Hızlı tepki, acil durumlarda avantaj sağlar.",
          veri: null
        });
      }
      
      // 2️⃣ Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı
      if (hataTipiAnalizi && hataTipiAnalizi.baskinTip !== undefined) {
        let aciklama = "";
        if (hataTipiAnalizi.baskinTip === "aceleci") {
          aciklama = `İmpulsivite hataları yüksek (${hataTipiAnalizi.impulsiviteOrani}%) → aceleci kararlar veriyorsun.`;
        } else if (hataTipiAnalizi.baskinTip === "dikkatsiz") {
          aciklama = `Dikkatsizlik hataları yüksek (${hataTipiAnalizi.dikkatsizlikOrani}%) → sınıf içi performansta sık dalgınlık görülebilir.`;
        } else {
          aciklama = "Hata türleri dengeli.";
        }
        gunlukHayatListesi.push({
          baslik: "Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı",
          aciklama,
          veri: hataTipiAnalizi
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı",
          aciklama: "İmpulsivite hataları yüksek → aceleci kararlar veriyorsun. Dikkatsizlik hataları yüksek → sınıf içi performansta sık dalgınlık görülebilir.",
          veri: null
        });
      }
      
      // 3️⃣ Görsel Tarama → Okuma Sırasında Satır Takibi
      if (gorselTarama && gorselTarama.seviye !== undefined) {
        let aciklama = `Görsel tarama becerin ${gorselTarama.seviye} seviyede. `;
        if (gorselTarama.seviye === "Yüksek") {
          aciklama += "Okuma sırasında satır takibi ve harf atlama sorunlarını azaltır.";
        } else if (gorselTarama.seviye === "Düşük") {
          aciklama += "Okuma sırasında satır takibi ve harf atlama sorunları görülebilir.";
        } else {
          aciklama += "Normal seviyede görsel tarama becerisi.";
        }
        gunlukHayatListesi.push({
          baslik: "Görsel Tarama → Okuma Sırasında Satır Takibi",
          aciklama,
          veri: gorselTarama
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Görsel Tarama → Okuma Sırasında Satır Takibi",
          aciklama: "Görsel tarama becerin, okuma sırasında satır takibi ve harf atlama sorunlarını azaltır.",
          veri: null
        });
      }
      
      // 4️⃣ Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi
      if (calismaBellegi && calismaBellegi.seviye !== undefined) {
        let aciklama = `Çalışma belleğin ${calismaBellegi.seviye} seviyede. `;
        if (calismaBellegi.seviye === "Yüksek") {
          aciklama += "Çok adımlı yönergeleri eksiksiz uygulayabilirsin.";
        } else if (calismaBellegi.seviye === "Düşük") {
          aciklama += "Çok adımlı yönergelerde zorlanma olabilir.";
        } else {
          aciklama += "Normal seviyede çalışma belleği.";
        }
        gunlukHayatListesi.push({
          baslik: "Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi",
          aciklama,
          veri: calismaBellegi
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi",
          aciklama: "Çalışma belleğin güçlüyse, çok adımlı yönergeleri eksiksiz uygulayabilirsin.",
          veri: null
        });
      }
      
      // 5️⃣ Mantık → Problem Çözme
      if (mantik && mantik.seviye !== undefined) {
        let aciklama = `Mantıksal düşünme becerin ${mantik.seviye} seviyede. `;
        if (mantik.seviye === "Yüksek") {
          aciklama += "Günlük problemleri çözmede ve karar vermede başarılısın.";
        } else if (mantik.seviye === "Düşük") {
          aciklama += "Günlük problemleri çözmede ve karar vermede zorlanma olabilir.";
        } else {
          aciklama += "Normal seviyede mantıksal düşünme.";
        }
        gunlukHayatListesi.push({
          baslik: "Mantık → Problem Çözme",
          aciklama,
          veri: mantik
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Mantık → Problem Çözme",
          aciklama: "Mantıksal düşünme becerin, günlük problemleri çözmede ve karar vermede önemlidir.",
          veri: null
        });
      }
      
      // 6️⃣ Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki
      if (sosyalDuygusal && sosyalDuygusal.profil !== undefined) {
        let aciklama = "";
        if (sosyalDuygusal.profil === "aceleci") {
          aciklama = `Aceleci profil (İmpulsivite: %${sosyalDuygusal.impulsiviteOrani}) → fevrilik / sabırsızlık görülebilir. Akran ilişkilerinde sabırlı olmak önemlidir.`;
        } else if (sosyalDuygusal.profil === "dikkati_dagilan") {
          aciklama = `Dikkati dağılan profil (Dikkatsizlik: %${sosyalDuygusal.dikkatsizlikOrani}) → iç/dış dikkat dağınıklığı görülebilir. Odaklanma becerilerini geliştirmek faydalı olabilir.`;
        } else {
          aciklama = "Dengeli profil → sosyal biliş becerin, akran ilişkilerinde ve uygun tepki vermede önemlidir.";
        }
        gunlukHayatListesi.push({
          baslik: "Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki",
          aciklama,
          veri: sosyalDuygusal
        });
      } else {
        gunlukHayatListesi.push({
          baslik: "Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki",
          aciklama: "Sosyal biliş becerin, akran ilişkilerinde ve uygun tepki vermede önemlidir.",
          veri: null
        });
      }
      
      gunlukHayatListesi.forEach((item, index) => {
        // Her başlık için performans verilerini al
        let performansBilgisi = "";
        let seviyeRenk = "#4caf50";
        let seviyeIcon = "✅";
        
        if (item.baslik === "Tepki Süresi → Karar Verme Hızı" && item.veri) {
          const kararVermeHizi = item.veri;
          if (kararVermeHizi.seviye === "Hızlı") {
            seviyeRenk = "#4caf50";
            seviyeIcon = "⚡";
          } else if (kararVermeHizi.seviye === "Yavaş") {
            seviyeRenk = "#f44336";
            seviyeIcon = "🐌";
          } else {
            seviyeRenk = "#ff9800";
            seviyeIcon = "➖";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Performans: ${kararVermeHizi.seviye}</strong><br>
            <span style='font-size:12px;color:#666;'>Ortalama: ${kararVermeHizi.ortalamaMs}ms${kararVermeHizi.enHizliTepki ? ` | En Hızlı: ${kararVermeHizi.enHizliTepki}ms | En Yavaş: ${kararVermeHizi.enYavasTepki}ms` : ""}</span>
          </div>`;
        } else if (item.baslik === "Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı" && item.veri) {
          const hataTipiAnalizi = item.veri;
          if (hataTipiAnalizi.baskinTip === "aceleci") {
            seviyeRenk = "#ff9800";
            seviyeIcon = "⚡";
          } else if (hataTipiAnalizi.baskinTip === "dikkatsiz") {
            seviyeRenk = "#f44336";
            seviyeIcon = "⚠️";
          } else {
            seviyeRenk = "#4caf50";
            seviyeIcon = "✅";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Profil: ${hataTipiAnalizi.baskinTip === "aceleci" ? "Aceleci" : hataTipiAnalizi.baskinTip === "dikkatsiz" ? "Dikkatsiz" : "Dengeli"}</strong><br>
            <span style='font-size:12px;color:#666;'>İmpulsivite: %${hataTipiAnalizi.impulsiviteOrani} (${hataTipiAnalizi.impulsiviteSayisi} hata) | Dikkatsizlik: %${hataTipiAnalizi.dikkatsizlikOrani} (${hataTipiAnalizi.dikkatsizlikSayisi} hata) | Toplam Yanlış: ${hataTipiAnalizi.toplamYanlis}</span>
          </div>`;
        } else if (item.baslik === "Görsel Tarama → Okuma Sırasında Satır Takibi" && item.veri) {
          const gorselTarama = item.veri;
          if (gorselTarama.seviye === "Yüksek") {
            seviyeRenk = "#4caf50";
            seviyeIcon = "✅";
          } else if (gorselTarama.seviye === "Düşük") {
            seviyeRenk = "#f44336";
            seviyeIcon = "⚠️";
          } else {
            seviyeRenk = "#ff9800";
            seviyeIcon = "➖";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Seviye: ${gorselTarama.seviye}</strong><br>
            <span style='font-size:12px;color:#666;'>Doğru Oranı: %${gorselTarama.dogruOran} | Ortalama Tepki: ${gorselTarama.ortalamaRT}ms | Zor Soru Sayısı: ${gorselTarama.soruSayisi}</span>
          </div>`;
        } else if (item.baslik === "Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi" && item.veri) {
          const calismaBellegi = item.veri;
          if (calismaBellegi.seviye === "Yüksek") {
            seviyeRenk = "#4caf50";
            seviyeIcon = "✅";
          } else if (calismaBellegi.seviye === "Düşük") {
            seviyeRenk = "#f44336";
            seviyeIcon = "⚠️";
          } else {
            seviyeRenk = "#ff9800";
            seviyeIcon = "➖";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Seviye: ${calismaBellegi.seviye}</strong><br>
            <span style='font-size:12px;color:#666;'>En Uzun Doğru Seri: ${calismaBellegi.enUzunDogruSeri} | İlk Yarı: %${calismaBellegi.ilkYariDogruOrani} | Son Yarı: %${calismaBellegi.sonYariDogruOrani} | Gelişim: ${calismaBellegi.gelisimFarki >= 0 ? "+" : ""}${calismaBellegi.gelisimFarki}%</span>
          </div>`;
        } else if (item.baslik === "Mantık → Problem Çözme" && item.veri) {
          const mantik = item.veri;
          if (mantik.seviye === "Yüksek") {
            seviyeRenk = "#4caf50";
            seviyeIcon = "✅";
          } else if (mantik.seviye === "Düşük") {
            seviyeRenk = "#f44336";
            seviyeIcon = "⚠️";
          } else {
            seviyeRenk = "#ff9800";
            seviyeIcon = "➖";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Seviye: ${mantik.seviye}</strong><br>
            <span style='font-size:12px;color:#666;'>Genel Doğru Oranı: %${mantik.genelDogruOran} | Zor Sorularda Doğru Oranı: %${mantik.zorDogruOran} | Toplam Soru: ${mantik.soruSayisi}</span>
          </div>`;
        } else if (item.baslik === "Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki" && item.veri) {
          const sosyalDuygusal = item.veri;
          if (sosyalDuygusal.profil === "aceleci") {
            seviyeRenk = "#ff9800";
            seviyeIcon = "⚡";
          } else if (sosyalDuygusal.profil === "dikkati_dagilan") {
            seviyeRenk = "#f44336";
            seviyeIcon = "⚠️";
          } else {
            seviyeRenk = "#4caf50";
            seviyeIcon = "✅";
          }
          performansBilgisi = `<div style='margin-top:8px; padding:8px; background:${seviyeRenk}15; border-radius:6px;'>
            <strong style='color:${seviyeRenk};'>${seviyeIcon} Profil: ${sosyalDuygusal.profil === "aceleci" ? "Aceleci" : sosyalDuygusal.profil === "dikkati_dagilan" ? "Dikkati Dağılan" : "Dengeli"}</strong><br>
            <span style='font-size:12px;color:#666;'>İmpulsivite: %${sosyalDuygusal.impulsiviteOrani} | Dikkatsizlik: %${sosyalDuygusal.dikkatsizlikOrani} | Toplam Yanlış: ${sosyalDuygusal.toplamYanlis}</span>
          </div>`;
        }
        
        gunlukHayatMetni += `<div style='padding:12px; margin:10px 0; background:#e8f5e9; border-left:4px solid ${seviyeRenk}; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>
          <strong style='font-size:15px;color:#1e3d59;'>${item.baslik}</strong><br>
          <span style='font-size:13px;color:#666;margin-top:4px;display:block;'>${item.aciklama}</span>
          ${performansBilgisi}
        </div>`;
      });
    } else {
      // Diğer oyunlar için genel günlük hayat karşılığı
      if (Object.keys(gosterilecekMetrikler).length > 0) {
        Object.keys(gosterilecekMetrikler).forEach(key => {
          const karsilik = GUNLUK_HAYAT_KARSILIKLARI[key] || 
                           Object.values(GUNLUK_HAYAT_KARSILIKLARI).find(k => k.metrik === key);
          if (karsilik) {
            gunlukHayatMetni += `<div style='padding:10px; margin:8px 0; background:#e8f5e9; border-left:4px solid #4caf50; border-radius:6px;'>
              <strong>${karsilik.karşılık}:</strong> ${karsilik.aciklama}
            </div>`;
          }
        });
      }
      
      if (gunlukHayatMetni === "<h4 style='margin-top:0;'>💡 Günlük Hayat Karşılığı</h4>") {
        gunlukHayatMetni += "<p>💡 Bu oyunun özel metrikleri, günlük hayattaki benzer görevlerdeki performansını yansıtır.</p>";
      }
    }
    
    gunlukHayatOyun.innerHTML = gunlukHayatMetni;
    gunlukHayatOyun.style.display = "block";
    console.log("✅ Günlük hayat karşılığı gösterildi");
  }
  
  console.log("✅ yukleOyunOzel tamamlandı");
}

// -------------------------------------------------------------
// 8) 📌 4. ZİHİN ALANLARI PERFORMANS SEKMESİ
// -------------------------------------------------------------
function yuklePerformans() {
  console.log("🔵 yuklePerformans çağrıldı");
  
  const cokluAlan = son.coklu_alan || {};
  const performansTabloBody = document.getElementById("performansTabloBody");
  
  console.log("📊 oyunMeta:", oyunMeta);
  console.log("📊 oyunKod:", oyunKod);
  console.log("📊 son.oyunDetaylari:", son.oyunDetaylari);
  
  if (performansTabloBody) {
    // Önce zihinselAlanlar'dan veri al (eşleme oyunu için)
    const zihinselAlanlar = son.oyunDetaylari?.zihinselAlanlar || {};
    const zihinselAlanMap = {
      "dikkat": "attention",
      "algisal_islemleme": "perception",
      "hafiza": "memory",
      "yuruteci_islev": "executive",
      "mantik": "logic",
      "okuma_dil": "literacy",
      "sosyal_bilis": "social"
    };
    
    // Oyunun modüllerini al (hangi alanlara veri gönderiyor)
    let moduller = oyunMeta.moduller || [];
    
    // Eğer moduller boşsa, son.moduller'den al
    if (moduller.length === 0) {
      moduller = son.moduller || [];
    }
    
    // Modül adlarını BRAIN_AREAS key'lerine çevir
    const modulMap = {
      "attention": "attention", "dikkat": "attention",
      "perception": "perception", "algisal_islemleme": "perception", "algisal": "perception",
      "executive": "executive", "yuruteci_islev": "executive", "yuruteci": "executive",
      "logic": "logic", "mantik": "logic", "mantiksal": "logic",
      "memory": "memory", "hafiza": "memory",
      "literacy": "literacy", "okuma": "literacy", "okuma_dil": "literacy",
      "dyslexia": "dyslexia", "disleksi": "dyslexia",
      "writing": "writing", "yazi": "writing",
      "math": "math", "matematik": "math",
      "emotional": "emotional", "duygusal": "emotional",
      "social": "social", "sosyal": "social", "sosyal_bilis": "social",
      "comprehension": "comprehension", "anlama": "comprehension"
    };
    
    // Önce zihinselAlanlar'dan veri al (eğer varsa) - ÖNCELİK 1
    let alanSkorlari = {};
    let gosterilecekAlanlar = [];
    
    if (Object.keys(zihinselAlanlar).length > 0) {
      // zihinselAlanlar varsa, direkt bunları kullan
      Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
        const brainAreaKey = zihinselAlanMap[key];
        if (brainAreaKey && BRAIN_AREAS[brainAreaKey]) {
          gosterilecekAlanlar.push(brainAreaKey);
          alanSkorlari[brainAreaKey] = Math.round(skor);
        }
      });
      console.log("✅ zihinselAlanlar'dan alınan skorlar:", alanSkorlari);
      console.log("✅ zihinselAlanlar'dan gösterilecek alanlar:", gosterilecekAlanlar);
    }
    
    // Eğer zihinselAlanlar yoksa, moduller'den al
    if (gosterilecekAlanlar.length === 0) {
      // Eğer moduller boşsa, son.moduller'den al
      if (moduller.length === 0) {
        moduller = son.moduller || [];
      }
      
      // Moduller'den gösterilecek alanları oluştur
      gosterilecekAlanlar = moduller.map(modul => {
        return modulMap[modul] || modul;
      }).filter(alanKey => {
        return BRAIN_AREAS[alanKey] !== undefined;
      });
      
      // coklu_alan'dan skorları al
      gosterilecekAlanlar.forEach(alanKey => {
        if (cokluAlan[alanKey] !== undefined) {
          alanSkorlari[alanKey] = Math.round(cokluAlan[alanKey]);
        }
      });
      console.log("✅ coklu_alan'dan alınan skorlar:", alanSkorlari);
    }
    
    console.log("📋 Gösterilecek alanlar:", gosterilecekAlanlar);
    console.log("📊 zihinselAlanlar:", zihinselAlanlar);
    console.log("📊 cokluAlan:", cokluAlan);
    console.log("📊 alanSkorlari:", alanSkorlari);
    
    if (gosterilecekAlanlar.length === 0) {
      performansTabloBody.innerHTML = "<tr><td colspan='5'>Bu oyun için zihin alanı verisi bulunamadı.</td></tr>";
      console.warn("⚠ Gösterilecek alan bulunamadı!");
    } else {
      let html = "";
      
      // Tabloyu oluştur
      gosterilecekAlanlar.forEach(alanKey => {
        const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
        const sonSkor = alanSkorlari[alanKey] || 0;
        const ortalama = sonSkor; // Geçmiş verilerden hesaplanacak (şimdilik aynı)
        const trend = son.trendMeta?.trend || "➖";
        const gunlukHayat = BRAIN_AREAS[alanKey]?.gunlukHayat || "-";
        html += `<tr>
          <td>${alanAd}</td>
          <td>${Math.round(sonSkor)}</td>
          <td>${Math.round(ortalama)}</td>
          <td>${trend}</td>
          <td>${gunlukHayat}</td>
        </tr>`;
      });
      
      performansTabloBody.innerHTML = html;
      console.log("✅ Performans tablosu oluşturuldu,", gosterilecekAlanlar.length, "alan gösterildi");
    }
  } else {
    console.error("❌ performansTabloBody elementi bulunamadı!");
  }
  
  console.log("✅ yuklePerformans tamamlandı");
}

// -------------------------------------------------------------
// 🟩 ZİHİNSEL PROFİL SEKMESİ (7 Alan + 8 Beceri)
// -------------------------------------------------------------
function yukleZihinselProfil() {
  console.log("🟩 ZİHİNSEL PROFİL sekmesi yükleniyor...");
  
  // Blok A: 7 Zihinsel Alan (Radar + Tablo)
  yukleZihinselAlanRadar();
  yukleZihinselAlanTablo();
  
  // Blok B: 8 Özel Performans Alanı (Kart Grid)
  yukleOzelPerformansKartlari();
}

// 7 Zihinsel Alan Radar Grafiği
function yukleZihinselAlanRadar() {
  const canvas = document.getElementById("zihinselAlanRadar");
  if (!canvas || !window.Chart) return;
  
  const zihinselAlanlar = son.oyunDetaylari?.zihinselAlanlar || {};
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  const labels = [];
  const data = [];
  
  Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
    labels.push(alanAdlari[key] || key);
    data.push(Math.round(skor));
  });
  
  if (labels.length === 0) {
    canvas.parentElement.innerHTML = "<p style='color:#999; text-align:center;'>Zihinsel alan verisi bulunamadı.</p>";
    return;
  }
  
  // Önceki chart'ı destroy et
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();
  
  new Chart(canvas, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "Zihinsel Alan Puanları",
        data: data,
        borderColor: "#1E88E5",
        backgroundColor: "rgba(30,136,229,0.2)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#1E88E5"
      }]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// 7 Zihinsel Alan Tablosu
function yukleZihinselAlanTablo() {
  const tabloBody = document.getElementById("zihinselAlanTabloBody");
  if (!tabloBody) return;
  
  const zihinselAlanlar = son.oyunDetaylari?.zihinselAlanlar || {};
  const alanAdlari = {
    dikkat: "Dikkat",
    algisal_islemleme: "Algısal İşlemleme",
    hafiza: "Hafıza",
    yuruteci_islev: "Yürütücü İşlev",
    mantik: "Mantık",
    okuma_dil: "Okuma-Dil",
    sosyal_bilis: "Sosyal Biliş"
  };
  
  const yorumlar = {
    dikkat: "Odaklanma ve dikkat gerektiren görevlerdeki performansınızı gösterir.",
    algisal_islemleme: "Görsel bilgileri işleme ve algılama becerinizi yansıtır.",
    hafiza: "Bellek ve bilgi saklama kapasitenizi gösterir.",
    yuruteci_islev: "Planlama, organizasyon ve problem çözme becerilerinizi yansıtır.",
    mantik: "Mantıksal düşünme ve akıl yürütme kapasitenizi gösterir.",
    okuma_dil: "Okuma ve dil becerilerinizdeki performansınızı yansıtır.",
    sosyal_bilis: "Sosyal durumları anlama ve empati kurma becerinizi gösterir."
  };
  
  let html = "";
  Object.entries(zihinselAlanlar).forEach(([key, skor]) => {
    const seviye = skor >= 80 ? "Yüksek" : skor >= 50 ? "Orta" : "Düşük";
    const renk = skor >= 80 ? "#4caf50" : skor >= 50 ? "#ff9800" : "#f44336";
    
    html += `<tr>
      <td style="font-weight:600;">${alanAdlari[key] || key}</td>
      <td style="text-align:center; font-weight:600;">${Math.round(skor)}</td>
      <td style="text-align:center;">
        <span style="display:inline-block; padding:4px 10px; background:${renk}20; color:${renk}; border-radius:12px; font-size:12px; font-weight:600;">
          ${seviye}
        </span>
      </td>
      <td style="font-size:13px; color:#666;">${yorumlar[key] || "Bu alan bilişsel performansınızı yansıtır."}</td>
    </tr>`;
  });
  
  tabloBody.innerHTML = html || "<tr><td colspan='4' style='text-align:center; color:#999;'>Veri bulunamadı.</td></tr>";
}

// 8 Özel Performans Alanı Kartları
function yukleOzelPerformansKartlari() {
  const kartlarEl = document.getElementById("ozelPerformansKartlari");
  if (!kartlarEl) return;
  
  const ozelPerformans = son.oyunDetaylari?.ozelPerformansAlanlari || {};
  const beceriAdlari = {
    renk_ayirt_etme: "Renk Ayırt Etme",
    sekil_tanima: "Şekil Tanıma",
    gorsel_kalip_algisi: "Görsel Kalıp Algısı",
    kategori_sinif_esleme: "Kategori / Sınıf Eşleme",
    gorsel_tamamlama: "Görsel Tamamlama",
    benzer_farkli_ayirt_etme: "Benzer – Farklı Ayırt Etme",
    detay_tarama_hizi: "Detay Tarama Hızı",
    yonluk_figur_zemin: "Yönlük / Figür–Zemin Algısı"
  };
  
  let html = "";
  Object.entries(ozelPerformans).forEach(([key, deger]) => {
    if (deger && typeof deger === "object" && deger.seviye) {
      const seviyeRenk = deger.seviye === "Yüksek" ? "#4caf50" : deger.seviye === "Düşük" ? "#f44336" : "#ff9800";
      
      html += `<div style="padding:15px; background:white; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:4px solid ${seviyeRenk};">
        <h4 style="margin:0 0 10px 0; color:#1e3d59; font-size:16px;">${beceriAdlari[key] || key}</h4>
        <div style="margin-bottom:8px;">
          <span style="display:inline-block; padding:4px 10px; background:${seviyeRenk}20; color:${seviyeRenk}; border-radius:12px; font-size:12px; font-weight:600;">
            ${deger.seviye}
          </span>
        </div>`;
      
      // Metrikler
      let metrikler = [];
      if (deger.dogruOran !== undefined) metrikler.push(`%${deger.dogruOran} doğru`);
      if (deger.ortalamaRT !== undefined && deger.ortalamaRT > 0) metrikler.push(`${deger.ortalamaRT}ms ort.`);
      if (deger.soruSayisi !== undefined) metrikler.push(`${deger.soruSayisi} soru`);
      
      if (metrikler.length > 0) {
        html += `<div style="font-size:13px; color:#666; margin-top:8px;">
          ${metrikler.join(" | ")}
        </div>`;
      }
      
      html += `</div>`;
    }
  });
  
  kartlarEl.innerHTML = html || "<p style='color:#999; text-align:center;'>Özel performans verisi bulunamadı.</p>";
}

// -------------------------------------------------------------
// 🟧 OYUN DETAYI & HATALAR SEKMESİ
// -------------------------------------------------------------
function yukleOyunDetay() {
  console.log("🟧 OYUN DETAYI sekmesi yükleniyor...");
  
  // Bölüm Bazlı Performans Tablosu
  yukleBolumBazliPerformans();
  
  // Hata Türü Dağılımı Grafiği
  yukleHataTuruDagilimi();
  
  // Bölüm Bazlı Hata Tablosu
  yukleBolumBazliHataTablo();
  
  // Soru Zaman Çizgisi
  yukleSoruZamanCizgisi();
}

// Bölüm Bazlı Performans Tablosu
function yukleBolumBazliPerformans() {
  const tabloEl = document.getElementById("bolumBazliPerformansTablo");
  if (!tabloEl) return;
  
  const bolumSkorlari = son.oyunDetaylari?.bolumSkorlari || {};
  const bolumAdlari = {
    renk: "🎨 Renk Eşleme",
    sekil: "🔷 Şekil Eşleme",
    golge: "🌑 Nesne-Gölge Eşleme",
    parca: "🧩 Parça-Bütün Eşleme"
  };
  
  if (Object.keys(bolumSkorlari).length === 0) {
    tabloEl.innerHTML = "<p style='color:#999;'>Bölüm bazlı veri bulunamadı.</p>";
    return;
  }
  
  let html = `<table style="width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <thead>
      <tr style="background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color:white;">
        <th style="padding:12px; text-align:left; border-radius:8px 0 0 0;">Bölüm</th>
        <th style="padding:12px; text-align:center;">Toplam Soru</th>
        <th style="padding:12px; text-align:center;">Doğru Oranı</th>
        <th style="padding:12px; text-align:center; border-radius:0 8px 0 0;">Seviye</th>
      </tr>
    </thead>
    <tbody>`;
  
  Object.entries(bolumSkorlari).forEach(([bolumKey, skor], index) => {
    if (skor && typeof skor === "object" && skor.toplam > 0) {
      const toplam = skor.toplam || 0;
      const dogru = skor.dogru || 0;
      const dogruOrani = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
      
      let seviye = "Düşük";
      let seviyeRenk = "#f44336";
      if (dogruOrani >= 80) {
        seviye = "Yüksek";
        seviyeRenk = "#4caf50";
      } else if (dogruOrani >= 50) {
        seviye = "Orta";
        seviyeRenk = "#ff9800";
      }
      
      const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
      
      html += `<tr style="background:${satirRengi};">
        <td style="padding:12px; font-weight:600; color:#2c3e50;">${bolumAdlari[bolumKey] || bolumKey}</td>
        <td style="padding:12px; text-align:center; color:#333;">${toplam}</td>
        <td style="padding:12px; text-align:center; color:#1e88e5; font-weight:600;">%${dogruOrani}</td>
        <td style="padding:12px; text-align:center;">
          <span style="display:inline-block; padding:4px 10px; background:${seviyeRenk}20; color:${seviyeRenk}; border-radius:12px; font-size:12px; font-weight:600;">
            ${seviye}
          </span>
        </td>
      </tr>`;
    }
  });
  
  html += `</tbody></table>`;
  tabloEl.innerHTML = html;
}

// Hata Türü Dağılımı Grafiği
function yukleHataTuruDagilimi() {
  const canvas = document.getElementById("hataTurleriGrafik");
  if (!canvas || !window.Chart) return;
  
  const temelSkor = son.temel_skor || {};
  let hataTurleri = temelSkor.hataTurleriDetay || temelSkor.hataTurleri || {};
  
  if (!hataTurleri || Object.keys(hataTurleri).length === 0) {
    const trials = son.trials || [];
    const hataliTrials = trials.filter(t => !t.correct);
    hataTurleri = {
      impulsivite: hataliTrials.filter(t => t.hataTuru === "impulsivite" || (t.reaction_ms < 300 && !t.correct)).length,
      karistirma: hataliTrials.filter(t => t.hataTuru === "karistirma" || (t.reaction_ms >= 300 && t.reaction_ms < 800 && !t.correct)).length,
      dikkatsizlik: hataliTrials.filter(t => t.hataTuru === "dikkatsizlik" || (t.reaction_ms >= 800 && !t.correct)).length,
      kategori_hatasi: hataliTrials.filter(t => t.hataTuru === "kategori_hatasi").length
    };
  }
  
  const toplam = (hataTurleri.impulsivite || 0) + (hataTurleri.karistirma || 0) + 
                 (hataTurleri.dikkatsizlik || 0) + (hataTurleri.kategori_hatasi || 0);
  
  if (toplam === 0) {
    canvas.parentElement.innerHTML = "<p style='color:#999; text-align:center;'>Hata verisi bulunamadı.</p>";
    return;
  }
  
  // Önceki chart'ı destroy et
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();
  
  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["İmpulsivite", "Karıştırma", "Dikkatsizlik", "Kategori Hatası"],
      datasets: [{
        data: [
          hataTurleri.impulsivite || 0,
          hataTurleri.karistirma || 0,
          hataTurleri.dikkatsizlik || 0,
          hataTurleri.kategori_hatasi || 0
        ],
        backgroundColor: ["#ff9800", "#ff5722", "#f44336", "#9c27b0"]
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
  
  // Baskın hata tipi
  const baskınEl = document.getElementById("baskinHataTipi");
  if (baskınEl) {
    const impulsiviteOran = ((hataTurleri.impulsivite || 0) / toplam) * 100;
    const dikkatsizlikOran = ((hataTurleri.dikkatsizlik || 0) / toplam) * 100;
    
    let baskın = "Dengeli";
    if (impulsiviteOran > 40) baskın = "Acelecilik";
    else if (dikkatsizlikOran > 40) baskın = "Dikkatsizlik";
    
    baskınEl.textContent = `Baskın hata tipi: ${baskın}`;
  }
}

// Bölüm Bazlı Hata Tablosu
function yukleBolumBazliHataTablo() {
  const tabloEl = document.getElementById("bolumBazliHataTablo");
  if (!tabloEl) return;
  
  const bolumSkorlari = son.oyunDetaylari?.bolumSkorlari || {};
  const trials = son.trials || [];
  const bolumAdlari = {
    renk: "🎨 Renk",
    sekil: "🔷 Şekil",
    golge: "🌑 Gölge",
    parca: "🧩 Parça"
  };
  
  if (Object.keys(bolumSkorlari).length === 0) {
    tabloEl.innerHTML = "<p style='color:#999;'>Bölüm bazlı hata verisi bulunamadı.</p>";
    return;
  }
  
  let html = `<table style="width:100%; border-collapse:collapse; margin-top:10px; background:white; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <thead>
      <tr style="background:linear-gradient(135deg, #e53935 0%, #c62828 100%); color:white;">
        <th style="padding:12px; text-align:left; border-radius:8px 0 0 0;">Bölüm</th>
        <th style="padding:12px; text-align:center;">Toplam Hata</th>
        <th style="padding:12px; text-align:center;">İmpulsivite Oranı</th>
        <th style="padding:12px; text-align:center; border-radius:0 8px 0 0;">Dikkatsizlik Oranı</th>
      </tr>
    </thead>
    <tbody>`;
  
  Object.entries(bolumSkorlari).forEach(([bolumKey, skor], index) => {
    if (skor && typeof skor === "object" && skor.toplam > 0) {
      const bolumTrials = trials.filter(t => t.bolum === bolumKey);
      const bolumHataliTrials = bolumTrials.filter(t => !t.correct);
      const toplamHata = bolumHataliTrials.length;
      
      const impulsivite = bolumHataliTrials.filter(t => t.hataTuru === "impulsivite").length;
      const dikkatsizlik = bolumHataliTrials.filter(t => t.hataTuru === "dikkatsizlik").length;
      
      const impulsiviteOran = toplamHata > 0 ? Math.round((impulsivite / toplamHata) * 100) : 0;
      const dikkatsizlikOran = toplamHata > 0 ? Math.round((dikkatsizlik / toplamHata) * 100) : 0;
      
      const satirRengi = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
      
      html += `<tr style="background:${satirRengi};">
        <td style="padding:12px; font-weight:600; color:#2c3e50;">${bolumAdlari[bolumKey] || bolumKey}</td>
        <td style="padding:12px; text-align:center; color:#e74c3c; font-weight:600;">${toplamHata}</td>
        <td style="padding:12px; text-align:center; color:#ff9800;">%${impulsiviteOran}</td>
        <td style="padding:12px; text-align:center; color:#f44336;">%${dikkatsizlikOran}</td>
      </tr>`;
    }
  });
  
  html += `</tbody></table>`;
  tabloEl.innerHTML = html;
}

// Soru Zaman Çizgisi
function yukleSoruZamanCizgisi() {
  const canvas = document.getElementById("soruZamanCizgisi");
  if (!canvas || !window.Chart) return;
  
  const trials = son.trials || [];
  if (trials.length === 0) {
    canvas.parentElement.innerHTML = "<p style='color:#999; text-align:center;'>Soru verisi bulunamadı.</p>";
    return;
  }
  
  const labels = trials.map((t, i) => `Soru ${i + 1}`);
  const data = trials.map(t => t.reaction_ms || 0);
  const colors = trials.map(t => t.correct ? "#4caf50" : "#f44336");
  
  // Önceki chart'ı destroy et
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();
  
  new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Tepki Süresi (ms)",
        data: data,
        borderColor: "#1E88E5",
        backgroundColor: "rgba(30,136,229,0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: colors,
        pointBorderColor: colors
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Tepki Süresi (ms)" }
        },
        x: {
          title: { display: true, text: "Soru Numarası" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const trial = trials[context.dataIndex];
              return `Tepki: ${context.parsed.y}ms | ${trial.correct ? "Doğru" : "Yanlış"}`;
            }
          }
        }
      }
    }
  });
}

// -------------------------------------------------------------
// 🟨 GÜNLÜK HAYAT KARŞILIĞI SEKMESİ (Sadece Metin + Seviye)
// -------------------------------------------------------------
function yukleGunlukHayat() {
  console.log("🟨 GÜNLÜK HAYAT sekmesi yükleniyor...");
  
  // ÜST BLOK: İkonlu Kutular
  yukleGunlukHayatIkonlari();
  
  // ALT BLOK: Açıklayıcı Paragraflar
  yukleGunlukHayatParagraflari();
}

// ÜST BLOK: 6 Başlık için İkonlu Kutular
function yukleGunlukHayatIkonlari() {
  const ikonlarEl = document.getElementById("gunlukHayatIkonlari");
  if (!ikonlarEl) return;
  
  const gunlukHayat = son.oyunDetaylari?.gunlukHayatKarsiligi || {};
  
  const basliklar = [
    { key: "kararVermeHizi", ikon: "⚡", baslik: "Karar Verme Hızı" },
    { key: "hataTipiAnalizi", ikon: "⚠️", baslik: "Hata Tipi Profili" },
    { key: "gorselTarama", ikon: "👁️", baslik: "Görsel Tarama" },
    { key: "calismaBellegi", ikon: "🧠", baslik: "Çalışma Belleği" },
    { key: "mantik", ikon: "💭", baslik: "Mantık" },
    { key: "sosyalDuygusal", ikon: "🤝", baslik: "Sosyal-Duygusal" }
  ];
  
  let html = "";
  basliklar.forEach(baslik => {
    const veri = gunlukHayat[baslik.key];
    if (!veri) return;
    
    let seviye = "Orta";
    let seviyeRenk = "#ff9800";
    
    if (baslik.key === "kararVermeHizi") {
      seviye = veri.seviye || "Orta";
      seviyeRenk = seviye === "Hızlı" ? "#4caf50" : seviye === "Yavaş" ? "#f44336" : "#ff9800";
    } else if (baslik.key === "hataTipiAnalizi") {
      const profil = veri.profil || "Dengeli";
      seviye = profil === "aceleci" ? "Aceleci" : profil === "dikkati_dagilan" ? "Dikkati Dağılan" : "Dengeli";
      seviyeRenk = profil === "aceleci" ? "#ff9800" : profil === "dikkati_dagilan" ? "#f44336" : "#4caf50";
    } else if (baslik.key === "gorselTarama" || baslik.key === "calismaBellegi" || baslik.key === "mantik") {
      seviye = veri.seviye || "Orta";
      seviyeRenk = seviye === "Yüksek" ? "#4caf50" : seviye === "Düşük" ? "#f44336" : "#ff9800";
    } else if (baslik.key === "sosyalDuygusal") {
      const profil = veri.profil || "Dengeli";
      seviye = profil === "aceleci" ? "Aceleci" : profil === "dikkati_dagilan" ? "Dikkati Dağılan" : "Dengeli";
      seviyeRenk = profil === "aceleci" ? "#ff9800" : profil === "dikkati_dagilan" ? "#f44336" : "#4caf50";
    }
    
    html += `<div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); text-align:center;">
      <div style="font-size:48px; margin-bottom:10px;">${baslik.ikon}</div>
      <h4 style="margin:0 0 10px 0; color:#1e3d59; font-size:16px;">${baslik.baslik}</h4>
      <span style="display:inline-block; padding:6px 14px; background:${seviyeRenk}20; color:${seviyeRenk}; border-radius:20px; font-size:14px; font-weight:600; border:2px solid ${seviyeRenk}40;">
        ${seviye}
      </span>
    </div>`;
  });
  
  ikonlarEl.innerHTML = html || "<p style='color:#999; text-align:center;'>Günlük hayat verisi bulunamadı.</p>";
}

// ALT BLOK: Açıklayıcı Paragraflar (2-4 cümle, sayısal veri yok)
function yukleGunlukHayatParagraflari() {
  const detaylarEl = document.getElementById("gunlukHayatDetaylari");
  if (!detaylarEl) return;
  
  const gunlukHayat = son.oyunDetaylari?.gunlukHayatKarsiligi || {};
  
  const basliklar = [
    {
      key: "kararVermeHizi",
      ikon: "⚡",
      baslik: "Tepki Süresi → Karar Verme Hızı",
      aciklama: "Ortalama tepki süren, günlük hayatta karar verme hızını gösterir. Hızlı tepki, acil durumlarda avantaj sağlar. Düşünmeden karar verme eğilimi varsa, daha dikkatli olmak gerekebilir. Karar verme hızı, günlük yaşamdaki performansı doğrudan etkiler."
    },
    {
      key: "hataTipiAnalizi",
      ikon: "⚠️",
      baslik: "Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı",
      aciklama: "İmpulsivite hataları yüksekse, aceleci kararlar veriyorsun demektir. Bu durum sınıf içi performansta düşünmeden cevap verme şeklinde görülebilir. Dikkatsizlik hataları yüksekse, sınıf içi performansta sık dalgınlık görülebilir. Her iki durumda da farkındalık ve pratik ile geliştirilebilir."
    },
    {
      key: "gorselTarama",
      ikon: "👁️",
      baslik: "Görsel Tarama → Okuma Sırasında Satır Takibi",
      aciklama: "Görsel tarama becerin, okuma sırasında satır takibi ve harf atlama sorunlarını azaltır. Bu beceri, görsel bilgileri hızlı ve doğru şekilde işleme kapasiteni gösterir. Görsel tarama güçlüyse, okuma ve yazma görevlerinde daha başarılı olursun. Günlük hayatta görsel bilgileri takip etmede avantaj sağlar."
    },
    {
      key: "calismaBellegi",
      ikon: "🧠",
      baslik: "Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi",
      aciklama: "Çalışma belleğin güçlüyse, çok adımlı yönergeleri eksiksiz uygulayabilirsin. Bu beceri, bilgileri kısa süreli hafızada tutma ve işleme kapasiteni gösterir. Çalışma belleği zayıfsa, karmaşık görevlerde zorlanabilirsin. Günlük hayatta planlama ve organizasyon gerektiren görevlerde önemlidir."
    },
    {
      key: "mantik",
      ikon: "💭",
      baslik: "Mantık → Problem Çözme",
      aciklama: "Mantıksal düşünme becerin, günlük problemleri çözmede ve karar vermede önemlidir. Bu beceri, neden-sonuç ilişkilerini kurma ve analitik düşünme kapasiteni gösterir. Mantık güçlüyse, problem çözme ve karar verme görevlerinde daha başarılı olursun. Günlük hayatta karşılaştığın sorunları çözmede avantaj sağlar."
    },
    {
      key: "sosyalDuygusal",
      ikon: "🤝",
      baslik: "Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki",
      aciklama: "Sosyal biliş becerin, akran ilişkilerinde ve uygun tepki vermede önemlidir. Bu beceri, sosyal durumları anlama ve empati kurma kapasiteni gösterir. Sosyal biliş güçlüyse, akran ilişkilerinde daha başarılı olursun. Günlük hayatta sosyal durumlarda uygun tepki vermede avantaj sağlar."
    }
  ];
  
  let html = "";
  basliklar.forEach(baslik => {
    const veri = gunlukHayat[baslik.key];
    if (!veri) return;
    
    let seviye = "Orta";
    let seviyeRenk = "#ff9800";
    
    if (baslik.key === "kararVermeHizi") {
      seviye = veri.seviye || "Orta";
      seviyeRenk = seviye === "Hızlı" ? "#4caf50" : seviye === "Yavaş" ? "#f44336" : "#ff9800";
    } else if (baslik.key === "hataTipiAnalizi") {
      const profil = veri.profil || "Dengeli";
      seviye = profil === "aceleci" ? "Aceleci" : profil === "dikkati_dagilan" ? "Dikkati Dağılan" : "Dengeli";
      seviyeRenk = profil === "aceleci" ? "#ff9800" : profil === "dikkati_dagilan" ? "#f44336" : "#4caf50";
    } else if (baslik.key === "gorselTarama" || baslik.key === "calismaBellegi" || baslik.key === "mantik") {
      seviye = veri.seviye || "Orta";
      seviyeRenk = seviye === "Yüksek" ? "#4caf50" : seviye === "Düşük" ? "#f44336" : "#ff9800";
    } else if (baslik.key === "sosyalDuygusal") {
      const profil = veri.profil || "Dengeli";
      seviye = profil === "aceleci" ? "Aceleci" : profil === "dikkati_dagilan" ? "Dikkati Dağılan" : "Dengeli";
      seviyeRenk = profil === "aceleci" ? "#ff9800" : profil === "dikkati_dagilan" ? "#f44336" : "#4caf50";
    }
    
    html += `<div style="padding:20px; margin:15px 0; background:white; border-left:4px solid ${seviyeRenk}; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <span style="font-size:32px;">${baslik.ikon}</span>
        <div>
          <h4 style="margin:0; color:#1e3d59; font-size:18px;">${baslik.baslik}</h4>
          <span style="display:inline-block; padding:4px 12px; background:${seviyeRenk}20; color:${seviyeRenk}; border-radius:12px; font-size:13px; font-weight:600; margin-top:5px;">
            ${seviye}
          </span>
        </div>
      </div>
      <p style="margin:0; color:#555; font-size:15px; line-height:1.8;">${baslik.aciklama}</p>
    </div>`;
  });
  
  detaylarEl.innerHTML = html || "<p style='color:#999; text-align:center; padding:20px;'>Günlük hayat verisi bulunamadı.</p>";
}

// -------------------------------------------------------------
// 10) 💬 ÖĞRETMEN YORUMLARI SİSTEMİ
// -------------------------------------------------------------
// teacherID zaten yukarıda tanımlı (satır 51)
const studentId = role === ROLES.OGRENCI ? localStorage.getItem("uid") || localStorage.getItem("studentID") : aktifOgrenciId;
let currentGameResultId = null;

// Yorum sistemi initSonucSayfasi içinde çağrılacak
function yukleYorumSistemi() {
  if (!son) return;
  
  // Oyun sonucu ID'sini al (localStorage'dan veya son kayıttan)
  if (son.id) {
    currentGameResultId = son.id;
  } else {
    // Eğer ID yoksa, timestamp ve oyun kodundan oluştur
    currentGameResultId = `${son.oyun}_${son.timestamp || Date.now()}`;
  }
  
  // Öğretmen için yorum yazma alanını göster
  if (role === ROLES.OGRETMEN && teacherID && studentId) {
    const yorumYazmaAlani = document.getElementById("yorumYazmaAlani");
    if (yorumYazmaAlani) {
      yorumYazmaAlani.style.display = "block";
    }

    const yorumGonderBtn = document.getElementById("yorumGonderBtn");
    if (yorumGonderBtn) {
      yorumGonderBtn.onclick = async () => {
        await yorumGonder();
      };
    }
  }
}

// -------------------------------------------------------------
// 9) 📌 DOMContentLoaded - Tüm Sayfayı Başlat
// -------------------------------------------------------------
// Sekme yönetimini başlat (geriye uyumluluk için - onclick zaten HTML'de)
function initSekmeYonetimi() {
  console.log("initSekmeYonetimi çağrıldı (onclick zaten HTML'de)");
  // HTML'de onclick kullanıldığı için burada ek bir şey yapmaya gerek yok
}

// Sekme yönetimini ve içerikleri yükle
function baslatSayfa() {
  console.log("baslatSayfa çağrıldı, readyState:", document.readyState);
  console.log("son verisi:", son);
  
  // Önce içerikleri yükle
  initSonucSayfasi();
  
  // Sonra sekme yönetimini başlat
  initSekmeYonetimi();
  
  // Yorumları yükle
  yukleYorumlar();
}

// DOM hazır olduğunda çalıştır
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded tetiklendi");
    baslatSayfa();
  });
} else {
  // DOM zaten hazır
  console.log("DOM zaten hazır, hemen başlatılıyor");
  // setTimeout ile biraz bekle (header.js gibi diğer scriptler yüklenebilsin)
  setTimeout(() => {
    baslatSayfa();
  }, 300);
}

async function yukleYorumlar() {
  if (!studentId || !currentGameResultId) return;

  const yorumListesi = document.getElementById("yorumListesi");
  if (!yorumListesi) return;

  yorumListesi.innerHTML = "<p style='color:#999;text-align:center;'>Yorumlar yükleniyor...</p>";

  try {
    const yorumlar = await getCommentsByGameResult(studentId, currentGameResultId);

    if (!yorumlar.length) {
      yorumListesi.innerHTML = "<p style='color:#999;text-align:center;'>Henüz yorum yok.</p>";
      return;
    }

    yorumListesi.innerHTML = "";

    yorumlar.forEach(yorum => {
      const yorumDiv = document.createElement("div");
      yorumDiv.className = "yorum-item";

      const tarih = yorum.timestamp ? 
        new Date(yorum.timestamp).toLocaleString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) : "Tarih bilinmiyor";

      const isMyComment = role === ROLES.OGRETMEN && teacherID === yorum.teacherId;

      yorumDiv.innerHTML = `
        <div class="yorum-header">
          <div>
            <span class="yorum-ogretmen">👨‍🏫 ${yorum.teacherName || "Öğretmen"}</span>
            ${yorum.edited ? '<span style="font-size:11px;color:#999;margin-left:5px;">(Düzenlendi)</span>' : ''}
          </div>
          <div>
            <span class="yorum-tarih">${tarih}</span>
            ${isMyComment ? `
              <button class="yorum-duzenle-btn" data-comment-id="${yorum.id}">Düzenle</button>
              <button class="yorum-sil-btn" data-comment-id="${yorum.id}">Sil</button>
            ` : ''}
          </div>
        </div>
        <div class="yorum-text">${yorum.text}</div>
      `;

      // Düzenle ve sil butonları
      if (isMyComment) {
        const duzenleBtn = yorumDiv.querySelector(".yorum-duzenle-btn");
        const silBtn = yorumDiv.querySelector(".yorum-sil-btn");

        if (duzenleBtn) {
          duzenleBtn.onclick = () => yorumDuzenle(yorum.id, yorum.text);
        }

        if (silBtn) {
          silBtn.onclick = () => yorumSil(yorum.id);
        }
      }

      yorumListesi.appendChild(yorumDiv);
    });

  } catch (err) {
    console.error("❌ Yorumlar yüklenemedi:", err);
    yorumListesi.innerHTML = "<p style='color:#f44336;text-align:center;'>Yorumlar yüklenirken bir hata oluştu.</p>";
  }
}

async function yorumGonder() {
  const yorumInput = document.getElementById("yorumInput");
  if (!yorumInput || !teacherID || !studentId || !currentGameResultId) return;

  const text = yorumInput.value.trim();
  if (!text) {
    alert("Lütfen bir yorum yazın.");
    return;
  }

  const gonderBtn = document.getElementById("yorumGonderBtn");
  if (gonderBtn) {
    gonderBtn.disabled = true;
    gonderBtn.textContent = "Gönderiliyor...";
  }

  const result = await addComment(studentId, currentGameResultId, teacherID, text);

  if (gonderBtn) {
    gonderBtn.disabled = false;
    gonderBtn.textContent = "Yorum Gönder";
  }

  if (result.success) {
    yorumInput.value = "";
    await yukleYorumlar();
  } else {
    alert("Yorum gönderilemedi: " + result.message);
  }
}

async function yorumDuzenle(commentId, currentText) {
  const newText = prompt("Yorumu düzenleyin:", currentText);
  if (!newText || newText.trim() === currentText) return;

  const result = await updateComment(studentId, commentId, newText.trim(), teacherID);
  
  if (result.success) {
    await yukleYorumlar();
  } else {
    alert("Yorum güncellenemedi: " + result.message);
  }
}

async function yorumSil(commentId) {
  if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

  const result = await deleteComment(studentId, commentId, teacherID);
  
  if (result.success) {
    await yukleYorumlar();
  } else {
    alert("Yorum silinemedi: " + result.message);
  }
}

// -------------------------------------------------------------
// 11) 🔁 Eski Radar Grafik (Geriye Uyumluluk)
// -------------------------------------------------------------
const radarCanvas = document.getElementById("radarGrafik");
if (radarCanvas && window.Chart) {
  // Önceki chart'ı destroy et (varsa)
  const existingChart = Chart.getChart(radarCanvas);
  if (existingChart) {
    existingChart.destroy();
  }

  const scale = (window.devicePixelRatio || 1) * 1.25;
  radarCanvas.width = radarCanvas.clientWidth * scale;
  radarCanvas.height = radarCanvas.clientHeight * scale;
  const ctx = radarCanvas.getContext("2d");
  if (ctx) {
    ctx.scale(scale, scale);
  }

  new Chart(radarCanvas, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
      datasets: [{
          label: "Bilişsel Profil",
          data: [reaction, inhib, sustain],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  });
}

console.log("📘 sonuc.js yüklendi (v8.0 — Yeni Şema Desteği)");

// ============================================================
// 🎨 RENK HATALARI ANALİZ FONKSİYONU
// ============================================================
function analizEtRenkHatalari(trials) {
  if (!trials || !Array.isArray(trials) || trials.length === 0) {
    return [];
  }
  
  // Hatalı trial'ları filtrele ve renk bazında grupla
  const renkHatalari = {};
  const toplamHata = trials.filter(t => !t.correct).length;
  
  if (toplamHata === 0) {
    return [];
  }
  
  trials.forEach(trial => {
    // Sadece hatalı trial'ları say
    if (!trial.correct && trial.hedefRenk) {
      const renk = trial.hedefRenk;
      if (!renkHatalari[renk]) {
        renkHatalari[renk] = {
          renk: renk,
          hataSayisi: 0,
          toplamDeneme: 0
        };
      }
      renkHatalari[renk].hataSayisi++;
    }
    
    // Toplam deneme sayısını da hesapla (doğru + yanlış)
    if (trial.hedefRenk) {
      const renk = trial.hedefRenk;
      if (!renkHatalari[renk]) {
        renkHatalari[renk] = {
          renk: renk,
          hataSayisi: 0,
          toplamDeneme: 0
        };
      }
      renkHatalari[renk].toplamDeneme++;
    }
  });
  
  // Hata oranını hesapla ve sırala
  const sonuc = Object.values(renkHatalari)
    .filter(r => r.hataSayisi > 0) // Sadece hata yapılan renkleri göster
    .map(r => ({
      renk: r.renk,
      hataSayisi: r.hataSayisi,
      toplamDeneme: r.toplamDeneme,
      hataOrani: r.toplamDeneme > 0 ? Math.round((r.hataSayisi / r.toplamDeneme) * 100) : 0
    }))
    .sort((a, b) => b.hataSayisi - a.hataSayisi); // En çok hatadan en aza sırala
  
  console.log("🎨 Renk hataları analizi:", sonuc);
  return sonuc;
}
