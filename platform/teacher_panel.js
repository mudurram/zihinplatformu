// ====================================================================
// 📘 teacher_panel.js — Öğretmen Paneli (Final Stabil v7.1)
// GLOBAL, ROUTER, FIRESTORE ile %100 uyumlu — KIRILMAZ SÜRÜM
// ====================================================================

import { db } from "../data/firebaseConfig.js";
import { yonlendir } from "./router.js";
import { ROLES } from "./globalConfig.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { listAllRequestsByUser, listRequestsByUser, listSentRequestsByUser, respondRequest, createTeacherStudentRequest, createTeacherInstitutionRequest, unlinkTeacherStudent, unlinkInstitutionTeacher } from "../data/requestService.js";
import { 
  sendMessage, 
  listenMessages, 
  getChatList,
  getTeacherInstitutionChatList 
} from "../data/messageService.js";

// ====================================================================
// 1) ROL & OTURUM DOĞRULAMASI
// ====================================================================

const role = localStorage.getItem("role");
let teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid") || null;

// Rol yoksa → login
if (!role) {
  console.warn("⛔ Rol bulunamadı → login.html");
  window.location.href = "login.html";
  throw new Error("Rol yok.");
}

// Öğretmen değilse erişim kapalı (role trim ve lowercase kontrolü)
const normalizedRole = (role || "").trim().toLowerCase();
if (normalizedRole !== ROLES.OGRETMEN) {
  console.warn("⛔ Yetkisiz erişim. Rol:", role, "| Normalized:", normalizedRole);
  yonlendir(role);
  throw new Error("Yetkisiz erişim.");
}

// TeacherID yoksa ama uid varsa → teacherID = uid (öğretmen kendi hesabı)
if (!teacherID && uid) {
  console.log("⚠ teacherID bulunamadı, uid'den set ediliyor:", uid);
  teacherID = uid;
  localStorage.setItem("teacherID", uid);
}

// Hala teacherID yoksa → platforma dönüş
if (!teacherID) {
  console.warn("⚠ teacherID ve uid bulunamadı → index.html");
  alert("Öğretmen hesabı doğrulanamadı. Lütfen tekrar giriş yapın.");
  window.location.href = "login.html";
  throw new Error("teacherID yok.");
}

console.log("🎯 Teacher Panel Açıldı → teacherID:", teacherID, "| uid:", uid);

// ====================================================================
// 2) ÖĞRETMEN BİLGİLERİNİ YÜKLE
// ====================================================================
async function yukleOgretmenBilgisi() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    const ref = doc(db, "profiles", teacherID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("⚠ Öğretmen profili bulunamadı.");
      return;
    }

    const data = snap.data();
    const isim = data.username || data.ad || "Öğretmen";

    const alan = document.getElementById("kullaniciAdi");
    if (alan) alan.textContent = `👩‍🏫 Öğretmen: ${isim}`;

  } catch (err) {
    console.error("❌ Öğretmen bilgisi yüklenemedi:", err);
  }
}

yukleOgretmenBilgisi();

// ====================================================================
// 2.5) KURUM BİLGİSİNİ YÜKLE
// ====================================================================
async function yukleKurumBilgisi() {
  try {
    if (!db || !teacherID) return;

    const ref = doc(db, "profiles", teacherID);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    const kurumBilgisi = data.institution;

    const mevcutKurumDiv = document.getElementById("mevcutKurumBilgisi");
    const kurumAdiP = document.getElementById("kurumAdi");

    if (kurumBilgisi && kurumBilgisi.status === "kabul" && kurumBilgisi.id) {
      // Kurum bilgisini al
      const kurumRef = doc(db, "profiles", kurumBilgisi.id);
      const kurumSnap = await getDoc(kurumRef);
      
      if (kurumSnap.exists()) {
        const kurumData = kurumSnap.data();
        const kurumAdi = kurumData.username || kurumData.name || "Kurum";
        
        if (mevcutKurumDiv) {
          mevcutKurumDiv.style.display = "block";
        }
        if (kurumAdiP) {
          kurumAdiP.textContent = kurumAdi;
        }
      }
    } else {
      if (mevcutKurumDiv) {
        mevcutKurumDiv.style.display = "none";
      }
    }
  } catch (err) {
    console.error("❌ Kurum bilgisi yüklenemedi:", err);
  }
}

// ====================================================================
// 3) ÖĞRENCİ LİSTESİNİ YÜKLE
// ====================================================================
async function listeOgrenciler() {
  const listeDiv = document.getElementById("ogrListe");

  if (!listeDiv) {
    console.warn("⚠ ogrListe elementi bulunamadı.");
    return;
  }

  listeDiv.innerHTML = "<p>Yükleniyor...</p>";

  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      listeDiv.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
      return;
    }

    // Öğretmenin profilinden students map'ini al
    const teacherRef = doc(db, "profiles", teacherID);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      listeDiv.innerHTML = "<p>Öğretmen profili bulunamadı.</p>";
      return;
    }

    const teacherData = teacherSnap.data();
    const students = teacherData.students || {};

    listeDiv.innerHTML = "";

    const studentIds = Object.keys(students).filter(id => students[id] === "kabul");

    if (!studentIds.length) {
      listeDiv.innerHTML = "<p>Henüz kayıtlı öğrenci yok.</p>";
      return;
    }

    // Her öğrenci için bilgileri al
    for (const ogrID of studentIds) {
      try {
        const ogrRef = doc(db, "profiles", ogrID);
        const ogrSnap = await getDoc(ogrRef);

        if (!ogrSnap.exists()) continue;

        const data = ogrSnap.data() || {};
        const ad = data.username || data.ad || data.fullName || "İsimsiz Öğrenci";

        const kart = document.createElement("div");
        kart.className = "ogr-kart";

        kart.innerHTML = `
          <div style="flex:1;">
            <div class="ogr-ad">${ad}</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <button 
              class="ogrenci-sil-btn" 
              data-ogrenci-id="${ogrID}"
              data-ogrenci-ad="${ad}"
              onclick="event.stopPropagation();"
              style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:0.2s;"
              onmouseover="this.style.background='#c0392b'"
              onmouseout="this.style.background='#e74c3c'"
            >
              🗑️ Sil
            </button>
          </div>
        `;

        // Öğrenci seçme (kartın kendisine tıklanınca)
        kart.querySelector('div:first-child').onclick = () => ogrenciSec(ogrID, ad);
        
        // Silme butonu event listener
        const silBtn = kart.querySelector('.ogrenci-sil-btn');
        if (silBtn) {
          silBtn.onclick = async (e) => {
            e.stopPropagation();
            const ogrenciId = silBtn.dataset.ogrenciId;
            const ogrenciAd = silBtn.dataset.ogrenciAd;
            
            if (!confirm(`${ogrenciAd} öğrencisini listeden silmek istediğinize emin misiniz?`)) {
              return;
            }
            
            try {
              const result = await unlinkTeacherStudent(teacherID, ogrenciId);
              if (result.success) {
                alert(`✅ ${ogrenciAd} öğrencisi başarıyla silindi.`);
                await listeOgrenciler(); // Listeyi yenile
              } else {
                alert(`❌ Hata: ${result.message || "Öğrenci silinemedi."}`);
              }
            } catch (err) {
              console.error("Öğrenci silme hatası:", err);
              alert(`❌ Hata: ${err.message || "Öğrenci silinemedi."}`);
            }
          };
        }

        listeDiv.appendChild(kart);
      } catch (err) {
        console.warn("⚠ Öğrenci bilgisi alınamadı:", ogrID, err);
      }
    }

  } catch (err) {
    console.error("❌ Öğrenci listesi yüklenemedi:", err);
    listeDiv.innerHTML = "<p>Bir hata oluştu.</p>";
  }
}

