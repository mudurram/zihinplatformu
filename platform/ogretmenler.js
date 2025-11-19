// =====================================================
// 👩‍🏫 ogretmenler.js — Öğretmenler Sayfası
// =====================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { createStudentTeacherRequest, unlinkTeacherStudent } from "../data/requestService.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("👩‍🏫 ogretmenler.js yüklendi");

// Rol kontrolü
const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
if (role !== ROLES.OGRENCI) {
  window.location.href = "index.html";
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  await yukleOgretmenler();
  ogretmenEkleButonu();
});

// Öğretmenleri yükle
async function yukleOgretmenler() {
  const liste = document.getElementById("ogretmenListesi");
  if (!liste) return;

  try {
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    if (!uid || !db) return;

    const userRef = doc(db, "profiles", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      liste.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Profil bulunamadı.</li>";
      return;
    }

    const userData = userSnap.data();
    const teachers = userData.teachers || {};
    const onayliOgretmenler = Object.entries(teachers).filter(([_, status]) => status === "kabul");

    if (onayliOgretmenler.length === 0) {
      liste.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Henüz öğretmenin yok.</li>";
      return;
    }

    liste.innerHTML = "";

    for (const [teacherId] of onayliOgretmenler) {
      try {
        const teacherRef = doc(db, "profiles", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        
        if (!teacherSnap.exists()) continue;

        const teacherData = teacherSnap.data();
        const teacherName = teacherData.username || teacherData.fullName || "Öğretmen";

        const li = document.createElement("li");
        li.style.cssText = "background:#f4f6fb;padding:16px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;";
        li.innerHTML = `
          <div>
            <strong style="font-size:16px;color:#1e3d59;">${teacherName}</strong>
            <p style="margin:5px 0 0 0;color:#666;font-size:13px;">Öğretmen</p>
          </div>
          <button onclick="ogretmeniSil('${teacherId}')" style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🗑️ Sil</button>
        `;
        liste.appendChild(li);
      } catch (err) {
        console.warn("Öğretmen bilgisi alınamadı:", teacherId, err);
      }
    }
  } catch (err) {
    console.error("Öğretmen listesi yüklenemedi:", err);
    liste.innerHTML = "<li style='padding:15px;text-align:center;color:#e74c3c;'>Bir hata oluştu.</li>";
  }
}

// Öğretmeni sil
window.ogretmeniSil = async function(teacherId) {
  if (!confirm("Bu öğretmeni listeden kaldırmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    const studentId = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    const result = await unlinkTeacherStudent(teacherId, studentId);
    
    if (result.success) {
      alert("✅ Öğretmen listeden kaldırıldı.");
      await yukleOgretmenler();
    } else {
      alert(`❌ Hata: ${result.message || "Öğretmen kaldırılamadı."}`);
    }
  } catch (err) {
    console.error("Öğretmen silme hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// Öğretmen ekle butonu
function ogretmenEkleButonu() {
  const btn = document.getElementById("ogretmenEkleBtn");
  const input = document.getElementById("yeniOgretmenInput");
  const mesajDiv = document.getElementById("ogretmenMesaji");
  
  if (!btn || !input || !mesajDiv) return;
  
  btn.onclick = async () => {
    const username = input.value.trim();
    if (!username) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kullanıcı adı girin.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
    
    try {
      const q = query(collection(db, "profiles"), where("username", "==", username));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı bulunamadı.</span>";
        return;
      }
      
      const teacherId = snap.docs[0].id;
      const teacherData = snap.docs[0].data();
      
      if (teacherData.role !== ROLES.OGRETMEN) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı öğretmen değil.</span>";
        return;
      }
      
      const studentId = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      const result = await createStudentTeacherRequest(studentId, teacherId);
      
      if (result.success) {
        mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Davet başarıyla gönderildi!</span>";
        input.value = "";
        setTimeout(() => {
          mesajDiv.innerHTML = "";
        }, 3000);
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ ${result.message || "Davet gönderilemedi."}</span>`;
      }
    } catch (err) {
      console.error("Davet gönderme hatası:", err);
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu.</span>";
    }
  };
}

