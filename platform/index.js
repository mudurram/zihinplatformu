// =====================================================
// 📌 index.js — Zihin Platformu Ana Menü (Final v6.8)
// =====================================================

import { GLOBAL, ROLES, BRAIN_AREAS, SUBSKILLS } from "./globalConfig.js";
import { listAllRequestsByUser, respondRequest, createStudentTeacherRequest, createStudentInstitutionRequest } from "../data/requestService.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =====================================================
// 🔍 Kullanıcı Bilgisi (LocalStorage)
// =====================================================
function aktifKullaniciBilgisi() {
  try {
    return JSON.parse(localStorage.getItem("aktifKullanici")) || null;
  } catch {
    return null;
  }
}

function aktifOgrenciBilgisi() {
  const id = localStorage.getItem("aktifOgrenciId") || null;
  const ad = localStorage.getItem("aktifOgrenci") || null;
  return { id, ad };
}

// =====================================================
// 🚀 Sayfa Yüklenince
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const user = aktifKullaniciBilgisi();
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE);
  const ogr = aktifOgrenciBilgisi();

  // =====================================
  // 👤 Kullanıcı Bilgisi Yazdır
  // =====================================
  const kullaniciEl = document.getElementById("kullaniciAd");
  if (kullaniciEl && user) {
    const isim = user.username || user.email || "-";
    const rol = user.role || "-";
    kullaniciEl.textContent = `👤 Kullanıcı: ${isim} (${rol})`;
  }

  // =====================================
  // 🎓 Aktif Öğrenci Bilgisi Yazdır (Öğretmen için)
  // =====================================
  const ogrEl = document.getElementById("aktifOgrenci");
  if (ogrEl && ogr?.ad) {
    ogrEl.textContent = `🎓 Aktif Öğrenci: ${ogr.ad}`;
  }

  // Öğrenci için öğretmen bölümü artık header'da

  zihinAlanlariniCiz();
  
  // Öğrenci ise talepleri yükle
  if (role === ROLES.OGRENCI) {
    const taleplerKart = document.getElementById("ogrenciTaleplerKart");
    if (taleplerKart) {
      taleplerKart.style.display = "block";
      yukleOgrenciTalepleri();
      ogretmenTalepGonderButonu();
    }
  }
  
  // Aktif alan varsa modal aç (sadece header'dan geliyorsa)
  const aktifAlan = localStorage.getItem("aktifAlan");
  if (aktifAlan && BRAIN_AREAS[aktifAlan]) {
    modalAc(aktifAlan);
    localStorage.removeItem("aktifAlan");
  } else {
    // Aktif alan yoksa modal'ı kapat (ana menüye direkt gidildiyse)
    const modal = document.getElementById("altAlanModal");
    if (modal) modal.style.display = "none";
  }
});

console.log("📘 index.js yüklendi (Final v6.8 — GLOBAL uyumlu)");

function zihinAlanlariniCiz() {
  const grid = document.getElementById("alanGrid");
  if (!grid) return;

  grid.innerHTML = "";
  Object.values(BRAIN_AREAS).forEach(area => {
    const kart = document.createElement("div");
    kart.className = "menu-kart";
    kart.style.borderTop = `6px solid ${area.renk}`;
    kart.innerHTML = `
      <h2>${area.ad}</h2>
      <p>${area.tanim}</p>
    `;
    kart.onclick = () => modalAc(area.id);
    grid.appendChild(kart);
  });
}

let seciliAlanId = null;

function modalAc(alanId) {
  seciliAlanId = alanId;
  const modal = document.getElementById("altAlanModal");
  const baslik = document.getElementById("modalBaslik");
  const tanim = document.getElementById("modalTanim");
  const altListe = document.getElementById("altAlanListesi");
  const oyunListe = document.getElementById("oyunListesi");

  if (!modal || !baslik || !altListe || !oyunListe) return;

  baslik.textContent = BRAIN_AREAS[alanId]?.ad || "Zihin Alanı";
  tanim.textContent = BRAIN_AREAS[alanId]?.tanim || "";
  altListe.innerHTML = "";
  oyunListe.innerHTML = "<li>Alt beceri seçildiğinde listelenir.</li>";

  (SUBSKILLS[alanId] || []).forEach(alt => {
    const li = document.createElement("li");
    li.textContent = alt.ad;
    li.onclick = () => altBeceriSec(alanId, alt.id);
    altListe.appendChild(li);
  });

  modal.style.display = "flex";
}