listeOgrenciler();

// ====================================================================
// 4) BEKLEYEN TALEPLER
// ====================================================================
async function yukleBekleyenTalepler() {
  const alinanListe = document.getElementById("ogretmenAlinanTalepler");
  const gonderilenListe = document.getElementById("ogretmenGonderilenTalepler");
  const eskiAlan = document.getElementById("bekleyenTalepler"); // Geriye uyumluluk

  if (!alinanListe && !gonderilenListe && !eskiAlan) return;

  if (!uid) {
    if (eskiAlan) eskiAlan.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    if (alinanListe) alinanListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    if (gonderilenListe) gonderilenListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    return;
  }

  const { received, sent } = await listAllRequestsByUser(uid);

  // ALINAN TALEPLER (Beklemede olanlar)
  const bekleyenTalepler = received.filter(req => req.status === "beklemede");
  
  if (alinanListe) {
    if (!bekleyenTalepler.length) {
      alinanListe.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Bekleyen talep yok.</li>";
    } else {
      alinanListe.innerHTML = "";
      for (const req of bekleyenTalepler) {
        const item = document.createElement("li");
        
        // Gönderen kullanıcının bilgisini al
        let senderName = req.fromId;
        try {
          const senderRef = doc(db, "profiles", req.fromId);
          const senderSnap = await getDoc(senderRef);
          if (senderSnap.exists()) {
            const senderData = senderSnap.data();
            senderName = senderData.username || senderData.fullName || senderData.ad || req.fromId;
          }
        } catch (err) {
          console.warn("Gönderen bilgisi alınamadı:", err);
        }

        let talepMetni = "";
        if (req.type === "student_teacher") {
          talepMetni = `<strong>${senderName}</strong> öğrencisi seni eklemek istiyor.`;
        } else if (req.type === "institution_teacher") {
          talepMetni = `<strong>${senderName}</strong> kurumu seni eklemek istiyor.`;
        } else {
          talepMetni = `<strong>${req.type}</strong> — ${senderName}`;
        }

        item.innerHTML = `
          <div>
            ${talepMetni}
          </div>
          <div class="talep-btn-grup">
            <button data-id="${req.id}" data-status="kabul" style="background:#27ae60;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✓ Kabul</button>
            <button data-id="${req.id}" data-status="red" style="background:#e74c3c;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✗ Red</button>
          </div>
        `;

        item.querySelectorAll("button").forEach(btn => {
          btn.onclick = async () => {
            const status = btn.dataset.status;
            await respondRequest(req.id, status, uid);
            await yukleBekleyenTalepler();
            // Eğer kabul edildiyse öğrenci listesini yenile
            if (status === "kabul") {
              await listeOgrenciler();
            }
          };
        });

        alinanListe.appendChild(item);
      }
    }
  }

  // GÖNDERİLEN TALEPLER
  if (gonderilenListe) {
    // Öğretmenin gönderdiği talepler: teacher_student (öğrenciye) ve teacher_institution (kuruma - öğretmen kuruma katılmak istiyor)
    const gonderilenTalepler = sent.filter(req => 
      req.type === "teacher_student" || req.type === "teacher_institution"
    );
    
    if (!gonderilenTalepler.length) {
      gonderilenListe.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Gönderilen talep yok.</li>";
    } else {
      gonderilenListe.innerHTML = "";
      for (const req of gonderilenTalepler) {
        let receiverName = req.toId;
        try {
          const receiverRef = doc(db, "profiles", req.toId);
          const receiverSnap = await getDoc(receiverRef);
          if (receiverSnap.exists()) {
            const receiverData = receiverSnap.data();
            receiverName = receiverData.username || receiverData.fullName || receiverData.ad || req.toId;
          }
        } catch (err) {
          console.warn("Alıcı bilgisi alınamadı:", err);
        }

        let talepMetni = "";
        if (req.type === "teacher_student") {
          talepMetni = `<strong>${receiverName}</strong> öğrencisine gönderildi`;
        } else if (req.type === "teacher_institution") {
          talepMetni = `<strong>${receiverName}</strong> kurumuna başvuru gönderildi`;
        } else {
          talepMetni = `${req.type} — ${receiverName}`;
        }

        const statusText = req.status === "beklemede" ? "⏳ Beklemede" : 
                          req.status === "kabul" ? "✅ Kabul Edildi" : 
                          req.status === "red" ? "❌ Reddedildi" : req.status;

        const item = document.createElement("li");
        item.innerHTML = `
          <div>
            ${talepMetni} — ${statusText}
          </div>
        `;
        gonderilenListe.appendChild(item);
      }
    }
  }

  // Geriye uyumluluk için eski alan
  if (eskiAlan && !alinanListe) {
    if (!bekleyenTalepler.length) {
      eskiAlan.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Bekleyen talep yok.</li>";
    } else {
      eskiAlan.innerHTML = "";
      for (const req of bekleyenTalepler) {
        const item = document.createElement("li");
        let senderName = req.fromId;
        try {
          const senderRef = doc(db, "profiles", req.fromId);
          const senderSnap = await getDoc(senderRef);
          if (senderSnap.exists()) {
            const senderData = senderSnap.data();
            senderName = senderData.username || senderData.fullName || senderData.ad || req.fromId;
          }
        } catch (err) {
          console.warn("Gönderen bilgisi alınamadı:", err);
        }

        let talepMetni = "";
        if (req.type === "student_teacher") {
          talepMetni = `<strong>${senderName}</strong> öğrencisi seni eklemek istiyor.`;
        } else if (req.type === "institution_teacher") {
          talepMetni = `<strong>${senderName}</strong> kurumu seni eklemek istiyor.`;
        } else {
          talepMetni = `<strong>${req.type}</strong> — ${senderName}`;
        }

        item.innerHTML = `
          <div>
            ${talepMetni}
          </div>
          <div class="talep-btn-grup">
            <button data-id="${req.id}" data-status="kabul" style="background:#27ae60;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✓ Kabul</button>
            <button data-id="${req.id}" data-status="red" style="background:#e74c3c;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">✗ Red</button>
          </div>
        `;

        item.querySelectorAll("button").forEach(btn => {
          btn.onclick = async () => {
            const status = btn.dataset.status;
            await respondRequest(req.id, status, uid);
            await yukleBekleyenTalepler();
            // Eğer kabul edildiyse öğrenci listesini yenile
            if (status === "kabul") {
              await listeOgrenciler();
            }
          };
        });

        eskiAlan.appendChild(item);
      }
    }
  }
}

