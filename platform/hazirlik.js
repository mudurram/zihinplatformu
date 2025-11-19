// =============================================================
// 📌 hazirlik.js — Oyun Hazırlık Ekranı
// Final v7.1 • Ultra Stabil • GLOBAL Tam Uyumlu
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS, SUBSKILLS } from "./globalConfig.js";

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
  guncelleUstPanel();

  const oyunKodu = getAktifOyunKodu();

  if (!oyunKodu) {
    console.warn("⚠ Oyun kodu bulunamadı.");
    yazdir("Oyun Bulunamadı", "Lütfen ana menüden bir oyun seçiniz.");
    return;
  }

  const oyun = (GLOBAL.GAME_MAP || {})[oyunKodu];
  if (!oyun) {
    console.warn("⚠ GAME_MAP içinde oyun bulunamadı:", oyunKodu);
    yazdir("Tanımlanamayan Oyun", "Bu oyun sistemde kayıtlı değil.");
    return;
  }

  const oyunYolu = oyun.path;
  const alan = BRAIN_AREAS[oyun.alan];
  const alt =
    (SUBSKILLS[oyun.alan] || []).find(sub => sub.id === oyun.altBeceri) || {};

  const perfList = (oyun.performans || []).map(p => `<span class="badge">${p}</span>`).join(" ");
  const modulList = (oyun.moduller || [])
    .map(mod => BRAIN_AREAS[mod]?.ad || mod)
    .join(", ");

  const aciklamaHTML = `
    <b>${oyun.ad}</b> oyunu için hazırlık tamam.<br><br>
    Hedef Alan: <b>${alan?.ad || "-"}</b><br>
    Alt Beceriler: <b>${alt?.ad || "-"}</b><br>
    Ölçülen Performanslar: ${perfList || "-"}<br>
    Desteklenen Modüller: ${modulList || "-"}<br><br>
    Hazırlık süresi: <b>30 sn</b> • Oyun süresi oyuna göre dinamik.
  `;

  yazdir(oyun.ad, aciklamaHTML, true);

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
  function yazdir(baslik, aciklama, isHtml = false) {
    const baslikEl = document.getElementById("hazirlikBaslik");
    const acikEl = document.getElementById("hazirlikMetni");

    if (baslikEl) baslikEl.textContent = baslik;
    if (acikEl) {
      if (isHtml) {
        acikEl.innerHTML = aciklama;
      } else {
        acikEl.textContent = aciklama;
      }
    }
  }

  function getAktifOyunKodu() {
    return (
      localStorage.getItem(GLOBAL.LS_KEYS.AKTIF_OYUN) ||
      localStorage.getItem("secilenOyunKodu") ||
      localStorage.getItem("secilenOyun") ||
      localStorage.getItem("seciliOyun")
    );
  }

  function guncelleUstPanel() {
    const adEl = document.getElementById("kullaniciAdi");
    const rolEl = document.getElementById("kullaniciRol");
    const email = localStorage.getItem("loggedUser") || "-";
    const role = localStorage.getItem("role") || "-";
    const rolYazi = {
      ogrenci: "Öğrenci",
      ogretmen: "Öğretmen",
      admin: "Admin",
      editor: "Editör",
      institution: "Kurum"
    };

    if (adEl) adEl.textContent = `Kullanıcı: ${email}`;
    if (rolEl) rolEl.textContent = `Rol: ${rolYazi[role] || role}`;
  }

});