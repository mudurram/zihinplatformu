// ====================================================================
// 📘 ogrencilerim.js — Öğretmen Öğrencilerim Sayfası
// ====================================================================

import { db } from "../data/firebaseConfig.js";
import { yonlendir } from "./router.js";
import { ROLES } from "./globalConfig.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ====================================================================
// 1) ROL & OTURUM DOĞRULAMASI
// ====================================================================

const role = localStorage.getItem("role");
let teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid") || null;

// Rol yoksa → login
if (!role) {
  console.warn("⛔ Rol bulunamadı → login.html");
  window.location.href = "login.html";
  throw new Error("Rol yok.");
}

// Öğretmen değilse erişim kapalı
const normalizedRole = (role || "").trim().toLowerCase();
if (normalizedRole !== ROLES.OGRETMEN) {
  console.warn("⛔ Yetkisiz erişim. Rol:", role);
  yonlendir(role);
  throw new Error("Yetkisiz erişim.");
}

// TeacherID yoksa ama uid varsa → teacherID = uid
if (!teacherID && uid) {
  console.log("⚠ teacherID bulunamadı, uid'den set ediliyor:", uid);
  teacherID = uid;
  localStorage.setItem("teacherID", uid);
}

// Hala teacherID yoksa → login
if (!teacherID) {
  console.warn("⚠ teacherID ve uid bulunamadı → login.html");
  alert("Öğretmen hesabı doğrulanamadı. Lütfen tekrar giriş yapın.");
  window.location.href = "login.html";
  throw new Error("teacherID yok.");
}

console.log("🎯 Öğrencilerim Sayfası Açıldı → teacherID:", teacherID);

// ====================================================================
// 2) ÖĞRENCİ LİSTESİNİ YÜKLE
// ====================================================================
async function listeOgrenciler() {
  const listeDiv = document.getElementById("ogrListe");

  if (!listeDiv) {
    console.warn("⚠ ogrListe elementi bulunamadı.");
    return;
  }

  listeDiv.innerHTML = '<div class="bos-liste">Yükleniyor...</div>';

  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      listeDiv.innerHTML = '<div class="bos-liste">Veritabanı bağlantısı yok.</div>';
      return;
    }

    // Öğretmenin profilinden students map'ini al
    const teacherRef = doc(db, "profiles", teacherID);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      listeDiv.innerHTML = '<div class="bos-liste">Öğretmen profili bulunamadı.</div>';
      return;
    }

    const teacherData = teacherSnap.data();
    const students = teacherData.students || {};

    // Sadece onaylanmış öğrencileri filtrele
    const studentIds = Object.keys(students).filter(id => students[id] === "kabul");

    if (!studentIds.length) {
      listeDiv.innerHTML = '<div class="bos-liste">Henüz onaylanmış öğrenci yok.</div>';
      return;
    }

    listeDiv.innerHTML = "";

    // Her öğrenci için bilgileri al
    for (const ogrID of studentIds) {
      try {
        const ogrRef = doc(db, "profiles", ogrID);
        const ogrSnap = await getDoc(ogrRef);

        if (!ogrSnap.exists()) continue;

        const data = ogrSnap.data() || {};
        const ad = data.username || data.ad || data.fullName || "İsimsiz Öğrenci";

        const kart = document.createElement("div");
        kart.className = "ogr-kart";

        kart.innerHTML = `
          <div>
            <div class="ogr-ad">${ad}</div>
            <div class="ogr-detay">Öğrenci ID: ${ogrID.substring(0, 8)}...</div>
          </div>
          <div class="ogr-aksiyon">
            <button class="analiz-btn" onclick="ogrenciSec('${ogrID}', '${ad}')">
              📊 Analiz Görüntüle
            </button>
          </div>
        `;

        listeDiv.appendChild(kart);
      } catch (err) {
        console.warn("⚠ Öğrenci bilgisi alınamadı:", ogrID, err);
      }
    }

  } catch (err) {
    console.error("❌ Öğrenci listesi yüklenemedi:", err);
    listeDiv.innerHTML = '<div class="bos-liste">Bir hata oluştu. Lütfen sayfayı yenileyin.</div>';
  }
}

// ====================================================================
// 3) ÖĞRENCİ SEÇ VE ANALİZ SAYFASINA YÖNLENDİR
// ====================================================================
window.ogrenciSec = function(id, ad) {
  localStorage.setItem("aktifOgrenciId", id);
  localStorage.setItem("aktifOgrenci", ad);
  window.location.href = "analiz.html";
};

// Sayfa yüklendiğinde öğrenci listesini yükle
document.addEventListener("DOMContentLoaded", () => {
  listeOgrenciler();
});

console.log("📘 ogrencilerim.js yüklendi");