yukleBekleyenTalepler();

// ====================================================================
// 5) ÖĞRENCİ SEÇ — analiz.html'e yönlendir
// ====================================================================
function ogrenciSec(id, ad) {
  localStorage.setItem("aktifOgrenciId", id);
  localStorage.setItem("aktifOgrenci", ad || "Bilinmiyor");

  console.log("📌 Öğrenci seçildi:", id, ad);

  window.location.href = "analiz.html";
}

// ====================================================================
// 5) MODAL (Opsiyonel)
// ====================================================================
window.modalKapat = function () {
  const arka = document.getElementById("ogrModal");
  if (arka) arka.style.display = "none";
};

// ====================================================================
// 6) SEKME YÖNETİMİ
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Öğrenciye talep gönderme butonunu başlat
  ogrenciTalepGonderButonu();
  
  // Kurum daveti gönderme butonunu başlat
  const kurumDavetBtn = document.getElementById("kurumDavetGonderBtn");
  const kurumDavetInput = document.getElementById("kurumDavetUsernameInput");
  
  if (kurumDavetBtn) {
    kurumDavetBtn.onclick = kurumDavetGonder;
  }
  
  // Mesajlaşma sistemi başlat
  initMesajRolSecimi();
  
  // Kullanıcı adı arama butonu
  const aramaBtn = document.getElementById("mesajKullaniciAdiAraBtn");
  if (aramaBtn) {
    aramaBtn.addEventListener("click", mesajKullaniciAdiAra);
  }
  
  // Arşiv butonları
  const arsivGonderilenBtn = document.getElementById("arsivGonderilenBtn");
  const arsivGelenBtn = document.getElementById("arsivGelenBtn");
  const arsivSilinenBtn = document.getElementById("arsivSilinenBtn");
  
  if (arsivGonderilenBtn) {
    arsivGonderilenBtn.addEventListener("click", () => mesajArsivGoster("gonderilen"));
  }
  
  if (arsivGelenBtn) {
    arsivGelenBtn.addEventListener("click", () => mesajArsivGoster("gelen"));
  }
  
  if (arsivSilinenBtn) {
    arsivSilinenBtn.addEventListener("click", () => mesajArsivGoster("silinen"));
  }
  
  if (kurumDavetInput) {
    kurumDavetInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        kurumDavetGonder();
      }
    };
  }

  const sekmeBtnler = document.querySelectorAll(".sekme-btn");
  const sekmeIcerikler = document.querySelectorAll(".sekme-icerik");

  // Sekme açma fonksiyonu (global scope'a ekle)
  window.acSekme = function(sekmeAdi) {
    console.log("🔍 acSekme çağrıldı:", sekmeAdi);
    const hedefBtn = document.querySelector(`[data-sekme="${sekmeAdi}"]`);
    if (hedefBtn) {
      console.log("✅ Sekme butonu bulundu, tıklanıyor:", sekmeAdi);
      hedefBtn.click();
    } else {
      console.warn("⚠️ Sekme butonu bulunamadı:", sekmeAdi);
      // Direkt olarak sekme içeriğini açmayı dene
      const sekmeIcerik = document.getElementById(`sekme-${sekmeAdi}`);
      if (sekmeIcerik) {
        // Tüm sekmeleri pasif yap
        sekmeBtnler.forEach(b => b.classList.remove("active"));
        sekmeIcerikler.forEach(s => s.classList.remove("active"));
        
        // Seçilen sekmeyi aktif yap
        const btn = document.querySelector(`[data-sekme="${sekmeAdi}"]`);
        if (btn) btn.classList.add("active");
        sekmeIcerik.classList.add("active");
        
        // Mesajlaşma sekmesi açıldığında öğrenci listesini yükle
        if (sekmeAdi === "mesajlar") {
          yukleMesajOgrenciListesi();
        }
        
        // Kurum sekmesi açıldığında kurum bilgilerini yükle
        if (sekmeAdi === "kurum") {
          yukleKurumBilgisi();
          yukleKurumTalepleri();
        }
      }
    }
  };

  sekmeBtnler.forEach(btn => {
    btn.addEventListener("click", () => {
      const hedefSekme = btn.dataset.sekme;

      // Tüm sekmeleri pasif yap
      sekmeBtnler.forEach(b => b.classList.remove("active"));
      sekmeIcerikler.forEach(s => s.classList.remove("active"));

      // Seçilen sekmeyi aktif yap
      btn.classList.add("active");
      document.getElementById(`sekme-${hedefSekme}`)?.classList.add("active");

      // URL hash'ini güncelle
      window.location.hash = hedefSekme;

      // Mesajlaşma sekmesi açıldığında öğrenci listesini yükle
      if (hedefSekme === "mesajlar") {
        yukleMesajOgrenciListesi();
      }
      
      // Kurum sekmesi açıldığında kurum bilgilerini yükle
      if (hedefSekme === "kurum") {
        yukleKurumBilgisi();
        yukleKurumTalepleri();
      }
    });
  });

  // Hash değişikliğini dinle
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['ogrenciler', 'talepler', 'kurum', 'mesajlar'].includes(hash)) {
      console.log("🔍 Hash değişti:", hash);
      setTimeout(() => {
        window.acSekme(hash);
      }, 50);
    }
  });

  // İlk yüklemede hash kontrolü
  const hashKontrol = () => {
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['ogrenciler', 'talepler', 'kurum', 'mesajlar'].includes(hash)) {
        console.log("🔍 İlk yüklemede hash bulundu:", hash);
        setTimeout(() => {
          window.acSekme(hash);
        }, 200);
      }
    }
  };

  // Sayfa tamamen yüklendiğinde hash kontrolü
  if (document.readyState === 'complete') {
    hashKontrol();
  } else {
    window.addEventListener('load', hashKontrol);
    // DOMContentLoaded zaten çalıştı, direkt kontrol et
    hashKontrol();
  }
});

