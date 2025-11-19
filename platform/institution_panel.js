import { db } from "../data/firebaseConfig.js";
import { sayfaRolKontrol } from "./router.js";
import { ROLES } from "./globalConfig.js";
import {
  listRequestsByUser,
  respondRequest,
  createInstitutionTeacherRequest
} from "../data/requestService.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const roleOk = sayfaRolKontrol(ROLES.INSTITUTION);
if (!roleOk) throw new Error("Yetkisiz erişim");

const uid = localStorage.getItem("uid");

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
  const liste = document.getElementById("kurumTalepListesi");
  if (!liste) return;

  if (!uid) {
    liste.innerHTML = "<li>Kullanıcı ID bulunamadı.</li>";
    return;
  }

  liste.innerHTML = "<li>Yükleniyor...</li>";
  const talepler = await listRequestsByUser(uid);

  if (!talepler.length) {
    liste.innerHTML = "<li>Talep bulunmuyor.</li>";
    return;
  }

  liste.innerHTML = "";
  talepler.forEach(req => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="talep-info">
        ${req.payload?.teacherId || req.fromId} → Kuruma katılma isteği
      </div>
      <div class="talep-btn-grup">
        <button data-id="${req.id}" data-status="kabul">Kabul</button>
        <button data-id="${req.id}" data-status="red">Red</button>
      </div>
    `;

    li.querySelectorAll("button").forEach(btn => {
      btn.onclick = async () => {
        await respondRequest(req.id, btn.dataset.status, uid);
        await yukleTalepler();
      };
    });

    liste.appendChild(li);
  });
}

async function yukleOgretmenler() {
  const liste = document.getElementById("kurumOgretmenListesi");
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
  const teachers = snap.data().teachers || {};
  const aktif = Object.entries(teachers).filter(([, status]) => status === "kabul");

  if (!aktif.length) {
    liste.innerHTML = "<li>Kayıtlı öğretmen bulunmuyor.</li>";
    return;
  }

  liste.innerHTML = "";
  aktif.forEach(([teacherId]) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="talep-info">${teacherId}</div>`;
    liste.appendChild(li);
  });
}

window.cikisYap = function () {
  localStorage.clear();
  window.location.href = "login.html";
};

async function init() {
  await yukleKurumBilgisi();
  await yukleTalepler();
  await yukleOgretmenler();

  const davetBtn = document.getElementById("ogretmenDavetBtn");
  if (davetBtn) {
    davetBtn.onclick = async () => {
      const usernameInput = document.getElementById("ogretmenUsernameInput");
      if (!usernameInput) {
        alert("Kullanıcı adı alanı bulunamadı.");
        return;
      }
      const username = usernameInput.value.trim();
      if (!username) {
        alert("Kullanıcı adı girin.");
        return;
      }
      const teacherUid = await findUserByUsername(username);
      if (!teacherUid) {
        alert("Öğretmen bulunamadı.");
        return;
      }
      await createInstitutionTeacherRequest(teacherUid, uid);
      usernameInput.value = "";
      await yukleTalepler();
    };
  }
}

init();

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

