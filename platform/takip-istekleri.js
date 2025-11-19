// =====================================================
// 📩 takip-istekleri.js — Takip İstekleri Sayfası (Tüm Roller)
// =====================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { 
  listAllRequestsByUser, 
  createStudentTeacherRequest,
  createStudentInstitutionRequest,
  createTeacherStudentRequest,
  createTeacherInstitutionRequest,
  createInstitutionTeacherRequest,
  createInstitutionStudentRequest,
  respondRequest 
} from "../data/requestService.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("📩 takip-istekleri.js yüklendi");

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
  
  if (!role) {
    window.location.href = "login.html";
    return;
  }

  await yukleTalepler(role);
  davetGonderButonu(role);
});

// Talepleri yükle (rol bazlı)
async function yukleTalepler(role) {
  const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
  if (!uid) return;

  const { received, sent } = await listAllRequestsByUser(uid);
  
  // Alınan talepler
  const alinanListe = document.getElementById("alinanTalepler");
  if (alinanListe) {
    const alinanTalepler = received.filter(req => req.status === "beklemede");
    
    if (alinanTalepler.length === 0) {
      alinanListe.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Alınan davet bulunmuyor.</li>";
    } else {
      alinanListe.innerHTML = "";
      for (const req of alinanTalepler) {
        const li = await olusturTalepItem(req, role, "received");
        alinanListe.appendChild(li);
      }
    }
  }
  
  // Gönderilen talepler
  const gonderilenListe = document.getElementById("gonderilenTalepler");
  if (gonderilenListe) {
    if (sent.length === 0) {
      gonderilenListe.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Gönderilen davet bulunmuyor.</li>";
    } else {
      gonderilenListe.innerHTML = "";
      for (const req of sent) {
        const li = await olusturTalepItem(req, role, "sent");
        gonderilenListe.appendChild(li);
      }
    }
  }
}

// Talep item'ı oluştur
async function olusturTalepItem(req, currentRole, type) {
  const li = document.createElement("li");
  li.style.cssText = "background:#f4f6fb;padding:16px;border-radius:8px;margin-bottom:10px;";
  
  try {
    let userName = "Bilinmeyen";
    let userRole = "";
    let targetId = type === "received" ? req.fromId : req.toId;
    
    // Kullanıcı bilgisini al
    const userRef = doc(db, "profiles", targetId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      userName = userData.username || userData.fullName || userData.ad || "İsimsiz";
      userRole = userData.role || "";
    }
    
    // Talep tipine göre mesaj oluştur
    let message = "";
    let actionButtons = "";
    
    if (type === "received") {
      // Alınan talepler - onay/red butonları
      switch (req.type) {
        case "teacher_student":
          message = `<strong>${userName}</strong> öğretmeni sizi eklemek istiyor.`;
          break;
        case "student_teacher":
          message = `<strong>${userName}</strong> öğrencisi sizi eklemek istiyor.`;
          break;
        case "institution_teacher":
          message = `<strong>${userName}</strong> kurumu sizi eklemek istiyor.`;
          break;
        case "teacher_institution":
          message = `<strong>${userName}</strong> öğretmeni kurumunuza başvuruyor.`;
          break;
        case "institution_student":
          message = `<strong>${userName}</strong> kurumu sizi eklemek istiyor.`;
          break;
        case "student_institution":
          message = `<strong>${userName}</strong> öğrencisi kurumunuza başvuruyor.`;
          break;
        default:
          message = `Talep tipi: ${req.type}`;
      }
      
      actionButtons = `
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button onclick="talepKabul('${req.id}')" style="padding:8px 16px;background:#27ae60;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">✓ Kabul</button>
          <button onclick="talepRed('${req.id}')" style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">✗ Red</button>
        </div>
      `;
    } else {
      // Gönderilen talepler - durum göster
      switch (req.type) {
        case "student_teacher":
          message = `<strong>${userName}</strong> öğretmenine gönderildi`;
          break;
        case "teacher_student":
          message = `<strong>${userName}</strong> öğrencisine gönderildi`;
          break;
        case "student_institution":
          message = `<strong>${userName}</strong> kurumuna gönderildi`;
          break;
        case "institution_teacher":
          message = `<strong>${userName}</strong> öğretmenine gönderildi`;
          break;
        case "institution_student":
          message = `<strong>${userName}</strong> öğrencisine gönderildi`;
          break;
        case "teacher_institution":
          message = `<strong>${userName}</strong> kurumuna gönderildi`;
          break;
        default:
          message = `Talep tipi: ${req.type}`;
      }
      
      const statusText = req.status === "beklemede" ? "⏳ Beklemede" : 
                        req.status === "kabul" ? "✅ Kabul Edildi" : "❌ Reddedildi";
      const statusColor = req.status === "beklemede" ? "#f39c12" : 
                         req.status === "kabul" ? "#27ae60" : "#e74c3c";
      
      actionButtons = `<span style="color:${statusColor};font-weight:600;margin-top:10px;display:block;">${statusText}</span>`;
    }
    
    li.innerHTML = `
      <div>
        <div>${message}</div>
        ${actionButtons}
      </div>
    `;
  } catch (err) {
    console.error("Talep item oluşturma hatası:", err);
    li.innerHTML = `<span>Talep ID: ${req.id} - ${req.type} - ${req.status}</span>`;
  }
  
  return li;
}