// ====================================================================
// 7) MESAJLAŞMA SİSTEMİ
// ====================================================================
let aktifKullaniciId = null;
let aktifKullaniciAdi = null;
let aktifChatTipi = null; // "ogrenci" veya "kurum"
let mesajUnsubscribe = null;
let seciliRol = null; // "ogrenci", "kurum", "herikisi"

// Role seçimi event listener'ları
function initMesajRolSecimi() {
  const rolRadioBtnler = document.querySelectorAll('input[name="mesajRolSecimi"]');
  rolRadioBtnler.forEach(radio => {
    radio.addEventListener('change', (e) => {
      seciliRol = e.target.value;
      yukleMesajKullaniciListesi();
    });
  });
}

// Kullanıcı adı ile arama
async function mesajKullaniciAdiAra() {
  const input = document.getElementById("mesajKullaniciAdiInput");
  if (!input) return;
  
  const username = input.value.trim();
  if (!username) {
    alert("⚠️ Lütfen kullanıcı adı girin.");
    return;
  }

  try {
    const userId = await findUserByUsername(username);
    if (!userId) {
      alert("❌ Kullanıcı bulunamadı. Kullanıcı adını kontrol edin.");
      return;
    }

    // Kullanıcı bilgilerini al
    const userRef = doc(db, "profiles", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("❌ Kullanıcı profili bulunamadı.");
      return;
    }

    const userData = userSnap.data();
    const userRole = userData.role;
    const userName = userData.username || userData.fullName || userData.ad || username;

    // Role kontrolü
    if (seciliRol === "ogrenci" && userRole !== "ogrenci") {
      alert("❌ Bu kullanıcı öğrenci değil.");
      return;
    }
    if (seciliRol === "kurum" && userRole !== "institution") {
      alert("❌ Bu kullanıcı kurum değil.");
      return;
    }
    if (seciliRol === "herikisi" && userRole !== "ogrenci" && userRole !== "institution") {
      alert("❌ Bu kullanıcı öğrenci veya kurum değil.");
      return;
    }

    // Kullanıcıyı seç
    mesajKullaniciSec(userId, userRole, userName);
  } catch (err) {
    console.error("Kullanıcı arama hatası:", err);
    alert("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
  }
}

async function yukleMesajKullaniciListesi() {
  const secimAlani = document.getElementById("mesajKullaniciSecimAlani");
  const select = document.getElementById("mesajKullaniciSelect");
  if (!secimAlani || !select) return;

  // Role seçilmediyse alanı gizle
  if (!seciliRol) {
    secimAlani.style.display = "none";
    return;
  }

  secimAlani.style.display = "block";
  select.innerHTML = '<option value="">Kullanıcı seçin...</option>';

  try {
    const options = [];

    // Öğrenci listesi
    if (seciliRol === "ogrenci" || seciliRol === "herikisi") {
      const chats = await getChatList(teacherID);
      chats.forEach(chat => {
        options.push({
          value: `ogrenci_${chat.studentId}`,
          text: `👩‍🎓 ${chat.studentName || "Öğrenci"}`,
          id: chat.studentId,
          name: chat.studentName || "Öğrenci",
          role: "ogrenci"
        });
      });
    }

    // Kurum listesi
    if (seciliRol === "kurum" || seciliRol === "herikisi") {
      const kurumChats = await getTeacherInstitutionChatList(teacherID);
      kurumChats.forEach(chat => {
        options.push({
          value: `kurum_${chat.institutionId}`,
          text: `🏢 ${chat.institutionName}`,
          id: chat.institutionId,
          name: chat.institutionName,
          role: "kurum"
        });
      });
    }

    // Select'e ekle
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      option.dataset.userId = opt.id;
      option.dataset.userName = opt.name;
      option.dataset.userRole = opt.role;
      select.appendChild(option);
    });

    // Event listener (önceki listener'ı kaldır)
    const yeniSelect = select.cloneNode(true);
    select.parentNode.replaceChild(yeniSelect, select);
    
    yeniSelect.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (selectedOption && selectedOption.value) {
        const userId = selectedOption.dataset.userId;
        const userName = selectedOption.dataset.userName;
        const userRole = selectedOption.dataset.userRole;
        mesajKullaniciSec(userId, userRole, userName);
      } else {
        mesajAlaniKapat();
      }
    });

  } catch (err) {
    console.error("❌ Mesaj kullanıcı listesi yüklenemedi:", err);
  }
}

function mesajKullaniciSec(kullaniciId, chatTipi, kullaniciAdi) {
  aktifKullaniciId = kullaniciId;
  aktifChatTipi = chatTipi;
  aktifKullaniciAdi = kullaniciAdi || "Kullanıcı";
  
  const gondermeAlani = document.getElementById("mesajGondermeAlani");
  const aliciBilgisi = document.getElementById("mesajAlıcıBilgisi");
  
  if (gondermeAlani) {
    gondermeAlani.style.display = "block";
  }
  
  if (aliciBilgisi) {
    const roleIcon = chatTipi === "ogrenci" ? "👩‍🎓" : "🏢";
    aliciBilgisi.textContent = `${roleIcon} ${aktifKullaniciAdi}`;
  }

  // Önceki dinlemeyi kapat
  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }

  // Yeni mesajları dinle
  mesajUnsubscribe = listenMessages(teacherID, kullaniciId, (messages) => {
    renderMesajlar(messages);
  });

  // Mesaj gönderme butonu
  const gonderBtn = document.getElementById("mesajGonderBtn");
  const mesajInput = document.getElementById("mesajInput");

  if (gonderBtn) {
    gonderBtn.onclick = () => mesajGonder();
  }

  if (mesajInput) {
    mesajInput.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        mesajGonder();
      }
    };
  }
}

