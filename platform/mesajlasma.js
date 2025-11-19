// =============================================================
// 💬 mesajlasma.js — Öğrenci Mesajlaşma Sayfası
// =============================================================

import { db } from "../data/firebaseConfig.js";
import { sendMessage, listenMessages } from "../data/messageService.js";
import { ROLES } from "./globalConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
// 2) ÖĞRETMEN LİSTESİNİ YÜKLE
// =============================================================
let aktifOgretmenId = null;
let mesajUnsubscribe = null;

async function yukleOgretmenListesi() {
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

    if (!ogretmenIds.length) {
      listeDiv.innerHTML = "<p>Henüz öğretmenin yok. Öğretmenler seni eklediğinde burada görünecek.</p>";
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
      kart.innerHTML = `
        <div style="font-weight:600;margin-bottom:5px;">${teacherName}</div>
        <div style="font-size:12px;opacity:0.7;">Mesajlaşmaya başla</div>
      `;

      kart.onclick = () => ogretmenSec(teacherId, teacherName);

      listeDiv.appendChild(kart);
    }

  } catch (err) {
    console.error("❌ Öğretmen listesi yüklenemedi:", err);
    listeDiv.innerHTML = "<p>Bir hata oluştu.</p>";
  }
}

// =============================================================
// 3) ÖĞRETMEN SEÇ
// =============================================================
function ogretmenSec(teacherId, teacherName) {
  aktifOgretmenId = teacherId;

  // Tüm kartları pasif yap
  document.querySelectorAll(".ogretmen-kart").forEach(kart => {
    kart.classList.remove("aktif");
  });

  // Seçilen kartı aktif yap
  const secilenKart = document.querySelector(`[data-teacher-id="${teacherId}"]`);
  if (secilenKart) {
    secilenKart.classList.add("aktif");
  }

  // Mesaj alanını göster
  const mesajAlani = document.getElementById("mesajAlani");
  const aktifOgretmenAdi = document.getElementById("aktifOgretmenAdi");

  if (mesajAlani) mesajAlani.classList.add("aktif");
  if (aktifOgretmenAdi) aktifOgretmenAdi.textContent = `💬 ${teacherName}`;

  // Önceki dinlemeyi kapat
  if (mesajUnsubscribe) {
    mesajUnsubscribe();
    mesajUnsubscribe = null;
  }

  // Yeni mesajları dinle
  mesajUnsubscribe = listenMessages(teacherId, studentId, (messages) => {
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
    mesajInput.focus();
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
      <div>${msg.text}</div>
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
  if (!input || !aktifOgretmenId) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.disabled = true;

  const result = await sendMessage(aktifOgretmenId, studentId, text, studentId);
  
  input.disabled = false;
  input.focus();

  if (!result.success) {
    alert("Mesaj gönderilemedi: " + result.message);
  }
}

// =============================================================
// 6) SAYFA YÜKLENİNCE
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  yukleOgretmenListesi();
});

// =============================================================
console.log("💬 mesajlasma.js yüklendi");
// =============================================================

