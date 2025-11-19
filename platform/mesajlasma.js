// =============================================================
// 💬 mesajlasma.js — Öğrenci Mesajlaşma Sayfası
// =============================================================

import { db } from "../data/firebaseConfig.js";
import { 
  sendMessage, 
  listenMessages, 
  getStudentInstitutionChatList,
  getStudentChatList
} from "../data/messageService.js";
import { ROLES } from "./globalConfig.js";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =============================================================
// 1) ROL DOĞRULAMA
// =============================================================
const role = localStorage.getItem("role");
const studentId = localStorage.getItem("uid") || localStorage.getItem("studentID");

if (!role || role !== ROLES.OGRENCI) {
  console.warn("⛔ Öğrenci değil → index.html");
  window.location.href = "index.html";
}

if (!studentId) {
  console.warn("⛔ Öğrenci ID bulunamadı");
  alert("Oturum bilgisi bulunamadı.");
  window.location.href = "index.html";
}

console.log("💬 Mesajlaşma sayfası açıldı → studentID:", studentId);

// =============================================================
// 2) ÖĞRETMEN VE KURUM LİSTESİNİ YÜKLE
// =============================================================
let aktifKullaniciId = null;
let aktifKullaniciAdi = null;
let aktifChatTipi = null; // "ogretmen" veya "kurum"
let mesajUnsubscribe = null;
let seciliRol = null; // "ogretmen", "kurum", "herikisi"

async function yukleOgretmenVeKurumListesi() {
  const listeDiv = document.getElementById("ogretmenListesi");
  if (!listeDiv) return;

  listeDiv.innerHTML = "<p>Yükleniyor...</p>";

  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      listeDiv.innerHTML = "<p>Veritabanı bağlantısı yok.</p>";
      return;
    }

    // Öğrencinin profili üzerinden öğretmenleri al
    const studentRef = doc(db, "profiles", studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      listeDiv.innerHTML = "<p>Profil bulunamadı.</p>";
      return;
    }

    const studentData = studentSnap.data();
    const teachers = studentData.teachers || {};

    const ogretmenIds = Object.keys(teachers).filter(
      tid => teachers[tid] === "kabul"
    );

    // Kurum listesini al
    const kurumChatList = await getStudentInstitutionChatList(studentId);

    if (!ogretmenIds.length && kurumChatList.length === 0) {
      listeDiv.innerHTML = "<p>Henüz öğretmenin veya kurumun yok. Öğretmenler veya kurumlar seni eklediğinde burada görünecek.</p>";
      return;
    }

    listeDiv.innerHTML = "";

    // Her öğretmen için kart oluştur
    for (const teacherId of ogretmenIds) {
      const teacherRef = doc(db, "profiles", teacherId);
      const teacherSnap = await getDoc(teacherRef);

      if (!teacherSnap.exists()) continue;

      const teacherData = teacherSnap.data();
      const teacherName = teacherData.fullName || teacherData.username || teacherData.ad || "Öğretmen";

      const kart = document.createElement("div");
      kart.className = "ogretmen-kart";
      kart.dataset.teacherId = teacherId;
      kart.dataset.chatTipi = "ogretmen";
      kart.innerHTML = `
        <div style="font-weight:600;margin-bottom:5px;">👩‍🏫 ${teacherName}</div>
        <div style="font-size:12px;opacity:0.7;">Mesajlaşmaya başla</div>
      `;

      kart.onclick = () => ogretmenSec(teacherId, teacherName);

      listeDiv.appendChild(kart);
    }

    // Her kurum için kart oluştur
    for (const kurum of kurumChatList) {
      const kart = document.createElement("div");
      kart.className = "ogretmen-kart";
      kart.dataset.institutionId = kurum.institutionId;
      kart.dataset.chatTipi = "kurum";
      kart.innerHTML = `
        <div style="font-weight:600;margin-bottom:5px;">🏢 ${kurum.institutionName}</div>
        <div style="font-size:12px;opacity:0.7;">Mesajlaşmaya başla</div>
      `;

      kart.onclick = () => kurumSec(kurum.institutionId, kurum.institutionName);

      listeDiv.appendChild(kart);
    }

  } catch (err) {
    console.error("❌ Öğretmen ve kurum listesi yüklenemedi:", err);
    listeDiv.innerHTML = "<p>Bir hata oluştu.</p>";
  }
}

