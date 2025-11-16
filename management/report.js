// ========================================================================
// 📘 report.js — Öğrenci Raporu (Final v7.1 Ultra Stabil)
// ========================================================================

console.log("📘 report.js yüklendi — Final v7.1");

// ========================================================================
// 🔗 Firebase
// ========================================================================
import { db } from "../data/firebaseConfig.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ========================================================================
// 🔗 Modüller
// ========================================================================
import { drawTrendLines } from "../engine/trendAI.js";
import { drawComparisonChart } from "../engine/comparisonChart.js";
import { teacherAI_generateAdvice } from "./teacherAI.js";

// ========================================================================
// 🔧 HTML Elemanları
// ========================================================================
const adEl = document.getElementById("raporOgrAd");
const tarihEl = document.getElementById("raporTarih");

const radarCanvas = document.getElementById("radarProfil");
const trendCanvas = document.getElementById("trendGrafik");
const compareCanvas = document.getElementById("karsilastirmaGrafik");

const yorumEl = document.getElementById("ogretmenYorum");
const yorumBtn = document.getElementById("yorumKaydetBtn");

// ========================================================================
// 🟦 Öğrenci Bilgisi — localStorage
// ========================================================================
const ogrId = localStorage.getItem("aktifOgrenciId");
const ogrAd = localStorage.getItem("aktifOgrenci") || "Öğrenci";
const teacherID = localStorage.getItem("teacherID");

if (!ogrId || !teacherID) {
  alert("Öğrenci veya öğretmen bilgisi bulunamadı!");
  window.location.href = "panel.html";
}

adEl.textContent = ogrAd;

// ========================================================================
// 📌 1) Firestore’dan öğrenci sonuçlarını yükle
// ========================================================================
async function loadResults() {
  try {
    const resultsRef = collection(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      ogrId,
      "oyunSonuclari"
    );

    const snap = await getDocs(resultsRef);

    let history = [];
    snap.forEach(docu => history.push(docu.data()));

    if (!history.length) {
      alert("Bu öğrenci için kayıtlı sonuç bulunmuyor.");
      return;
    }

    // Tarihe göre sırala
    history.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

    const son = history.at(-1);
    tarihEl.textContent = new Date(son.tarih).toLocaleString("tr-TR");

    // Çizimler
    drawRadar(son);
    drawTrendLines(trendCanvas, history);
    drawCompare(history);

    // Yorum yükle
    loadTeacherComment();

  } catch (err) {
    console.error("❌ Öğrenci sonuçları yüklenemedi:", err);
  }
}

loadResults();

// ========================================================================
// 📌 2) Radar Profil (Son oyun)
// ========================================================================
function drawRadar(result) {
  if (!result || !result.skorlar || !radarCanvas) return;

  new Chart(radarCanvas, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
      datasets: [
        {
          label: "Bilişsel Profil",
          data: [
            result.skorlar.reaction_speed ?? 0,
            result.skorlar.inhibitory_control ?? 0,
            result.skorlar.sustained_attention ?? 0
          ],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30,136,229,0.22)",
          pointBackgroundColor: "#1E88E5",
          borderWidth: 3,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  });
}

// ========================================================================
// 📌 3) Karşılaştırma Grafiği (Son oyun VS Ortalama)
// ========================================================================
function drawCompare(history) {
  if (!compareCanvas || !history.length) return;

  if (history.length < 2) return; // 1 kayıtla ortalama olmaz

  const son = history.at(-1);
  let ort = {
    reaction_speed: 0,
    inhibitory_control: 0,
    sustained_attention: 0
  };

  history.forEach(h => {
    ort.reaction_speed += h.skorlar?.reaction_speed ?? 0;
    ort.inhibitory_control += h.skorlar?.inhibitory_control ?? 0;
    ort.sustained_attention += h.skorlar?.sustained_attention ?? 0;
  });

  const n = history.length;
  ort.reaction_speed = Math.round(ort.reaction_speed / n);
  ort.inhibitory_control = Math.round(ort.inhibitory_control / n);
  ort.sustained_attention = Math.round(ort.sustained_attention / n);

  drawComparisonChart(compareCanvas, son.skorlar, ort);
}

// ========================================================================
// 📌 4) Öğretmen Yorumunu Yükle
// ========================================================================
async function loadTeacherComment() {
  try {
    const ref = doc(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      ogrId
    );

    const snap = await getDoc(ref);
    if (snap.exists()) {
      yorumEl.value = snap.data()?.ogretmenYorum || "";
    }

  } catch (err) {
    console.error("Yorum okunamadı:", err);
  }
}

// ========================================================================
// 📌 5) Öğretmen Yorumu Kaydet
// ========================================================================
yorumBtn.addEventListener("click", async () => {
  try {
    const ref = doc(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      ogrId
    );

    await updateDoc(ref, { ogretmenYorum: yorumEl.value });

    alert("Yorum başarıyla kaydedildi!");

  } catch (err) {
    // Eğer doküman yoksa create et
    try {
      await setDoc(
        doc(db, "profiles", teacherID, "ogrenciler", ogrId),
        { ogretmenYorum: yorumEl.value },
        { merge: true }
      );
      alert("Yorum oluşturuldu ve kaydedildi.");
    } catch (e) {
      console.error("❌ Yorum kaydedilemedi:", e);
    }
  }
});