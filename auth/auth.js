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
  createStudentTeacherRequest,
  createInstitutionTeacherRequest
} from "../data/requestService.js";

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
    if (!auth || !db) {
      console.error("❌ Firebase başlatılamadı!");
      return { success: false, message: "Sistem hatası. Lütfen sayfayı yenileyin." };
    }

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
export async function register(formData, password) {
  try {
    if (!auth || !db) {
      console.error("❌ Firebase başlatılamadı!");
      return { success: false, message: "Sistem hatası. Lütfen sayfayı yenileyin." };
    }

    const email = formData.email;
    const role = formData.role || ROLES.OGRENCI;

    const res = await createUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    const baseProfile = {
      username: formData.username,
      email,
      fullName: formData.fullName,
      role,
      phone: formData.phone || null,
      teachers: {},
      students: {},
      institution: { id: null, status: null },
      pendingRequests: [],
      createdAt: new Date().toISOString()
    };

    // Role based enrichments
    if (role === ROLES.OGRENCI) {
      baseProfile.teachers = {};
      if (formData.meta?.teacherUsername) {
        baseProfile.pendingRequests.push({
          type: "student_teacher",
          teacherUsername: formData.meta.teacherUsername,
          createdAt: Date.now()
        });
      }
      if (formData.meta?.institutionCode) {
        baseProfile.institution = { id: formData.meta.institutionCode, status: "beklemede" };
      }
    } else if (role === ROLES.OGRETMEN) {
      baseProfile.students = {};
      if (formData.meta?.institutionCode) {
        baseProfile.institution = { id: formData.meta.institutionCode, status: "beklemede" };
      }
    } else if (role === ROLES.INSTITUTION) {
      baseProfile.institutionProfile = {
        name: formData.meta?.institution?.name || "",
        code: formData.meta?.institution?.code || "",
        address: formData.meta?.institution?.address || "",
        phone: formData.meta?.institution?.phone || ""
      };
    }

    await setDoc(doc(db, "profiles", uid), baseProfile);

    await handlePostRegisterRequests({ uid, role, meta: formData.meta });

    return { success: true };

  } catch (err) {
    console.error("register error", err);
    return { success: false, message: err.message };
  }
}

async function handlePostRegisterRequests({ uid, role, meta }) {
  if (!meta) return;

  if (role === ROLES.OGRENCI && meta.teacherUsername) {
    // Öğretmen username → UID lookup
    const teacherUid = await findUserByUsername(meta.teacherUsername);
    if (teacherUid) {
      await createStudentTeacherRequest(uid, teacherUid);
    }
  }

  if ((role === ROLES.OGRENCI || role === ROLES.OGRETMEN) && meta.institutionCode) {
    const instId = await findInstitutionByCode(meta.institutionCode);
    if (instId) {
      await createInstitutionTeacherRequest(uid, instId);
    }
  }
}

async function findUserByUsername(username) {
  if (!username) return null;
  const q = query(collection(db, "profiles"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function findInstitutionByCode(code) {
  if (!code) return null;
  const q = query(collection(db, "institutions"), where("code", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
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