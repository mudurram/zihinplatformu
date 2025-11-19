// =============================================================
// 📮 requestService.js — Kurum / Öğretmen / Öğrenci davet yönetimi
// =============================================================

import { db } from "./firebaseConfig.js";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteField,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("requestService.js yüklendi ✅");

const REQUESTS = "requests";
const PROFILES = "profiles";
const INSTITUTIONS = "institutions";

export async function createRequest({ type, fromId, toId, payload = {} }) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const data = {
      type,
      fromId,
      toId,
      payload,
      status: "beklemede",
      createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, REQUESTS), data);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("createRequest error", err);
    return { success: false, message: err.message };
  }
}

export async function respondRequest(requestId, status, responderId) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const ref = doc(db, REQUESTS, requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, message: "Talep bulunamadı" };

    const data = snap.data();

    await updateDoc(ref, {
      status,
      responderId,
      respondedAt: serverTimestamp()
    });

    if (status === "kabul") {
      console.log("✅ Talep onaylandı, bağlantı kuruluyor:", data.type);
      try {
        await applyRequestEffect(data);
        console.log("✅ Bağlantı başarıyla kuruldu:", data.type);
      } catch (err) {
        console.error("❌ applyRequestEffect hatası:", err);
        return { success: false, message: "Bağlantı kurulurken hata oluştu: " + err.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("respondRequest error", err);
    return { success: false, message: err.message };
  }
}

// Alınan davetler (toId == uid)
export async function listRequestsByUser(uid) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const q = query(
      collection(db, REQUESTS),
      where("toId", "==", uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("listRequestsByUser error", err);
    return [];
  }
}

// Gönderilen davetler (fromId == uid)
export async function listSentRequestsByUser(uid) {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return [];
    }

    const q = query(
      collection(db, REQUESTS),
      where("fromId", "==", uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("listSentRequestsByUser error", err);
    return [];
  }
}

// Hem alınan hem gönderilen davetler
export async function listAllRequestsByUser(uid) {
  try {
    const [received, sent] = await Promise.all([
      listRequestsByUser(uid),
      listSentRequestsByUser(uid)
    ]);
    return {
      received: received,
      sent: sent
    };
  } catch (err) {
    console.error("listAllRequestsByUser error", err);
    return { received: [], sent: [] };
  }
}

export async function createStudentTeacherRequest(studentId, teacherId) {
  // Önce aynı öğretmen için bekleyen bir davet var mı kontrol et
  const existingRequests = await listRequestsByUser(teacherId);
  const duplicateRequest = existingRequests.find(
    req => req.type === "student_teacher" && 
           req.status === "beklemede" && 
           req.fromId === studentId
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu öğretmene zaten bir davet gönderilmiş." };
  }

  // Öğrencinin zaten bu öğretmene bağlı olup olmadığını kontrol et
  try {
    const studentRef = doc(db, PROFILES, studentId);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      if (studentData.teachers?.[teacherId] === "kabul") {
        return { success: false, message: "Bu öğretmene zaten bağlısınız." };
      }
    }
  } catch (err) {
    console.warn("Öğrenci kontrolü yapılamadı:", err);
  }

  return createRequest({
    type: "student_teacher",
    fromId: studentId,
    toId: teacherId,
    payload: { teacherId, studentId }
  });
}

export async function createTeacherStudentRequest(teacherId, studentId) {
  // Önce aynı öğrenci için bekleyen bir davet var mı kontrol et
  const existingRequests = await listRequestsByUser(studentId);
  const duplicateRequest = existingRequests.find(
    req => req.type === "teacher_student" && 
           req.status === "beklemede" && 
           req.fromId === teacherId
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu öğrenciye zaten bir davet gönderilmiş." };
  }

  // Öğrencinin zaten bu öğretmene bağlı olup olmadığını kontrol et
  try {
    const studentRef = doc(db, PROFILES, studentId);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      if (studentData.teachers?.[teacherId] === "kabul") {
        return { success: false, message: "Bu öğrenci zaten öğretmeninize bağlı." };
      }
    }
  } catch (err) {
    console.warn("Öğrenci kontrolü yapılamadı:", err);
  }

  return createRequest({
    type: "teacher_student",
    fromId: teacherId,
    toId: studentId,
    payload: { teacherId, studentId }
  });
}

