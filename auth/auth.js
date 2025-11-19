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
  createStudentInstitutionRequest,
  createTeacherInstitutionRequest
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
    console.log("🔵 Login başlatılıyor...", { usernameOrEmail: usernameOrEmail?.substring(0, 3) + "***" });
    
    // Firebase kontrolü
    if (!auth) {
      console.error("❌ Firebase Auth başlatılamadı!");
      return { success: false, message: "Sistem hatası: Firebase Auth başlatılamadı. Lütfen sayfayı yenileyin." };
    }
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Sistem hatası: Firestore başlatılamadı. Lütfen sayfayı yenileyin." };
    }

    if (!usernameOrEmail || !password) {
      return { success: false, message: "Kullanıcı adı ve şifre boş olamaz!" };
    }

    let email = usernameOrEmail.trim();
    console.log("📧 Giriş metni:", email.includes("@") ? "Email formatı" : "Kullanıcı adı formatı");

    // Kullanıcı adı ile giriş (email yoksa)
    if (!email.includes("@")) {
      console.log("🔍 Kullanıcı adı ile arama yapılıyor:", email);
      
      try {
        const q = query(
          collection(db, "profiles"),
          where("username", "==", email)
        );

        const snap = await getDocs(q);
        
        if (snap.empty) {
          console.warn("⚠ Kullanıcı adı bulunamadı:", email);
          return { success: false, message: "Kullanıcı adı bulunamadı!" };
        }

        const userData = snap.docs[0].data();
        email = userData.email;
        
        if (!email) {
          console.error("❌ Kullanıcı profilinde email alanı yok!");
          return { success: false, message: "Kullanıcı profilinde e-posta bilgisi bulunamadı!" };
        }
        
        console.log("✅ Kullanıcı adı bulundu, email:", email.substring(0, 3) + "***");
      } catch (queryErr) {
        console.error("❌ Kullanıcı arama hatası:", queryErr);
        return { success: false, message: "Kullanıcı aranırken bir hata oluştu: " + queryErr.message };
      }
    }

    // Email format kontrolü
    if (!email || !email.includes("@")) {
      console.error("❌ Geçersiz email formatı:", email);
      return { success: false, message: "Geçersiz e-posta adresi!" };
    }

    console.log("🔐 Firebase Authentication deneniyor...");
    
    // Firebase Authentication
    let result;
    try {
      result = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase Auth başarılı, UID:", result.user.uid);
    } catch (authErr) {
      console.error("❌ Firebase Auth hatası:", authErr);
      throw authErr; // Hata mesajı aşağıda işlenecek
    }
    
    const uid = result.user.uid;

    // Profil bilgisi
    console.log("📋 Profil bilgisi alınıyor...");
    const ref = doc(db, "profiles", uid);
    const profileSnap = await getDoc(ref);

    if (!profileSnap.exists()) {
      console.error("❌ Profil Firestore'da bulunamadı, UID:", uid);
      return { success: false, message: "Kullanıcı profili bulunamadı! Lütfen yöneticiye başvurun." };
    }

    const data = profileSnap.data();
    const role = data.role || ROLES.OGRENCI;
    
    console.log("✅ Profil bulundu, Rol:", role);

    // LocalStorage — Merkez Yazım
    try {
      localStorage.setItem("uid", uid);
      localStorage.setItem("loggedUser", email);
      localStorage.setItem("role", role);
      localStorage.setItem("username", data.username || "");
      console.log("💾 LocalStorage güncellendi");
    } catch (lsErr) {
      console.warn("⚠ LocalStorage yazma hatası:", lsErr);
      // Devam et, kritik değil
    }

    // Öğretmen için teacherID = kendi UID
    if (role === ROLES.OGRETMEN) {
      localStorage.setItem("teacherID", uid);
      console.log("👩‍🏫 Öğretmen ID kaydedildi");
    }

    console.log("🎯 Giriş başarılı. Rol:", role, "UID:", uid);

    // Yönlendirme
    try {
      yonlendir(role);
    } catch (redirectErr) {
      console.error("❌ Yönlendirme hatası:", redirectErr);
      // Yönlendirme hatası olsa bile başarılı sayılabilir
    }
    
    return { success: true };

  } catch (err) {
    console.error("🚫 Login hatası (catch):", err);
    console.error("Hata detayları:", {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    
    let errorMessage = "Giriş yapılamadı.";
    
    if (err.code) {
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "Geçersiz e-posta adresi!";
          break;
        case "auth/user-not-found":
          errorMessage = "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı!";
          break;
        case "auth/wrong-password":
          errorMessage = "Şifre yanlış!";
          break;
        case "auth/invalid-credential":
          errorMessage = "Kullanıcı adı veya şifre yanlış!";
          break;
        case "auth/too-many-requests":
          errorMessage = "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Ağ hatası. İnternet bağlantınızı kontrol edin.";
          break;
        case "auth/user-disabled":
          errorMessage = "Bu hesap devre dışı bırakılmış!";
          break;
        case "permission-denied":
          errorMessage = "Veritabanı erişim izni yok!";
          break;
        default:
          errorMessage = err.message || `Giriş yapılamadı. (Hata: ${err.code || "Bilinmeyen"})`;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return { success: false, message: errorMessage };
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

  if (role === ROLES.OGRENCI && meta.institutionCode) {
    // Öğrenci → Kurum başvurusu
    const instId = await findInstitutionByCode(meta.institutionCode);
    if (instId) {
      await createStudentInstitutionRequest(uid, instId);
    }
  }

  if (role === ROLES.OGRETMEN && meta.institutionCode) {
    // Öğretmen → Kurum başvurusu
    const instId = await findInstitutionByCode(meta.institutionCode);
    if (instId) {
      await createTeacherInstitutionRequest(uid, instId);
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