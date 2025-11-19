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
      await applyRequestEffect(data);
    }

    return { success: true };
  } catch (err) {
    console.error("respondRequest error", err);
    return { success: false, message: err.message };
  }
}

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

export async function createStudentTeacherRequest(studentId, teacherId) {
  return createRequest({
    type: "student_teacher",
    fromId: studentId,
    toId: teacherId,
    payload: { teacherId, studentId }
  });
}

export async function createTeacherStudentRequest(teacherId, studentId) {
  return createRequest({
    type: "teacher_student",
    fromId: teacherId,
    toId: studentId,
    payload: { teacherId, studentId }
  });
}

export async function createInstitutionTeacherRequest(teacherId, institutionId) {
  return createRequest({
    type: "institution_teacher",
    fromId: teacherId,
    toId: institutionId,
    payload: { teacherId, institutionId }
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
      const institutionId = request.payload?.institutionId;
      const teacherId = request.payload?.teacherId || request.toId;
      if (!institutionId || !teacherId) return;
      await linkInstitutionTeacher(institutionId, teacherId);
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
  const instRef = doc(db, INSTITUTIONS, institutionId);

  await Promise.all([
    updateDoc(teacherRef, { institution: { id: institutionId, status: "kabul" } }),
    updateDoc(instRef, { [`teachers.${teacherId}`]: "kabul" })
  ]);
}