function mesajAlaniKapat() {
  aktifKullaniciId = null;
  aktifChatTipi = null;
  aktifKullaniciAdi = null;
  const gondermeAlani = document.getElementById("mesajGondermeAlani");
  if (gondermeAlani) gondermeAlani.style.display = "none";

  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }
}

function renderMesajlar(messages) {
  const kutu = document.getElementById("mesajKutu");
  if (!kutu) return;

  kutu.innerHTML = "";

  if (!messages.length) {
    kutu.innerHTML = "<p style='text-align:center;color:#999;'>Henüz mesaj yok.</p>";
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement("div");
    const isOgretmen = msg.from === teacherID;
    div.className = `mesaj ${isOgretmen ? "ogretmen" : "ogrenci"}`;
    
    const tarih = msg.timestamp?.toDate ? 
      new Date(msg.timestamp.toDate()).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) :
      "Şimdi";
    
    div.innerHTML = `
      <div>${msg.text}</div>
      <small style="font-size:11px;opacity:0.7;">${tarih}</small>
    `;
    kutu.appendChild(div);
  });

  // En alta kaydır
  kutu.scrollTop = kutu.scrollHeight;
}

async function mesajGonder() {
  const input = document.getElementById("mesajInput");
  if (!input) return;
  
  // Kullanıcı seçili olmalı
  if (!aktifKullaniciId) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.disabled = true;

  let result;
  if (aktifChatTipi === "kurum") {
    // Kurum ile mesajlaşma
    result = await sendMessage(teacherID, aktifKullaniciId, text, teacherID);
  } else if (aktifChatTipi === "ogrenci") {
    // Öğrenci ile mesajlaşma
    result = await sendMessage(teacherID, aktifKullaniciId, text, teacherID);
  } else {
    input.disabled = false;
    return;
  }
  
  input.disabled = false;
  input.focus();

  if (result.success) {
    // Mesajı arşive kaydet
    await mesajArsiveKaydet(aktifKullaniciId, aktifKullaniciAdi, text, "gonderilen");
  } else {
    alert("Mesaj gönderilemedi: " + result.message);
  }
}

// ====================================================================
// 7.1) MESAJ ARŞİVİ
// ====================================================================
async function mesajArsiveKaydet(kullaniciId, kullaniciAdi, mesajText, tip) {
  try {
    if (!db) return;

    const arsivRef = doc(db, "profiles", teacherID);
    const arsivSnap = await getDoc(arsivRef);
    const arsivData = arsivSnap.exists() ? arsivSnap.data() : {};

    const mesajArsivi = arsivData.mesajArsivi || {};
    if (!mesajArsivi[kullaniciId]) {
      mesajArsivi[kullaniciId] = {
        kullaniciAdi: kullaniciAdi,
        gonderilen: [],
        silinen: []
      };
    }

    if (tip === "gonderilen") {
      mesajArsivi[kullaniciId].gonderilen.push({
        text: mesajText,
        timestamp: new Date().toISOString()
      });
    }

    await updateDoc(arsivRef, {
      mesajArsivi: mesajArsivi
    });
  } catch (err) {
    console.error("Mesaj arşiv kayıt hatası:", err);
  }
}

async function mesajArsivGoster(tip) {
  const arsivAlani = document.getElementById("mesajArsivAlani");
  if (!arsivAlani) return;

  arsivAlani.innerHTML = "<p>Yükleniyor...</p>";

  try {
    if (!db) {
      arsivAlani.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
      return;
    }

    // Gelen mesajlar için farklı bir yaklaşım
    if (tip === "gelen") {
      await mesajGelenGoster();
      return;
    }

    const arsivRef = doc(db, "profiles", teacherID);
    const arsivSnap = await getDoc(arsivRef);

    if (!arsivSnap.exists()) {
      arsivAlani.innerHTML = `<p style="text-align:center;color:#999;">Henüz ${tip === "gonderilen" ? "gönderilmiş" : "silinmiş"} mesaj yok.</p>`;
      return;
    }

    const arsivData = arsivSnap.data();
    const mesajArsivi = arsivData.mesajArsivi || {};

    if (Object.keys(mesajArsivi).length === 0) {
      arsivAlani.innerHTML = `<p style="text-align:center;color:#999;">Henüz ${tip === "gonderilen" ? "gönderilmiş" : "silinmiş"} mesaj yok.</p>`;
      return;
    }

    let html = "";
    for (const [kullaniciId, kullaniciArsivi] of Object.entries(mesajArsivi)) {
      const mesajlar = kullaniciArsivi[tip] || [];
      if (mesajlar.length === 0) continue;

      html += `<div style="margin-bottom:20px;padding:15px;background:white;border-radius:8px;border:1px solid #e0e0e0;">`;
      html += `<h5 style="color:#4a90e2;margin-bottom:10px;">${kullaniciArsivi.kullaniciAdi || "Kullanıcı"}</h5>`;

      mesajlar.forEach((mesaj, index) => {
        const tarih = new Date(mesaj.timestamp).toLocaleString("tr-TR");
        html += `<div style="padding:8px;margin-bottom:8px;background:#f9f9f9;border-radius:6px;border-left:3px solid #4a90e2;display:flex;justify-content:space-between;align-items:center;">`;
        html += `<div><div style="font-size:14px;margin-bottom:4px;">${String(mesaj.text).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}</div>`;
        html += `<small style="color:#999;font-size:11px;">${tarih}</small></div>`;
        if (tip === "gonderilen") {
          html += `<button onclick="mesajArsivdenSil('${kullaniciId}', ${index}, '${String(mesaj.text).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}')" style="padding:6px 12px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🗑️ Sil</button>`;
        }
        html += `</div>`;
      });

      html += `</div>`;
    }

    if (!html) {
      arsivAlani.innerHTML = `<p style="text-align:center;color:#999;">Henüz ${tip === "gonderilen" ? "gönderilmiş" : "silinmiş"} mesaj yok.</p>`;
    } else {
      arsivAlani.innerHTML = html;
    }
  } catch (err) {
    console.error("Mesaj arşiv yükleme hatası:", err);
    arsivAlani.innerHTML = "<p>Arşiv yüklenirken bir hata oluştu.</p>";
  }
}