// Talep kabul
window.talepKabul = async function(requestId) {
  try {
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    const result = await respondRequest(requestId, "kabul", uid);
    if (result.success) {
      const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
      await yukleTalepler(role);
      alert("✅ Talep kabul edildi!");
    } else {
      alert("❌ " + (result.message || "Bir hata oluştu."));
    }
  } catch (err) {
    console.error("Talep kabul hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// Talep red
window.talepRed = async function(requestId) {
  try {
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    const result = await respondRequest(requestId, "red", uid);
    if (result.success) {
      const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
      await yukleTalepler(role);
      alert("❌ Talep reddedildi.");
    } else {
      alert("❌ " + (result.message || "Bir hata oluştu."));
    }
  } catch (err) {
    console.error("Talep red hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// Davet gönderme butonu (rol bazlı)
function davetGonderButonu(role) {
  const btn = document.getElementById("davetGonderBtn");
  const input = document.getElementById("davetUsernameInput");
  const mesajDiv = document.getElementById("davetMesaji");
  
  if (!btn || !input || !mesajDiv) return;
  
  // Placeholder'ı rol bazlı güncelle
  if (role === ROLES.OGRENCI) {
    input.placeholder = "Kullanıcı adı girin (öğretmen veya kurum)";
  } else if (role === ROLES.OGRETMEN) {
    input.placeholder = "Kullanıcı adı girin (öğrenci veya kurum)";
  } else if (role === ROLES.INSTITUTION) {
    input.placeholder = "Kullanıcı adı girin (öğretmen veya öğrenci)";
  }
  
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
      
      const targetId = snap.docs[0].id;
      const targetData = snap.docs[0].data();
      const targetRole = targetData.role;
      const currentId = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      
      let result;
      
      // Rol bazlı davet gönderme
      if (role === ROLES.OGRENCI) {
        if (targetRole === ROLES.OGRETMEN) {
          result = await createStudentTeacherRequest(currentId, targetId);
        } else if (targetRole === ROLES.INSTITUTION) {
          result = await createStudentInstitutionRequest(currentId, targetId);
        } else {
          mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğretmen veya kuruma davet gönderebilirsiniz.</span>";
          return;
        }
      } else if (role === ROLES.OGRETMEN) {
        if (targetRole === ROLES.OGRENCI) {
          result = await createTeacherStudentRequest(currentId, targetId);
        } else if (targetRole === ROLES.INSTITUTION) {
          result = await createTeacherInstitutionRequest(currentId, targetId);
        } else {
          mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğrenci veya kuruma davet gönderebilirsiniz.</span>";
          return;
        }
      } else if (role === ROLES.INSTITUTION) {
        if (targetRole === ROLES.OGRETMEN) {
          result = await createInstitutionTeacherRequest(currentId, targetId);
        } else if (targetRole === ROLES.OGRENCI) {
          result = await createInstitutionStudentRequest(currentId, targetId);
        } else {
          mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğretmen veya öğrenciye davet gönderebilirsiniz.</span>";
          return;
        }
      } else {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu rol için davet gönderme desteklenmiyor.</span>";
        return;
      }
      
      if (result.success) {
        mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Davet başarıyla gönderildi!</span>";
        input.value = "";
        await yukleTalepler(role);
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
