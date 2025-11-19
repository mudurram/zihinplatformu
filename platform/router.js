// =============================================================
// 📌 router.js — Zihin Platformu Rol Tabanlı Yönlendirme Motoru
// Final v7.6 — GLOBAL + AUTH + INSTITUTION tam uyumlu
// =============================================================

console.log("router.js yüklendi ✔");

import { ROLES, GLOBAL } from "./globalConfig.js";

// =============================================================
// 1) ROLE → ROUTE TABLOSU
// =============================================================
export const ROLE_ROUTES = {
  [ROLES.OGRENCI]: GLOBAL.ROUTES[ROLES.OGRENCI],
  [ROLES.OGRETMEN]: GLOBAL.ROUTES[ROLES.OGRETMEN],
  [ROLES.ADMIN]: GLOBAL.ROUTES[ROLES.ADMIN],
  [ROLES.EDITOR]: GLOBAL.ROUTES[ROLES.EDITOR],
  [ROLES.INSTITUTION]: GLOBAL.ROUTES[ROLES.INSTITUTION]
};

// =============================================================
// 2) OTOMATİK YÖNLENDİRME MOTORU
// =============================================================
export function yonlendir(role) {
  let hedef = ROLE_ROUTES[role];

  if (!hedef) {
    console.warn("⚠ Tanımsız rol:", role);
    window.location.href = "./index.html";
    return;
  }

  // Eğer çağrıldığı yer auth/ klasöründen ise, yolu düzelt
  const currentPath = window.location.pathname;
  if (currentPath.includes("/auth/") || currentPath.includes("\\auth\\")) {
    // auth/ klasöründen çağrıldıysa ../platform/ ekle
    if (!hedef.startsWith("../") && !hedef.startsWith("http")) {
      hedef = "../platform/" + hedef.replace("./", "");
    }
  }

  console.log(`➡ Rol yönlendirme → ${role} → ${hedef}`);
  window.location.href = hedef;
}

// =============================================================
// 3) HTML → Manuel Yönlendirme
// =============================================================
window.rolYonlendir = function () {
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || ROLES.OGRENCI;
  yonlendir(role);
};

// =============================================================
// 4) SAYFA ROL KONTROLÜ
// =============================================================
export function sayfaRolKontrol(gerekliRol) {
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE);

  if (!role) {
    console.warn("🚫 Rol yok → login.html");
    window.location.href = "./login.html";
    return false;
  }

  if (role !== gerekliRol) {
    console.warn(`🚫 Yetkisiz (${role}) → gerekli: ${gerekliRol}`);
    yonlendir(role);
    return false;
  }

  return true;
}

// =============================================================
console.log("router.js (Final v7.6) tamamlandı ✔✔✔");