// Gelen mesajları göster
async function mesajGelenGoster() {
  const arsivAlani = document.getElementById("mesajArsivAlani");
  if (!arsivAlani) return;

  try {
    const { getChatList, getTeacherInstitutionChatList } = await import("../data/messageService.js");
    
    // getChatId fonksiyonunu oluştur
    const getChatId = (user1Id, user2Id) => {
      const ids = [user1Id, user2Id].sort();
      return `${ids[0]}_${ids[1]}`;
    };
    
    // Öğretmenin tüm chat'lerini al
    const studentChats = await getChatList(teacherID);
    const institutionChats = await getTeacherInstitutionChatList(teacherID);
    
    const allChats = [
      ...studentChats.map(chat => ({ ...chat, type: "ogrenci" })),
      ...institutionChats.map(chat => ({ ...chat, type: "kurum" }))
    ];

    if (allChats.length === 0) {
      arsivAlani.innerHTML = `<p style="text-align:center;color:#999;">Henüz gelen mesaj yok.</p>`;
      return;
    }

    // Tüm chat'lerden gelen mesajları topla
    const gelenMesajlar = [];
    
    for (const chat of allChats) {
      try {
        const chatId = chat.chatId || getChatId(teacherID, chat.studentId || chat.institutionId);
        const messagesRef = collection(db, "messages", chatId, "messages");
        const q = query(
          messagesRef,
          where("to", "==", teacherID),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const mesajData = doc.data();
          gelenMesajlar.push({
            ...mesajData,
            chatId: chatId,
            kullaniciId: chat.studentId || chat.institutionId,
            kullaniciAdi: chat.studentName || chat.institutionName || "Kullanıcı",
            chatType: chat.type,
            mesajId: doc.id
          });
        });
      } catch (err) {
        console.warn("Gelen mesaj yükleme hatası:", chat, err);
      }
    }

    // Tarihe göre sırala (en yeni en üstte)
    gelenMesajlar.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return bTime - aTime;
    });

    if (gelenMesajlar.length === 0) {
      arsivAlani.innerHTML = `<p style="text-align:center;color:#999;">Henüz gelen mesaj yok.</p>`;
      return;
    }

    // Kullanıcı bazında grupla
    const kullaniciBazinda = {};
    gelenMesajlar.forEach(mesaj => {
      const key = mesaj.kullaniciId;
      if (!kullaniciBazinda[key]) {
        kullaniciBazinda[key] = {
          kullaniciAdi: mesaj.kullaniciAdi,
          mesajlar: []
        };
      }
      kullaniciBazinda[key].mesajlar.push(mesaj);
    });

    let html = "";
    for (const [kullaniciId, kullaniciData] of Object.entries(kullaniciBazinda)) {
      html += `<div style="margin-bottom:20px;padding:15px;background:white;border-radius:8px;border:1px solid #e0e0e0;">`;
      html += `<h5 style="color:#4a90e2;margin-bottom:10px;">${kullaniciData.kullaniciAdi || "Kullanıcı"}</h5>`;

      kullaniciData.mesajlar.forEach((mesaj) => {
        const tarih = mesaj.timestamp?.toDate 
          ? new Date(mesaj.timestamp.toDate()).toLocaleString("tr-TR")
          : new Date().toLocaleString("tr-TR");
        html += `<div style="padding:8px;margin-bottom:8px;background:#f9f9f9;border-radius:6px;border-left:3px solid #3498db;">`;
        html += `<div style="font-size:14px;margin-bottom:4px;">${String(mesaj.text || "").replace(/'/g, "&#39;").replace(/"/g, "&quot;")}</div>`;
        html += `<small style="color:#999;font-size:11px;">${tarih}</small>`;
        html += `</div>`;
      });

      html += `</div>`;
    }

    arsivAlani.innerHTML = html;
  } catch (err) {
    console.error("Gelen mesaj yükleme hatası:", err);
    arsivAlani.innerHTML = "<p>Gelen mesajlar yüklenirken bir hata oluştu.</p>";
  }
}

window.mesajArsivdenSil = async function(kullaniciId, mesajIndex, mesajText) {
  if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
    return;
  }

  try {
    if (!db) return;

    const arsivRef = doc(db, "profiles", teacherID);
    const arsivSnap = await getDoc(arsivRef);
    const arsivData = arsivSnap.exists() ? arsivSnap.data() : {};

    const mesajArsivi = arsivData.mesajArsivi || {};
    const kullaniciArsivi = mesajArsivi[kullaniciId];

    if (!kullaniciArsivi || !kullaniciArsivi.gonderilen || kullaniciArsivi.gonderilen.length <= mesajIndex) {
      alert("❌ Mesaj bulunamadı veya zaten silinmiş.");
      return;
    }

    const silinecekMesaj = kullaniciArsivi.gonderilen.splice(mesajIndex, 1)[0];
    silinecekMesaj.silinmeTarihi = new Date().toISOString();

    if (!kullaniciArsivi.silinen) {
      kullaniciArsivi.silinen = [];
    }
    kullaniciArsivi.silinen.push(silinecekMesaj);

    mesajArsivi[kullaniciId] = kullaniciArsivi;

    await updateDoc(arsivRef, {
      mesajArsivi: mesajArsivi
    });

    alert("✅ Mesaj başarıyla silinenlere taşındı.");
    mesajArsivGoster("gonderilen");
  } catch (err) {
    console.error("Mesaj silme hatası:", err);
    alert("❌ Bir hata oluştu. Mesaj silinemedi.");
  }
};

