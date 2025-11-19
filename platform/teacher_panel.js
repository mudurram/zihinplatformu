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
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { listRequestsByUser, respondRequest, createTeacherStudentRequest } from "../data/requestService.js";
import { sendMessage, listenMessages, getChatList } from "../data/messageService.js";

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
          <div>
            <div class="ogr-ad">${ad}</div>
          </div>
        `;

        kart.onclick = () => ogrenciSec(ogrID, ad);

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
  const alan = document.getElementById("bekleyenTalepler");
  if (!alan) return;

  if (!uid) {
    alan.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    return;
  }

  alan.innerHTML = "<li>Yükleniyor...</li>";
  const talepler = await listRequestsByUser(uid);

  // Sadece beklemede olan talepleri göster
  const bekleyenTalepler = talepler.filter(req => req.status === "beklemede");

  if (!bekleyenTalepler.length) {
    alan.innerHTML = "<li style='color:#999;padding:15px;text-align:center;'>Bekleyen talep yok.</li>";
    return;
  }

  alan.innerHTML = "";
  
  // Talepleri async olarak işle
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
      };
    });

    alan.appendChild(item);
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

  const sekmeBtnler = document.querySelectorAll(".sekme-btn");
  const sekmeIcerikler = document.querySelectorAll(".sekme-icerik");

  sekmeBtnler.forEach(btn => {
    btn.addEventListener("click", () => {
      const hedefSekme = btn.dataset.sekme;

      // Tüm sekmeleri pasif yap
      sekmeBtnler.forEach(b => b.classList.remove("active"));
      sekmeIcerikler.forEach(s => s.classList.remove("active"));

      // Seçilen sekmeyi aktif yap
      btn.classList.add("active");
      document.getElementById(`sekme-${hedefSekme}`)?.classList.add("active");

      // Mesajlaşma sekmesi açıldığında öğrenci listesini yükle
      if (hedefSekme === "mesajlar") {
        yukleMesajOgrenciListesi();
      }
    });
  });
});

// ====================================================================
// 7) MESAJLAŞMA SİSTEMİ
// ====================================================================
let aktifOgrenciId = null;
let mesajUnsubscribe = null;

async function yukleMesajOgrenciListesi() {
  const select = document.getElementById("mesajOgrenciSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Öğrenci seçin...</option>';

  try {
    const chats = await getChatList(teacherID);
    
    chats.forEach(chat => {
      const option = document.createElement("option");
      option.value = chat.studentId;
      option.textContent = chat.studentName;
      select.appendChild(option);
    });

    // Önceki event listener'ı kaldır (duplicate önleme)
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    newSelect.addEventListener("change", (e) => {
      const studentId = e.target.value;
      if (studentId) {
        mesajOgrenciSec(studentId);
      } else {
        mesajAlaniKapat();
      }
    });

  } catch (err) {
    console.error("❌ Mesaj öğrenci listesi yüklenemedi:", err);
  }
}

function mesajOgrenciSec(studentId) {
  aktifOgrenciId = studentId;
  const mesajAlani = document.getElementById("mesajAlani");
  if (mesajAlani) mesajAlani.style.display = "block";

  // Önceki dinlemeyi kapat
  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }

  // Yeni mesajları dinle
  mesajUnsubscribe = listenMessages(teacherID, studentId, (messages) => {
    renderMesajlar(messages);
  });

  // Mesaj gönderme butonu
  const gonderBtn = document.getElementById("mesajGonderBtn");
  const mesajInput = document.getElementById("mesajInput");

  if (gonderBtn) {
    gonderBtn.onclick = () => mesajGonder();
  }

  if (mesajInput) {
    mesajInput.onkeypress = (e) => {
      if (e.key === "Enter") mesajGonder();
    };
  }
}

function mesajAlaniKapat() {
  aktifOgrenciId = null;
  const mesajAlani = document.getElementById("mesajAlani");
  if (mesajAlani) mesajAlani.style.display = "none";

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
  if (!input || !aktifOgrenciId) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.disabled = true;

  const result = await sendMessage(teacherID, aktifOgrenciId, text, teacherID);
  
  input.disabled = false;
  input.focus();

  if (!result.success) {
    alert("Mesaj gönderilemedi: " + result.message);
  }
}

// ====================================================================
// 7.5) ÖĞRENCİYE TALEP GÖNDER
// ====================================================================
function ogrenciTalepGonderButonu() {
  const btn = document.getElementById("ogrenciTalepGonderBtn");
  const input = document.getElementById("ogrenciUsernameInput");
  const mesajDiv = document.getElementById("ogrenciTalepMesaji");

  if (!btn || !input) return;

  btn.onclick = async () => {
    const username = input.value.trim();
    
    if (!username) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen öğrenci kullanıcı adı girin.</span>";
      return;
    }

    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
    btn.disabled = true;

    try {
      // Öğrenciyi bul
      const studentUid = await findUserByUsername(username);
      
      if (!studentUid) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Öğrenci bulunamadı. Kullanıcı adını kontrol edin.</span>";
        btn.disabled = false;
        return;
      }

      // Öğrenci rolünü kontrol et
      const studentRef = doc(db, "profiles", studentUid);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Öğrenci profili bulunamadı.</span>";
        btn.disabled = false;
        return;
      }

      const studentData = studentSnap.data();
      if (studentData.role !== ROLES.OGRENCI) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı öğrenci değil.</span>";
        btn.disabled = false;
        return;
      }

      // Öğretmen ID'sini al
      if (!teacherID) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası. Lütfen tekrar giriş yapın.</span>";
        btn.disabled = false;
        return;
      }

      // Talep gönder
      const result = await createTeacherStudentRequest(teacherID, studentUid);
      
      if (result.success) {
        mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Talep başarıyla gönderildi! Öğrenci onayı bekleniyor.</span>";
        input.value = "";
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
          mesajDiv.innerHTML = "";
        }, 3000);
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ Hata: ${result.message || "Talep gönderilemedi."}</span>`;
      }

      btn.disabled = false;
    } catch (err) {
      console.error("Talep gönderme hatası:", err);
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu. Lütfen tekrar deneyin.</span>";
      btn.disabled = false;
    }
  };

  // Enter tuşu ile gönder
  if (input) {
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        btn.click();
      }
    };
  }
}

// ====================================================================
// 7.6) ÖĞRENCİ BUL (Username ile)
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
console.log("📘 teacher_panel.js yüklendi (Final v7.1 • Ultra Stabil)");
// ====================================================================