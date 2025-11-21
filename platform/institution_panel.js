import { db } from "../data/firebaseConfig.js";
import { sayfaRolKontrol } from "./router.js";
import { ROLES } from "./globalConfig.js";
import {
  listAllRequestsByUser,
  listRequestsByUser,
  listSentRequestsByUser,
  respondRequest,
  createInstitutionTeacherRequest,
  createInstitutionStudentRequest,
  unlinkInstitutionTeacher,
  unlinkInstitutionStudent
} from "../data/requestService.js";
import {
  sendMessage,
  listenMessages,
  getInstitutionStudentChatList,
  getInstitutionTeacherChatList
} from "../data/messageService.js";
import { getStudentComments } from "../data/commentService.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const roleOk = sayfaRolKontrol(ROLES.INSTITUTION);
if (!roleOk) throw new Error("Yetkisiz erişim");

const uid = localStorage.getItem("uid");

// Global acSekme fonksiyonunu erken tanımla (placeholder)
window.acSekme = function(sekmeAdi) {
  console.log("🔵 window.acSekme çağrıldı (erken):", sekmeAdi);
  // initSekmeYonetimi henüz çalışmadıysa bekle
  if (typeof window._realAcSekme === 'function') {
    window._realAcSekme(sekmeAdi);
  } else {
    // Henüz yüklenmedi, kuyruğa ekle
    if (!window._sekmeKuyrugu) {
      window._sekmeKuyrugu = [];
    }
    window._sekmeKuyrugu.push(sekmeAdi);
    console.log("🔵 Sekme kuyruğa eklendi:", sekmeAdi);
  }
};

async function yukleKurumBilgisi() {
  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    return;
  }

  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const kurumAdi = data?.institutionProfile?.name || data.username || "Kurum";
  const alan = document.getElementById("kurumAdi");
  if (alan) alan.textContent = `🏢 Kurum: ${kurumAdi}`;
}

