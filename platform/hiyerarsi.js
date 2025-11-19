// =====================================================
// 🌳 hiyerarsi.js — Hiyerarşik Görüntüleme Sayfası
// =====================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("🌳 hiyerarsi.js yüklendi");

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
  const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
  
  if (!role || !uid) {
    window.location.href = "login.html";
    return;
  }

  await yukleHiyerarsi(role, uid);
});

// Hiyerarşiyi yükle
async function yukleHiyerarsi(role, uid) {
  const container = document.getElementById("hiyerarsiContainer");
  if (!container) return;

  try {
    let html = "";

    if (role === ROLES.OGRENCI) {
      // Öğrenci görünümü: Kurum → Öğretmenler → Öğrenci (kendisi)
      html = await ogrenciHiyerarsisi(uid);
    } else if (role === ROLES.OGRETMEN) {
      // Öğretmen görünümü: Kurum → Öğretmen (kendisi) → Öğrenciler
      html = await ogretmenHiyerarsisi(uid);
    } else if (role === ROLES.INSTITUTION) {
      // Kurum görünümü: Kurum (kendisi) → Öğretmenler → Öğrenciler
      html = await kurumHiyerarsisi(uid);
    } else {
      html = "<div class='empty-message'>Bu rol için hiyerarşik görüntüleme desteklenmiyor.</div>";
    }

    container.innerHTML = html;
  } catch (err) {
    console.error("Hiyerarşi yükleme hatası:", err);
    container.innerHTML = "<div class='empty-message'>Hiyerarşi yüklenirken bir hata oluştu.</div>";
  }
}

// Öğrenci hiyerarşisi
async function ogrenciHiyerarsisi(studentId) {
  const studentRef = doc(db, "profiles", studentId);
  const studentSnap = await getDoc(studentRef);
  
  if (!studentSnap.exists()) {
    return "<div class='empty-message'>Öğrenci profili bulunamadı.</div>";
  }

  const studentData = studentSnap.data();
  let html = "";

  // 1. Kurum seviyesi
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>🏢 Kurum</h3>";
  
  if (studentData.institution?.id && studentData.institution?.status === "kabul") {
    const instRef = doc(db, "profiles", studentData.institution.id);
    const instSnap = await getDoc(instRef);
    if (instSnap.exists()) {
      const instData = instSnap.data();
      const instName = instData.username || instData.institutionProfile?.name || "Kurum";
      html += `<div class="user-card">
        <div class="user-info">
          <div class="user-name">${instName}</div>
          <div class="user-role">Kurum</div>
        </div>
      </div>`;
    } else {
      html += "<div class='empty-message'>Kurum bilgisi bulunamadı.</div>";
    }
  } else {
    html += "<div class='empty-message'>Henüz bir kuruma bağlı değilsiniz.</div>";
  }
  html += "</div>";

  // 2. Öğretmenler seviyesi
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👩‍🏫 Öğretmenlerim</h3>";
  
  const teachers = studentData.teachers || {};
  const approvedTeachers = Object.keys(teachers).filter(tid => teachers[tid] === "kabul");
  
  if (approvedTeachers.length === 0) {
    html += "<div class='empty-message'>Henüz öğretmeniniz yok.</div>";
  } else {
    for (const teacherId of approvedTeachers) {
      try {
        const teacherRef = doc(db, "profiles", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          const teacherName = teacherData.username || teacherData.fullName || "Öğretmen";
          html += `<div class="user-card">
            <div class="user-info">
              <div class="user-name">${teacherName}</div>
              <div class="user-role">Öğretmen</div>
            </div>
          </div>`;
        }
      } catch (err) {
        console.warn("Öğretmen bilgisi alınamadı:", teacherId, err);
      }
    }
  }
  html += "</div>";

  // 3. Öğrenci (kendisi)
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👤 Ben (Öğrenci)</h3>";
  const studentName = studentData.username || studentData.fullName || "Öğrenci";
  html += `<div class="user-card" style="background:#e8f1ff;border-color:#4a90e2;">
    <div class="user-info">
      <div class="user-name">${studentName}</div>
      <div class="user-role">Öğrenci</div>
    </div>
  </div>`;
  html += "</div>";

  return html;
}

