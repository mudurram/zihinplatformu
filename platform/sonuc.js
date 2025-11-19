// ==================================================================
// 📌 Zihin Platformu — Ortak Sonuç JS (v8.0 - Yeni Şema Desteği)
// 4 Sekmeli Analiz: Temel Skor, Çoklu Alan, Oyun Özel, Performans
// ==================================================================

import { GLOBAL, ROLES, BRAIN_AREAS, GUNLUK_HAYAT_KARSILIKLARI } from "./globalConfig.js";
import { aiAdvice } from "../engine/aiAdvisor.js";
import { addComment, getCommentsByGameResult, updateComment, deleteComment } from "../data/commentService.js";
import { db } from "../data/firebaseConfig.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Öğretmen, Kurum ve Admin için öğrenci seçimi kontrolü
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  if (role === ROLES.OGRETMEN) {
    alert("ℹ Önce bir öğrenci seçmeniz gerekiyor.");
    window.location.href = "teacher_panel.html";
  } else if (role === ROLES.INSTITUTION) {
    alert("ℹ Önce bir öğrenci seçmeniz gerekiyor.");
    window.location.href = "institution_panel.html";
  } else if (role === ROLES.ADMIN) {
    alert("ℹ Önce bir öğrenci seçmeniz gerekiyor.");
    window.location.href = "admin_panel.html";
  }
  throw new Error("Öğrenci seçilmeden sonuç ekranına erişilemez.");
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

    // Öğretmen için: profiles/{teacherID}/ogrenciler/{ogrenciID}/oyunSonuclari
    if (role === ROLES.OGRETMEN && teacherID) {
      yol = collection(
        db,
        "profiles",
        teacherID,
        "ogrenciler",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }
    // Kurum ve Admin için: profiles/{ogrenciID}/oyunSonuclari (direkt öğrenci profili)
    else if (role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
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
    const gecmisStr = localStorage.getItem("oyunGecmisi");
    if (gecmisStr) {
      gecmis = JSON.parse(gecmisStr);
      if (!Array.isArray(gecmis)) {
        console.warn("⚠ oyunGecmisi dizi değil, sıfırlandı.");
        gecmis = [];
      } else {
        console.log("📦 localStorage'dan oyunGecmisi okundu:", gecmis.length, "kayıt");
      }
    } else {
      console.warn("⚠ localStorage'da oyunGecmisi bulunamadı.");
      gecmis = [];
    }
  } catch (err) {
    console.error("❌ oyunGecmisi parse hatası:", err);
    console.warn("⚠ oyunGecmisi bozuk → sıfırlandı.");
    gecmis = [];
  }

  return gecmis.at(-1) || null;
}

