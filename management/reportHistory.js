// ==========================================================================
// 📘 reportHistory.js — Öğrenci Tüm Geçmiş Rapor Listesi (Final v7.1 Ultra Stabil)
// ==========================================================================

console.log("📘 reportHistory.js yüklendi — Final v7.1");

// --------------------------------------------------------------------------
// 🔗 Firebase
// --------------------------------------------------------------------------
import { db } from "../data/firebaseConfig.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --------------------------------------------------------------------------
// 🔗 GLOBAL OYUN ADLARI (isimleri düzgün göstermek için)
// --------------------------------------------------------------------------
import { GLOBAL } from "../platform/globalConfig.js";

// --------------------------------------------------------------------------
// 🔍 1) Aktif Öğrenci Bilgisi (localStorage)
// --------------------------------------------------------------------------
const aktifAd = localStorage.getItem("aktifOgrenci") || "-";
const aktifId = localStorage.getItem("aktifOgrenciId");
const teacherID = localStorage.getItem("teacherID");

document.getElementById("historyTitle").textContent =
  `${aktifAd} — Geçmiş Oyun Kayıtları`;

if (!aktifId || !teacherID) {
  alert("⚠️ Öğrenci veya öğretmen bilgisi bulunamadı!");
  throw new Error("aktifOgrenciId veya teacherID eksik");
}

// --------------------------------------------------------------------------
// 🟦 2) Firestore’dan geçmiş sonuçları çek
// --------------------------------------------------------------------------
async function loadHistory() {
  try {
    const ref = collection(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      aktifId,
      "oyunSonuclari"
    );

    const snap = await getDocs(ref);

    let kayitlar = [];

    snap.forEach(docu => {
      const d = docu.data();

      kayitlar.push({
        oyun: d.oyun || "-",
        dogru: d.dogru ?? 0,
        yanlis: d.yanlis ?? 0,
        level: d.level ?? "-",
        sure: d.sure ?? "-",
        skorlar: d.skorlar || {},
        tarih: d.tarih ? new Date(d.tarih) : new Date()
      });
    });

    // Yeni → eski sıralama
    kayitlar.sort((a, b) => b.tarih - a.tarih);

    tabloyuDoldur(kayitlar);

  } catch (err) {
    console.error("❌ Geçmiş verileri yüklenemedi:", err);
  }
}

// --------------------------------------------------------------------------
// 🟩 3) Tabloyu HTML'e yaz
// --------------------------------------------------------------------------
function tabloyuDoldur(list) {
  const tbody = document.getElementById("historyBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; opacity:0.6;">
          Kayıt bulunamadı.
        </td>
      </tr>`;
    return;
  }

  list.forEach(k => {
    const oyunAdi =
      GLOBAL.OYUN_ADLARI?.[k.oyun] ||
      k.oyun.replace(/_/g, " ").toUpperCase();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${oyunAdi}</td>
      <td>${k.level}</td>
      <td>${k.dogru}</td>
      <td>${k.yanlis}</td>
      <td>${k.sure}</td>
      <td>${k.tarih.toLocaleString("tr-TR")}</td>
      <td>
        <button class="inceleBtn" data-oyun="${k.oyun}">
          İncele
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  incelemeButonlariniHazirla();
}

// --------------------------------------------------------------------------
// 🟧 4) İncele → platform/sonuc.html yönlendirme
// --------------------------------------------------------------------------
function incelemeButonlariniHazirla() {
  document.querySelectorAll(".inceleBtn").forEach(btn => {

    btn.addEventListener("click", () => {
      const oyun = btn.dataset.oyun;

      // Son incelenen oyunu işaretle
      localStorage.setItem("sonOyun", oyun);

      // Sonuç ekranına git
      window.location.href = "../platform/sonuc.html";
    });

  });
}

// --------------------------------------------------------------------------
// ✔ Sayfayı başlat
// --------------------------------------------------------------------------
loadHistory();