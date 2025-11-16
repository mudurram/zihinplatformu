// =============================================================
// 📌 hazirlik.js — Oyun Hazırlık Ekranı
// Final v7.1 • Ultra Stabil • GLOBAL Tam Uyumlu
// =============================================================

import { GLOBAL, ROLES } from "./globalConfig.js";

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // 1) ROL KONTROLÜ
  // ---------------------------------------------------------
  const role = localStorage.getItem("role");
  const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");

  // Öğretmen → mutlaka öğrenci seçmiş olmalı
  if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
    alert("ℹ Oyunu başlatmadan önce bir öğrenci seçmelisiniz.");
    window.location.href = "teacher_panel.html";
    return;
  }

  // Admin / Editor bu ekrana giremez
  if (role === ROLES.ADMIN || role === ROLES.EDITOR) {
    alert("⛔ Bu ekran admin/editor için kapalıdır.");
    window.location.href = "index.html";
    return;
  }

  // ---------------------------------------------------------
  // 2) SEÇİLEN OYUN KODUNU AL
  // ---------------------------------------------------------
  const oyunKodu =
    localStorage.getItem("secilenOyunKodu") ||
    localStorage.getItem("secilenOyun") ||
    localStorage.getItem("seciliOyun");

  if (!oyunKodu) {
    console.warn("⚠ Oyun kodu bulunamadı.");
    yazdir("Oyun Bulunamadı", "Lütfen ana menüden bir oyun seçiniz.");
    return;
  }

  // ---------------------------------------------------------
  // 3) GLOBAL ÜZERİNDEN OYUN ADI & PATH
  // ---------------------------------------------------------
  const oyunYolu = GLOBAL.OYUN_YOLLARI?.[oyunKodu] || null;

  const oyunAdi =
    GLOBAL.OYUN_ADLARI?.[oyunKodu] ||
    oyunKodu.replace(/_/g, " ").toUpperCase();

  if (!oyunYolu) {
    console.warn("⚠ GLOBAL.OYUN_YOLLARI içinde tanım bulunamadı:", oyunKodu);
    yazdir("Tanımlanamayan Oyun", "Bu oyun sistemde kayıtlı değil.");
    return;
  }

  // ---------------------------------------------------------
  // 4) HAZIRLIK METNİ
  // ---------------------------------------------------------
  const aciklamaText =
    "Bu oyun Zihin Platformu dikkat modüllerinden biridir. Başlamak için hazırlanın.";

  yazdir(oyunAdi, aciklamaText);

  // ---------------------------------------------------------
  // 5) BAŞLAT BUTONU — OYUNU BAŞLAT
  // ---------------------------------------------------------
  const baslaBtn = document.getElementById("baslaBtn");

  if (baslaBtn) {
    baslaBtn.onclick = () => {
      console.log("🎮 Oyun başlatılıyor:", oyunYolu);
      window.location.href = oyunYolu;
    };
  } else {
    console.warn("⚠ baslaBtn bulunamadı — HTML kontrol edilmeli.");
  }

  // ---------------------------------------------------------
  // 6) YAZDIRMA FONKSİYONU (SAFE, XSS KORUMALI)
  // ---------------------------------------------------------
  function yazdir(baslik, aciklama) {
    const baslikEl = document.getElementById("hazirlikBaslik");
    const acikEl = document.getElementById("hazirlikMetni");

    if (baslikEl) baslikEl.textContent = baslik;
    if (acikEl) acikEl.textContent = aciklama;
  }

});