// =============================================================
// 💬 commentService.js — Öğretmen Yorumları Sistemi (v8.0)
// Öğretmenlerin öğrenci oyun sonuçlarına yorum yazması
// =============================================================

import { db } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("commentService.js yüklendi ✅");

const COMMENTS = "yorumlar";

// =============================================================
// 1) YORUM EKLEME
// =============================================================
export async function addComment(studentId, gameResultId, teacherId, text) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const commentRef = collection(db, "profiles", studentId, COMMENTS);

    const data = {
      teacherId,
      gameResultId,
      text: text.trim(),
      timestamp: serverTimestamp(),
      edited: false
    };

    const docRef = await addDoc(commentRef, data);
    console.log("💬 Yorum eklendi:", docRef.id);
    return { success: true, id: docRef.id };

  } catch (err) {
    console.error("❌ Yorum ekleme hatası:", err);
    return { success: false, message: err.message };
  }
}

// =============================================================
// 2) ÖĞRENCİNİN TÜM YORUMLARINI GETİR
// =============================================================
export async function getStudentComments(studentId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const commentRef = collection(db, "profiles", studentId, COMMENTS);
    const q = query(commentRef, orderBy("timestamp", "desc"), limit(100));

    const snap = await getDocs(q);
    const comments = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      
      // Öğretmen bilgisini al
      let teacherName = "Öğretmen";
      if (data.teacherId) {
        try {
          const teacherRef = doc(db, "profiles", data.teacherId);
          const teacherSnap = await getDoc(teacherRef);
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            teacherName = teacherData.username || teacherData.ad || "Öğretmen";
          }
        } catch (err) {
          console.warn("Öğretmen bilgisi alınamadı:", err);
        }
      }

      comments.push({
        id: docSnap.id,
        ...data,
        teacherName,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
      });
    }

    return comments;

  } catch (err) {
    console.error("❌ Yorumlar alınamadı:", err);
    return [];
  }
}

// =============================================================
// 3) OYUN SONUCUNA ÖZEL YORUMLAR
// =============================================================
export async function getCommentsByGameResult(studentId, gameResultId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const commentRef = collection(db, "profiles", studentId, COMMENTS);
    const q = query(
      commentRef,
      where("gameResultId", "==", gameResultId),
      orderBy("timestamp", "desc")
    );

    const snap = await getDocs(q);
    const comments = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      
      let teacherName = "Öğretmen";
      if (data.teacherId) {
        try {
          const teacherRef = doc(db, "profiles", data.teacherId);
          const teacherSnap = await getDoc(teacherRef);
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            teacherName = teacherData.username || teacherData.ad || "Öğretmen";
          }
        } catch (err) {
          console.warn("Öğretmen bilgisi alınamadı:", err);
        }
      }

      comments.push({
        id: docSnap.id,
        ...data,
        teacherName,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
      });
    }

    return comments;

  } catch (err) {
    console.error("❌ Oyun sonucu yorumları alınamadı:", err);
    return [];
  }
}

// =============================================================
// 4) YORUM GÜNCELLEME (Edit)
// =============================================================
export async function updateComment(studentId, commentId, newText, teacherId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const commentRef = doc(db, "profiles", studentId, COMMENTS, commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return { success: false, message: "Yorum bulunamadı." };
    }

    const data = commentSnap.data();
    if (data.teacherId !== teacherId) {
      return { success: false, message: "Bu yorumu düzenleme yetkiniz yok." };
    }

    await updateDoc(commentRef, {
      text: newText.trim(),
      edited: true,
      editedAt: serverTimestamp()
    });

    console.log("💬 Yorum güncellendi:", commentId);
    return { success: true };

  } catch (err) {
    console.error("❌ Yorum güncelleme hatası:", err);
    return { success: false, message: err.message };
  }
}

// =============================================================
// 5) YORUM SİLME
// =============================================================
export async function deleteComment(studentId, commentId, teacherId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const commentRef = doc(db, "profiles", studentId, COMMENTS, commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return { success: false, message: "Yorum bulunamadı." };
    }

    const data = commentSnap.data();
    if (data.teacherId !== teacherId) {
      return { success: false, message: "Bu yorumu silme yetkiniz yok." };
    }

    await deleteDoc(commentRef);

    console.log("💬 Yorum silindi:", commentId);
    return { success: true };

  } catch (err) {
    console.error("❌ Yorum silme hatası:", err);
    return { success: false, message: err.message };
  }
}

