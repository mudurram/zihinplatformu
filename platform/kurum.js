// =====================================================
// 🏢 kurum.js — Kurum Sayfası
// =====================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("🏢 kurum.js yüklendi");

// Rol kontrolü
const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
if (role !== ROLES.OGRENCI) {
  window.location.href = "index.html";
}

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  await yukleKurumBilgisi();
  kurumEkleButonu();
});

// Kurum bilgisini yükle
async function yukleKurumBilgisi() {
  const mevcutKurumDiv = document.getElementById("mevcutKurum");
  const kurumEkleDiv = document.getElementById("kurumEkle");
  const kurumAdiP = document.getElementById("kurumAdi");
  
  if (!mevcutKurumDiv || !kurumEkleDiv || !kurumAdiP) return;

  try {
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    if (!uid || !db) return;

    const userRef = doc(db, "profiles", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const kurumBilgisi = userData.institution;
    
    if (kurumBilgisi && kurumBilgisi.status === "kabul" && kurumBilgisi.id) {
      try {
        const kurumRef = doc(db, "profiles", kurumBilgisi.id);
        const kurumSnap = await getDoc(kurumRef);
        
        if (kurumSnap.exists()) {
          const kurumData = kurumSnap.data();
          const kurumAdi = kurumData.username || kurumData.name || "Kurum";
          
          kurumAdiP.textContent = kurumAdi;
          mevcutKurumDiv.style.display = "block";
          kurumEkleDiv.style.display = "none";
        } else {
          mevcutKurumDiv.style.display = "none";
          kurumEkleDiv.style.display = "block";
        }
      } catch (err) {
        console.error("Kurum bilgisi yüklenemedi:", err);
        mevcutKurumDiv.style.display = "none";
        kurumEkleDiv.style.display = "block";
      }
    } else {
      mevcutKurumDiv.style.display = "none";
      kurumEkleDiv.style.display = "block";
    }
  } catch (err) {
    console.error("Kurum bilgisi yüklenemedi:", err);
    mevcutKurumDiv.style.display = "none";
    kurumEkleDiv.style.display = "block";
  }
}

// Kurumdan ayrıl
window.kurumdanAyril = async function() {
  if (!confirm("Kurumdan ayrılmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    if (!uid || !db) return;

    const userRef = doc(db, "profiles", uid);
    await updateDoc(userRef, { institution: deleteField() });
    
    alert("✅ Kurumdan ayrıldınız.");
    await yukleKurumBilgisi();
  } catch (err) {
    console.error("Kurumdan ayrılma hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// Kurum ekle butonu
function kurumEkleButonu() {
  const btn = document.getElementById("kurumEkleBtn");
  const input = document.getElementById("kurumUsernameInput");
  const mesajDiv = document.getElementById("kurumMesaji");
  
  if (!btn || !input || !mesajDiv) return;
  
  btn.onclick = async () => {
    const username = input.value.trim();
    if (!username) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kurum kullanıcı adı girin.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
    
    try {
      const { query, collection, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const q = query(collection(db, "profiles"), where("username", "==", username));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kurum bulunamadı.</span>";
        return;
      }
      
      const kurumId = snap.docs[0].id;
      const kurumData = snap.docs[0].data();
      
      if (kurumData.role !== ROLES.INSTITUTION) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı kurum değil.</span>";
        return;
      }
      
      const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      const userRef = doc(db, "profiles", uid);
      await updateDoc(userRef, { 
        institution: { 
          id: kurumId, 
          status: "kabul" 
        } 
      });
      
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Kuruma başarıyla bağlandınız!</span>";
      input.value = "";
      await yukleKurumBilgisi();
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } catch (err) {
      console.error("Kurum ekleme hatası:", err);
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu.</span>";
    }
  };
}