// Öğrenci için Firestore'dan sonuç çek
async function yukleOgrenciSonuc() {
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
  // Öğretmen/Kurum/Admin için Firestore'dan yükle
  yukleFirestoreSonuc().then(firestoreSonuc => {
    if (firestoreSonuc) {
      son = firestoreSonuc;
      console.log("📊 Son oyun sonucu (Firestore):", son);
      baslatSayfa();
    } else {
      // Firestore'da yoksa localStorage'dan dene
      son = yukleLocalSonuc();
      if (son) {
        console.log("📊 Son oyun sonucu (LocalStorage):", son);
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
    }
  });
} else if (role === ROLES.OGRENCI) {
  // Öğrenci için önce Firestore, sonra LocalStorage
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
  
  // İçerikleri yükle
  yukleTemelSkor();
  yukleCokluAlan();
  yukleOyunOzel();
  yuklePerformans();
  
  // Yorum sistemini başlat
  yukleYorumSistemi();
}

// -------------------------------------------------------------
// 5) 📌 1. TEMEL SKOR SEKMESİ
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
  const dogruSayi = son.dogru ?? temelSkor.dogru ?? 0;
  const yanlisSayi = son.yanlis ?? temelSkor.yanlis ?? 0;
  
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
  // Önce temel_skor'dan, sonra ana objeden, sonra timeElapsed'dan
  let sureDegeri = temelSkor.sure || son.sure || son.timeElapsed || 0;
  
  // Eğer hiçbiri yoksa, timeLimit'ten hesapla (varsa)
  if (!sureDegeri && son.timeLimit) {
    sureDegeri = son.timeLimit;
  }
  
  if (sureEl) {
    sureEl.textContent = sureDegeri > 0 ? `${Math.round(sureDegeri)} saniye` : "-";
    console.log("Süre yazıldı:", sureDegeri);
  }
  
  // Ortalama tepki süresi (ms cinsinden)
  // Önce temel_skor'dan, sonra trials'dan hesapla
  let ortalamaTepkiMs = temelSkor.ortalamaTepki || temelSkor.reaction_avg || null;
  
  // Eğer temel_skor'da yoksa, trials'dan hesapla
  if (!ortalamaTepkiMs && Array.isArray(son.trials) && son.trials.length > 0) {
    const dogruTrials = son.trials.filter(t => t.correct && typeof t.reaction_ms === "number");
    if (dogruTrials.length > 0) {
      const toplam = dogruTrials.reduce((sum, t) => sum + (t.reaction_ms || 0), 0);
      ortalamaTepkiMs = Math.round(toplam / dogruTrials.length);
      console.log("Ortalama tepki trials'dan hesaplandı:", ortalamaTepkiMs);
    }
  }
  
  if (ortalamaTepkiEl) {
    ortalamaTepkiEl.textContent = ortalamaTepkiMs ? `${Math.round(ortalamaTepkiMs)} ms` : "-";
    console.log("Ortalama tepki yazıldı:", ortalamaTepkiMs);
  }
  
  // Öğrenme hızı (0-100 arası)
  let ogrenmeHiziDegeri = temelSkor.ogrenmeHizi || temelSkor.learning_velocity || null;
  
  // Eğer temel_skor'da yoksa, hesapla
  if (ogrenmeHiziDegeri === null && Array.isArray(son.trials) && son.trials.length >= 4) {
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

  // Günlük hayat karşılığı (Temel)
  const gunlukHayatTemel = document.getElementById("gunlukHayatTemel");
  if (gunlukHayatTemel && ortalamaTepkiMs) {
    const ms = ortalamaTepkiMs;
    let yorum = "";
    if (ms < 400) yorum = "⚡ Karar verme hızın çok iyi. Günlük hayatta hızlı tepki gerektiren durumlarda başarılısın.";
    else if (ms < 600) yorum = "⚡ Karar verme hızın normal seviyede. Pratikle daha da gelişebilir.";
    else yorum = "⚡ Karar verme hızın düşük. Acele etmeden düşünerek karar vermek faydalı olacaktır.";
    gunlukHayatTemel.textContent = yorum;
    gunlukHayatTemel.style.display = "block";
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
      // Eğer coklu_alan boşsa, oyun meta'dan hesapla
      let gosterilecekAlan = {};
      
      // Önce mevcut coklu_alan'dan sadece gösterilecek alanları al
      gosterilecekAlanlar.forEach(alanKey => {
        if (cokluAlan[alanKey] !== undefined) {
          gosterilecekAlan[alanKey] = cokluAlan[alanKey];
        }
      });
      
      // Eğer hiç veri yoksa, hesapla
      if (Object.keys(gosterilecekAlan).length === 0) {
        console.log("⚠ coklu_alan boş, oyun meta'dan hesaplanıyor...");
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
        
        console.log("✅ Hesaplanan coklu_alan:", gosterilecekAlan);
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

    // Eğer coklu_alan boşsa, hesapla
    let gosterilecekAlanRadar = {};
    gosterilecekAlanlarRadar.forEach(alanKey => {
      if (cokluAlan[alanKey] !== undefined) {
        gosterilecekAlanRadar[alanKey] = cokluAlan[alanKey];
      }
    });
    
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
  
  // Sadece gösterilecek alanlar için veri topla
  let gosterilecekAlanFinal = {};
  gosterilecekAlanlarFinal.forEach(alanKey => {
    if (cokluAlan[alanKey] !== undefined) {
      gosterilecekAlanFinal[alanKey] = cokluAlan[alanKey];
    }
  });
  
  // Eğer coklu_alan boşsa, hesapla
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
    const enYuksek = Object.entries(gosterilecekAlanFinal).sort((a, b) => b[1] - a[1])[0];
    if (enYuksek) {
      const alanAd = BRAIN_AREAS[enYuksek[0]]?.ad || enYuksek[0];
      gunlukHayatCoklu.textContent = `💡 En güçlü alanın: ${alanAd} (${Math.round(enYuksek[1])}/100). Bu alan günlük hayatta problem çözme ve öğrenme süreçlerinde avantaj sağlar.`;
      gunlukHayatCoklu.style.display = "block";
      console.log("✅ Günlük hayat karşılığı gösterildi");
    }
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
  let hataTurleri = temelSkor.hataTurleri || {};
  if (!hataTurleri || Object.keys(hataTurleri).length === 0 || !hataTurleri.toplam) {
    console.log("⚠ hataTurleri boş, trials'dan hesaplanıyor...");
    const trials = son.trials || [];
    const hataliTrials = trials.filter(t => !t.correct);
    hataTurleri = {
      impulsivite: hataliTrials.filter(t => t.reaction_ms < 300).length,
      karistirma: hataliTrials.filter(t => t.reaction_ms >= 300 && t.reaction_ms < 800).length,
      dikkatsizlik: hataliTrials.filter(t => t.reaction_ms >= 800).length,
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
  
    // Oyun özel beceriler - Sadece performansKeys'de olan beceriler
    const performansKeysForBeceriler = performansKeys;
    
    if (oyunOzelBeceriler.length > 0) {
      html += "<h4 style='margin-top:0;'>🎯 Oyun Özel Beceriler</h4>";
      html += "<ul style='list-style:none; padding:0;'>";
      oyunOzelBeceriler.forEach(beceri => {
        // Performans key'lerinden ilgili değeri bul
        // Beceri ID'sini performans key'lerine eşleştir
        let deger = "-";
        let ilgiliKey = null;
        
        // Önce doğrudan eşleşme dene (beceri.id performansKeys'de var mı?)
        if (performansKeysForBeceriler.includes(beceri.id)) {
          ilgiliKey = beceri.id;
          deger = oyunOzel[beceri.id];
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
        if (deger !== "-" && ilgiliKey && performansKeysForBeceriler.includes(ilgiliKey)) {
          const skor = typeof deger === 'number' ? Math.round(deger) : deger;
          const birim = typeof deger === 'number' && (ilgiliKey.includes('accuracy') || ilgiliKey.includes('score') || ilgiliKey.includes('discrimination')) ? '%' : 
                        ilgiliKey.includes('time') ? ' ms' : 
                        ilgiliKey.includes('speed') ? ' işlem/sn' : '';
          html += `<li style='padding:10px; margin:8px 0; background:#f0f8ff; border-radius:8px; border-left:4px solid #4a90e2;'>
            <strong>${beceri.ad}:</strong> <span style='color:#1e88e5;font-weight:600;'>${skor}${birim}</span>
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

  // Günlük hayat karşılığı (Oyun Özel) - Sadece gösterilen metrikler için
  const gunlukHayatOyun = document.getElementById("gunlukHayatOyun");
  if (gunlukHayatOyun && Object.keys(gosterilecekMetrikler).length > 0) {
    let gunlukHayatMetni = "💡 <strong>Günlük Hayat Karşılığı:</strong><br>";
    
    // Sadece gösterilen performans metrikleri için günlük hayat karşılığını bul
    Object.keys(gosterilecekMetrikler).forEach(key => {
      const karsilik = GUNLUK_HAYAT_KARSILIKLARI[key] || 
                       Object.values(GUNLUK_HAYAT_KARSILIKLARI).find(k => k.metrik === key);
      if (karsilik) {
        gunlukHayatMetni += `• ${karsilik.karşılık}: ${karsilik.aciklama}<br>`;
      }
    });
    
    if (gunlukHayatMetni === "💡 <strong>Günlük Hayat Karşılığı:</strong><br>") {
      gunlukHayatMetni = "💡 Bu oyunun özel metrikleri, günlük hayattaki benzer görevlerdeki performansını yansıtır.";
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
  
  if (performansTabloBody) {
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
      performansTabloBody.innerHTML = "<tr><td colspan='5'>Bu oyun için zihin alanı verisi bulunamadı.</td></tr>";
      console.warn("⚠ Gösterilecek alan bulunamadı!");
    } else {
      let html = "";
      gosterilecekAlanlar.forEach(alanKey => {
        const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
        const sonSkor = cokluAlan[alanKey] || 0;
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
// 10) 💬 ÖĞRETMEN YORUMLARI SİSTEMİ
// -------------------------------------------------------------
const teacherID = localStorage.getItem("teacherID");
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
