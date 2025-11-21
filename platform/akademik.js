// =============================================================
// 📌 akademik.js — Akademik Performans Analiz Motoru (v8.0)
// Ders–Bilişsel Bağlantı, Tahmini Ders Skorları, AI Öneriler
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS } from "./globalConfig.js";
import { db } from "../data/firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------------------------------------
// 1) ROL & ÖĞRENCİ ERİŞİM KONTROLÜ
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid");

// Öğrenci seçimi zorunlu değil, opsiyonel
// Eğer öğrenci seçilmemişse, kullanıcıya uyarı ver ama sayfa kırılmasın
if ((role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  console.warn("⚠ Öğrenci seçilmemiş. Akademik veriler gösterilemeyecek.");
  // Sayfa kırılmasın, sadece uyarı ver
}

console.log("🎯 Akademik analiz ekranı yüklendi → Rol:", role);

// -------------------------------------------------------------
// 2) DERS–BİLİŞSEL BAĞLANTI HARİTASI
// -------------------------------------------------------------
const DERS_BAGLANTILARI = {
  turkce: {
    ad: "Türkçe",
    alanlar: ["literacy", "dyslexia", "attention", "comprehension"],
    beceriler: ["okuma", "WPM", "görsel takip", "anlama"],
    renk: "#3498db"
  },
  matematik: {
    ad: "Matematik",
    alanlar: ["math", "logic", "attention", "memory"],
    beceriler: ["mantık", "örüntü", "sayı belleği", "problem çözme"],
    renk: "#16a085"
  },
  fen: {
    ad: "Fen Bilimleri",
    alanlar: ["logic", "comprehension", "executive", "memory"],
    beceriler: ["neden-sonuç", "sıralama", "analiz", "hatırlama"],
    renk: "#e67e22"
  },
  sosyal: {
    ad: "Sosyal Bilgiler",
    alanlar: ["social", "emotional", "comprehension", "memory"],
    beceriler: ["empati", "analiz", "anlama", "sosyal biliş"],
    renk: "#9b59b6"
  }
};

let gecmis = [];

// =============================================================
// 3) VERİ YÜKLEME
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    if (!aktifOgrenciId) return;

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
      return;
    }

    if (!yol) return;

    const snap = await getDocs(yol);
    const temp = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data?.tarih) temp.push(data);
    });

    gecmis = temp.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    analizEt();

  } catch (err) {
    console.error("❌ Firestore geçmiş okunamadı:", err);
  }
}

// Öğrenci için önce Firestore, sonra LocalStorage
async function yukleOgrenciGecmis() {
  // Önce Firestore'dan çek
  try {
    if (db && uid) {
      const yol = collection(
        db,
        "profiles",
        uid,
        "oyunSonuclari"
      );
      
      const snap = await getDocs(yol);
      const firestoreData = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data?.tarih) firestoreData.push(data);
      });
      
      if (firestoreData.length > 0) {
        gecmis = firestoreData.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        console.log("📥 Firestore geçmiş yüklendi (öğrenci - akademik):", gecmis.length, "kayıt");
        analizEt();
        return;
      }
    }
  } catch (err) {
    console.warn("⚠ Firestore'dan veri çekilemedi, LocalStorage deneniyor:", err);
  }
  
  // Firestore'da veri yoksa LocalStorage'dan çek
  yukleLocalGecmis();
}

function yukleLocalGecmis() {
  try {
    const data = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
    gecmis = data
      .filter(x => x?.tarih)
      .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
    analizEt();
  } catch {
    console.warn("⚠ LocalStorage geçmiş bozuk.");
    gecmis = [];
    analizEt();
  }
}

// =============================================================
// 4) ANA ANALİZ FONKSİYONU
// =============================================================
function analizEt() {
  const dersKartlariEl = document.getElementById("dersKartlari");
  if (gecmis.length === 0) {
    if (dersKartlariEl) {
      dersKartlariEl.innerHTML = 
        "<p style='text-align:center;color:#999;'>Analiz için yeterli veri yok.</p>";
    }
    return;
  }

  // Yeni yapı: Blok bazlı yükleme
  yukleUstBlok();
  dersKartlariOlustur();
  dersSkorlariGrafik();
  yukleAltBlok();
}