// ====================================================================
// 7.5) ÖĞRENCİYE TALEP GÖNDER
// ====================================================================
// Ortak davet gönderme fonksiyonu (rol bazlı)
async function davetGonder() {
  const input = document.getElementById("davetUsernameInput");
  const mesajDiv = document.getElementById("davetMesaji");
  
  if (!input || !mesajDiv) {
    console.warn("Davet formu elementleri bulunamadı.");
    return;
  }
  
  const username = input.value.trim();
  if (!username) {
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kullanıcı adı girin.</span>";
    return;
  }

  mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
  
  try {
    const targetUid = await findUserByUsername(username);
    if (!targetUid) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı bulunamadı. Kullanıcı adını kontrol edin.</span>";
      return;
    }
    
    // Hedef kullanıcının bilgilerini al
    const targetRef = doc(db, "profiles", targetUid);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kullanıcı profili bulunamadı.</span>";
      return;
    }
    
    const targetData = targetSnap.data();
    const role = localStorage.getItem("role");
    let result = null;
    
    // Rol bazlı davet gönderme
    if (role === ROLES.OGRETMEN) {
      // Öğretmen → Öğrenci veya Kurum daveti
      if (!teacherID) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası. Lütfen tekrar giriş yapın.</span>";
        return;
      }
      
      if (targetData.role === ROLES.OGRENCI) {
        result = await createTeacherStudentRequest(teacherID, targetUid);
      } else if (targetData.role === ROLES.INSTITUTION) {
        result = await createTeacherInstitutionRequest(teacherID, targetUid);
      } else {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğrenci veya kuruma davet gönderebilirsiniz.</span>";
        return;
      }
    } else {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Geçersiz rol.</span>";
      return;
    }
    
    if (result.success) {
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Davet başarıyla gönderildi!</span>";
      input.value = "";
      await yukleBekleyenTalepler();
      
      // 3 saniye sonra mesajı temizle
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } else {
      mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ ${result.message || "Davet gönderilemedi."}</span>`;
    }
  } catch (err) {
    console.error("Davet gönderme hatası:", err);
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu. Lütfen tekrar deneyin.</span>";
  }
}

// Eski fonksiyon adını koru (geriye uyumluluk için)
function ogrenciTalepGonderButonu() {
  const btn = document.getElementById("davetGonderBtn");
  const input = document.getElementById("davetUsernameInput");
  
  if (btn) {
    btn.onclick = davetGonder;
  }
  
  if (input) {
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        davetGonder();
      }
    };
  }
}

// ====================================================================
// 7.5) KURUM DAVETİ GÖNDER
// ====================================================================
async function kurumDavetGonder() {
  const input = document.getElementById("kurumDavetUsernameInput");
  const mesajDiv = document.getElementById("kurumDavetMesaji");
  
  if (!input || !mesajDiv) {
    console.warn("Kurum davet formu elementleri bulunamadı.");
    return;
  }
  
  const username = input.value.trim();
  if (!username) {
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen kurum kullanıcı adı girin.</span>";
    return;
  }

  mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
  
  try {
    const targetUid = await findUserByUsername(username);
    if (!targetUid) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kurum bulunamadı. Kullanıcı adını kontrol edin.</span>";
      return;
    }
    
    // Hedef kullanıcının bilgilerini al
    const targetRef = doc(db, "profiles", targetUid);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Kurum profili bulunamadı.</span>";
      return;
    }
    
    const targetData = targetSnap.data();
    if (targetData.role !== ROLES.INSTITUTION) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı kurum değil.</span>";
      return;
    }
    
    if (!teacherID) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası. Lütfen tekrar giriş yapın.</span>";
      return;
    }
    
    const result = await createTeacherInstitutionRequest(teacherID, targetUid);
    
    if (result.success) {
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Başvuru başarıyla gönderildi!</span>";
      input.value = "";
      await yukleKurumTalepleri();
      
      // 3 saniye sonra mesajı temizle
      setTimeout(() => {
        mesajDiv.innerHTML = "";
      }, 3000);
    } else {
      mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ ${result.message || "Başvuru gönderilemedi."}</span>`;
    }
  } catch (err) {
    console.error("Kurum davet gönderme hatası:", err);
    mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu. Lütfen tekrar deneyin.</span>";
  }
}

// ====================================================================
// 7.6) KURUM TALEPLERİNİ YÜKLE
// ====================================================================
async function yukleKurumTalepleri() {
  const alinanListe = document.getElementById("ogretmenKurumAlinanTalepler");
  const gonderilenListe = document.getElementById("ogretmenKurumGonderilenTalepler");

  if (!alinanListe && !gonderilenListe) return;

  if (!uid) {
    if (alinanListe) alinanListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    if (gonderilenListe) gonderilenListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    return;
  }

  try {
    const allRequests = await listAllRequestsByUser(uid);
    
    // Alınan kurum davetleri (institution_teacher tipinde, toId = uid)
    if (alinanListe) {
      alinanListe.innerHTML = "";
      const alinanKurumTalepleri = allRequests.received.filter(
        req => req.type === "institution_teacher"
      );

      if (alinanKurumTalepleri.length === 0) {
        alinanListe.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Alınan kurum daveti bulunmuyor.</li>";
      } else {
        for (const req of alinanKurumTalepleri) {
          const kurumRef = doc(db, "profiles", req.fromId);
          const kurumSnap = await getDoc(kurumRef);
          const kurumAdi = kurumSnap.exists() ? (kurumSnap.data().username || "Kurum") : "Bilinmeyen Kurum";

          const item = document.createElement("li");
          item.innerHTML = `
            <div class="talep-info">
              <strong>${kurumAdi}</strong> size kurum daveti gönderdi.
              <br><small style="color:#666;">Durum: ${req.status}</small>
            </div>
            <div class="talep-btn-grup">
              ${req.status === "beklemede" ? `
                <button data-status="kabul" style="background:#27ae60;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;">Kabul</button>
                <button data-status="red" style="background:#c0392b;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;">Red</button>
              ` : `<span style="color:#666;">${req.status === "kabul" ? "✅ Kabul edildi" : "❌ Reddedildi"}</span>`}
            </div>
          `;

          item.querySelectorAll("button").forEach(btn => {
            btn.onclick = async () => {
              const status = btn.dataset.status;
              await respondRequest(req.id, status, uid);
              await yukleKurumTalepleri();
              await yukleKurumBilgisi();
            };
          });

          alinanListe.appendChild(item);
        }
      }
    }

    // Gönderilen kurum başvuruları (teacher_institution tipinde, fromId = uid)
    if (gonderilenListe) {
      gonderilenListe.innerHTML = "";
      const gonderilenKurumTalepleri = allRequests.sent.filter(
        req => req.type === "teacher_institution"
      );

      if (gonderilenKurumTalepleri.length === 0) {
        gonderilenListe.innerHTML = "<li style='padding:15px;text-align:center;color:#999;'>Gönderilen kurum başvurusu bulunmuyor.</li>";
      } else {
        for (const req of gonderilenKurumTalepleri) {
          const kurumRef = doc(db, "profiles", req.toId);
          const kurumSnap = await getDoc(kurumRef);
          const kurumAdi = kurumSnap.exists() ? (kurumSnap.data().username || "Kurum") : "Bilinmeyen Kurum";

          const item = document.createElement("li");
          item.innerHTML = `
            <div class="talep-info">
              <strong>${kurumAdi}</strong> kurumuna başvuru gönderdiniz.
              <br><small style="color:#666;">Durum: ${req.status}</small>
            </div>
            <div class="talep-btn-grup">
              <span style="color:#666;">${req.status === "beklemede" ? "⏳ Beklemede" : req.status === "kabul" ? "✅ Kabul edildi" : "❌ Reddedildi"}</span>
            </div>
          `;

          gonderilenListe.appendChild(item);
        }
      }
    }
  } catch (err) {
    console.error("❌ Kurum talepleri yüklenemedi:", err);
    if (alinanListe) alinanListe.innerHTML = "<li>Hata: " + err.message + "</li>";
    if (gonderilenListe) gonderilenListe.innerHTML = "<li>Hata: " + err.message + "</li>";
  }
}

