// =============================================================
// 📌 main.js — Zihin Platformu Ana Menü (Final v7.2 Ultra Stabil)
// =============================================================
//
// Bu dosya SADECE index.html’de öğrenci ana menüsünü yönetir.
// Öğretmen / Admin / Editör rollerine müdahale etmez.
// Yönlendirme router.js tarafından yapılır.
// =============================================================

import { GLOBAL, ROLES } from "./globalConfig.js";

console.log("main.js yüklendi ✔");

// =============================================================
// 1) OTURUM KONTROLÜ (KIRILMA ÖNLEYİCİ)
// =============================================================
const uid = localStorage.getItem("uid");
const role = localStorage.getItem("role");

// Login yoksa → login'e yönlendir
if (!uid || !role) {
  console.warn("⛔ Oturum bulunamadı → login.html");
  window.location.href = "login.html";
  throw new Error("Oturum bulunamadı.");
}

// =============================================================
// 2) SADECE ÖĞRENCİ EKRANINDA ÇALIŞSIN
// =============================================================
const sadeceOgrenciModu = (role === ROLES.OGRENCI);

// Öğrenci değilse oyun menüsü yüklenmez
if (!sadeceOgrenciModu) {
  console.log(`ℹ Rol öğrenci değil (${role}) — öğrenci menüsü devre dışı.`);
}

// =============================================================
// 3) ÜST BAR BİLGİLERİ
// =============================================================
const adEl = document.getElementById("kullaniciAdi");
const rolEl = document.getElementById("kullaniciRol");

// Kullanıcı adı
if (adEl) {
  const email = localStorage.getItem("loggedUser") || "-";
  adEl.textContent = "Kullanıcı: " + email;
}

// Rol adı
if (rolEl) {
  const rolYazi = {
    ogrenci: "Öğrenci",
    ogretmen: "Öğretmen",
    admin: "Admin",
    editor: "Editör"
  };
  rolEl.textContent = "Rol: " + (rolYazi[role] || role);
}

// =============================================================
// 4) ÖĞRENCİ DEĞİLSE OYUN MENÜSÜ YÜKLENMEZ
// =============================================================
if (!sadeceOgrenciModu) {
  return; // ❗ Öğrenci dışı roller için durdur
}

// =============================================================
// 5) ÖĞRENCİ OYUN MENÜSÜ (GLOBAL Tam Uyumlu)
// =============================================================
const oyunGrid =
  document.getElementById("oyunListesi") ||
  document.getElementById("oyunGrid") ||
  document.getElementById("dikkatGrid");

if (!oyunGrid) {
  console.warn("⚠ oyunGrid bulunamadı → index.html kontrol edilmeli.");
} else {
  oyunGrid.innerHTML = "";

  // Oyun kodları güvenli okuma
  const KODLAR = GLOBAL.OYUN_KODLARI || {};

  Object.keys(KODLAR).forEach(key => {
    const oyunKodu = KODLAR[key];

    // GLOBAL üzerinden oyun adı
    const oyunAdi =
      GLOBAL.OYUN_ADLARI?.[oyunKodu] ||
      (oyunKodu ? oyunKodu.replace(/_/g, " ").toUpperCase() : "Bilinmeyen Oyun");

    // Kart bileşeni
    const kart = document.createElement("div");
    kart.className = "menu-kart oyun-kart";

    kart.innerHTML = `
      <h3>${oyunAdi}</h3>
      <p>Başlamak için tıklayın</p>
    `;

    kart.onclick = () => oyunSec(oyunKodu);
    oyunGrid.appendChild(kart);
  });
}

// =============================================================
// 6) OYUN SEÇ → Hazırlık Ekranına Geç (GLOBAL UYUM)
// =============================================================
function oyunSec(oyunKodu) {
  console.log("🎮 Oyun seçildi:", oyunKodu);

  // Güvenli kayıt
  localStorage.setItem("secilenOyun", oyunKodu);
  localStorage.setItem("secilenOyunKodu", oyunKodu);

  // GLOBAL PLATFORM yoluna yönlendir
  window.location.href = GLOBAL.PLATFORM + "hazirlik.html";
}

// =============================================================
// 7) ÇIKIŞ BUTONU
// =============================================================
window.cikisYap = function () {
  localStorage.clear();
  console.log("🔒 Oturum kapatıldı → login.html");
  window.location.href = "login.html";
};

console.log("🎮 main.js çalıştı — Öğrenci menüsü başarıyla yüklendi.");