export async function createInstitutionTeacherRequest(institutionId, teacherId) {
  // Önce aynı öğretmen için bekleyen bir davet var mı kontrol et
  const existingRequests = await listRequestsByUser(teacherId);
  const duplicateRequest = existingRequests.find(
    req => req.type === "institution_teacher" && 
           req.status === "beklemede" && 
           req.fromId === institutionId
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu öğretmene zaten bir davet gönderilmiş." };
  }

  // Öğretmenin zaten bu kuruma bağlı olup olmadığını kontrol et
  try {
    const teacherRef = doc(db, PROFILES, teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (teacherSnap.exists()) {
      const teacherData = teacherSnap.data();
      if (teacherData.institution?.id === institutionId && teacherData.institution?.status === "kabul") {
        return { success: false, message: "Bu öğretmen zaten kurumunuza bağlı." };
      }
    }
  } catch (err) {
    console.warn("Öğretmen kontrolü yapılamadı:", err);
  }

  // Kurum → Öğretmen daveti: fromId=kurum, toId=öğretmen
  return createRequest({
    type: "institution_teacher",
    fromId: institutionId,  // Kurum gönderiyor
    toId: teacherId,  // Öğretmene gidiyor
    payload: { teacherId, institutionId }
  });
}

export async function createTeacherInstitutionRequest(teacherId, institutionId) {
  // Önce hedef kullanıcının kurum olup olmadığını kontrol et
  try {
    const institutionRef = doc(db, PROFILES, institutionId);
    const institutionSnap = await getDoc(institutionRef);
    if (!institutionSnap.exists()) {
      return { success: false, message: "Kurum profili bulunamadı." };
    }
    const institutionData = institutionSnap.data();
    if (institutionData.role !== "institution") {
      return { success: false, message: "Bu kullanıcı kurum değil." };
    }
  } catch (err) {
    console.warn("Kurum kontrolü yapılamadı:", err);
    return { success: false, message: "Kurum bilgisi kontrol edilemedi." };
  }

  // Önce aynı kurum için bekleyen bir başvuru var mı kontrol et
  // Hem gönderilen hem alınan talepleri kontrol et
  const [sentRequests, receivedRequests] = await Promise.all([
    listSentRequestsByUser(teacherId),
    listRequestsByUser(teacherId)
  ]);
  const allRequests = [...sentRequests, ...receivedRequests];
  const duplicateRequest = allRequests.find(
    req => (req.type === "teacher_institution" || req.type === "institution_teacher") && 
           req.status === "beklemede" && 
           (req.toId === institutionId || req.fromId === institutionId)
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu kuruma zaten bir başvuru gönderilmiş veya davet alınmış." };
  }

  // Öğretmenin zaten bu kuruma bağlı olup olmadığını kontrol et
  try {
    const teacherRef = doc(db, PROFILES, teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (teacherSnap.exists()) {
      const teacherData = teacherSnap.data();
      if (teacherData.institution?.id === institutionId && teacherData.institution?.status === "kabul") {
        return { success: false, message: "Bu kuruma zaten bağlısınız." };
      }
    }
  } catch (err) {
    console.warn("Öğretmen kontrolü yapılamadı:", err);
  }

  // Öğretmen → Kurum başvurusu: fromId=öğretmen, toId=kurum
  return createRequest({
    type: "teacher_institution",
    fromId: teacherId,  // Öğretmen gönderiyor
    toId: institutionId,  // Kuruma gidiyor
    payload: { teacherId, institutionId }
  });
}

export async function createStudentInstitutionRequest(studentId, institutionId) {
  // Önce aynı kurum için bekleyen bir davet var mı kontrol et
  const existingRequests = await listRequestsByUser(institutionId);
  const duplicateRequest = existingRequests.find(
    req => req.type === "student_institution" && 
           req.status === "beklemede" && 
           req.fromId === studentId
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu kuruma zaten bir başvuru gönderilmiş." };
  }

  // Öğrencinin zaten bu kuruma bağlı olup olmadığını kontrol et
  try {
    const studentRef = doc(db, PROFILES, studentId);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      if (studentData.institution?.id === institutionId && studentData.institution?.status === "kabul") {
        return { success: false, message: "Bu kuruma zaten bağlısınız." };
      }
    }
  } catch (err) {
    console.warn("Öğrenci kontrolü yapılamadı:", err);
  }

  // Öğrenci → Kurum başvurusu: fromId=öğrenci, toId=kurum
  return createRequest({
    type: "student_institution",
    fromId: studentId,  // Öğrenci gönderiyor
    toId: institutionId,  // Kuruma gidiyor
    payload: { studentId, institutionId }
  });
}

export async function createInstitutionStudentRequest(institutionId, studentId) {
  // Önce aynı öğrenci için bekleyen bir davet var mı kontrol et
  const existingRequests = await listRequestsByUser(studentId);
  const duplicateRequest = existingRequests.find(
    req => req.type === "institution_student" && 
           req.status === "beklemede" && 
           req.fromId === institutionId
  );
  
  if (duplicateRequest) {
    return { success: false, message: "Bu öğrenciye zaten bir davet gönderilmiş." };
  }

  // Öğrencinin zaten bu kuruma bağlı olup olmadığını kontrol et
  try {
    const studentRef = doc(db, PROFILES, studentId);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      if (studentData.institution?.id === institutionId && studentData.institution?.status === "kabul") {
        return { success: false, message: "Bu öğrenci zaten kurumunuza bağlı." };
      }
    }
  } catch (err) {
    console.warn("Öğrenci kontrolü yapılamadı:", err);
  }

  // Kurum → Öğrenci daveti: fromId=kurum, toId=öğrenci
  return createRequest({
    type: "institution_student",
    fromId: institutionId,  // Kurum gönderiyor
    toId: studentId,  // Öğrenciye gidiyor
    payload: { studentId, institutionId }
  });
}