window.modalKapat = function () {
  const modal = document.getElementById("altAlanModal");
  if (modal) modal.style.display = "none";
};

function altBeceriSec(alanId, altId) {
  localStorage.setItem(GLOBAL.LS_KEYS.AKTIF_ALAN, alanId);
  localStorage.setItem(GLOBAL.LS_KEYS.AKTIF_ALT_BECERI, altId);

  const oyunListe = document.getElementById("oyunListesi");
  if (!oyunListe) return;

  const oyunlar = Object.values(GLOBAL.GAME_MAP || {}).filter(
    oyun => oyun.alan === alanId && oyun.altBeceri === altId
  );

  if (!oyunlar.length) {
    oyunListe.innerHTML = "<li>Bu alt beceri için oyun henüz tanımlanmadı.</li>";
    return;
  }

  oyunListe.innerHTML = "";
  oyunlar.forEach(oyun => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${oyun.ad}</strong>
      <div>${oyun.kategori}</div>
    `;
    li.onclick = () => oyunSec(oyun.id);
    oyunListe.appendChild(li);
  });
}

function oyunSec(oyunId) {
  localStorage.setItem(GLOBAL.LS_KEYS.AKTIF_OYUN, oyunId);
  window.location.href = "hazirlik.html";
}

async function yukleOgrenciTalepleri() {
  const alinanListe = document.getElementById("ogrenciAlinanTalepler");
  const gonderilenListe = document.getElementById("ogrenciGonderilenTalepler");
  
  if (!alinanListe && !gonderilenListe) return;

  const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
  const { received, sent } = await listAllRequestsByUser(uid);

  // ALINAN TALEPLER (Öğretmen ve Kurumdan gelen)
  if (alinanListe) {
    const ogretmenTalepleri = received.filter(req => 
      (req.type === "teacher_student" || req.type === "institution_student") && req.status === "beklemede"
    );
    
    if (!ogretmenTalepleri.length) {
      alinanListe.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Bekleyen talep yok.</li>";
    } else {
      alinanListe.innerHTML = "";
      for (const req of ogretmenTalepleri) {
        let teacherName = req.fromId;
        try {
          const teacherRef = doc(db, "profiles", req.fromId);
          const teacherSnap = await getDoc(teacherRef);
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            teacherName = teacherData.username || teacherData.fullName || teacherData.ad || req.fromId;
          }
        } catch (err) {
          console.warn("Öğretmen bilgisi alınamadı:", err);
        }

        // Talep tipine göre mesaj
        const talepMetni = req.type === "teacher_student" 
          ? `<strong>${teacherName}</strong> öğretmeni seni eklemek istiyor.`
          : `<strong>${teacherName}</strong> kurumu seni eklemek istiyor.`;

        const li = document.createElement("li");
        li.innerHTML = `
          <div>
            ${talepMetni}
          </div>
          <div class="talep-btn-grup">
            <button data-id="${req.id}" data-status="kabul" style="background:#27ae60;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✓ Kabul</button>
            <button data-id="${req.id}" data-status="red" style="background:#e74c3c;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✗ Red</button>
          </div>
        `;

        li.querySelectorAll("button").forEach(btn => {
          btn.onclick = async () => {
            await respondRequest(req.id, btn.dataset.status, uid);
            await yukleOgrenciTalepleri();
          };
        });

        alinanListe.appendChild(li);
      }
    }
  }

  // GÖNDERİLEN TALEPLER (Öğretmen ve Kuruma gönderilen)
  if (gonderilenListe) {
    const ogrenciTalepleri = sent.filter(req => req.type === "student_teacher" || req.type === "student_institution");
    
    if (!ogrenciTalepleri.length) {
      gonderilenListe.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Gönderilen talep yok.</li>";
    } else {
      gonderilenListe.innerHTML = "";
      for (const req of ogrenciTalepleri) {
        let teacherName = req.toId;
        try {
          const teacherRef = doc(db, "profiles", req.toId);
          const teacherSnap = await getDoc(teacherRef);
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            teacherName = teacherData.username || teacherData.fullName || teacherData.ad || req.toId;
          }
        } catch (err) {
          console.warn("Öğretmen bilgisi alınamadı:", err);
        }

        const statusText = req.status === "beklemede" ? "⏳ Beklemede" : 
                          req.status === "kabul" ? "✅ Kabul Edildi" : 
                          req.status === "red" ? "❌ Reddedildi" : req.status;

        // Talep tipine göre mesaj
        const talepMetni = req.type === "student_teacher"
          ? `<strong>${teacherName}</strong> öğretmenine gönderildi`
          : `<strong>${teacherName}</strong> kurumuna gönderildi`;

        const li = document.createElement("li");
        li.innerHTML = `
          <div>
            ${talepMetni} — ${statusText}
          </div>
        `;
        gonderilenListe.appendChild(li);
      }
    }
  }
}

// =====================================================
// 📤 ORTAK DAVET GÖNDERME FONKSİYONU (ROL BAZLI)
// =====================================================
async function davetGonder() {
  const input = document.getElementById("davetUsernameInput");
  const mesajDiv = document.getElementById("davetMesaji");
  
  if (!input || !mesajDiv) {
    console.warn("Davet formu elementleri bulunamadı.");
    return;
  }
  
  const username = input.value.trim();
  if (!username) {
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kullanıcı adı girin.</span>";
    return;
  }

  mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
  
  try {
    const targetUid = await findUserByUsername(username);
    if (!targetUid) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı bulunamadı. Kullanıcı adını kontrol edin.</span>";
      return;
    }
    
    // Hedef kullanıcının bilgilerini al
    const teacherRef = doc(db, "profiles", targetUid);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı profili bulunamadı.</span>";
      return;
    }
    
    const teacherData = teacherSnap.data();
    const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
    let result = null;
    
    // Rol bazlı davet gönderme
    if (role === ROLES.OGRENCI) {
      // Öğrenci → Öğretmen veya Kurum daveti
      const studentId = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      if (!studentId) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası. Lütfen tekrar giriş yapın.</span>";
        return;
      }
      
      if (teacherData.role === ROLES.OGRETMEN) {
        // Öğrenci → Öğretmen daveti
        result = await createStudentTeacherRequest(studentId, targetUid);
      } else if (teacherData.role === ROLES.INSTITUTION) {
        // Öğrenci → Kurum daveti
        result = await createStudentInstitutionRequest(studentId, targetUid);
      } else {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğretmen veya kuruma davet gönderebilirsiniz.</span>";
        return;
      }
    } else {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Geçersiz rol.</span>";
      return;
    }
    
    if (result.success) {
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Davet başarıyla gönderildi!</span>";
      input.value = "";
      await yukleOgrenciTalepleri();
      
      // 3 saniye sonra mesajı temizle
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } else {
      mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ ${result.message || "Davet gönderilemedi."}</span>`;
    }
  } catch (err) {
    console.error("Davet gönderme hatası:", err);
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu. Lütfen tekrar deneyin.</span>";
  }
}

// Eski fonksiyon adını koru (geriye uyumluluk için)
function ogretmenTalepGonderButonu() {
  const btn = document.getElementById("davetGonderBtn");
  const input = document.getElementById("davetUsernameInput");
  
  if (btn) {
    btn.onclick = davetGonder;
  }
  
  if (input) {
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        davetGonder();
      }
    };
  }
}

// =====================================================
// 🔍 ÖĞRETMEN BUL (Username ile)
// =====================================================
async function findUserByUsername(username) {
  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    return null;
  }

  if (!username) return null;

  try {
    const q = query(
      collection(db, "profiles"),
      where("username", "==", username)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    return snap.docs[0].id;
  } catch (err) {
    console.error("findUserByUsername hatası:", err);
    return null;
  }
}

// =====================================================
// 💬 MESAJLAŞMA KARTI GÖRÜNÜRLÜĞÜ
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
  const mesajKart = document.getElementById("mesajlasmaKart");
  
  if (mesajKart && role === ROLES.OGRENCI) {
    mesajKart.style.display = "block";
  }
  
});
