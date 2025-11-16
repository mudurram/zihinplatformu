// =============================================================
// 📌 editor_panel.js — Editor Paneli (Final, Stabil)
// =============================================================

import { db } from "../data/firebaseConfig.js";
import { ROLES } from "./router.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------------------------------------
// 1) Rol Doğrulaması
// -------------------------------------------------------------
const role = localStorage.getItem("role");

if (role !== ROLES.EDITOR) {
  alert("⛔ Bu sayfaya sadece EDITOR rolü erişebilir.");
  window.location.href = "index.html";
}

// -------------------------------------------------------------
// 2) Tüm Oyunları Yükle (games koleksiyonu)
// -------------------------------------------------------------
async function oyunlariYukle() {
  const listeDiv = document.getElementById("oyunListesi");
  listeDiv.innerHTML = "<p>Yükleniyor...</p>";

  try {
    const ref = collection(db, "games");
    const snap = await getDocs(ref);

    listeDiv.innerHTML = "";

    snap.forEach(gameDoc => {
      const g = gameDoc.data();
      const id = gameDoc.id;

      const kart = document.createElement("div");
      kart.className = "oyun-kart";

      kart.innerHTML = `
        <h3>${g.ad || "İsimsiz Oyun"}</h3>

        <label><strong>Açıklama:</strong></label>
        <textarea id="aciklama_${id}" rows="3">${g.aciklama || ""}</textarea>

        <label><strong>Seviye Sayısı:</strong></label>
        <input id="seviye_${id}" 
               type="number" 
               min="1" max="10" 
               value="${g.seviye ?? 3}"
               style="width:80px; padding:6px; border-radius:6px;"><br>

        <label><strong>Yönerge:</strong></label>
        <textarea id="yonerge_${id}" rows="2">${g.yonerge || ""}</textarea>

        <button class="btn-kaydet" onclick="kaydet('${id}')">Kaydet</button>
      `;

      listeDiv.appendChild(kart);
    });

  } catch (err) {
    console.error("❌ Oyun listesi çekilemedi:", err);
    listeDiv.innerHTML = "<p>⚠ Oyunlar yüklenirken hata oluştu.</p>";
  }
}

oyunlariYukle();

// -------------------------------------------------------------
// 3) Kaydetme Fonksiyonu
// -------------------------------------------------------------
window.kaydet = async function (id) {
  const aciklama = document.getElementById(`aciklama_${id}`).value?.trim() || "";
  const yonerge = document.getElementById(`yonerge_${id}`).value?.trim() || "";
  const seviye = Number(document.getElementById(`seviye_${id}`).value);

  if (!seviye || seviye < 1) {
    alert("⚠ Seviye sayısı en az 1 olmalıdır!");
    return;
  }

  try {
    const ref = doc(db, "games", id);

    await updateDoc(ref, {
      aciklama,
      yonerge,
      seviye,
      guncellendi: new Date().toISOString()
    });

    alert("✔ Oyun bilgileri başarıyla güncellendi.");

  } catch (err) {
    console.error("Güncellenemedi:", err);
    alert("⚠ Güncelleme hatası!");
  }
};

// -------------------------------------------------------------
// 4) Çıkış
// -------------------------------------------------------------
window.cikisYap = function () {
  localStorage.clear();
  window.location.href = "login.html";
};

console.log("🛠 editor_panel.js yüklendi (Final)");