async function applyRequestEffect(request) {
  switch (request.type) {
    case "teacher_student": {
      // Öğretmen → Öğrenci talebi: fromId=öğretmen, toId=öğrenci
      const teacherId = request.payload?.teacherId || request.fromId;
      const studentId = request.payload?.studentId || request.toId;
      if (!teacherId || !studentId) return;
      await linkTeacherStudent(teacherId, studentId);
      break;
    }
    case "student_teacher": {
      // Öğrenci → Öğretmen talebi: fromId=öğrenci, toId=öğretmen
      const teacherId = request.payload?.teacherId || request.toId;
      const studentId = request.payload?.studentId || request.fromId;
      if (!teacherId || !studentId) return;
      await linkTeacherStudent(teacherId, studentId);
      break;
    }
    case "institution_teacher": {
      // Kurum → Öğretmen talebi: fromId=kurum, toId=öğretmen
      const institutionId = request.payload?.institutionId || request.fromId;
      const teacherId = request.payload?.teacherId || request.toId;
      if (!institutionId || !teacherId) return;
      await linkInstitutionTeacher(institutionId, teacherId);
      break;
    }
    case "teacher_institution": {
      // Öğretmen → Kurum başvurusu: fromId=öğretmen, toId=kurum
      const institutionId = request.payload?.institutionId || request.toId;
      const teacherId = request.payload?.teacherId || request.fromId;
      if (!institutionId || !teacherId) return;
      await linkInstitutionTeacher(institutionId, teacherId);
      break;
    }
    case "student_institution": {
      // Öğrenci → Kurum başvurusu: fromId=öğrenci, toId=kurum
      const institutionId = request.payload?.institutionId || request.toId;
      const studentId = request.payload?.studentId || request.fromId;
      if (!institutionId || !studentId) return;
      await linkInstitutionStudent(institutionId, studentId);
      break;
    }
    case "institution_student": {
      // Kurum → Öğrenci daveti: fromId=kurum, toId=öğrenci
      const institutionId = request.payload?.institutionId || request.fromId;
      const studentId = request.payload?.studentId || request.toId;
      if (!institutionId || !studentId) return;
      await linkInstitutionStudent(institutionId, studentId);
      break;
    }
    default:
      console.warn("Bilinmeyen talep tipi:", request.type);
  }
}

async function linkTeacherStudent(teacherId, studentId) {
  const teacherRef = doc(db, PROFILES, teacherId);
  const studentRef = doc(db, PROFILES, studentId);

  await Promise.all([
    updateDoc(teacherRef, { [`students.${studentId}`]: "kabul" }),
    updateDoc(studentRef, { [`teachers.${teacherId}`]: "kabul" })
  ]);
}

