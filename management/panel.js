// ============================================================================
// 📘 panel.js — Öğretmen Paneli (Final v7.1 Ultra Stabil)
// Öğrenci Listeleme + Analiz Yönlendirme + Rol Güvenliği
// ============================================================================

console.log("📘 panel.js yüklendi (FINAL v7.1)");

import { auth, db } from "../data/firebaseConfig.js";
import { ROLES } from "../platform/globalConfig.js";

import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// HTML Referansı
const ogrenciListesi = document.getElementById("ogrenciListesi");

// ============================================================================
// 🛡 1) Oturum + Rol Güvenliği
// ============================================================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("⛔ Oturum yok → login.html");
    window.location.href = "../auth/login.html";
    return;
  }

  const uid = user.uid;
  console.log("👩‍🏫 Kullanıcı giriş yaptı:", uid);

  // Firestore profil okuma
  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("⚠ Profil bulunamadı!");
    window.location.href = "../auth/login.html";
    return;
  }

  const data = snap.data();

  // Rol doğrulama (SADECE öğretmen girebilir)
  if (data.role !== ROLES.OGRETMEN) {
    console.warn("⛔ Bu sayfaya yalnızca öğretmen erişebilir!");
    window.location.href = "../platform/index.html";
    return;
  }

  console.log("✔ Öğretmen doğrulandı");

  // Öğrencileri yükle
  loadTeacherStudents(uid);
});


// ============================================================================
// 📥 2) Öğretmenin öğrencilerini Firestore’dan yükle
// ============================================================================

async function loadTeacherStudents(teacherUid) {
  try {
    const ogrRef = collection(
      db,
      "profiles",
      teacherUid,
      "ogrenciler"
    );

    const snap = await getDocs(ogrRef);

    ogrenciListesi.innerHTML = ""; // listeyi temizle

    if (snap.empty) {
      ogrenciListesi.innerHTML =
        "<p style='text-align:center; opacity:.7;'>Kayıtlı öğrenci yok.</p>";
      return;
    }

    snap.forEach((docu) => {
      const ogrID = docu.id;
      const data = docu.data();
      const isim = data.ad || data.username || "İsimsiz Öğrenci";

      const div = document.createElement("div");
      div.className = "ogrenci-item";

      div.innerHTML = `
        <span>${isim}</span>
        <button data-id="${ogrID}">Analiz</button>
      `;

      // 🔎 Analiz sayfasına yönlendirme
      div.querySelector("button").addEventListener("click", () => {
        localStorage.setItem("aktifOgrenciId", ogrID);
        localStorage.setItem("aktifOgrenci", isim);

        console.log("🔎 Analiz ekranına gidiliyor →", ogrID);
        window.location.href = "../platform/analiz.html";
      });

      ogrenciListesi.appendChild(div);
    });
  } catch (err) {
    console.error("⚠ Öğrenciler yüklenirken hata:", err);
    ogrenciListesi.innerHTML =
      "<p style='text-align:center; opacity:.7;'>Hata oluştu.</p>";
  }
}


// ============================================================================
// 🚪 3) Çıkış Yap
// ============================================================================

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.clear();
  console.log("🔒 Oturum kapatıldı.");
  window.location.href = "../auth/login.html";
});

console.log("📘 panel.js çalıştı — Öğretmen paneli hazır");