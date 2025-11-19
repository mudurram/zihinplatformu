// =====================================================
// ⚙️ hesap-bilgileri.js — Hesap Bilgileri Sayfası
// =====================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { getAuth, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db } from "../data/firebaseConfig.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("⚙️ hesap-bilgileri.js yüklendi");

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", async () => {
  await yukleKullaniciBilgileri();
  sifreDegistirButonu();
  kullaniciAdiDegistirButonu();
  emailDegistirButonu();
  
  // Kurum rolü için özel alanları göster ve butonları bağla
  const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
  if (role === ROLES.INSTITUTION) {
    const kurumBilgileriDiv = document.getElementById("kurumBilgileri");
    if (kurumBilgileriDiv) {
      kurumBilgileriDiv.style.display = "block";
    }
    kurumBilgileriGuncelleButonu();
  }
});

// Kullanıcı bilgilerini yükle
async function yukleKullaniciBilgileri() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    
    if (!user || !uid || !db) {
      console.error("Kullanıcı bilgileri yüklenemedi");
      return;
    }

    // Email'i göster
    const emailInput = document.getElementById("yeniEmail");
    if (emailInput) {
      emailInput.placeholder = user.email || "E-posta adresiniz";
    }

    // Profil bilgilerini yükle
    const profileRef = doc(db, "profiles", uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      
      // Kullanıcı adını göster
      const kullaniciAdiInput = document.getElementById("kullaniciAdi");
      if (kullaniciAdiInput) {
        kullaniciAdiInput.value = profileData.username || "";
        kullaniciAdiInput.placeholder = profileData.username || "Kullanıcı adınız";
      }
      
      // Kurum bilgilerini göster (sadece kurum rolü için)
      const role = localStorage.getItem(GLOBAL.LS_KEYS.ROLE) || localStorage.getItem("role");
      if (role === ROLES.INSTITUTION) {
        const institutionProfile = profileData.institutionProfile || {};
        
        const kurumAdiInput = document.getElementById("kurumAdi");
        if (kurumAdiInput) {
          kurumAdiInput.value = institutionProfile.name || "";
        }
        
        const kurumTelefon1Input = document.getElementById("kurumTelefon1");
        if (kurumTelefon1Input) {
          kurumTelefon1Input.value = institutionProfile.phone || institutionProfile.phone1 || "";
        }
        
        const kurumTelefon2Input = document.getElementById("kurumTelefon2");
        if (kurumTelefon2Input) {
          kurumTelefon2Input.value = institutionProfile.phone2 || "";
        }
        
        const kurumAdresInput = document.getElementById("kurumAdres");
        if (kurumAdresInput) {
          kurumAdresInput.value = institutionProfile.address || "";
        }
        
        const kurumYetkiliInput = document.getElementById("kurumYetkili");
        if (kurumYetkiliInput) {
          kurumYetkiliInput.value = institutionProfile.yetkili || institutionProfile.authorizedPerson || "";
        }
      }
    }
  } catch (err) {
    console.error("Kullanıcı bilgileri yüklenirken hata:", err);
  }
}