// Role seçimi event listener'ları
function initMesajRolSecimi() {
  console.log("🔍 initMesajRolSecimi çağrıldı");
  const rolRadioBtnler = document.querySelectorAll('input[name="mesajRolSecimi"]');
  console.log("🔍 Bulunan radio buton sayısı:", rolRadioBtnler.length);
  
  rolRadioBtnler.forEach(radio => {
    radio.addEventListener('change', (e) => {
      seciliRol = e.target.value;
      console.log("🔍 Rol seçildi:", seciliRol);
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
    if (seciliRol === "ogretmen" && userRole !== "ogretmen") {
      alert("❌ Bu kullanıcı öğretmen değil.");
      return;
    }
    if (seciliRol === "kurum" && userRole !== "institution") {
      alert("❌ Bu kullanıcı kurum değil.");
      return;
    }
    if (seciliRol === "herikisi" && userRole !== "ogretmen" && userRole !== "institution") {
      alert("❌ Bu kullanıcı öğretmen veya kurum değil.");
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

    // Öğretmen listesi
    if (seciliRol === "ogretmen" || seciliRol === "herikisi") {
      const chats = await getStudentChatList(studentId);
      chats.forEach(chat => {
        options.push({
          value: `ogretmen_${chat.teacherId}`,
          text: `👩‍🏫 ${chat.teacherName || "Öğretmen"}`,
          id: chat.teacherId,
          name: chat.teacherName || "Öğretmen",
          role: "ogretmen"
        });
      });
    }

    // Kurum listesi
    if (seciliRol === "kurum" || seciliRol === "herikisi") {
      const kurumChats = await getStudentInstitutionChatList(studentId);
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
  console.log("🔍 mesajKullaniciSec çağrıldı:", { kullaniciId, chatTipi, kullaniciAdi });
  
  aktifKullaniciId = kullaniciId;
  aktifChatTipi = chatTipi;
  aktifKullaniciAdi = kullaniciAdi || "Kullanıcı";
  
  const gondermeAlani = document.getElementById("mesajGondermeAlani");
  const aliciBilgisi = document.getElementById("mesajAlıcıBilgisi");
  
  console.log("🔍 Elementler:", { gondermeAlani, aliciBilgisi });
  
  if (gondermeAlani) {
    gondermeAlani.style.display = "block";
    console.log("✅ Mesaj gönderme alanı gösterildi");
  } else {
    console.error("❌ mesajGondermeAlani elementi bulunamadı!");
  }
  
  if (aliciBilgisi) {
    const roleIcon = chatTipi === "ogretmen" ? "👩‍🏫" : "🏢";
    aliciBilgisi.textContent = `${roleIcon} ${aktifKullaniciAdi}`;
    console.log("✅ Alıcı bilgisi güncellendi:", aliciBilgisi.textContent);
  } else {
    console.error("❌ mesajAlıcıBilgisi elementi bulunamadı!");
  }

  // Önceki dinlemeyi kapat
  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }

  // Yeni mesajları dinle
  mesajUnsubscribe = listenMessages(studentId, kullaniciId, (messages) => {
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

// =============================================================
// 4) MESAJLARI RENDER ET
// =============================================================
function renderMesajlar(messages) {
  const kutu = document.getElementById("mesajKutu");
  if (!kutu) return;

  kutu.innerHTML = "";

  if (!messages.length) {
    kutu.innerHTML = "<p style='text-align:center;color:#999;'>Henüz mesaj yok. İlk mesajı sen gönder!</p>";
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement("div");
    const isOgrenci = msg.from === studentId;
    div.className = `mesaj ${isOgrenci ? "ogrenci" : "ogretmen"}`;
    
    const tarih = msg.timestamp?.toDate ? 
      new Date(msg.timestamp.toDate()).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) :
      "Şimdi";
    
    div.innerHTML = `
      <div>${String(msg.text).replace(/'/g, "&#39;").replace(/"/g, "&quot;")}</div>
      <small style="font-size:11px;opacity:0.7;">${tarih}</small>
    `;
    kutu.appendChild(div);
  });

  // En alta kaydır
  kutu.scrollTop = kutu.scrollHeight;
}

// =============================================================
// 5) MESAJ GÖNDER
// =============================================================
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
    result = await sendMessage(studentId, aktifKullaniciId, text, studentId);
  } else if (aktifChatTipi === "ogretmen") {
    // Öğretmen ile mesajlaşma
    result = await sendMessage(studentId, aktifKullaniciId, text, studentId);
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

// =============================================================
// 6) MESAJ ARŞİVİ
// =============================================================
async function mesajArsiveKaydet(kullaniciId, kullaniciAdi, mesajText, tip) {
  try {
    if (!db) return;

    const arsivRef = doc(db, "profiles", studentId);
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

    const arsivRef = doc(db, "profiles", studentId);
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
    // getChatId fonksiyonunu oluştur (messageService'de export edilmemiş)
    const getChatId = (user1Id, user2Id) => {
      const ids = [user1Id, user2Id].sort();
      return `${ids[0]}_${ids[1]}`;
    };
    
    // Öğrencinin tüm chat'lerini al
    const teacherChats = await getStudentChatList(studentId);
    const institutionChats = await getStudentInstitutionChatList(studentId);
    
    const allChats = [
      ...teacherChats.map(chat => ({ ...chat, type: "ogretmen" })),
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
        const chatId = chat.chatId || getChatId(chat.teacherId || chat.institutionId, studentId);
        const messagesRef = collection(db, "messages", chatId, "messages");
        const q = query(
          messagesRef,
          where("to", "==", studentId),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const mesajData = doc.data();
          gelenMesajlar.push({
            ...mesajData,
            chatId: chatId,
            kullaniciId: chat.teacherId || chat.institutionId,
            kullaniciAdi: chat.teacherName || chat.institutionName || "Kullanıcı",
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

    const arsivRef = doc(db, "profiles", studentId);
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

// =============================================================
// 7) KULLANICI ADI İLE ARAMA FONKSİYONU
// =============================================================
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

// =============================================================
// 8) SAYFA YÜKLENİNCE
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
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
});

// =============================================================
console.log("💬 mesajlasma.js yüklendi");
// =============================================================

