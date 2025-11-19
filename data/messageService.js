// =============================================================
// 📮 messageService.js — Mesajlaşma Sistemi (v9.0)
// Tüm rol kombinasyonları için Firestore real-time mesajlaşma
// Öğrenci ↔ Öğretmen, Öğrenci ↔ Kurum, Öğretmen ↔ Kurum
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
// 1) CHAT ID OLUŞTURMA (Genel - Herhangi iki kullanıcı için)
// =============================================================
function getChatId(user1Id, user2Id) {
  // Sıralı ID (küçükten büyüğe) - her iki yönde aynı chat ID
  const ids = [user1Id, user2Id].sort();
  return `${ids[0]}_${ids[1]}`;
}

// =============================================================
// 2) MESAJ GÖNDERME (Genel - Herhangi iki kullanıcı için)
// =============================================================
export async function sendMessage(user1Id, user2Id, text, senderId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const chatId = getChatId(user1Id, user2Id);
    const chatRef = collection(db, MESSAGES, chatId, "messages");

    const data = {
      from: senderId,
      to: senderId === user1Id ? user2Id : user1Id,
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
// 3) MESAJLARI DİNLEME (Real-time - Genel)
// =============================================================
export function listenMessages(user1Id, user2Id, callback) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      callback([]);
      return () => {};
    }

    const chatId = getChatId(user1Id, user2Id);
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
    for (const teacherId of Object.keys(teachers)) {
      if (teachers[teacherId] === "kabul") {
        const teacherRef = doc(db, "profiles", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        const teacherName = teacherSnap.exists() 
          ? (teacherSnap.data().fullName || teacherSnap.data().username || teacherSnap.data().ad || "Öğretmen")
          : "Öğretmen";
        
        chats.push({
          teacherId,
          teacherName,
          chatId: getChatId(teacherId, studentId)
        });
      }
    }

    return chats;

  } catch (err) {
    console.error("❌ Öğrenci chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 6) CHAT LİSTESİ (Öğrenci için tüm kurumlar)
// =============================================================
export async function getStudentInstitutionChatList(studentId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const studentRef = doc(db, "profiles", studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) return [];

    const studentData = studentSnap.data();
    
    // Öğrencinin kurum bilgisini kontrol et
    if (!studentData.institution?.id || studentData.institution?.status !== "kabul") {
      return [];
    }

    const institutionId = studentData.institution.id;
    
    try {
      const institutionRef = doc(db, "profiles", institutionId);
      const institutionSnap = await getDoc(institutionRef);
      
      if (institutionSnap.exists()) {
        const institutionData = institutionSnap.data();
        return [{
          institutionId,
          institutionName: institutionData.institutionProfile?.name || institutionData.username || "Kurum",
          chatId: getChatId(studentId, institutionId)
        }];
      }
    } catch (err) {
      console.warn("⚠ Kurum bilgisi alınamadı:", institutionId, err);
    }

    return [];

  } catch (err) {
    console.error("❌ Öğrenci kurum chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 7) CHAT LİSTESİ (Öğretmen için kurum)
// =============================================================
export async function getTeacherInstitutionChatList(teacherId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const teacherRef = doc(db, "profiles", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    
    if (!teacherSnap.exists()) return [];

    const teacherData = teacherSnap.data();
    
    // Öğretmenin kurum bilgisini kontrol et
    if (!teacherData.institution?.id || teacherData.institution?.status !== "kabul") {
      return [];
    }

    const institutionId = teacherData.institution.id;
    
    try {
      const institutionRef = doc(db, "profiles", institutionId);
      const institutionSnap = await getDoc(institutionRef);
      
      if (institutionSnap.exists()) {
        const institutionData = institutionSnap.data();
        return [{
          institutionId,
          institutionName: institutionData.institutionProfile?.name || institutionData.username || "Kurum",
          chatId: getChatId(teacherId, institutionId)
        }];
      }
    } catch (err) {
      console.warn("⚠ Kurum bilgisi alınamadı:", institutionId, err);
    }

    return [];

  } catch (err) {
    console.error("❌ Öğretmen kurum chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 8) CHAT LİSTESİ (Kurum için tüm öğrenciler)
// =============================================================
export async function getInstitutionStudentChatList(institutionId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const institutionRef = doc(db, "profiles", institutionId);
    const institutionSnap = await getDoc(institutionRef);
    
    if (!institutionSnap.exists()) {
      console.warn("⚠ Kurum profili bulunamadı:", institutionId);
      return [];
    }

    const institutionData = institutionSnap.data();
    const students = institutionData.students || {};
    
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
              chatId: getChatId(institutionId, studentId)
            });
          }
        } catch (err) {
          console.warn("⚠ Öğrenci bilgisi alınamadı:", studentId, err);
        }
      }
    }

    return chats;

  } catch (err) {
    console.error("❌ Kurum öğrenci chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 9) CHAT LİSTESİ (Kurum için tüm öğretmenler)
// =============================================================
export async function getInstitutionTeacherChatList(institutionId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const institutionRef = doc(db, "profiles", institutionId);
    const institutionSnap = await getDoc(institutionRef);
    
    if (!institutionSnap.exists()) {
      console.warn("⚠ Kurum profili bulunamadı:", institutionId);
      return [];
    }

    const institutionData = institutionSnap.data();
    const teachers = institutionData.teachers || {};
    
    const chats = [];
    
    // Her öğretmen için bilgileri al
    for (const [teacherId, status] of Object.entries(teachers)) {
      if (status === "kabul") {
        try {
          const teacherRef = doc(db, "profiles", teacherId);
          const teacherSnap = await getDoc(teacherRef);
          
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data();
            chats.push({
              teacherId,
              teacherName: teacherData.username || teacherData.ad || teacherData.fullName || "İsimsiz",
              chatId: getChatId(institutionId, teacherId)
            });
          }
        } catch (err) {
          console.warn("⚠ Öğretmen bilgisi alınamadı:", teacherId, err);
        }
      }
    }

    return chats;

  } catch (err) {
    console.error("❌ Kurum öğretmen chat listesi alınamadı:", err);
    return [];
  }
}

// =============================================================
// 10) OKUNMAMIŞ MESAJ SAYISI (Genel - Tüm roller için)
// =============================================================
export async function getUnreadMessageCount(userId) {
  try {
    if (!db) {
      return 0;
    }

    // Öğretmen için
    try {
      const chats = await getChatList(userId);
      let totalUnread = 0;

      for (const chat of chats) {
        try {
          const chatId = chat.chatId;
          const messagesRef = collection(db, MESSAGES, chatId, "messages");
          const q = query(
            messagesRef,
            where("to", "==", userId),
            where("read", "==", false)
          );
          const snapshot = await getDocs(q);
          totalUnread += snapshot.size;
        } catch (err) {
          console.warn("⚠ Mesaj sayısı alınamadı:", chat.chatId, err);
        }
      }

      if (totalUnread > 0) {
        return totalUnread;
      }
    } catch (err) {
      // Öğretmen değilse devam et
    }

    // Öğrenci için
    try {
      const studentChats = await getStudentChatList(userId);
      const institutionChats = await getStudentInstitutionChatList(userId);
      let totalUnread = 0;

      // Öğretmen chat'lerinden okunmamış mesajları say
      for (const chat of studentChats) {
        try {
          const chatId = chat.chatId;
          const messagesRef = collection(db, MESSAGES, chatId, "messages");
          const q = query(
            messagesRef,
            where("to", "==", userId),
            where("read", "==", false)
          );
          const snapshot = await getDocs(q);
          totalUnread += snapshot.size;
        } catch (err) {
          console.warn("⚠ Öğretmen mesaj sayısı alınamadı:", chat.chatId, err);
        }
      }

      // Kurum chat'lerinden okunmamış mesajları say
      for (const chat of institutionChats) {
        try {
          const chatId = chat.chatId;
          const messagesRef = collection(db, MESSAGES, chatId, "messages");
          const q = query(
            messagesRef,
            where("to", "==", userId),
            where("read", "==", false)
          );
          const snapshot = await getDocs(q);
          totalUnread += snapshot.size;
        } catch (err) {
          console.warn("⚠ Kurum mesaj sayısı alınamadı:", chat.chatId, err);
        }
      }

      return totalUnread;
    } catch (err) {
      // Öğrenci değilse devam et
    }

    return 0;

  } catch (err) {
    console.error("❌ Okunmamış mesaj sayısı alınamadı:", err);
    return 0;
  }
}