// Öğretmen hiyerarşisi
async function ogretmenHiyerarsisi(teacherId) {
  const teacherRef = doc(db, "profiles", teacherId);
  const teacherSnap = await getDoc(teacherRef);
  
  if (!teacherSnap.exists()) {
    return "<div class='empty-message'>Öğretmen profili bulunamadı.</div>";
  }

  const teacherData = teacherSnap.data();
  let html = "";

  // 1. Kurum seviyesi
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>🏢 Kurum</h3>";
  
  if (teacherData.institution?.id && teacherData.institution?.status === "kabul") {
    const instRef = doc(db, "profiles", teacherData.institution.id);
    const instSnap = await getDoc(instRef);
    if (instSnap.exists()) {
      const instData = instSnap.data();
      const instName = instData.username || instData.institutionProfile?.name || "Kurum";
      html += `<div class="user-card">
        <div class="user-info">
          <div class="user-name">${instName}</div>
          <div class="user-role">Kurum</div>
        </div>
      </div>`;
    } else {
      html += "<div class='empty-message'>Kurum bilgisi bulunamadı.</div>";
    }
  } else {
    html += "<div class='empty-message'>Henüz bir kuruma bağlı değilsiniz.</div>";
  }
  html += "</div>";

  // 2. Öğretmen (kendisi)
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👩‍🏫 Ben (Öğretmen)</h3>";
  const teacherName = teacherData.username || teacherData.fullName || "Öğretmen";
  html += `<div class="user-card" style="background:#e8f1ff;border-color:#4a90e2;">
    <div class="user-info">
      <div class="user-name">${teacherName}</div>
      <div class="user-role">Öğretmen</div>
    </div>
  </div>`;
  html += "</div>";

  // 3. Öğrenciler seviyesi
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👥 Öğrencilerim</h3>";
  
  const students = teacherData.students || {};
  const approvedStudents = Object.keys(students).filter(sid => students[sid] === "kabul");
  
  if (approvedStudents.length === 0) {
    html += "<div class='empty-message'>Henüz öğrenciniz yok.</div>";
  } else {
    for (const studentId of approvedStudents) {
      try {
        const studentRef = doc(db, "profiles", studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const studentName = studentData.username || studentData.fullName || "Öğrenci";
          html += `<div class="user-card">
            <div class="user-info">
              <div class="user-name">${studentName}</div>
              <div class="user-role">Öğrenci</div>
            </div>
          </div>`;
        }
      } catch (err) {
        console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
      }
    }
  }
  html += "</div>";

  return html;
}

// Kurum hiyerarşisi
async function kurumHiyerarsisi(institutionId) {
  const instRef = doc(db, "profiles", institutionId);
  const instSnap = await getDoc(instRef);
  
  if (!instSnap.exists()) {
    return "<div class='empty-message'>Kurum profili bulunamadı.</div>";
  }

  const instData = instSnap.data();
  let html = "";

  // 1. Kurum (kendisi)
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>🏢 Ben (Kurum)</h3>";
  const instName = instData.username || instData.institutionProfile?.name || "Kurum";
  html += `<div class="user-card" style="background:#e8f1ff;border-color:#4a90e2;">
    <div class="user-info">
      <div class="user-name">${instName}</div>
      <div class="user-role">Kurum</div>
    </div>
  </div>`;
  html += "</div>";

  // 2. Öğretmenler seviyesi
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👩‍🏫 Öğretmenlerim</h3>";
  
  const teachers = instData.teachers || {};
  const approvedTeachers = Object.keys(teachers).filter(tid => teachers[tid] === "kabul");
  
  if (approvedTeachers.length === 0) {
    html += "<div class='empty-message'>Henüz öğretmeniniz yok.</div>";
  } else {
    for (const teacherId of approvedTeachers) {
      try {
        const teacherRef = doc(db, "profiles", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          const teacherName = teacherData.username || teacherData.fullName || "Öğretmen";
          
          // Bu öğretmenin öğrencilerini say
          const teacherStudents = teacherData.students || {};
          const studentCount = Object.keys(teacherStudents).filter(sid => teacherStudents[sid] === "kabul").length;
          
          html += `<div class="user-card">
            <div class="user-info">
              <div class="user-name">${teacherName}</div>
              <div class="user-role">Öğretmen (${studentCount} öğrenci)</div>
            </div>
          </div>`;
        }
      } catch (err) {
        console.warn("Öğretmen bilgisi alınamadı:", teacherId, err);
      }
    }
  }
  html += "</div>";

  // 3. Öğrenciler seviyesi (kurumun direkt öğrencileri)
  html += "<div class='hiyerarsi-level'>";
  html += "<h3>👥 Öğrencilerim</h3>";
  
  const students = instData.students || {};
  const approvedStudents = Object.keys(students).filter(sid => students[sid] === "kabul");
  
  if (approvedStudents.length === 0) {
    html += "<div class='empty-message'>Henüz öğrenciniz yok.</div>";
  } else {
    for (const studentId of approvedStudents) {
      try {
        const studentRef = doc(db, "profiles", studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const studentName = studentData.username || studentData.fullName || "Öğrenci";
          html += `<div class="user-card">
            <div class="user-info">
              <div class="user-name">${studentName}</div>
              <div class="user-role">Öğrenci</div>
            </div>
          </div>`;
        }
      } catch (err) {
        console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
      }
    }
  }
  html += "</div>";

  return html;
}


