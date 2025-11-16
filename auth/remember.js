// =============================================================
// 📌 remember.js — Oturum Hatırlatma & LocalStorage Yönetimi
// Zihin Platformu v7.1 — Final, Ultra Stabil, Kırılmaz Yapı
// =============================================================

import { watchAuthState } from "../auth/auth.js";
import { ROLES, GLOBAL } from "../platform/globalConfig.js";

console.log("remember.js yüklendi ✔");

// =============================================================
// 🔍 1) Firebase Oturumunu İzle
// =============================================================
// Kullanıcı giriş-çıkış yaptığında localStorage senkronize edilir.
// =============================================================
watchAuthState(user => {
  if (!user) {
    console.warn("🔸 remember.js → Oturum yok → storage temizleniyor.");

    // Kullanıcı çıkış yaptığında sadece kritik alanlar silinir:
    localStorage.removeItem("uid");
    localStorage.removeItem("loggedUser");
    // role, teacherID, aktifOgrenci bilgileri korunmaz
    localStorage.removeItem("role");
    localStorage.removeItem("teacherID");
    localStorage.removeItem("aktifOgrenciId");
    localStorage.removeItem("aktifOgrenci");

    return;
  }

  console.log("🔹 remember.js → Oturum bulundu:", user.email);

  // uid yazılmamışsa → yaz
  if (!localStorage.getItem("uid")) {
    localStorage.setItem("uid", user.uid);
  }

  // email yazılmamışsa → yaz
  if (!localStorage.getItem("loggedUser")) {
    localStorage.setItem("loggedUser", user.email);
  }
});

// =============================================================
// 📌 2) Rol Güvenliği — Rol yoksa OGRENCI atanır
// =============================================================
export function ensureRole() {
  let role = localStorage.getItem("role");

  if (!role) {
    console.warn("⚠ remember.js → Rol bulunamadı → OGRENCI atanıyor.");
    role = ROLES.OGRENCI;
    localStorage.setItem("role", role);
  }

  return role;
}

// =============================================================
// 📌 3) Öğretmen Bağlantısı — teacherID garantisi
// =============================================================
export function ensureTeacherLink() {
  const role = localStorage.getItem("role");

  // Sadece öğretmen için anlamlı
  if (role === ROLES.OGRETMEN) {
    const uid = localStorage.getItem("uid");

    // Eğer teacherID yoksa → öğretmenin kendi uid'si yazılır
    if (uid && !localStorage.getItem("teacherID")) {
      localStorage.setItem("teacherID", uid);
      console.log("📘 remember.js → teacherID atanmış:", uid);
    }
  }
}

// =============================================================
// 📌 4) Çalıştırıcı: Tüm hatırlama fonksiyonlarını aktif et
// =============================================================
export function initRemember() {
  console.log("🚀 remember.js → Init başladı.");

  ensureRole();
  ensureTeacherLink();

  console.log("🚀 remember.js → Init tamamlandı.");
}

// Otomatik başlat
initRemember();