// Kullanıcı adı değiştir butonu
function kullaniciAdiDegistirButonu() {
  const btn = document.getElementById("kullaniciAdiDegistirBtn");
  const mesajDiv = document.getElementById("kullaniciAdiMesaji");
  
  if (!btn || !mesajDiv) return;
  
  btn.onclick = async () => {
    const yeniKullaniciAdi = document.getElementById("kullaniciAdi").value.trim();
    
    if (!yeniKullaniciAdi) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kullanıcı adı girin.</span>";
      return;
    }
    
    if (yeniKullaniciAdi.length < 3) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı adı en az 3 karakter olmalıdır.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kullanıcı adı güncelleniyor...</span>";
    
    try {
      const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      
      if (!uid || !db) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sistem hatası. Lütfen sayfayı yenileyin.</span>";
        return;
      }

      // Kullanıcı adının başka biri tarafından kullanılıp kullanılmadığını kontrol et
      const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const q = query(
        collection(db, "profiles"),
        where("username", "==", yeniKullaniciAdi)
      );
      const snap = await getDocs(q);
      
      // Mevcut kullanıcının kendi adı değilse ve başka biri kullanıyorsa hata ver
      if (!snap.empty && snap.docs[0].id !== uid) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı adı zaten kullanılıyor.</span>";
        return;
      }

      // Profili güncelle
      const profileRef = doc(db, "profiles", uid);
      await updateDoc(profileRef, {
        username: yeniKullaniciAdi
      });

      // LocalStorage'ı güncelle
      localStorage.setItem("username", yeniKullaniciAdi);
      
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Kullanıcı adı başarıyla güncellendi!</span>";
      
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } catch (err) {
      console.error("Kullanıcı adı güncelleme hatası:", err);
      mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${err.message || "Kullanıcı adı güncellenemedi."}</span>`;
    }
  };
}

// Email değiştir butonu
function emailDegistirButonu() {
  const btn = document.getElementById("emailDegistirBtn");
  const mesajDiv = document.getElementById("emailMesaji");
  
  if (!btn || !mesajDiv) return;
  
  btn.onclick = async () => {
    const yeniEmail = document.getElementById("yeniEmail").value.trim();
    const sifre = document.getElementById("emailSifre").value;
    
    if (!yeniEmail || !sifre) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen tüm alanları doldurun.</span>";
      return;
    }
    
    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(yeniEmail)) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Geçersiz e-posta formatı.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ E-posta adresi güncelleniyor...</span>";
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum bulunamadı. Lütfen tekrar giriş yapın.</span>";
        return;
      }
      
      // Mevcut şifreyi doğrula
      const credential = EmailAuthProvider.credential(user.email, sifre);
      await reauthenticateWithCredential(user, credential);
      
      // Email'i güncelle
      await updateEmail(user, yeniEmail);
      
      // Firestore'daki profili de güncelle
      const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      if (uid && db) {
        try {
          const profileRef = doc(db, "profiles", uid);
          await updateDoc(profileRef, {
            email: yeniEmail
          });
        } catch (err) {
          console.warn("Profil email güncelleme hatası:", err);
        }
      }
      
      // LocalStorage'ı güncelle
      localStorage.setItem("loggedUser", yeniEmail);
      
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ E-posta adresi başarıyla güncellendi!</span>";
      document.getElementById("yeniEmail").value = "";
      document.getElementById("emailSifre").value = "";
      
      // Placeholder'ı güncelle
      document.getElementById("yeniEmail").placeholder = yeniEmail;
      
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } catch (err) {
      console.error("Email güncelleme hatası:", err);
      if (err.code === "auth/wrong-password") {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Şifre yanlış.</span>";
      } else if (err.code === "auth/email-already-in-use") {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu e-posta adresi zaten kullanılıyor.</span>";
      } else if (err.code === "auth/invalid-email") {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Geçersiz e-posta adresi.</span>";
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${err.message || "E-posta güncellenemedi."}</span>`;
      }
    }
  };
}