// -------------------------------------------------------------
// ÜST BLOK – GENEL AKADEMİK PROFİL
// -------------------------------------------------------------
function yukleUstBlok() {
  const dersSkorlari = {};
  const DERS_BAGLANTILARI = {
    turkce: { ad: "Türkçe", alanlar: ["okuma_dil", "literacy", "attention"], renk: "#4a90e2" },
    matematik: { ad: "Matematik", alanlar: ["mantik", "logic", "yuruteci_islev", "executive"], renk: "#e53935" },
    fen: { ad: "Fen Bilgisi", alanlar: ["algisal_islemleme", "perception", "mantik", "logic"], renk: "#43a047" },
    sosyal: { ad: "Sosyal Bilgiler", alanlar: ["sosyal_bilis", "social", "hafiza", "memory"], renk: "#ff9800" }
  };
  
  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, dersInfo);
  });
  
  // Ortalama akademik puan
  const ortAkademikPuan = Math.round(
    Object.values(dersSkorlari).reduce((a, b) => a + b, 0) / Object.keys(dersSkorlari).length
  );
  
  const ortAkademikPuanEl = document.getElementById("ortAkademikPuan");
  if (ortAkademikPuanEl) ortAkademikPuanEl.textContent = `${ortAkademikPuan} / 100`;
  
  // En güçlü/destek gereken ders
  const sirali = Object.entries(dersSkorlari).sort((a, b) => b[1] - a[1]);
  const enGuclu = sirali[0];
  const enZayif = sirali[sirali.length - 1];
  
  const enGucluDersEl = document.getElementById("enGucluDers");
  if (enGucluDersEl && enGuclu) {
    enGucluDersEl.textContent = DERS_BAGLANTILARI[enGuclu[0]]?.ad || enGuclu[0];
  }
  
  const destekGerekenDersEl = document.getElementById("destekGerekenDers");
  if (destekGerekenDersEl && enZayif) {
    destekGerekenDersEl.textContent = DERS_BAGLANTILARI[enZayif[0]]?.ad || enZayif[0];
  }
}

// -------------------------------------------------------------
// ALT BLOK – DERS ÖNERİ MOTORU
// -------------------------------------------------------------
function yukleAltBlok() {
  const dersSkorlari = {};
  const DERS_BAGLANTILARI = {
    turkce: { ad: "Türkçe", alanlar: ["okuma_dil", "literacy", "attention"], renk: "#4a90e2" },
    matematik: { ad: "Matematik", alanlar: ["mantik", "logic", "yuruteci_islev", "executive"], renk: "#e53935" },
    fen: { ad: "Fen Bilgisi", alanlar: ["algisal_islemleme", "perception", "mantik", "logic"], renk: "#43a047" },
    sosyal: { ad: "Sosyal Bilgiler", alanlar: ["sosyal_bilis", "social", "hafiza", "memory"], renk: "#ff9800" }
  };
  
  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, dersInfo);
  });
  
  const sirali = Object.entries(dersSkorlari).sort((a, b) => a[1] - b[1]);
  const enZayif = sirali[0];
  
  if (enZayif) {
    const zayifDersOnerileriEl = document.getElementById("zayifDersOnerileri");
    const gelisimPlaniEl = document.getElementById("gelisimPlani");
    const onerilenOyunlarEl = document.getElementById("onerilenOyunlar");
    
    const dersAd = DERS_BAGLANTILARI[enZayif[0]]?.ad || enZayif[0];
    const skor = Math.round(enZayif[1]);
    
    if (zayifDersOnerileriEl) {
      zayifDersOnerileriEl.innerHTML = `
        <p><strong>${dersAd}</strong> dersinde tahmini skor ${skor}/100. Bu ders için özel destek önerilir.</p>
        <p>İlgili zihin alanları: ${DERS_BAGLANTILARI[enZayif[0]]?.alanlar.join(", ") || "-"}</p>
      `;
    }
    
    if (gelisimPlaniEl) {
      gelisimPlaniEl.innerHTML = `
        <ul style="list-style:none; padding:0;">
          <li style="padding:8px; margin:5px 0; background:#fff3cd; border-left:3px solid #ff9800; border-radius:4px;">1. İlgili zihin alanlarını geliştiren oyunlar oynanmalı</li>
          <li style="padding:8px; margin:5px 0; background:#fff3cd; border-left:3px solid #ff9800; border-radius:4px;">2. Düzenli pratik yapılmalı</li>
          <li style="padding:8px; margin:5px 0; background:#fff3cd; border-left:3px solid #ff9800; border-radius:4px;">3. İlerleme takip edilmeli</li>
        </ul>
      `;
    }
    
    if (onerilenOyunlarEl) {
      const oyunOnerileri = {
        turkce: "Okuma-dil becerilerini geliştiren oyunlar",
        matematik: "Mantık ve problem çözme oyunları",
        fen: "Görsel algı ve mantık oyunları",
        sosyal: "Sosyal biliş ve hafıza oyunları"
      };
      
      onerilenOyunlarEl.innerHTML = `<p>${oyunOnerileri[enZayif[0]] || "İlgili becerileri geliştiren oyunlar"} önerilir.</p>`;
    }
  }
  
  aiAkademikOneri();
}

