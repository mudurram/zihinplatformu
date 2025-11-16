// =====================================================================
// 📌 gameResultService.js — Zihin Platformu v7.1 Ultra Stabil
// Tüm oyunların sonuç kayıt işlemlerini tek merkezden yönetir.
// Firestore yolları ANALIZ ve TEACHER PANEL ile %100 uyumlu.
// =====================================================================

import { db, auth } from "../data/firebaseConfig.js";
import { GLOBAL, ROLES } from "../platform/globalConfig.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("gameResultService.js yüklendi ✔");


// =====================================================================
// 🟦 1) Ortak Sonuç Kayıt Fonksiyonu
// =====================================================================
export async function saveGameResult(sonuc) {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.error("❌ Kullanıcı giriş yapmamış! → sonuç kaydedilemez.");
      return false;
    }

    const role = localStorage.getItem("role");
    const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
    const teacherID = localStorage.getItem("teacherID");

    let hedefRef = null;

    // =================================================================
    // 🟩 2) Öğrenci — kendi profilinin altına kaydeder
    // Firestore: profiles / UID / oyunSonuclari
    // =================================================================
    if (role === ROLES.OGRENCI) {
      hedefRef = collection(
        db,
        GLOBAL.FIRESTORE.PROFILES,
        user.uid,
        "oyunSonuclari"
      );
    }

    // =================================================================
    // 🟦 3) Öğretmen — seçili öğrenciye kaydeder
    // Firestore: profiles / teacherID / ogrenciler / ogrID / oyunSonuclari
    // =================================================================
    else if (role === ROLES.OGRETMEN) {
      if (!teacherID) {
        console.warn("⚠ teacherID bulunamadı → kayıt yapılamaz.");
        return false;
      }

      if (!aktifOgrenciId) {
        console.warn("⚠ Öğretmen öğrencisiz sonuç kaydedemez.");
        return false;
      }

      hedefRef = collection(
        db,
        GLOBAL.FIRESTORE.PROFILES,
        teacherID,
        GLOBAL.FIRESTORE.OGRENCILER,
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }

    // =================================================================
    // 🟥 4) Admin / Editor — sonuç kaydedemez
    // =================================================================
    else {
      console.warn("⛔ Admin / Editor oyun sonucu kaydedemez.");
      return false;
    }

    // =================================================================
    // 🔥 5) Kaydedilecek Veri
    // =================================================================
    const data = {
      ...sonuc,
      uid: user.uid,
      kaydedildi: serverTimestamp()
    };

    await addDoc(hedefRef, data);

    console.log(`🎉 Oyun sonucu kaydedildi → ${sonuc.oyun}`);
    return true;

  } catch (err) {
    console.error("❌ Firestore kayıt hatası:", err);
    return false;
  }
}