// =============================================================
// 📌 auth.js — Firebase Auth + Rol Yönetimi (Final v7.1 Ultra Stabil)
// Konum: /auth/auth.js   ← ✔ PATH DOĞRU
// =============================================================
//
// Bu dosya login, register, logout ve tüm rol-UID yönetimini yapar.
// globalConfig.js + router.js ile %100 uyumludur.
// =============================================================

import { auth, db } from "../data/firebaseConfig.js";
import { ROLES } from "../platform/globalConfig.js";
import { yonlendir } from "../platform/router.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("auth.js yüklendi ✔");


// =============================================================
// 🔵 1) LOGIN — Username veya Email ile Giriş
// =============================================================
export async function login(usernameOrEmail, password) {
  try {
    let email = usernameOrEmail.trim();

    // Kullanıcı adı ile giriş (email yoksa)
    if (!email.includes("@")) {
      const q = query(
        collection(db, "profiles"),
        where("username", "==", email)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        return { success: false, message: "Kullanıcı bulunamadı!" };
      }

      email = snap.docs[0].data().email;
    }

    // Firebase Authentication
    const result = await signInWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;

    // Profil bilgisi
    const ref = doc(db, "profiles", uid);
    const profileSnap = await getDoc(ref);

    if (!profileSnap.exists()) {
      return { success: false, message: "Profil bulunamadı!" };
    }

    const data = profileSnap.data();
    const role = data.role || ROLES.OGRENCI;

    // LocalStorage — Merkez Yazım
    localStorage.setItem("uid", uid);
    localStorage.setItem("loggedUser", email);
    localStorage.setItem("role", role);
    localStorage.setItem("username", data.username || "");

    // Öğretmen için teacherID = kendi UID
    if (role === ROLES.OGRETMEN) {
      localStorage.setItem("teacherID", uid);
    }

    console.log("🎯 Giriş başarılı. Rol:", role);

    yonlendir(role);
    return { success: true };

  } catch (err) {
    console.error("🚫 Login hatası:", err);
    return { success: false, message: "Giriş yapılamadı." };
  }
}


// =============================================================
// 🟢 2) REGISTER — Yeni Kullanıcı
// =============================================================
export async function register(email, password, role = ROLES.OGRENCI) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    await setDoc(doc(db, "profiles", uid), {
      email,
      role,
      username: email.split("@")[0],
      createdAt: new Date().toISOString()
    });

    return { success: true };

  } catch (err) {
    return { success: false, message: err.message };
  }
}


// =============================================================
// 🔴 3) LOGOUT
// =============================================================
export async function logout() {
  try {
    await signOut(auth);
    localStorage.clear();
    return true;
  } catch (err) {
    console.error("Logout hatası:", err);
    return false;
  }
}


// =============================================================
// 🟡 4) OTURUM DİNLEYİCİ
// =============================================================
export function watchAuthState(callback) {
  return auth.onAuthStateChanged(callback);
}