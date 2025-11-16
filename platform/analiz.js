// =============================================================
// 📌 analiz.js — Zihin Platformu Analiz Motoru (Final v7.2 Ultra Stabil)
// =============================================================

import { GLOBAL, ROLES } from "./globalConfig.js";
import { drawTrendLines } from "../engine/trendAI.js";
import { drawComparisonChart } from "../engine/comparisonChart.js";

import { db } from "../data/firebaseConfig.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------------------------------------
// 1) ROL & ÖĞRENCİ ERİŞİM KONTROLÜ
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");
const teacherID = localStorage.getItem("teacherID");
const uid = localStorage.getItem("uid");

// 🔒 Öğretmen → öğrenci seçmeden analiz ekranına giremez
if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
  alert("ℹ Lütfen önce bir öğrenci seçiniz.");
  window.location.href = "teacher_panel.html";
  throw new Error("Öğretmen öğrenci seçmedi.");
}

console.log("🎯 Analiz ekranı yüklendi → Rol:", role);

// -------------------------------------------------------------
// 2) HTML Elemanları
// -------------------------------------------------------------
const oyunFiltre = document.getElementById("oyunFiltre");
const tarihFiltre = document.getElementById("tarihFiltre");
const sonucListe = document.getElementById("sonucListe");

let gecmis = []; // Analiz veri kaynağı

// =============================================================
// 🔥 3A — Öğretmen → Firestore’dan kayıt çek
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!teacherID || !aktifOgrenciId) {
      console.warn("⚠ teacherID veya aktifOgrenciId eksik.");
      return;
    }

    const yol = collection(
      db,
      "profiles",
      teacherID,
      "ogrenciler",
      aktifOgrenciId,
      "oyunSonuclari"
    );

    const snap = await getDocs(yol);
    const temp = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data?.tarih) temp.push(data);
    });

    console.log("📥 Firestore geçmiş yüklendi:", temp.length, "kayıt");

    gecmis = temp.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

    filtrele();

  } catch (err) {
    console.error("❌ Firestore geçmiş okunamadı:", err);
  }
}

// =============================================================
// 🔥 3B — Öğrenci → LocalStorage geçmişi
// =============================================================
function yukleLocalGecmis() {
  let data;

  try {
    data = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
    if (!Array.isArray(data)) throw 0;
  } catch {
    console.warn("⚠ LocalStorage geçmiş bozuk → sıfırlandı.");
    data = [];
  }

  gecmis = data
    .filter(x => x?.tarih)
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  console.log("📥 LocalStorage geçmiş yüklendi:", gecmis.length, "kayıt");

  filtrele();
}

// -------------------------------------------------------------
// 4) OYUN FİLTRELERİNİ DOLDUR
// -------------------------------------------------------------
if (oyunFiltre) {
  const opt = document.createElement("option");
  opt.value = "hepsi";
  opt.textContent = "Tüm Oyunlar";
  oyunFiltre.appendChild(opt);

  Object.keys(GLOBAL.OYUN_KODLARI).forEach(key => {
    const kod = GLOBAL.OYUN_KODLARI[key];
    const ad = GLOBAL.OYUN_ADLARI?.[kod] || kod.replace(/_/g, " ").toUpperCase();

    const o = document.createElement("option");
    o.value = kod;
    o.textContent = ad;
    oyunFiltre.appendChild(o);
  });
}

// -------------------------------------------------------------
// 5) FİLTRELEME MOTORU
// -------------------------------------------------------------
function filtrele() {
  let filtered = [...gecmis];

  // 🎮 Oyun filtresi
  if (oyunFiltre && oyunFiltre.value !== "hepsi") {
    filtered = filtered.filter(x => x.oyun === oyunFiltre.value);
  }

  // 📅 Tarih filtresi
  const now = Date.now();
  let limit = null;

  switch (tarihFiltre?.value) {
    case "hafta":
      limit = now - 7 * 86400000;
      break;
    case "ay":
      limit = now - 30 * 86400000;
      break;
    case "tum":
      limit = 0;
      break;
    case "son":
      limit = null;
      break;
  }

  if (limit !== null && tarihFiltre.value !== "son") {
    filtered = filtered.filter(x => new Date(x.tarih).getTime() >= limit);
  }

  if (tarihFiltre.value === "son") {
    filtered = filtered.length ? [filtered.at(-1)] : [];
  }

  // Liste + grafik işlemleri
  listele(filtered);
  trendGrafik(filtered);
  compareGrafik(filtered);
}

// -------------------------------------------------------------
// 6) SONUÇ LİSTESİ
// -------------------------------------------------------------
function listele(data) {
  if (!sonucListe) return;

  sonucListe.innerHTML = "";

  if (!data.length) {
    sonucListe.innerHTML =
      "<p style='text-align:center;color:#999;'>Kayıt bulunamadı.</p>";
    return;
  }

  data.forEach(item => {
    const kart = document.createElement("div");
    kart.className = "sonuc-kart";

    const oyunAdi =
      GLOBAL.OYUN_ADLARI?.[item.oyun] ||
      item.oyun.replace(/_/g, " ").toUpperCase();

    kart.innerHTML = `
      <strong>${oyunAdi}</strong><br>
      Doğru: ${item.dogru ?? 0} — Yanlış: ${item.yanlis ?? 0}<br>
      Tarih: ${new Date(item.tarih).toLocaleString("tr-TR")}
    `;

    kart.onclick = () => {
      localStorage.setItem("sonOyun", item.oyun);
      window.location.href = GLOBAL.PLATFORM + "sonuc.html";
    };

    sonucListe.appendChild(kart);
  });
}

// -------------------------------------------------------------
// 7) TREND GRAFİĞİ
// -------------------------------------------------------------
function trendGrafik(data) {
  try {
    const canvas = document.getElementById("trendChart");
    if (canvas) drawTrendLines(canvas, data);
  } catch (err) {
    console.warn("⚠ Trend grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 8) RADAR GRAFİĞİ KARŞILAŞTIRMA
// -------------------------------------------------------------
function compareGrafik(data) {
  try {
    const canvas = document.getElementById("compareChart");
    if (!canvas || data.length < 2) return;

    const son = data.at(-1).skorlar || {};

    const ort = {
      reaction_speed: avg(data.map(x => x.skorlar?.reaction_speed ?? 0)),
      inhibitory_control: avg(data.map(x => x.skorlar?.inhibitory_control ?? 0)),
      sustained_attention: avg(data.map(x => x.skorlar?.sustained_attention ?? 0))
    };

    drawComparisonChart(canvas, son, ort);

  } catch (err) {
    console.warn("⚠ Radar grafiği çizilemedi:", err);
  }
}

function avg(arr) {
  return arr.length
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : 0;
}

// -------------------------------------------------------------
// 9) EVENTLER
// -------------------------------------------------------------
oyunFiltre?.addEventListener("change", filtrele);
tarihFiltre?.addEventListener("change", filtrele);

// -------------------------------------------------------------
// 10) BAŞLAT
// -------------------------------------------------------------
if (role === ROLES.OGRETMEN) {
  yukleFirestoreGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📊 analiz.js yüklendi (Final v7.2 — Ultra Stabil)");