// =============================================================
// 5) DERS KARTLARI (Tahmini Skorlar)
// =============================================================
function dersKartlariOlustur() {
  const container = document.getElementById("dersKartlari");
  if (!container) return;

  let html = "";

  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    const tahminSkor = hesaplaDersSkoru(dersKey, dersInfo);
    const seviye = tahminSkor >= 80 ? "Mükemmel" : 
                   tahminSkor >= 60 ? "İyi" : 
                   tahminSkor >= 40 ? "Orta" : "Geliştirilmeli";
    
    // Bağlantılı zihin alanları (etiketler)
    const alanEtiketleri = dersInfo.alanlar.map(alanKey => {
      const alanAdlari = {
        okuma_dil: "Okuma-Dil",
        literacy: "Okuma-Dil",
        attention: "Dikkat",
        dikkat: "Dikkat",
        mantik: "Mantık",
        logic: "Mantık",
        yuruteci_islev: "Yürütücü İşlev",
        executive: "Yürütücü İşlev",
        algisal_islemleme: "Algısal İşlemleme",
        perception: "Algısal İşlemleme",
        sosyal_bilis: "Sosyal Biliş",
        social: "Sosyal Biliş",
        hafiza: "Hafıza",
        memory: "Hafıza"
      };
      return alanAdlari[alanKey] || alanKey;
    });
    
    // 1 satır açıklama
    const aciklama = `${dersInfo.ad} dersinde tahmini performansınız ${seviye.toLowerCase()} seviyededir.`;

    html += `
      <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); border-left:4px solid ${dersInfo.renk};">
        <h4 style="margin:0 0 10px 0; color:#1e3d59; font-size:18px;">${dersInfo.ad}</h4>
        <div style="text-align:center; margin:15px 0;">
          <div style="font-size:36px; font-weight:700; color:${dersInfo.renk};">${Math.round(tahminSkor)}</div>
          <div style="font-size:14px; color:#666;">/ 100</div>
        </div>
        <div style="text-align:center; margin:10px 0;">
          <span style="display:inline-block; padding:6px 12px; background:${seviye === "Mükemmel" ? "#4caf5020" : seviye === "İyi" ? "#4a90e220" : seviye === "Orta" ? "#ff980020" : "#f4433620"}; color:${seviye === "Mükemmel" ? "#4caf50" : seviye === "İyi" ? "#4a90e2" : seviye === "Orta" ? "#ff9800" : "#f44336"}; border-radius:12px; font-size:13px; font-weight:600;">
            ${seviye}
          </span>
        </div>
        <p style="font-size:13px; color:#666; margin:10px 0; line-height:1.5;">${aciklama}</p>
        <div style="margin-top:15px; padding-top:15px; border-top:1px solid #e0e0e0;">
          <div style="font-size:12px; color:#999; margin-bottom:5px;">Bağlantılı Zihin Alanları:</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${alanEtiketleri.map(alan => `<span style="padding:4px 8px; background:#f0f8ff; color:#1e88e5; border-radius:8px; font-size:11px;">${alan}</span>`).join("")}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =============================================================
// 6) DERS SKORU HESAPLAMA
// =============================================================
function hesaplaDersSkoru(dersKey, dersInfo) {
  const ilgiliAlanlar = dersInfo.alanlar;
  
  // Son kayıtlardan ilgili alan skorlarını topla
  const alanSkorlari = {};
  
  if (!Array.isArray(ilgiliAlanlar) || ilgiliAlanlar.length === 0) {
    return 50; // Varsayılan skor
  }

  ilgiliAlanlar.forEach(alanKey => {
    if (!alanKey) return;
    
    const skorlar = gecmis
      .map(item => {
        // Önce coklu_alan'dan al
        if (item.coklu_alan?.[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eşleme oyunu için özel işleme: bolumSkorlari'dan hesapla
        if ((item.oyun === "renk_esleme" || item.oyun === "1_basamak_esleme") && item.oyunDetaylari?.bolumSkorlari) {
          const bolumSkorlari = item.oyunDetaylari.bolumSkorlari;
          
          // Alan bazlı bölüm skorlarını topla
          if (alanKey === "perception" || alanKey === "algisal_islemleme") {
            // Algısal işlemleme: şekil, gölge, parça bölümleri
            const toplam = (bolumSkorlari.sekil?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0) + 
                          (bolumSkorlari.parca?.toplam || 0);
            const dogru = (bolumSkorlari.sekil?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0) + 
                         (bolumSkorlari.parca?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "attention" || alanKey === "dikkat") {
            // Dikkat: tüm bölümlerin ortalaması
            const toplam = (bolumSkorlari.renk?.toplam || 0) + 
                          (bolumSkorlari.sekil?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0) + 
                          (bolumSkorlari.parca?.toplam || 0);
            const dogru = (bolumSkorlari.renk?.dogru || 0) + 
                         (bolumSkorlari.sekil?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0) + 
                         (bolumSkorlari.parca?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "logic" || alanKey === "mantik") {
            // Mantık: parça-bütün ve gölge eşleme
            const toplam = (bolumSkorlari.parca?.toplam || 0) + 
                          (bolumSkorlari.golge?.toplam || 0);
            const dogru = (bolumSkorlari.parca?.dogru || 0) + 
                         (bolumSkorlari.golge?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "literacy" || alanKey === "okuma") {
            // Okuma-dil: renk ve şekil eşleme (isim tanıma)
            const toplam = (bolumSkorlari.renk?.toplam || 0) + 
                          (bolumSkorlari.sekil?.toplam || 0);
            const dogru = (bolumSkorlari.renk?.dogru || 0) + 
                         (bolumSkorlari.sekil?.dogru || 0);
            if (toplam > 0) {
              return Math.round((dogru / toplam) * 100);
            }
          } else if (alanKey === "social" || alanKey === "sosyal") {
            // Sosyal biliş: gölge eşleme (figür-zemin)
            if (bolumSkorlari.golge && bolumSkorlari.golge.toplam > 0) {
              return Math.round((bolumSkorlari.golge.dogru / bolumSkorlari.golge.toplam) * 100);
            }
          }
        }
        
        return 0;
      })
      .filter(s => s > 0 && !isNaN(s));
    
    alanSkorlari[alanKey] = skorlar.length > 0
      ? skorlar.reduce((a, b) => a + b, 0) / skorlar.length
      : 0;
  });

  // WPM özel kontrolü (Türkçe için)
  if (dersKey === "turkce") {
    const wpmSkorlari = gecmis
      .map(item => item.wpm || 0)
      .filter(w => w > 0);
    
    if (wpmSkorlari.length > 0) {
      const ortalamaWPM = wpmSkorlari.reduce((a, b) => a + b, 0) / wpmSkorlari.length;
      if (!isNaN(ortalamaWPM) && ortalamaWPM > 0) {
        // WPM'i 0-100 skoruna çevir (örnek: 60 WPM = 75 puan)
        const wpmSkor = Math.min(100, Math.max(0, (ortalamaWPM / 80) * 100));
        alanSkorlari.wpm = wpmSkor;
      }
    }
  }

  // Ortalama hesapla
  const skorlar = Object.values(alanSkorlari).filter(s => s > 0 && !isNaN(s));
  if (skorlar.length === 0) return 50; // Varsayılan

  const ortalama = skorlar.reduce((a, b) => a + b, 0) / skorlar.length;
  return isNaN(ortalama) ? 50 : Math.max(0, Math.min(100, ortalama));
}

// =============================================================
// 7) BAĞLANTI TABLOSU
// =============================================================
function baglantiTablosuOlustur() {
  const tbody = document.getElementById("baglantiTabloBody");
  if (!tbody) return;

  let html = "";

  Object.entries(DERS_BAGLANTILARI).forEach(([dersKey, dersInfo]) => {
    const tahminSkor = hesaplaDersSkoru(dersKey, dersInfo);
    
    const alanAdlari = dersInfo.alanlar
      .map(k => BRAIN_AREAS[k]?.ad || k)
      .join(", ");

    const kanit = tahminSkor >= 70
      ? `<span class="guclu-alan">Güçlü bilişsel alanlar → ${dersInfo.ad} başarısı yüksek</span>`
      : tahminSkor >= 50
      ? `Orta seviye bilişsel alanlar → ${dersInfo.ad} başarısı normal`
      : `<span class="destek-alan">Düşük bilişsel alanlar → ${dersInfo.ad} için destek gerekli</span>`;

    html += `
      <tr>
        <td><strong>${dersInfo.ad}</strong></td>
        <td>${alanAdlari}</td>
        <td>${dersInfo.beceriler.join(", ")}</td>
        <td>${kanit}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// =============================================================
// 8) AKADEMİK GÜÇLÜ VE DESTEK ALANLARI
// =============================================================
function akademikGucluVeDestek() {
  const gucluDiv = document.getElementById("akademikGuclu");
  const destekDiv = document.getElementById("akademikDestek");
  if (!gucluDiv || !destekDiv) return;

  const dersSkorlari = {};
  Object.keys(DERS_BAGLANTILARI).forEach(dersKey => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, DERS_BAGLANTILARI[dersKey]);
  });

  const siralanmis = Object.entries(dersSkorlari).sort((a, b) => b[1] - a[1]);
  const guclu = siralanmis.filter(([_, skor]) => skor >= 70);
  const destek = siralanmis.filter(([_, skor]) => skor < 50);

  gucluDiv.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<p class="guclu-alan">✅ ${DERS_BAGLANTILARI[key].ad}: ${Math.round(skor)}/100</p>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";

  destekDiv.innerHTML = destek.length > 0
    ? destek.map(([key, skor]) => 
        `<p class="destek-alan">📈 ${DERS_BAGLANTILARI[key].ad}: ${Math.round(skor)}/100 - Destek önerilir</p>`
      ).join("")
    : "<p>Henüz yeterli veri yok.</p>";
}

