// =====================================================
// 📌 index.js — Zihin Platformu Ana Menü (Final v6.8)
// =====================================================

import { GLOBAL } from "./globalConfig.js";

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

  // =====================================
  // 🎮 Oyun Kartlarını Oluştur (GLOBAL GAME MAP)
  // =====================================
  const grid = document.getElementById("oyunGrid");
  if (!grid) {
    console.warn("⚠ oyunGrid bulunamadı (index.html kontrol edilmeli)");
    return;
  }

  grid.innerHTML = "";

  const GAME_MAP = GLOBAL.GAME_MAP || {};

  Object.keys(GAME_MAP).forEach(key => {
    const oyun = GAME_MAP[key];

    if (!oyun || !oyun.path) return; // Güvenlik

    const kart = document.createElement("div");
    kart.className = "menu-kart"; // ✔ UI uyumlu sınıf

    kart.innerHTML = `
      <h2>${oyun.ad || "Oyun"}</h2>
      <p>${oyun.kategori || "-"}</p>
    `;

    kart.onclick = () => {
      window.location.href = oyun.path;
    };

    grid.appendChild(kart);
  });
});

console.log("📘 index.js yüklendi (Final v6.8 — GLOBAL uyumlu)");