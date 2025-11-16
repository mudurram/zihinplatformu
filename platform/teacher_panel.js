// ====================================================================
// 📘 teacher_panel.js — Öğretmen Paneli (Final Stabil v7.1)
// GLOBAL, ROUTER, FIRESTORE ile %100 uyumlu — KIRILMAZ SÜRÜM
// ====================================================================

import { db } from "../data/firebaseConfig.js";
import { yonlendir } from "./router.js";
import { ROLES } from "./globalConfig.js";

import {
  collection,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ====================================================================
// 1) ROL & OTURUM DOĞRULAMASI
// ====================================================================

const role = localStorage.getItem("role");
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid") || null;

// Rol yoksa → login
if (!role) {
  console.warn("⛔ Rol bulunamadı → login.html");
  window.location.href = "login.html";
  throw new Error("Rol yok.");
}

// Öğretmen değilse erişim kapalı
if (role !== ROLES.OGRETMEN) {
  console.warn("⛔ Yetkisiz erişim. Rol:", role);
  yonlendir(role);
  throw new Error("Yetkisiz erişim.");
}

// TeacherID yoksa → platforma dönüş
if (!teacherID) {
  console.warn("⚠ teacherID bulunamadı → index.html");
  alert("Öğretmen hesabı doğrulanamadı.");
  window.location.href = "index.html";
  throw new Error("teacherID yok.");
}

console.log("🎯 Teacher Panel Açıldı → teacherID:", teacherID, "| uid:", uid);

// ====================================================================
// 2) ÖĞRETMEN BİLGİLERİNİ YÜKLE
// ====================================================================
async function yukleOgretmenBilgisi() {
  try {
    const ref = doc(db, "profiles", teacherID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("⚠ Öğretmen profili bulunamadı.");
      return;
    }

    const data = snap.data();
    const isim = data.username || data.ad || "Öğretmen";

    const alan = document.getElementById("kullaniciAdi");
    if (alan) alan.textContent = `👩‍🏫 Öğretmen: ${isim}`;

  } catch (err) {
    console.error("❌ Öğretmen bilgisi yüklenemedi:", err);
  }
}

yukleOgretmenBilgisi();

// ====================================================================
// 3) ÖĞRENCİ LİSTESİNİ YÜKLE
// ====================================================================
async function listeOgrenciler() {
  const listeDiv = document.getElementById("ogrListe");

  if (!listeDiv) {
    console.warn("⚠ ogrListe elementi bulunamadı.");
    return;
  }

  listeDiv.innerHTML = "<p>Yükleniyor...</p>";

  try {
    const ref = collection(db, "profiles", teacherID, "ogrenciler");
    const snap = await getDocs(ref);

    listeDiv.innerHTML = "";

    if (snap.empty) {
      listeDiv.innerHTML = "<p>Henüz kayıtlı öğrenci yok.</p>";
      return;
    }

    snap.forEach(docu => {
      const ogrID = docu.id;
      const data = docu.data() || {};

      const ad = data.ad || data.username || "İsimsiz Öğrenci";

      const kart = document.createElement("div");
      kart.className = "ogr-kart";

      kart.innerHTML = `
        <div>
          <div class="ogr-ad">${ad}</div>
          <div class="ogr-detay">ID: ${ogrID}</div>
        </div>
      `;

      kart.onclick = () => ogrenciSec(ogrID, ad);

      listeDiv.appendChild(kart);
    });

  } catch (err) {
    console.error("❌ Öğrenci listesi yüklenemedi:", err);
    listeDiv.innerHTML = "<p>Bir hata oluştu.</p>";
  }
}

listeOgrenciler();

// ====================================================================
// 4) ÖĞRENCİ SEÇ — analiz.html'e yönlendir
// ====================================================================
function ogrenciSec(id, ad) {
  localStorage.setItem("aktifOgrenciId", id);
  localStorage.setItem("aktifOgrenci", ad || "Bilinmiyor");

  console.log("📌 Öğrenci seçildi:", id, ad);

  window.location.href = "analiz.html";
}

// ====================================================================
// 5) MODAL (Opsiyonel)
// ====================================================================
window.modalKapat = function () {
  const arka = document.getElementById("ogrModal");
  if (arka) arka.style.display = "none";
};

// ====================================================================
// 6) ÇIKIŞ YAP
// ====================================================================
window.cikisYap = function () {
  localStorage.clear();
  console.log("🔒 Oturum kapatıldı.");
  window.location.href = "login.html";
};

// ====================================================================
console.log("📘 teacher_panel.js yüklendi (Final v7.1 • Ultra Stabil)");
// ====================================================================