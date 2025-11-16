// =============================================================
// 📌 login.js — Giriş Ekranı Controller
// Final v6.7 — (Kırılmayan, Username Destekli, GLOBAL Uyumlu)
// =============================================================

import { login } from "../auth/auth.js";
import { yonlendir } from "./router.js";
import { ROLES } from "./router.js";   // ✔ GLOBAL merkez rol kontrolü

console.log("login.js yüklendi ✔");


// =============================================================
// 1) HTML Elemanları (Güvenli Seçim)
// =============================================================
let emailInput = document.getElementById("email");
let passInput  = document.getElementById("password");
let loginBtn   = document.getElementById("loginBtn");

// Eksik input varsa otomatik oluştur (kırılmayı önler)
function guvenliInput(id, type, placeholder) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("input");
    el.id = id;
    el.type = type;
    el.placeholder = placeholder;
    el.style.display = "block";
    el.style.margin = "10px auto";
    document.body.appendChild(el);
  }
  return el;
}

emailInput = emailInput || guvenliInput("email", "text", "Kullanıcı adı veya e-posta");
passInput  = passInput  || guvenliInput("password", "password", "Şifre");

// -------------------------------------------------------------
// Hata mesajı elementi
// -------------------------------------------------------------
let hataEl = document.getElementById("hata");
if (!hataEl) {
  hataEl = document.createElement("div");
  hataEl.id = "hata";
  hataEl.style.color = "red";
  hataEl.style.marginTop = "10px";
  hataEl.style.display = "none";
  document.body.appendChild(hataEl);
}

// -------------------------------------------------------------
// Yükleniyor alanı
// -------------------------------------------------------------
let yukleniyor = document.getElementById("yukleniyor");
if (!yukleniyor) {
  yukleniyor = document.createElement("div");
  yukleniyor.id = "yukleniyor";
  yukleniyor.textContent = "Giriş yapılıyor...";
  yukleniyor.style.display = "none";
  yukleniyor.style.marginTop = "10px";
  document.body.appendChild(yukleniyor);
}


// =============================================================
// 2) Kullanıcı Adını E-Postaya Çevirme
// =============================================================
function normalizeEmail(text) {
  // Zaten e-posta ise → direkt kullan
  if (text.includes("@")) return text;

  // Kullanıcı adı → otomatik e-posta
  return text + "@zihin.com";
}


// =============================================================
// 3) Giriş İşlemi
// =============================================================
async function girisYap() {

  hataEl.style.display = "none";
  yukleniyor.style.display = "block";

  let girisText = emailInput.value.trim();
  const pass = passInput.value.trim();

  if (!girisText || !pass) {
    hataEl.textContent = "Kullanıcı adı / e-posta ve şifre boş olamaz.";
    hataEl.style.display = "block";
    yukleniyor.style.display = "none";
    return;
  }

  // Kullanıcı adı → e-posta formatına çevir
  const email = normalizeEmail(girisText);

  console.log("➡ Firebase Login:", email);

  // ---- Firebase Login ----
  const sonuc = await login(email, pass);

  yukleniyor.style.display = "none";

  if (!sonuc.success) {
    hataEl.textContent = sonuc.message || "Giriş hatası";
    hataEl.style.display = "block";
    return;
  }

  // Rol bilgisi auth.js tarafından LS'e yazıldı
  const role = localStorage.getItem("role") || ROLES.OGRENCI;  // ✔ DOĞRU GLOBAL ROL OKUMA

  console.log("🎯 Giriş başarılı → Rol:", role);

  // Rolüne göre yönlendirme
  yonlendir(role);
}


// =============================================================
// 4) Giriş Butonu
// =============================================================
if (loginBtn) {
  loginBtn.addEventListener("click", girisYap);
}


// =============================================================
// 5) Enter Tuşu ile Giriş
// =============================================================
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    girisYap();
  }
});


// =============================================================
export { girisYap };
// =============================================================