async function yukleTalepler() {
  const alinanListe = document.getElementById("kurumAlinanTalepler");
  const gonderilenListe = document.getElementById("kurumGonderilenTalepler");
  const eskiListe = document.getElementById("kurumTalepListesi"); // Geriye uyumluluk

  if (!alinanListe && !gonderilenListe && !eskiListe) return;

  if (!uid) {
    if (eskiListe) eskiListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    if (alinanListe) alinanListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    if (gonderilenListe) gonderilenListe.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    return;
  }

  const { received, sent } = await listAllRequestsByUser(uid);

  // ALINAN TALEPLER (Kuruma gelen talepler - teacher_institution, student_institution tiplerinde)
  // NOT: institution_teacher kurumun öğretmene gönderdiği davettir, burada gösterilmez
  const kurumaGelenTalepler = received.filter(req => {
    // Öğretmen başvuruları (teacher_institution tipinde, toId == uid)
    // Öğrenci başvuruları (student_institution tipinde, toId == uid)
    return req.status === "beklemede" && 
           ((req.type === "teacher_institution" && req.toId === uid) ||
            (req.type === "student_institution" && req.toId === uid));
  });

  if (alinanListe) {
    if (!kurumaGelenTalepler.length) {
      alinanListe.innerHTML = "<li>Kuruma gelen talep bulunmuyor.</li>";
    } else {
      alinanListe.innerHTML = "";
      for (const req of kurumaGelenTalepler) {
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

        const li = document.createElement("li");
        li.innerHTML = `
          <div class="talep-info">
            <strong>${senderName}</strong> → Kuruma katılma isteği
          </div>
          <div class="talep-btn-grup">
            <button data-id="${req.id}" data-status="kabul">Kabul</button>
            <button data-id="${req.id}" data-status="red">Red</button>
          </div>
        `;

        li.querySelectorAll("button").forEach(btn => {
          btn.onclick = async () => {
            const status = btn.dataset.status;
            await respondRequest(req.id, status, uid);
            await yukleTalepler();
            await yukleOgretmenler(); // Öğretmen listesini güncelle
            // Eğer kabul edildiyse öğrenci listesini de yenile
            if (status === "kabul") {
              await yukleOgrenciler();
            }
          };
        });

        alinanListe.appendChild(li);
      }
    }
  }

  // GÖNDERİLEN TALEPLER (Kurumun öğretmen ve öğrencilere gönderdiği bekleyen davetler)
  const kurumunGonderdigiDavetler = sent.filter(
    req => (req.type === "institution_teacher" || req.type === "institution_student") && req.status === "beklemede"
  );

  if (gonderilenListe) {
    if (!kurumunGonderdigiDavetler.length) {
      gonderilenListe.innerHTML = "<li>Gönderilen davet bulunmuyor.</li>";
    } else {
      gonderilenListe.innerHTML = "";
      for (const req of kurumunGonderdigiDavetler) {
        let userName = req.toId;
        let userRole = "";
        try {
          const userRef = doc(db, "profiles", req.toId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userName = userData.username || userData.fullName || userData.ad || req.toId;
            userRole = userData.role || "";
          }
        } catch (err) {
          console.warn("Kullanıcı bilgisi alınamadı:", err);
        }

        const roleText = userRole === ROLES.OGRETMEN ? "öğretmenine" : userRole === ROLES.OGRENCI ? "öğrencisine" : "kullanıcısına";
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="talep-info">
            <strong>${userName}</strong> ${roleText} gönderildi — ⏳ Beklemede
          </div>
        `;
        gonderilenListe.appendChild(li);
      }
    }
    
    const infoLi = document.createElement("li");
    infoLi.style.color = "#999";
    infoLi.style.padding = "10px 15px";
    infoLi.textContent = "✅ Onaylanan davetler 'Kabul Edilen Öğretmenler' veya 'Kabul Edilen Öğrenciler' bölümüne taşınır.";
    gonderilenListe.appendChild(infoLi);
  }

  // Geriye uyumluluk için eski liste
  if (eskiListe && !alinanListe) {
    if (!kurumaGelenTalepler.length) {
      eskiListe.innerHTML = "<li>Kuruma gelen talep bulunmuyor.</li>";
    } else {
      eskiListe.innerHTML = "";
      for (const req of kurumaGelenTalepler) {
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

        const li = document.createElement("li");
        li.innerHTML = `
          <div class="talep-info">
            <strong>${senderName}</strong> → Kuruma katılma isteği
          </div>
          <div class="talep-btn-grup">
            <button data-id="${req.id}" data-status="kabul">Kabul</button>
            <button data-id="${req.id}" data-status="red">Red</button>
          </div>
        `;

        li.querySelectorAll("button").forEach(btn => {
          btn.onclick = async () => {
            const status = btn.dataset.status;
            await respondRequest(req.id, status, uid);
            await yukleTalepler();
            await yukleOgretmenler();
            // Eğer kabul edildiyse öğrenci listesini de yenile
            if (status === "kabul") {
              await yukleOgrenciler();
            }
          };
        });

        eskiListe.appendChild(li);
      }
    }
  }
}

// Öğretmen listesi yükleniyor mu kontrolü
let yukleOgretmenlerYukleniyor = false;

async function yukleOgretmenler() {
  // Eğer zaten yükleniyorsa, yeni çağrıyı bekle
  if (yukleOgretmenlerYukleniyor) {
    console.log("⏳ yukleOgretmenler() zaten çalışıyor, bekleniyor...");
    return;
  }
  
  yukleOgretmenlerYukleniyor = true;
  console.log("🔵 yukleOgretmenler() başlatıldı");
  
  const liste = document.getElementById("kurumOgretmenListesi");
  if (!liste) {
    yukleOgretmenlerYukleniyor = false;
    return;
  }

  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    liste.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
    yukleOgretmenlerYukleniyor = false;
    return;
  }

  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    liste.innerHTML = "<li>Kurum profili bulunamadı.</li>";
    yukleOgretmenlerYukleniyor = false;
    return;
  }
  const teachers = snap.data().teachers || {};
  const aktif = Object.entries(teachers).filter(([, status]) => status === "kabul");

  if (!aktif.length) {
    liste.innerHTML = "<li>Kayıtlı öğretmen bulunmuyor.</li>";
    yukleOgretmenlerYukleniyor = false;
    return;
  }

  // Duplicate öğretmen ID'lerini önlemek için Set kullan
  const gorulenOgretmenler = new Set();
  
  liste.innerHTML = "";
  for (const [teacherId] of aktif) {
    // Eğer bu öğretmen daha önce işlendiyse atla
    if (gorulenOgretmenler.has(teacherId)) {
      console.warn("⚠️ Duplicate öğretmen ID tespit edildi ve atlandı:", teacherId);
      continue;
    }
    gorulenOgretmenler.add(teacherId);
    try {
      const teacherRef = doc(db, "profiles", teacherId);
      const teacherSnap = await getDoc(teacherRef);
      if (!teacherSnap.exists()) continue;
      
      const teacherData = teacherSnap.data();
      const teacherName = teacherData.username || teacherData.fullName || teacherData.ad || teacherId;
      
      // Öğretmen istatistiklerini hesapla
      const stats = await hesaplaOgretmenIstatistikleri(teacherId);
      
      const li = document.createElement("li");
      
      // Öğretmen adını güvenli hale getir (HTML escape)
      const safeTeacherName = String(teacherName).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      
      li.innerHTML = `
        <div class="talep-info" style="flex:1;">
          <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${safeTeacherName}</div>
          <div style="font-size:13px;color:#666;display:flex;gap:15px;flex-wrap:wrap;">
            <span>👥 Takip Edilen Öğrenci: <strong>${stats.takipEdilenOgrenci}</strong></span>
            <span>💬 Yorum Yazılan Öğrenci: <strong>${stats.yorumYazilanOgrenci}</strong></span>
            <span>📝 Toplam Yorum: <strong>${stats.toplamYorum}</strong></span>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <button 
            class="ogretmen-sil-btn"
            data-ogretmen-id="${teacherId}"
            data-ogretmen-ad="${safeTeacherName}"
            style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:0.2s;"
            onmouseover="this.style.background='#c0392b'"
            onmouseout="this.style.background='#e74c3c'"
          >
            🗑️ Sil
          </button>
        </div>
      `;
      
      // Event listener ekle
      const silBtn = li.querySelector('.ogretmen-sil-btn');
      if (silBtn) {
        silBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = silBtn.dataset.ogretmenId;
          const ad = silBtn.dataset.ogretmenAd;
          if (window.ogretmenSil) {
            window.ogretmenSil(id, ad);
          } else {
            console.error("ogretmenSil fonksiyonu bulunamadı");
          }
        });
      }
      
      liste.appendChild(li);
    } catch (err) {
      console.warn("Öğretmen bilgisi alınamadı:", teacherId, err);
    }
  }
  
  yukleOgretmenlerYukleniyor = false;
  console.log("✅ yukleOgretmenler() tamamlandı, toplam öğretmen:", gorulenOgretmenler.size);
}

// Öğretmen istatistiklerini hesapla
async function hesaplaOgretmenIstatistikleri(teacherId) {
  try {
    if (!db) return { takipEdilenOgrenci: 0, yorumYazilanOgrenci: 0, toplamYorum: 0 };

    // Öğretmenin takip ettiği öğrenci sayısı
    const teacherRef = doc(db, "profiles", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) {
      return { takipEdilenOgrenci: 0, yorumYazilanOgrenci: 0, toplamYorum: 0 };
    }

    const teacherData = teacherSnap.data();
    const students = teacherData.students || {};
    const takipEdilenOgrenci = Object.values(students).filter(status => status === "kabul").length;

    // Öğretmenin yorumlarını say
    let yorumYazilanOgrenciSet = new Set();
    let toplamYorum = 0;

    // Tüm öğrencilerin yorumlarını kontrol et
    const studentIds = Object.keys(students).filter(id => students[id] === "kabul");
    
    for (const studentId of studentIds) {
      try {
        const comments = await getStudentComments(studentId);
        const teacherComments = comments.filter(c => c.teacherId === teacherId);
        
        if (teacherComments.length > 0) {
          yorumYazilanOgrenciSet.add(studentId);
          toplamYorum += teacherComments.length;
        }
      } catch (err) {
        console.warn("Öğrenci yorumları alınamadı:", studentId, err);
      }
    }

    return {
      takipEdilenOgrenci,
      yorumYazilanOgrenci: yorumYazilanOgrenciSet.size,
      toplamYorum
    };
  } catch (err) {
    console.error("Öğretmen istatistikleri hesaplanamadı:", err);
    return { takipEdilenOgrenci: 0, yorumYazilanOgrenci: 0, toplamYorum: 0 };
  }
}

// Öğretmen silme fonksiyonu
window.ogretmenSil = async function(teacherId, teacherName) {
  if (!confirm(`${teacherName} öğretmenini kurumunuzdan silmek istediğinize emin misiniz?`)) {
    return;
  }

  try {
    const result = await unlinkInstitutionTeacher(uid, teacherId);
    if (result.success) {
      alert(`✅ ${teacherName} öğretmeni başarıyla silindi.`);
      await yukleOgretmenler();
    } else {
      alert(`❌ Hata: ${result.message || "Öğretmen silinemedi."}`);
    }
  } catch (err) {
    console.error("Öğretmen silme hatası:", err);
    alert(`❌ Hata: ${err.message || "Öğretmen silinemedi."}`);
  }
};

// Kurumun tüm öğrencilerini listele (direkt bağlı öğrenciler + öğretmenler üzerinden)
async function yukleOgrenciler() {
  const liste = document.getElementById("kurumOgrenciListesi");
  if (!liste) return;

  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    liste.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
    return;
  }

  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    liste.innerHTML = "<li>Kurum profili bulunamadı.</li>";
    return;
  }
  
  const instData = snap.data();
  const teachers = instData.teachers || {};
  const students = instData.students || {}; // Kurumun direkt öğrencileri
  const aktifOgretmenler = Object.entries(teachers).filter(([, status]) => status === "kabul");
  const direktOgrenciler = Object.entries(students).filter(([, status]) => status === "kabul");

  // Tüm öğrencileri topla (direkt + öğretmenler üzerinden)
  const tumOgrenciler = new Map(); // Map kullanarak tekrar eden öğrencileri önle
  
  // 1. Önce direkt kuruma bağlı öğrencileri ekle
  for (const [studentId] of direktOgrenciler) {
    if (!tumOgrenciler.has(studentId)) {
      try {
        const studentRef = doc(db, "profiles", studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const studentName = studentData.username || studentData.fullName || studentData.ad || studentId;
          tumOgrenciler.set(studentId, studentName);
        }
      } catch (err) {
        console.warn("Direkt öğrenci bilgisi alınamadı:", studentId, err);
      }
    }
  }
  
  // 2. Sonra öğretmenler üzerinden öğrencileri ekle
  for (const [teacherId] of aktifOgretmenler) {
    try {
      const teacherRef = doc(db, "profiles", teacherId);
      const teacherSnap = await getDoc(teacherRef);
      if (!teacherSnap.exists()) continue;
      
      const teacherData = teacherSnap.data();
      const teacherStudents = teacherData.students || {};
      const aktifOgrenciler = Object.entries(teacherStudents).filter(([, status]) => status === "kabul");
      
      for (const [studentId] of aktifOgrenciler) {
        if (!tumOgrenciler.has(studentId)) {
          try {
            const studentRef = doc(db, "profiles", studentId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              const studentName = studentData.username || studentData.fullName || studentData.ad || studentId;
              tumOgrenciler.set(studentId, studentName);
            }
          } catch (err) {
            console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
          }
        }
      }
    } catch (err) {
      console.warn("Öğretmen öğrencileri alınamadı:", teacherId, err);
    }
  }

  if (tumOgrenciler.size === 0) {
    liste.innerHTML = "<li>Henüz kayıtlı öğrenci bulunmuyor.</li>";
    return;
  }

  liste.innerHTML = "";
  tumOgrenciler.forEach((studentName, studentId) => {
    const li = document.createElement("li");
    li.className = "ogr-kart";
    li.style.cursor = "pointer";
    
    // Öğrenci adını güvenli hale getir (HTML escape)
    const safeStudentName = String(studentName).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    
    li.innerHTML = `
      <div class="talep-info" style="flex:1;">
        <strong>${safeStudentName}</strong>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button 
          class="ogrenci-analiz-btn"
          data-ogrenci-id="${studentId}"
          data-ogrenci-ad="${safeStudentName}"
          style="padding:8px 16px;background:#4a90e2;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:0.2s;"
          onmouseover="this.style.background='#3578c6'"
          onmouseout="this.style.background='#4a90e2'"
        >
          📊 Analiz
        </button>
        <button 
          class="ogrenci-sil-btn"
          data-ogrenci-id="${studentId}"
          data-ogrenci-ad="${safeStudentName}"
          style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:0.2s;"
          onmouseover="this.style.background='#c0392b'"
          onmouseout="this.style.background='#e74c3c'"
        >
          🗑️ Sil
        </button>
      </div>
    `;
    
    // Event listener'ları ekle
    const analizBtn = li.querySelector('.ogrenci-analiz-btn');
    const silBtn = li.querySelector('.ogrenci-sil-btn');
    
    if (analizBtn) {
      analizBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = analizBtn.dataset.ogrenciId;
        const ad = analizBtn.dataset.ogrenciAd;
        console.log("📌 Analiz butonu tıklandı:", id, ad);
        if (window.ogrenciSec) {
          window.ogrenciSec(id, ad);
        } else {
          console.error("❌ ogrenciSec fonksiyonu bulunamadı, manuel yönlendirme yapılıyor");
          localStorage.setItem("aktifOgrenciId", id);
          localStorage.setItem("aktifOgrenci", ad || "Bilinmiyor");
          window.location.href = "analiz.html";
        }
      });
    }
    
    if (silBtn) {
      silBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = silBtn.dataset.ogrenciId;
        const ad = silBtn.dataset.ogrenciAd;
        if (window.ogrenciSil) {
          window.ogrenciSil(id, ad);
        } else {
          console.error("ogrenciSil fonksiyonu bulunamadı");
        }
      });
    }
    
    liste.appendChild(li);
  });
}

// Öğrenci silme fonksiyonu
window.ogrenciSil = async function(studentId, studentName) {
  if (!confirm(`${studentName} öğrencisini kurumunuzdan silmek istediğinize emin misiniz?`)) {
    return;
  }

  try {
    const result = await unlinkInstitutionStudent(uid, studentId);
    if (result.success) {
      alert(`✅ ${studentName} öğrencisi başarıyla silindi.`);
      await yukleOgrenciler();
    } else {
      alert(`❌ Hata: ${result.message || "Öğrenci silinemedi."}`);
    }
  } catch (err) {
    console.error("Öğrenci silme hatası:", err);
    alert(`❌ Hata: ${err.message || "Öğrenci silinemedi."}`);
  }
};

// Öğrenci seç ve analiz sayfasına yönlendir
window.ogrenciSec = function(studentId, studentName) {
  try {
    console.log("📌 ogrenciSec çağrıldı:", studentId, studentName);
    if (!studentId) {
      console.error("❌ Öğrenci ID bulunamadı");
      return;
    }
    localStorage.setItem("aktifOgrenciId", studentId);
    localStorage.setItem("aktifOgrenci", studentName || "Bilinmiyor");
    console.log("✅ LocalStorage güncellendi, yönlendiriliyor...");
    window.location.href = "analiz.html";
  } catch (err) {
    console.error("❌ ogrenciSec hatası:", err);
    alert("Öğrenci seçilirken bir hata oluştu. Lütfen tekrar deneyin.");
  }
};

window.cikisYap = function () {
  localStorage.clear();
  window.location.href = "login.html";
};

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
    if (role === ROLES.INSTITUTION) {
      // Kurum → Öğretmen veya Öğrenci daveti
      if (targetData.role === ROLES.OGRETMEN) {
        result = await createInstitutionTeacherRequest(uid, targetUid);
      } else if (targetData.role === ROLES.OGRENCI) {
        result = await createInstitutionStudentRequest(uid, targetUid);
      } else {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Sadece öğretmen veya öğrenciye davet gönderebilirsiniz.</span>";
        return;
      }
    } else {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Geçersiz rol.</span>";
      return;
    }
    
    if (result.success) {
      mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Davet başarıyla gönderildi!</span>";
      input.value = "";
      await yukleTalepler();
      await yukleOgretmenler();
      
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

// Öğretmeni kurumdan sil
window.ogretmeniKurumdanSil = async function(teacherId) {
  if (!confirm("Bu öğretmeni kurumdan kaldırmak istediğinize emin misiniz?")) {
    return;
  }

  try {
    const result = await unlinkInstitutionTeacher(uid, teacherId);
    
    if (result.success) {
      alert("✅ Öğretmen kurumdan kaldırıldı.");
      // Profil bilgisini ve öğretmen listesini yenile
      const userRef = doc(db, "profiles", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await yukleOgretmenler();
      }
    } else {
      alert(`❌ Hata: ${result.message || "Öğretmen kaldırılamadı."}`);
    }
  } catch (err) {
    console.error("Öğretmen silme hatası:", err);
    alert("❌ Bir hata oluştu.");
  }
};

// ====================================================================
// SEKME YÖNETİMİ
// ====================================================================
function initSekmeYonetimi() {
  console.log("🔵 initSekmeYonetimi çağrıldı");
  
  const sekmeBtnler = document.querySelectorAll(".sekme-btn");
  const sekmeIcerikler = document.querySelectorAll(".sekme-icerik");

  console.log("🔵 Sekme butonları bulundu:", sekmeBtnler.length);
  console.log("🔵 Sekme içerikleri bulundu:", sekmeIcerikler.length);

  if (sekmeBtnler.length === 0 || sekmeIcerikler.length === 0) {
    console.error("❌ Sekme butonları veya içerikleri bulunamadı!");
    return;
  }

  // Sekme değiştirme fonksiyonu
  const acSekme = (sekmeAdi) => {
    console.log("🔵 acSekme çağrıldı:", sekmeAdi);
    
    if (!sekmeAdi) {
      console.warn("⚠️ Sekme adı boş");
      return;
    }

    // Sekme butonlarını ve içeriklerini yeniden al (DOM değişmiş olabilir)
    const currentSekmeBtnler = document.querySelectorAll(".sekme-btn");
    const currentSekmeIcerikler = document.querySelectorAll(".sekme-icerik");
    
    // Tüm sekmeleri pasif yap
    currentSekmeBtnler.forEach(b => {
      b.classList.remove("active");
      b.style.borderBottomColor = "transparent";
      b.style.color = "#666";
    });
    currentSekmeIcerikler.forEach(ic => {
      ic.classList.remove("active");
      ic.style.display = "none";
    });

    // Seçilen sekme aktif
    const hedefBtn = document.querySelector(`[data-sekme="${sekmeAdi}"]`);
    if (hedefBtn) {
      hedefBtn.classList.add("active");
      hedefBtn.style.borderBottomColor = "#4a90e2";
      hedefBtn.style.color = "#4a90e2";
      console.log("✅ Sekme butonu aktif edildi:", sekmeAdi);
    } else {
      console.warn("⚠️ Sekme butonu bulunamadı:", sekmeAdi);
    }
    
    const hedefSekme = document.getElementById(`sekme-${sekmeAdi}`);
    if (hedefSekme) {
      hedefSekme.classList.add("active");
      hedefSekme.style.display = "block";
      console.log("✅ Sekme içeriği gösterildi:", sekmeAdi);
    } else {
      console.warn("⚠️ Sekme içeriği bulunamadı:", `sekme-${sekmeAdi}`);
    }

    // Mesajlaşma sekmesi açıldığında sadece role seçimini başlat
    if (sekmeAdi === "mesajlar") {
      // Role seçimi zaten initContent'te başlatıldı
      // Burada sadece gerekirse ek işlemler yapılabilir
    }
    
    // Öğretmenler sekmesi açıldığında listeyi yenile (sadece liste boşsa)
    if (sekmeAdi === "ogretmenler") {
      const liste = document.getElementById("kurumOgretmenListesi");
      // Liste zaten doluysa yeniden yükleme (initContent'te zaten yüklendi)
      if (liste && liste.children.length === 0) {
        setTimeout(() => {
          yukleOgretmenler();
        }, 100);
      }
    }
    
    // Öğrenciler sekmesi açıldığında listeyi yenile
    if (sekmeAdi === "ogrenciler") {
      setTimeout(() => {
        yukleOgrenciler();
      }, 100);
    }
  };

  // Buton tıklamaları
  sekmeBtnler.forEach((btn, index) => {
    const sekmeAdi = btn.dataset.sekme;
    console.log(`🔵 Sekme butonu ${index}:`, sekmeAdi, btn);
    
    if (!sekmeAdi) {
      console.warn("⚠️ Sekme butonunda data-sekme attribute'u yok:", btn);
      return;
    }
    
    // Önceki event listener'ları kaldır (varsa)
    const yeniBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(yeniBtn, btn);
    
    // Yeni event listener ekle
    yeniBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sekme = yeniBtn.dataset.sekme;
      console.log("🔵 Sekme butonu tıklandı:", sekme);
      if (sekme) {
        window.location.hash = sekme;
        acSekme(sekme);
      }
    });
  });

  // Hash değişikliklerini dinle
  const hashChangeHandler = () => {
    const hash = window.location.hash.replace("#", "");
    console.log("🔵 Hash değişti:", hash);
    if (hash && ['talepler', 'ogretmenler', 'ogrenciler', 'mesajlar'].includes(hash)) {
      // Kısa bir gecikme ile sekme aç (DOM'un hazır olması için)
      setTimeout(() => {
        if (window.acSekme) {
          window.acSekme(hash);
        } else {
          acSekme(hash);
        }
      }, 100);
    }
  };
  
  // Önceki hashchange listener'ları kaldır (varsa)
  const oldHashChange = window._hashChangeHandler;
  if (oldHashChange) {
    window.removeEventListener("hashchange", oldHashChange);
  }
  
  window._hashChangeHandler = hashChangeHandler;
  window.addEventListener("hashchange", hashChangeHandler);

  // Sayfa yüklendiğinde hash'i kontrol et
  const checkInitialHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ['talepler', 'ogretmenler', 'ogrenciler', 'mesajlar'].includes(hash)) {
      console.log("🔵 Sayfa yüklendi, hash var:", hash);
      setTimeout(() => {
        acSekme(hash);
      }, 100);
    } else {
      // Varsayılan olarak talepler sekmesini aç
      console.log("🔵 Varsayılan sekme açılıyor: talepler");
      setTimeout(() => {
        acSekme("talepler");
      }, 100);
    }
  };
  
  // Global fonksiyon olarak erişilebilir yap
  window._realAcSekme = acSekme;
  window.acSekme = acSekme;
  console.log("✅ window.acSekme tanımlandı");
  
  // Kuyruktaki sekmeleri işle
  if (window._sekmeKuyrugu && window._sekmeKuyrugu.length > 0) {
    console.log("🔵 Kuyruktaki sekmeler işleniyor:", window._sekmeKuyrugu);
    window._sekmeKuyrugu.forEach(sekme => {
      setTimeout(() => {
        acSekme(sekme);
      }, 50);
    });
    window._sekmeKuyrugu = [];
  }
  
  // İlk yüklemede hash kontrolü
  checkInitialHash();
  
  // Sayfa tamamen yüklendiğinde tekrar kontrol et
  if (document.readyState === 'complete') {
    checkInitialHash();
  } else {
    window.addEventListener('load', () => {
      console.log("🔵 window.load event tetiklendi");
      checkInitialHash();
    });
  }
  
  console.log("✅ Sekme yönetimi başlatıldı");
}

// ====================================================================
// MESAJLAŞMA SİSTEMİ
// ====================================================================
let aktifKullaniciId = null;
let aktifKullaniciAdi = null;
let aktifChatTipi = null; // "ogrenci" veya "ogretmen"
let mesajUnsubscribe = null;
let seciliRol = null; // "ogrenci", "ogretmen", "herikisi"

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
    if (seciliRol === "ogretmen" && userRole !== "ogretmen") {
      alert("❌ Bu kullanıcı öğretmen değil.");
      return;
    }
    if (seciliRol === "herikisi" && userRole !== "ogrenci" && userRole !== "ogretmen") {
      alert("❌ Bu kullanıcı öğrenci veya öğretmen değil.");
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
      // Önce kurumun doğrudan öğrencilerini al
      const ogrenciChats = await getInstitutionStudentChatList(uid);
      const gorulenOgrenciIds = new Set();
      
      ogrenciChats.forEach(chat => {
        gorulenOgrenciIds.add(chat.studentId);
        options.push({
          value: `ogrenci_${chat.studentId}`,
          text: `👩‍🎓 ${chat.studentName}`,
          id: chat.studentId,
          name: chat.studentName,
          role: "ogrenci"
        });
      });
      
      // Sonra öğretmenler üzerinden öğrencileri al
      try {
        const institutionRef = doc(db, "profiles", uid);
        const institutionSnap = await getDoc(institutionRef);
        
        if (institutionSnap.exists()) {
          const institutionData = institutionSnap.data();
          const teachers = institutionData.teachers || {};
          const aktifOgretmenler = Object.entries(teachers).filter(([, status]) => status === "kabul");
          
          for (const [teacherId] of aktifOgretmenler) {
            try {
              const teacherRef = doc(db, "profiles", teacherId);
              const teacherSnap = await getDoc(teacherRef);
              
              if (teacherSnap.exists()) {
                const teacherData = teacherSnap.data();
                const students = teacherData.students || {};
                const aktifOgrenciler = Object.entries(students).filter(([, status]) => status === "kabul");
                
                for (const [studentId] of aktifOgrenciler) {
                  // Duplicate kontrolü
                  if (gorulenOgrenciIds.has(studentId)) continue;
                  gorulenOgrenciIds.add(studentId);
                  
                  try {
                    const studentRef = doc(db, "profiles", studentId);
                    const studentSnap = await getDoc(studentRef);
                    
                    if (studentSnap.exists()) {
                      const studentData = studentSnap.data();
                      const studentName = studentData.username || studentData.fullName || studentData.ad || "İsimsiz";
                      
                      options.push({
                        value: `ogrenci_${studentId}`,
                        text: `👩‍🎓 ${studentName}`,
                        id: studentId,
                        name: studentName,
                        role: "ogrenci"
                      });
                    }
                  } catch (err) {
                    console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
                  }
                }
              }
            } catch (err) {
              console.warn("Öğretmen öğrencileri alınamadı:", teacherId, err);
            }
          }
        }
      } catch (err) {
        console.error("Öğretmenler üzerinden öğrenci listesi alınamadı:", err);
      }
    }

    // Öğretmen listesi
    if (seciliRol === "ogretmen" || seciliRol === "herikisi") {
      const ogretmenChats = await getInstitutionTeacherChatList(uid);
      ogretmenChats.forEach(chat => {
        options.push({
          value: `ogretmen_${chat.teacherId}`,
          text: `👩‍🏫 ${chat.teacherName}`,
          id: chat.teacherId,
          name: chat.teacherName,
          role: "ogretmen"
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
    const roleIcon = chatTipi === "ogrenci" ? "👩‍🎓" : "👩‍🏫";
    aliciBilgisi.textContent = `${roleIcon} ${aktifKullaniciAdi}`;
  }

  // Önceki dinlemeyi kapat
  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }

  // Yeni mesajları dinle
  mesajUnsubscribe = listenMessages(uid, kullaniciId, (messages) => {
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
    const isKurum = msg.from === uid;
    div.className = `mesaj ${isKurum ? "kurum" : "diger"}`;
    div.style.cssText = isKurum 
      ? "background:#4a90e2;color:white;margin-left:auto;text-align:right;padding:10px;margin-bottom:10px;border-radius:8px;max-width:70%;"
      : "background:#e0e0e0;color:#333;padding:10px;margin-bottom:10px;border-radius:8px;max-width:70%;";
    
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
  if (!input || !aktifKullaniciId) {
    alert("⚠️ Lütfen önce bir alıcı seçin.");
    return;
  }

  const text = input.value.trim();
  if (!text) {
    alert("⚠️ Lütfen mesaj metni girin.");
    return;
  }

  input.disabled = true;
  const gonderBtn = document.getElementById("mesajGonderBtn");
  if (gonderBtn) gonderBtn.disabled = true;

  try {
    const result = await sendMessage(uid, aktifKullaniciId, text, uid);
    
    if (result.success) {
      input.value = "";
      // Mesajı arşive kaydet
      await mesajArsiveKaydet(aktifKullaniciId, aktifKullaniciAdi, text, "gonderilen");
    } else {
      alert("❌ Mesaj gönderilemedi: " + (result.message || "Bilinmeyen hata"));
    }
  } catch (err) {
    console.error("Mesaj gönderme hatası:", err);
    alert("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
  } finally {
    input.disabled = false;
    if (gonderBtn) gonderBtn.disabled = false;
    input.focus();
  }
}

// Mesaj arşivine kaydet
async function mesajArsiveKaydet(kullaniciId, kullaniciAdi, mesajText, tip) {
  try {
    if (!db) return;
    
    const arsivRef = doc(db, "profiles", uid);
    const arsivSnap = await getDoc(arsivRef);
    const arsivData = arsivSnap.exists() ? arsivSnap.data() : {};
    
    const mesajArsivi = arsivData.mesajArsivi || {};
    const kullaniciArsivi = mesajArsivi[kullaniciId] || {
      kullaniciAdi: kullaniciAdi,
      gonderilen: [],
      silinen: []
    };
    
    const mesajKaydi = {
      text: mesajText,
      timestamp: new Date().toISOString(),
      tip: tip
    };
    
    if (tip === "gonderilen") {
      kullaniciArsivi.gonderilen.push(mesajKaydi);
    } else if (tip === "silinen") {
      kullaniciArsivi.silinen.push(mesajKaydi);
    }
    
    mesajArsivi[kullaniciId] = kullaniciArsivi;
    
    await updateDoc(arsivRef, {
      mesajArsivi: mesajArsivi
    });
  } catch (err) {
    console.error("Mesaj arşiv kayıt hatası:", err);
  }
}

// Mesajı arşivden sil (gönderilen mesajları silinenlere taşı)
async function mesajArsivdenSil(kullaniciId, mesajIndex, mesajText) {
  if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
    return;
  }

  try {
    if (!db) {
      alert("❌ Veritabanı bağlantısı yok.");
      return;
    }

    const arsivRef = doc(db, "profiles", uid);
    const arsivSnap = await getDoc(arsivRef);
    
    if (!arsivSnap.exists()) {
      alert("❌ Arşiv bulunamadı.");
      return;
    }

    const arsivData = arsivSnap.data();
    const mesajArsivi = arsivData.mesajArsivi || {};
    const kullaniciArsivi = mesajArsivi[kullaniciId];

    if (!kullaniciArsivi || !kullaniciArsivi.gonderilen || mesajIndex >= kullaniciArsivi.gonderilen.length) {
      alert("❌ Mesaj bulunamadı.");
      return;
    }

    // Mesajı gönderilenlerden al
    const silinecekMesaj = kullaniciArsivi.gonderilen[mesajIndex];
    
    // Mesajı gönderilenlerden çıkar
    kullaniciArsivi.gonderilen.splice(mesajIndex, 1);
    
    // Mesajı silinenlere ekle
    if (!kullaniciArsivi.silinen) {
      kullaniciArsivi.silinen = [];
    }
    kullaniciArsivi.silinen.push({
      ...silinecekMesaj,
      silinmeTarihi: new Date().toISOString()
    });

    mesajArsivi[kullaniciId] = kullaniciArsivi;

    await updateDoc(arsivRef, {
      mesajArsivi: mesajArsivi
    });

    alert("✅ Mesaj başarıyla silindi.");
    
    // Arşivi yeniden yükle
    await mesajArsivGoster("gonderilen");
  } catch (err) {
    console.error("Mesaj silme hatası:", err);
    alert("❌ Mesaj silinirken bir hata oluştu.");
  }
}

// Global fonksiyon olarak erişilebilir yap
window.mesajArsivdenSil = mesajArsivdenSil;

// Mesaj arşivini göster
async function mesajArsivGoster(tip) {
  const arsivAlani = document.getElementById("mesajArsivAlani");
  if (!arsivAlani) return;
  
  arsivAlani.innerHTML = "<p>Yükleniyor...</p>";
  
  try {
    if (!db) {
      arsivAlani.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
      return;
    }
    
    const arsivRef = doc(db, "profiles", uid);
    const arsivSnap = await getDoc(arsivRef);
    
    if (!arsivSnap.exists()) {
      arsivAlani.innerHTML = "<p>Henüz arşiv kaydı yok.</p>";
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
        const mesajId = `${kullaniciId}_${index}`;
        html += `<div id="mesaj-${mesajId}" style="padding:8px;margin-bottom:8px;background:#f9f9f9;border-radius:6px;border-left:3px solid #4a90e2;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">`;
        html += `<div style="flex:1;">`;
        html += `<div style="font-size:14px;margin-bottom:4px;">${mesaj.text}</div>`;
        html += `<small style="color:#999;font-size:11px;">${tarih}</small>`;
        html += `</div>`;
        
        // Sadece gönderilen mesajlar için sil butonu
        if (tip === "gonderilen") {
          html += `<button onclick="mesajArsivdenSil('${kullaniciId}', ${index}, '${mesaj.text.replace(/'/g, "&#39;")}')" style="padding:4px 8px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0;" title="Mesajı sil">🗑️ Sil</button>`;
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

async function init() {
  console.log("🔵 init() çağrıldı");
  
  // DOM'un hazır olduğundan emin ol
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await initContent();
    });
  } else {
    await initContent();
  }
}

async function initContent() {
  console.log("🔵 initContent() çağrıldı");
  
  await yukleKurumBilgisi();
  await yukleTalepler();
  await yukleOgretmenler();
  await yukleOgrenciler();
  
  // Mesajlaşma sistemi başlat
  initMesajRolSecimi();
  
  // Kullanıcı adı arama butonu
  const aramaBtn = document.getElementById("mesajKullaniciAdiAraBtn");
  const kullaniciAdiInput = document.getElementById("mesajKullaniciAdiInput");
  
  if (aramaBtn) {
    aramaBtn.onclick = mesajKullaniciAdiAra;
  }
  
  if (kullaniciAdiInput) {
    kullaniciAdiInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        mesajKullaniciAdiAra();
      }
    };
  }
  
  // Mesaj arşiv butonları
  const arsivGonderilenBtn = document.getElementById("arsivGonderilenBtn");
  const arsivSilinenBtn = document.getElementById("arsivSilinenBtn");
  
  if (arsivGonderilenBtn) {
    arsivGonderilenBtn.onclick = () => mesajArsivGoster("gonderilen");
  }
  
  if (arsivSilinenBtn) {
    arsivSilinenBtn.onclick = () => mesajArsivGoster("silinen");
  }
  
  // Profil bilgisi yükle
  // yukleKurumProfilBilgisi(); // Bilgi balonu kaldırıldı

  // Sekme yönetimi - DOM hazır olduktan sonra
  // Önce global acSekme fonksiyonunu tanımla (geçici placeholder)
  if (!window.acSekme) {
    window.acSekme = function(sekmeAdi) {
      console.log("🔵 window.acSekme çağrıldı (placeholder):", sekmeAdi);
      // initSekmeYonetimi henüz çalışmadıysa bekle
      const tryAcSekme = () => {
        const realAcSekme = window.acSekme;
        if (realAcSekme && realAcSekme.toString().includes('sekmeAdi')) {
          // Gerçek fonksiyon yüklendi, çağır
          realAcSekme(sekmeAdi);
        } else {
          // Henüz yüklenmedi, tekrar dene
          setTimeout(tryAcSekme, 100);
        }
      };
      setTimeout(tryAcSekme, 100);
    };
  }
  
  setTimeout(() => {
    initSekmeYonetimi();
    // Hash'i tekrar kontrol et (sekme yönetimi başladıktan sonra)
    const hash = window.location.hash.replace("#", "");
    if (hash && ['talepler', 'ogretmenler', 'ogrenciler', 'mesajlar'].includes(hash)) {
      console.log("🔵 Sekme yönetimi başladıktan sonra hash kontrolü:", hash);
      setTimeout(() => {
        if (window.acSekme) {
          window.acSekme(hash);
        }
      }, 100);
    }
  }, 200);

  // Ortak davet gönderme butonu
  const davetBtn = document.getElementById("davetGonderBtn");
  const davetInput = document.getElementById("davetUsernameInput");
  
  if (davetBtn) {
    davetBtn.onclick = davetGonder;
  }
  
  if (davetInput) {
    davetInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        davetGonder();
      }
    };
  }
}

// DOM hazır olduğunda init'i çağır
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function findUserByUsername(username) {
  if (!db) {
    console.error("❌ Firestore başlatılamadı!");
    return null;
  }

  const q = query(collection(db, "profiles"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