async function linkInstitutionTeacher(institutionId, teacherId) {
  const teacherRef = doc(db, PROFILES, teacherId);
  const instRef = doc(db, PROFILES, institutionId);  // Kurum profili de PROFILES collection'ında

  // Öğretmenin zaten bu kuruma bağlı olup olmadığını kontrol et
  const teacherSnap = await getDoc(teacherRef);
  const instSnap = await getDoc(instRef);
  
  if (!teacherSnap.exists() || !instSnap.exists()) {
    console.error("Öğretmen veya kurum profili bulunamadı");
    return;
  }

  const teacherData = teacherSnap.data();
  const instData = instSnap.data();

  // Öğretmen zaten bu kuruma bağlıysa tekrar ekleme
  if (teacherData.institution?.id === institutionId && teacherData.institution?.status === "kabul") {
    console.log("Öğretmen zaten bu kuruma bağlı");
    return;
  }

  // Kurumun teachers objesi yoksa oluştur
  const teachers = instData.teachers || {};
  // Aynı öğretmen zaten varsa tekrar ekleme
  if (teachers[teacherId] === "kabul") {
    console.log("Öğretmen zaten kurum listesinde");
    return;
  }

  await Promise.all([
    updateDoc(teacherRef, { institution: { id: institutionId, status: "kabul" } }),
    updateDoc(instRef, { [`teachers.${teacherId}`]: "kabul" })
  ]);
}

async function linkInstitutionStudent(institutionId, studentId) {
  console.log("🔗 linkInstitutionStudent çağrıldı:", { institutionId, studentId });
  
  try {
    const studentRef = doc(db, PROFILES, studentId);
    const instRef = doc(db, PROFILES, institutionId);

    // Öğrencinin zaten bu kuruma bağlı olup olmadığını kontrol et
    const studentSnap = await getDoc(studentRef);
    const instSnap = await getDoc(instRef);
    
    if (!studentSnap.exists() || !instSnap.exists()) {
      console.error("❌ Öğrenci veya kurum profili bulunamadı", {
        studentExists: studentSnap.exists(),
        instExists: instSnap.exists()
      });
      return;
    }

    const studentData = studentSnap.data();
    const instData = instSnap.data();

    console.log("📋 Mevcut durum:", {
      studentInstitution: studentData.institution,
      instStudents: instData.students
    });

    // Öğrenci zaten bu kuruma bağlıysa tekrar ekleme
    if (studentData.institution?.id === institutionId && studentData.institution?.status === "kabul") {
      console.log("⚠️ Öğrenci zaten bu kuruma bağlı");
      return;
    }

    // Kurumun students objesi yoksa oluştur
    const students = instData.students || {};
    // Aynı öğrenci zaten varsa tekrar ekleme
    if (students[studentId] === "kabul") {
      console.log("⚠️ Öğrenci zaten kurum listesinde");
      return;
    }

    console.log("✅ Bağlantı kuruluyor...");
    await Promise.all([
      updateDoc(studentRef, { institution: { id: institutionId, status: "kabul" } }),
      updateDoc(instRef, { [`students.${studentId}`]: "kabul" })
    ]);
    
    console.log("✅ Kurum-öğrenci bağlantısı başarıyla kuruldu:", { institutionId, studentId });
  } catch (err) {
    console.error("❌ linkInstitutionStudent hatası:", err);
    throw err;
  }
}

// =============================================================
// BAĞLANTI SİLME FONKSİYONLARI
// =============================================================

export async function unlinkTeacherStudent(teacherId, studentId) {
  try {
    if (!db) {
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const teacherRef = doc(db, PROFILES, teacherId);
    const studentRef = doc(db, PROFILES, studentId);

    await Promise.all([
      updateDoc(teacherRef, { [`students.${studentId}`]: deleteField() }),
      updateDoc(studentRef, { [`teachers.${teacherId}`]: deleteField() })
    ]);

    return { success: true };
  } catch (err) {
    console.error("Bağlantı silme hatası:", err);
    return { success: false, message: err.message };
  }
}

export async function unlinkInstitutionTeacher(institutionId, teacherId) {
  try {
    if (!db) {
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const teacherRef = doc(db, PROFILES, teacherId);
    const instRef = doc(db, PROFILES, institutionId);

    await Promise.all([
      updateDoc(teacherRef, { institution: deleteField() }),
      updateDoc(instRef, { [`teachers.${teacherId}`]: deleteField() })
    ]);

    return { success: true };
  } catch (err) {
    console.error("Bağlantı silme hatası:", err);
    return { success: false, message: err.message };
  }
}

export async function unlinkInstitutionStudent(institutionId, studentId) {
  try {
    if (!db) {
      return { success: false, message: "Veritabanı bağlantısı yok." };
    }

    const studentRef = doc(db, PROFILES, studentId);
    const instRef = doc(db, PROFILES, institutionId);

    await Promise.all([
      updateDoc(studentRef, { institution: deleteField() }),
      updateDoc(instRef, { [`students.${studentId}`]: deleteField() })
    ]);

    return { success: true };
  } catch (err) {
    console.error("Bağlantı silme hatası:", err);
    return { success: false, message: err.message };
  }
}