// ====================================================================
// 7.7) ÖĞRENCİ BUL (Username ile)
// ====================================================================
async function findUserByUsername(username) {
  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    return null;
  }

  if (!username) return null;

  try {
    const q = query(
      collection(db, "profiles"),
      where("username", "==", username)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    return snap.docs[0].id;
  } catch (err) {
    console.error("findUserByUsername hatası:", err);
    return null;
  }
}

// ====================================================================
// 8) ÇIKIŞ YAP
// ====================================================================
window.cikisYap = function () {
  if (mesajUnsubscribe) mesajUnsubscribe();
  localStorage.clear();
  console.log("🔒 Oturum kapatıldı.");
  window.location.href = "login.html";
};

// ====================================================================
// 9) PROFİL BİLGİSİ YÜKLEME
// ====================================================================
async function yukleOgretmenProfilBilgisi() {
  const profilDiv = document.getElementById("profilBilgisi");
  if (!profilDiv) return;

  try {
    if (!db || !teacherID) return;

    const userRef = doc(db, "profiles", teacherID);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const username = userData.username || userData.email || "Öğretmen";
    
    // Profil adını göster
    const profilAdi = document.getElementById("profilAdi");
    if (profilAdi) {
      profilAdi.textContent = `👩‍🏫 ${username}`;
    }

    // Profil bölümünü göster
    profilDiv.style.display = "block";

    // Kurum bilgisi yükle
    await yukleOgretmenKurumBilgisi(teacherID, userData);

    // Bağlı profilleri yükle (öğrenciler)
    await yukleOgretmenBagliProfiller(teacherID, userData);

    // Talep gönder butonunu bağla
    const talepBtn = document.getElementById("profilTalepGonderBtn");
    if (talepBtn) {
      talepBtn.onclick = () => {
        // Talepler sekmesine yönlendir
        const taleplerBtn = document.querySelector('[data-sekme="talepler"]');
        if (taleplerBtn) {
          taleplerBtn.click();
        }
      };
    }
  } catch (err) {
    console.error("Profil bilgisi yüklenemedi:", err);
  }
}

async function yukleOgretmenKurumBilgisi(uid, userData) {
  const kurumDiv = document.getElementById("profilKurumBilgisi");
  const kurumAdiP = document.getElementById("profilKurumAdi");
  
  if (!kurumDiv || !kurumAdiP) return;

  const kurumBilgisi = userData.institution;
  
  if (kurumBilgisi && kurumBilgisi.status === "kabul" && kurumBilgisi.id) {
    try {
      const kurumRef = doc(db, "profiles", kurumBilgisi.id);
      const kurumSnap = await getDoc(kurumRef);
      
      if (kurumSnap.exists()) {
        const kurumData = kurumSnap.data();
        const kurumAdi = kurumData.username || kurumData.name || "Kurum";
        
        kurumAdiP.textContent = kurumAdi;
        kurumDiv.style.display = "block";
      }
    } catch (err) {
      console.error("Kurum bilgisi yüklenemedi:", err);
    }
  } else {
    kurumDiv.style.display = "none";
  }
}

async function yukleOgretmenBagliProfiller(uid, userData) {
  const bagliDiv = document.getElementById("bagliProfiller");
  if (!bagliDiv) return;

  bagliDiv.innerHTML = "";

  // Öğretmen için öğrencileri listele
  const students = userData.students || {};
  const onayliOgrenciler = Object.entries(students).filter(([_, status]) => status === "kabul");

  if (onayliOgrenciler.length > 0) {
    const h3 = document.createElement("h3");
    h3.style.cssText = "color:#1e3d59;margin-bottom:15px;font-size:18px;";
    h3.textContent = "👥 Öğrencilerim";
    bagliDiv.appendChild(h3);

    const liste = document.createElement("ul");
    liste.style.cssText = "list-style:none;padding:0;margin:0;";

    for (const [studentId] of onayliOgrenciler) {
      try {
        const studentRef = doc(db, "profiles", studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) continue;

        const studentData = studentSnap.data();
        const studentName = studentData.username || studentData.fullName || "Öğrenci";

        const li = document.createElement("li");
        li.style.cssText = "background:#f4f6fb;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;";
        li.innerHTML = `
          <span style="font-weight:600;">${studentName}</span>
          <button onclick="ogrenciyiSil('${studentId}')" style="padding:6px 12px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🗑️ Sil</button>
        `;
        liste.appendChild(li);
      } catch (err) {
        console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
      }
    }

    bagliDiv.appendChild(liste);
  }
}

// Öğrenciyi sil
window.ogrenciyiSil = async function(studentId) {
  if (!confirm("Bu öğrenciyi listeden kaldırmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    const result = await unlinkTeacherStudent(teacherID, studentId);
    
    if (result.success) {
      alert("✅ Öğrenci listeden kaldırıldı.");
      // Profil bilgisini ve öğrenci listesini yenile
      const userRef = doc(db, "profiles", teacherID);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await yukleOgretmenBagliProfiller(teacherID, userSnap.data());
        await listeOgrenciler();
      }
    } else {
      alert(`❌ Hata: ${result.message || "Öğrenci kaldırılamadı."}`);
    }
  } catch (err) {
    console.error("Öğrenci silme hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// Kurumdan ayrıl
window.kurumdanAyril = async function() {
  if (!confirm("Kurumdan ayrılmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    const userRef = doc(db, "profiles", teacherID);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const kurumBilgisi = userData.institution;
    
    if (!kurumBilgisi || !kurumBilgisi.id) {
      alert("❌ Kurum bilgisi bulunamadı.");
      return;
    }

    const result = await unlinkInstitutionTeacher(kurumBilgisi.id, teacherID);
    
    if (result.success) {
      alert("✅ Kurum bağlantısı başarıyla silindi.");
      // Kurum bilgisini yenile
      await yukleKurumBilgisi();
    } else {
      alert(`❌ Hata: ${result.message || "Kurum bağlantısı silinemedi."}`);
    }
  } catch (err) {
    console.error("Kurumdan ayrılma hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// ====================================================================
console.log("📘 teacher_panel.js yüklendi (Final v7.1 • Ultra Stabil)");
// ====================================================================
// ====================================================================