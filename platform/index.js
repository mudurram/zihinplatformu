// =====================================================
// 📌 index.js — Zihin Platformu Ana Menü (Final v6.8)
// =====================================================

import { GLOBAL, ROLES, BRAIN_AREAS, SUBSKILLS } from "./globalConfig.js";
import { listRequestsByUser, respondRequest, createStudentTeacherRequest } from "../data/requestService.js";
import { db } from "../data/firebaseConfig.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  const liste = document.getElementById("ogrenciTalepListesi");
  if (!liste) return;

  liste.innerHTML = "<li>Yükleniyor...</li>";
  const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
  const talepler = await listRequestsByUser(uid);

  // Sadece öğretmenden gelen talepleri filtrele (type: "teacher_student")
  const ogretmenTalepleri = talepler.filter(req => req.type === "teacher_student" && req.status === "beklemede");

  if (!ogretmenTalepleri.length) {
    liste.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Bekleyen öğretmen talebi yok.</li>";
    return;
  }

  liste.innerHTML = "";
  ogretmenTalepleri.forEach(req => {
    const li = document.createElement("li");
    const teacherName = req.payload?.teacherUsername || req.fromId;
    li.innerHTML = `
      <div>
        <strong>${teacherName}</strong> öğretmeni seni eklemek istiyor.
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

    liste.appendChild(li);
  });
}

// =====================================================
// 📤 ÖĞRETMENE TALEP GÖNDER
// =====================================================
function ogretmenTalepGonderButonu() {
  const btn = document.getElementById("ogretmenTalepGonderBtn");
  const input = document.getElementById("ogretmenUsernameInput");
  const mesajDiv = document.getElementById("talepMesaji");

  if (!btn || !input) return;

  btn.onclick = async () => {
    const username = input.value.trim();
    
    if (!username) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen öğretmen kullanıcı adı girin.</span>";
      return;
    }

    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
    btn.disabled = true;

    try {
      // Öğretmeni bul
      const teacherUid = await findUserByUsername(username);
      
      if (!teacherUid) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Öğretmen bulunamadı. Kullanıcı adını kontrol edin.</span>";
        btn.disabled = false;
        return;
      }

      // Öğretmen rolünü kontrol et
      const teacherRef = doc(db, "profiles", teacherUid);
      const teacherSnap = await getDoc(teacherRef);
      
      if (!teacherSnap.exists()) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Öğretmen profili bulunamadı.</span>";
        btn.disabled = false;
        return;
      }

      const teacherData = teacherSnap.data();
      if (teacherData.role !== ROLES.OGRETMEN) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı öğretmen değil.</span>";
        btn.disabled = false;
        return;
      }

      // Öğrenci ID'sini al
      const studentId = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      
      if (!studentId) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası. Lütfen tekrar giriş yapın.</span>";
        btn.disabled = false;
        return;
      }

      // Talep gönder
      const result = await createStudentTeacherRequest(studentId, teacherUid);
      
      if (result.success) {
        mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Talep başarıyla gönderildi! Öğretmen onayı bekleniyor.</span>";
        input.value = "";
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
          mesajDiv.innerHTML = "";
        }, 3000);
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${result.message || "Talep gönderilemedi."}</span>`;
      }

      btn.disabled = false;
    } catch (err) {
      console.error("Talep gönderme hatası:", err);
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu. Lütfen tekrar deneyin.</span>";
      btn.disabled = false;
    }
  };

  // Enter tuşu ile gönder
  if (input) {
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        btn.click();
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