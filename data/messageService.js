// =============================================================
// 📮 messageService.js — Mesajlaşma Sistemi (v8.0)
// Öğretmen-Öğrenci iletişimi için Firestore real-time mesajlaşma
// =============================================================

import { db } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("messageService.js yüklendi ✅");

const MESSAGES = "messages";

// =============================================================
// 1) CHAT ID OLUŞTURMA
// =============================================================
function getChatId(teacherId, studentId) {
  // Sıralı ID (küçükten büyüğe) - her iki yönde aynı chat ID
  const ids = [teacherId, studentId].sort();
  return `${ids[0]}_${ids[1]}`;
}

// =============================================================
// 2) MESAJ GÖNDERME
// =============================================================
export async function sendMessage(teacherId, studentId, text, senderId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const chatId = getChatId(teacherId, studentId);
    const chatRef = collection(db, MESSAGES, chatId, "messages");

    const data = {
      from: senderId,
      to: senderId === teacherId ? studentId : teacherId,
      text: text.trim(),
      timestamp: serverTimestamp(),
      read: false
    };

    const docRef = await addDoc(chatRef, data);
    console.log("📤 Mesaj gönderildi:", docRef.id);
    return { success: true, id: docRef.id };

  } catch (err) {
    console.error("❌ Mesaj gönderme hatası:", err);
    return { success: false, message: err.message };
  }
}

// =============================================================
// 3) MESAJLARI DİNLEME (Real-time)
// =============================================================
export function listenMessages(teacherId, studentId, callback) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      callback([]);
      return () => {};
    }

    const chatId = getChatId(teacherId, studentId);
    const chatRef = collection(db, MESSAGES, chatId, "messages");
    
    const q = query(chatRef, orderBy("timestamp", "desc"), limit(50));

    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // En eski mesaj en üstte
      messages.reverse();
      callback(messages);
    }, (err) => {
      console.error("❌ Mesaj dinleme hatası:", err);
      callback([]);
    });

  } catch (err) {
    console.error("❌ listenMessages hatası:", err);
    return () => {}; // Boş unsubscribe fonksiyonu
  }
}

// =============================================================
// 4) CHAT LİSTESİ (Öğretmen için tüm öğrenciler)
// =============================================================
export async function getChatList(teacherId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    // Öğretmenin profilinden students map'ini al
    const teacherRef = doc(db, "profiles", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    
    if (!teacherSnap.exists()) {
      console.warn("⚠ Öğretmen profili bulunamadı:", teacherId);
      return [];
    }

    const teacherData = teacherSnap.data();
    const students = teacherData.students || {};
    
    const chats = [];
    
    // Her öğrenci için bilgileri al
    for (const [studentId, status] of Object.entries(students)) {
      if (status === "kabul") {
        try {
          const studentRef = doc(db, "profiles", studentId);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            chats.push({
              studentId,
              studentName: studentData.username || studentData.ad || studentData.fullName || "İsimsiz",
              chatId: getChatId(teacherId, studentId)
            });
          }
        } catch (err) {
          console.warn("⚠ Öğrenci bilgisi alınamadı:", studentId, err);
        }
      }
    }

    return chats;

  } catch (err) {
    console.error("❌ Chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 5) CHAT LİSTESİ (Öğrenci için tüm öğretmenler)
// =============================================================
export async function getStudentChatList(studentId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const studentRef = doc(db, "profiles", studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) return [];

    const studentData = studentSnap.data();
    const teachers = studentData.teachers || {};
    
    const chats = [];
    Object.keys(teachers).forEach(teacherId => {
      if (teachers[teacherId] === "kabul") {
        chats.push({
          teacherId,
          chatId: getChatId(teacherId, studentId)
        });
      }
    });

    return chats;

  } catch (err) {
    console.error("❌ Öğrenci chat listesi alınamadı:", err);
    return [];
  }
}

