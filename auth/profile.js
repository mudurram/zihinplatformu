// ============================================================
// 📌 profile.js — Kullanıcı Profil Bilgisi (Final v7.1 Ultra Stabil)
// Zihin Platformu Tam Uyumlu — Kırılmaz Mimari
// ============================================================

import { auth } from "../data/firebaseConfig.js";
import { watchAuthState, logout } from "../auth/auth.js";
import { ROLES } from "../platform/globalConfig.js";
import { yonlendir } from "../platform/router.js";

console.log("profile.js yüklendi ✔");


// ============================================================
// 🔍 1) Kullanıcı Oturum Kontrolü
// ============================================================
//
// Bu dosya yalnızca giriş yapılmış bir kullanıcı varsa çalışır.
// Kullanıcı yoksa → login.html’e yönlendirilir.
//
watchAuthState(async user => {
  if (!user) {
    console.warn("🚫 Kullanıcı oturumu yok → login.html");
    window.location.href = "login.html";
    return;
  }

  console.log("👤 Profil yükleniyor:", user.email);

  // ---------------------------------------
  // EMAIL
  // ---------------------------------------
  const emailEl = document.getElementById("email");
  if (emailEl) emailEl.textContent = user.email || "-";

  // ---------------------------------------
  // UID
  // ---------------------------------------
  const uidEl = document.getElementById("uid");
  if (uidEl) uidEl.textContent = user.uid || "-";

  // ---------------------------------------
  // ROLE (LocalStorage üzerinden güvenli okuma)
  // ---------------------------------------
  const roleEl = document.getElementById("role");
  const role = localStorage.getItem("role") || ROLES.OGRENCI;
  if (roleEl) roleEl.textContent = role;

  // ---------------------------------------
  // TEACHER ID (Sadece öğrenciler için anlamlı)
  // ---------------------------------------
  const teacherEl = document.getElementById("teacherID");
  const teacherID = localStorage.getItem("teacherID");
  if (teacherEl) teacherEl.textContent = teacherID || "-";
});


// ============================================================
// 🚪 2) Çıkış Butonu (Full Stabil)
// ============================================================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    console.log("🚪 Çıkış yapılıyor...");

    await logout();

    console.log("👋 Kullanıcı çıkış yaptı → login.html");
    window.location.href = "login.html";
  };
}


// ============================================================
// 🔐 3) Profil Ekranı Rol Güvenliği
// ============================================================
//
// Profil tüm roller tarafından görüntülenebilir.
// Ancak istenirse rol bazlı UI kısıtlamaları buraya eklenir.
// ------------------------------------------------------------
(function rolKontrol() {
  const role = localStorage.getItem("role");

  if (!role) {
    console.warn("⚠ Rol bulunamadı → login.html");
    window.location.href = "login.html";
    return;
  }

  console.log("🔐 Profil ekranı görüntülendi. Rol:", role);

  // Buraya istenirse:
  // if (role !== ROLES.OGRENCI) hideElement(...)
})();