// =============================================================
// 9) AI AKADEMİK ÖNERİ
// =============================================================
function aiAkademikOneri() {
  const oneriDiv = document.getElementById("aiAkademikOneri");
  if (!oneriDiv || gecmis.length === 0) {
    if (oneriDiv) oneriDiv.innerHTML = "<p>Analiz için yeterli veri yok.</p>";
    return;
  }

  const dersSkorlari = {};
  Object.keys(DERS_BAGLANTILARI).forEach(dersKey => {
    dersSkorlari[dersKey] = hesaplaDersSkoru(dersKey, DERS_BAGLANTILARI[dersKey]);
  });

  const enDusukDers = Object.entries(dersSkorlari)
    .sort((a, b) => a[1] - b[1])[0];

  const oneriler = [];

  if (enDusukDers && enDusukDers[1] < 50) {
    const dersInfo = DERS_BAGLANTILARI[enDusukDers[0]];
    oneriler.push(
      `📚 <strong>${dersInfo.ad}</strong> dersinde destek önerilir. ` +
      `İlgili zihin alanları: ${dersInfo.alanlar.map(k => BRAIN_AREAS[k]?.ad || k).join(", ")}. ` +
      `Bu alanlara yönelik oyunlar oynayarak gelişim sağlanabilir.`
    );
  }

  const enYuksekDers = Object.entries(dersSkorlari)
    .sort((a, b) => b[1] - a[1])[0];

  if (enYuksekDers && enYuksekDers[1] >= 70) {
    oneriler.push(
      `✅ <strong>${DERS_BAGLANTILARI[enYuksekDers[0]].ad}</strong> dersinde güçlü performans görülüyor. ` +
      `Bu başarıyı korumak için düzenli pratik yapılmalı.`
    );
  }

  oneriler.push(
    `💡 Genel öneri: Tüm derslerde başarı için dikkat, hafıza ve mantıksal düşünme alanlarını geliştirmek önemlidir. ` +
    `Platformdaki oyunları düzenli oynayarak bu alanlar güçlendirilebilir.`
  );

  oneriDiv.innerHTML = `<p>${oneriler.join("<br><br>")}</p>`;
}

// =============================================================
// 10) DERS SKORLARI GRAFİĞİ
// =============================================================
function dersSkorlariGrafik() {
  try {
    const canvas = document.getElementById("dersSkorlariChart");
    if (!canvas || !window.Chart) return;

    const dersler = Object.keys(DERS_BAGLANTILARI);
    const labels = dersler.map(k => DERS_BAGLANTILARI[k].ad);
    const skorlar = dersler.map(k => 
      Math.round(hesaplaDersSkoru(k, DERS_BAGLANTILARI[k]))
    );
    const renkler = dersler.map(k => DERS_BAGLANTILARI[k].renk);

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Tahmini Ders Skorları",
          data: skorlar,
          backgroundColor: renkler,
          borderRadius: 8
        }]
      },
      options: {
        scales: {
          y: {
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
  } catch (err) {
    console.warn("⚠ Ders skorları grafiği çizilemedi:", err);
  }
}

// =============================================================
// 11) BAŞLAT
// =============================================================
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  yukleFirestoreGecmis();
} else if (role === ROLES.OGRENCI) {
  yukleOgrenciGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📚 akademik.js yüklendi (v8.0)");

