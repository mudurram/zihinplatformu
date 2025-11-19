// =============================================================
// 📌 firebaseConfig.js — Zihin Platformu v7.2
// Firebase Authentication + Firestore + Initialize (Ultra Stabil)
// =============================================================
//
// Bu dosya platformdaki TÜM Firebase erişimlerinin tek kaynağıdır.
// Asla başka yerde initializeApp çağrılmaz.
// Tüm modüller sadece buradan auth & db import eder.
// =============================================================

console.log("⚡ firebaseConfig.js yükleniyor...");

// =============================================================
// 1) Firebase SDK Modülleri
// =============================================================
import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =============================================================
// 2) Firebase Proje Ayarları (Gerçek Proje Değerleri)
// =============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDKtNt3U3KMIMVyixuE5mOXs8F0h6RwvHg",
  authDomain: "zihin-platformu.firebaseapp.com",
  projectId: "zihin-platformu",
  storageBucket: "zihin-platformu.firebasestorage.app",
  messagingSenderId: "328349672879",
  appId: "1:328349672879:web:836a416a63a818d4553b5a"
};

// =============================================================
// 3) Firebase App — Tek Sefer Initialize
// =============================================================
let app;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("✔ Firebase başlatıldı:", app.name);
  } else {
    app = getApps()[0];
    console.log("ℹ Firebase zaten başlatılmış:", app.name);
  }
} catch (err) {
  console.error("❌ Firebase başlatılamadı:", err);
  // Hata durumunda fallback - boş bir app objesi oluştur
  // Bu durumda auth ve db undefined olacak ama crash olmayacak
  app = null;
}

// =============================================================
// 4) Servisler: Auth + Firestore
// =============================================================
if (!app) {
  console.error("❌ Firebase app başlatılamadı - auth ve db kullanılamaz");
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Sağlık kontrolü logları
if (auth) console.log("🔥 Auth hazır (v7.2)");
if (db) console.log("📚 Firestore hazır (v7.2)");

// =============================================================
// Kullanım Notu:
// import { auth, db } from "../data/firebaseConfig.js"
// =============================================================