// Şifre değiştir butonu
function sifreDegistirButonu() {
  const btn = document.getElementById("sifreDegistirBtn");
  const mesajDiv = document.getElementById("sifreMesaji");
  
  if (!btn || !mesajDiv) return;
  
  btn.onclick = async () => {
    const mevcutSifre = document.getElementById("mevcutSifre").value;
    const yeniSifre = document.getElementById("yeniSifre").value;
    const yeniSifreTekrar = document.getElementById("yeniSifreTekrar").value;
    
    if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen tüm alanları doldurun.</span>";
      return;
    }
    
    if (yeniSifre !== yeniSifreTekrar) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Yeni şifreler eşleşmiyor.</span>";
      return;
    }
    
    if (yeniSifre.length < 6) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Şifre en az 6 karakter olmalıdır.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Şifre değiştiriliyor...</span>";
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum bulunamadı. Lütfen tekrar giriş yapın.</span>";
        return;
      }
      
      // Mevcut şifreyi doğrula
      const credential = EmailAuthProvider.credential(user.email, mevcutSifre);
      await reauthenticateWithCredential(user, credential);
      
      // Şifreyi güncelle
      await updatePassword(user, yeniSifre);
      
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Şifre başarıyla değiştirildi!</span>";
      document.getElementById("mevcutSifre").value = "";
      document.getElementById("yeniSifre").value = "";
      document.getElementById("yeniSifreTekrar").value = "";
      
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } catch (err) {
      console.error("Şifre değiştirme hatası:", err);
      if (err.code === "auth/wrong-password") {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Mevcut şifre yanlış.</span>";
      } else if (err.code === "auth/weak-password") {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Şifre çok zayıf. Daha güçlü bir şifre seçin.</span>";
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${err.message || "Şifre değiştirilemedi."}</span>`;
      }
    }
  };
}

// Kurum bilgileri güncelle butonu
function kurumBilgileriGuncelleButonu() {
  const btn = document.getElementById("kurumBilgileriGuncelleBtn");
  const mesajDiv = document.getElementById("kurumBilgileriMesaji");
  
  if (!btn || !mesajDiv) return;
  
  btn.onclick = async () => {
    const kurumAdi = document.getElementById("kurumAdi").value.trim();
    const telefon1 = document.getElementById("kurumTelefon1").value.trim();
    const telefon2 = document.getElementById("kurumTelefon2").value.trim();
    const adres = document.getElementById("kurumAdres").value.trim();
    const yetkili = document.getElementById("kurumYetkili").value.trim();
    
    if (!kurumAdi) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kurum adı girin.</span>";
      return;
    }
    
    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kurum bilgileri güncelleniyor...</span>";
    
    try {
      const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
      
      if (!uid || !db) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sistem hatası. Lütfen sayfayı yenileyin.</span>";
        return;
      }

      // Profili güncelle
      const profileRef = doc(db, "profiles", uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Profil bulunamadı.</span>";
        return;
      }
      
      const profileData = profileSnap.data();
      const mevcutInstitutionProfile = profileData.institutionProfile || {};
      
      // institutionProfile objesini güncelle
      await updateDoc(profileRef, {
        institutionProfile: {
          name: kurumAdi,
          code: mevcutInstitutionProfile.code || "",
          phone: telefon1,
          phone1: telefon1,
          phone2: telefon2 || null,
          address: adres || null,
          yetkili: yetkili || null,
          authorizedPerson: yetkili || null
        }
      });
      
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Kurum bilgileri başarıyla güncellendi!</span>";
      
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } catch (err) {
      console.error("Kurum bilgileri güncelleme hatası:", err);
      mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${err.message || "Kurum bilgileri güncellenemedi."}</span>`;
    }
  };
}

// Hesabı sil
window.hesabiSil = async function() {
  if (!confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.")) {
    return;
  }
  
  const onay = prompt("Silmek için 'SİL' yazın:");
  if (onay !== "SİL") {
    alert("İşlem iptal edildi.");
    return;
  }
  
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const uid = localStorage.getItem(GLOBAL.LS_KEYS.UID) || localStorage.getItem("uid");
    
    if (!user || !uid) {
      alert("❌ Oturum bulunamadı.");
      return;
    }
    
    // Profili sil
    if (db) {
      try {
        const userRef = doc(db, "profiles", uid);
        await deleteDoc(userRef);
      } catch (err) {
        console.warn("Profil silme hatası:", err);
      }
    }
    
    // Kullanıcıyı sil
    await deleteUser(user);
    
    // LocalStorage'ı temizle
    localStorage.clear();
    
    alert("✅ Hesabınız silindi. Giriş sayfasına yönlendiriliyorsunuz...");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Hesap silme hatası:", err);
    alert(`❌ Hata: ${err.message || "Hesap silinemedi."}`);
  }
};
