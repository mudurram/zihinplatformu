// =============================================================
// 📌 login.js — Giriş Ekranı Controller
// Final v7.8 — (Kırılmayan, Username Destekli, GLOBAL Uyumlu)
// =============================================================

import { login } from "../auth/auth.js";
import { yonlendir } from "./router.js";
import { ROLES } from "./globalConfig.js";

console.log("login.js yüklendi ✔");

// =============================================================
// 1) HTML Elemanları
// =============================================================
let emailInput, passInput, loginBtn, hataEl, yukleniyor;

// DOM yüklendiğinde elemanları al
document.addEventListener("DOMContentLoaded", () => {
  emailInput = document.getElementById("email");
  passInput = document.getElementById("password");
  loginBtn = document.getElementById("loginBtn");
  hataEl = document.getElementById("hata");
  yukleniyor = document.getElementById("yukleniyor");

  // Eksik elemanları kontrol et
  if (!emailInput) {
    console.error("❌ Email input bulunamadı!");
    return;
  }
  if (!passInput) {
    console.error("❌ Password input bulunamadı!");
    return;
  }
  if (!loginBtn) {
    console.error("❌ Login button bulunamadı!");
    return;
  }
  if (!hataEl) {
    console.warn("⚠ Hata elementi bulunamadı, oluşturuluyor...");
    hataEl = document.createElement("div");
    hataEl.id = "hata";
    hataEl.style.cssText = "color: #e74c3c; margin-top: 15px; display: none; font-size: 14px; font-weight: 500;";
    const container = document.querySelector(".login-container");
    if (container) container.appendChild(hataEl);
  }
  if (!yukleniyor) {
    console.warn("⚠ Yükleniyor elementi bulunamadı, oluşturuluyor...");
    yukleniyor = document.createElement("div");
    yukleniyor.id = "yukleniyor";
    yukleniyor.textContent = "Giriş yapılıyor...";
    yukleniyor.style.cssText = "color: #3498db; margin-top: 15px; display: none; font-size: 14px;";
    const container = document.querySelector(".login-container");
    if (container) container.appendChild(yukleniyor);
  }

  // Giriş butonunu bağla
  loginBtn.addEventListener("click", girisYap);
  
  // Enter tuşu ile giriş
  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      passInput.focus();
    }
  });
  passInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      girisYap();
    }
  });
});

// =============================================================
// 2) Giriş İşlemi
// =============================================================
async function girisYap() {
  if (!emailInput || !passInput || !hataEl || !yukleniyor) {
    console.error("❌ Gerekli elemanlar bulunamadı!");
    alert("Sayfa yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
    return;
  }

  hataEl.style.display = "none";
  yukleniyor.style.display = "block";
  yukleniyor.textContent = "Giriş yapılıyor...";

  const girisText = emailInput.value.trim();
  const pass = passInput.value.trim();

  if (!girisText || !pass) {
    hataEl.textContent = "Kullanıcı adı / e-posta ve şifre boş olamaz.";
    hataEl.style.display = "block";
    yukleniyor.style.display = "none";
    return;
  }

  console.log("➡ Giriş yapılıyor:", girisText.substring(0, 3) + "***");

  try {
    // auth.js zaten username veya email ile giriş yapıyor
    const sonuc = await login(girisText, pass);

    yukleniyor.style.display = "none";

    if (!sonuc.success) {
      console.error("❌ Giriş başarısız:", sonuc.message);
      hataEl.textContent = sonuc.message || "Giriş hatası. Lütfen bilgilerinizi kontrol edin.";
      hataEl.style.display = "block";
      return;
    }

    // Giriş başarılı - auth.js zaten yönlendirme yapıyor
    console.log("🎯 Giriş başarılı, yönlendiriliyor...");
    yukleniyor.textContent = "Giriş başarılı! Yönlendiriliyor...";
  } catch (err) {
    console.error("❌ Giriş hatası (catch):", err);
    console.error("Hata detayları:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    yukleniyor.style.display = "none";
    hataEl.textContent = err.message || "Giriş yapılırken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.";
    hataEl.style.display = "block";
  }
}

// =============================================================
export { girisYap };
// =============================================================
