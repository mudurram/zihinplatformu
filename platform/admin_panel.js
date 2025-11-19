// =============================================================
// 📌 admin_panel.js — Admin Paneli (Final v6.6, Stabil)
// =============================================================

console.log("🛠 admin_panel.js yüklendi");

// -------------------------------------------------------------
// 📌 Firebase + Router
// -------------------------------------------------------------
import { db } from "../data/firebaseConfig.js";
import { ROLES } from "./router.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { logout } from "../auth/auth.js";

// -------------------------------------------------------------
// Router kontrolü
// -------------------------------------------------------------
import { yonlendir } from "./router.js";


// -------------------------------------------------------------
// 1) ROL DOĞRULAMA — sadece admin girebilir
// -------------------------------------------------------------
const role = localStorage.getItem("role");

if (role !== ROLES.ADMIN) {
  alert("⛔ Bu sayfaya yalnızca admin erişebilir.");
  yonlendir(role || ROLES.OGRENCI);
  throw new Error("Admin yetkisi yok.");
}


// -------------------------------------------------------------
// 2) TÜM KULLANICILARI LİSTELE
// -------------------------------------------------------------
async function listeleKullanicilar() {
  const div = document.getElementById("kullaniciListesi");
  if (!div) {
    console.warn("⚠ kullaniciListesi elementi bulunamadı.");
    return;
  }
  
  div.innerHTML = "<p>Yükleniyor...</p>";

  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      div.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
      return;
    }

    const ref = collection(db, "profiles");
    const snap = await getDocs(ref);

    div.innerHTML = "";

    snap.forEach(docu => {
      const data = docu.data();
      const id = docu.id;

      const kart = document.createElement("div");
      kart.className = "kullanici-kart";

      kart.innerHTML = `
        <div style="flex:1;">
            <strong>${data.username || "Kullanıcı"}</strong><br>
            <small>${data.email || "-"}</small>
        </div>

        <div style="display:flex; align-items:center;">
            <select class="rol-sec" id="rol_${id}">
              <option value="ogrenci">Öğrenci</option>
              <option value="ogretmen">Öğretmen</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>

            <button class="btn-kaydet" onclick="rolKaydet('${id}')">
              Kaydet
            </button>
        </div>
      `;

      div.appendChild(kart);

      // Mevcut rolü seçili yapıyoruz
      setTimeout(() => {
        const eleman = document.getElementById(`rol_${id}`);
        if (eleman) eleman.value = data.role || "ogrenci";
      }, 50);
    });

  } catch (err) {
    console.error("⚠ Kullanıcı listesi okunamadı:", err);
    div.innerHTML = "<p>Hata oluştu.</p>";
  }
}

listeleKullanicilar();


// -------------------------------------------------------------
// 3) ROL GÜNCELLEME
// -------------------------------------------------------------
window.rolKaydet = async function (uid) {
  const rolSelect = document.getElementById(`rol_${uid}`);
  if (!rolSelect) {
    alert("Rol seçim alanı bulunamadı.");
    return;
  }
  
  const yeniRol = rolSelect.value;

  try {
    if (!db) {
      alert("Veritabanı bağlantısı yok.");
      return;
    }

    const ref = doc(db, "profiles", uid);
    await updateDoc(ref, { role: yeniRol });

    alert("✔ Rol başarıyla güncellendi!");

  } catch (err) {
    console.error("❌ Rol kaydı yapılamadı:", err);
    alert("Hata oluştu.");
  }
};


// -------------------------------------------------------------
// 4) ÇIKIŞ YAP
// -------------------------------------------------------------
window.cikisYap = async function () {
  await logout();
  window.location.href = "login.html";
};