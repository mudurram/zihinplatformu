// =============================================================
// 📌 analiz.js — Zihin Platformu Analiz Motoru (v8.0 - Yeni Şema)
// 12 Alan Radar, Öğrenme Hızı, Hata Türleri, AI Öneri
// =============================================================

import { GLOBAL, ROLES, BRAIN_AREAS } from "./globalConfig.js";
import { drawTrendLines } from "../engine/trendAI.js";
import { drawComparisonChart } from "../engine/comparisonChart.js";
import { aiAdvice } from "../engine/aiAdvisor.js";

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
const institutionID = localStorage.getItem("institutionID");

// Öğretmen için öğrenci seçimi kontrolü
if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
  alert("ℹ Lütfen önce bir öğrenci seçiniz.");
  window.location.href = "teacher_panel.html";
  throw new Error("Öğretmen öğrenci seçmedi.");
}

// Kurum ve Admin için öğrenci seçimi kontrolü
if ((role === ROLES.INSTITUTION || role === ROLES.ADMIN) && !aktifOgrenciId) {
  // Kurum/Admin için öğrenci seçimi zorunlu değil, ana sayfaya yönlendir
  if (role === ROLES.INSTITUTION) {
    window.location.href = "institution_panel.html";
  } else {
    window.location.href = "admin_panel.html";
  }
  throw new Error("Öğrenci seçilmedi.");
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
// 🔥 3A — Öğretmen/Kurum/Admin → Firestore'dan kayıt çek
// =============================================================
async function yukleFirestoreGecmis() {
  try {
    if (!db) {
      console.error("❌ Firestore başlatılamadı!");
      return;
    }

    if (!aktifOgrenciId) {
      console.warn("⚠ aktifOgrenciId eksik.");
      return;
    }

    let yol = null;

    // Öğretmen için: profiles/{teacherID}/ogrenciler/{ogrenciID}/oyunSonuclari
    if (role === ROLES.OGRETMEN && teacherID) {
      yol = collection(
        db,
        "profiles",
        teacherID,
        "ogrenciler",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    }
    // Kurum ve Admin için: profiles/{ogrenciID}/oyunSonuclari (direkt öğrenci profili)
    else if (role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
      yol = collection(
        db,
        "profiles",
        aktifOgrenciId,
        "oyunSonuclari"
      );
    } else {
      console.warn("⚠ Geçersiz rol veya eksik bilgi.");
      return;
    }

    if (!yol) {
      console.warn("⚠ Firestore yolu oluşturulamadı.");
      return;
    }

    const snap = await getDocs(yol);
    const temp = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data?.tarih) temp.push(data);
    });

    console.log("📥 Firestore geçmiş yüklendi:", temp.length, "kayıt");
    
    // Veri formatını kontrol et
    if (temp.length > 0) {
      console.log("📊 İlk kayıt örneği:", temp[0]);
      console.log("📊 İlk kayıt coklu_alan:", temp[0].coklu_alan);
      console.log("📊 İlk kayıt temel_skor:", temp[0].temel_skor);
    }

    gecmis = temp.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

    filtrele();

  } catch (err) {
    console.error("❌ Firestore geçmiş okunamadı:", err);
  }
}

// =============================================================
// 🔥 3B — Öğrenci → Önce Firestore, sonra LocalStorage geçmişi
// =============================================================
async function yukleOgrenciGecmis() {
  // Önce Firestore'dan çek
  try {
    if (db && uid) {
      const yol = collection(
        db,
        "profiles",
        uid,
        "oyunSonuclari"
      );
      
      const snap = await getDocs(yol);
      const firestoreData = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data?.tarih) firestoreData.push(data);
      });
      
      if (firestoreData.length > 0) {
        gecmis = firestoreData.sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        console.log("📥 Firestore geçmiş yüklendi (öğrenci):", gecmis.length, "kayıt");
        
        // Veri formatını kontrol et
        if (gecmis.length > 0) {
          console.log("📊 İlk kayıt örneği:", gecmis[0]);
          console.log("📊 İlk kayıt coklu_alan:", gecmis[0].coklu_alan);
          console.log("📊 İlk kayıt temel_skor:", gecmis[0].temel_skor);
        }
        
        filtrele();
        return;
      }
    }
  } catch (err) {
    console.warn("⚠ Firestore'dan veri çekilemedi, LocalStorage deneniyor:", err);
  }
  
  // Firestore'da veri yoksa LocalStorage'dan çek
  yukleLocalGecmis();
}

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
  
  // Veri formatını kontrol et
  if (gecmis.length > 0) {
    console.log("📊 İlk kayıt örneği:", gecmis[0]);
    console.log("📊 İlk kayıt coklu_alan:", gecmis[0].coklu_alan);
    console.log("📊 İlk kayıt temel_skor:", gecmis[0].temel_skor);
  }

  filtrele();
}

// -------------------------------------------------------------
// 4) OYUN FİLTRELERİNİ DOLDUR (GAME_MAP'ten)
// -------------------------------------------------------------
if (oyunFiltre) {
  const opt = document.createElement("option");
  opt.value = "hepsi";
  opt.textContent = "Tüm Oyunlar";
  oyunFiltre.appendChild(opt);

  const gameMap = GLOBAL.GAME_MAP || {};
  Object.keys(gameMap).forEach(oyunId => {
    const oyun = gameMap[oyunId];
    const o = document.createElement("option");
    o.value = oyunId;
    o.textContent = oyun.ad || oyunId;
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
    filtered = filtered.filter(x => {
      if (!x.tarih) return false;
      const tarihTime = new Date(x.tarih).getTime();
      return !isNaN(tarihTime) && tarihTime >= limit;
    });
  }

  if (tarihFiltre.value === "son") {
    filtered = filtered.length ? [filtered.at(-1)] : [];
  }

  // Liste + grafik işlemleri
  listele(filtered);
  radarGrafik(filtered);
  trendGrafik(filtered);
  ogrenmeHiziGrafik(filtered);
  alanTablo(filtered);
  hataTurleriGrafik(filtered);
  gucluVeZayifAnaliz(filtered);
  aiOneri(filtered);
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

    const oyunAdi = GLOBAL.GAME_MAP?.[item.oyun]?.ad || 
                   GLOBAL.OYUN_ADLARI?.[item.oyun] ||
                   (item.oyun ? item.oyun.replace(/_/g, " ").toUpperCase() : "Bilinmeyen Oyun");

    kart.innerHTML = `
      <strong>${oyunAdi}</strong><br>
      Doğru: ${item.dogru ?? 0} — Yanlış: ${item.yanlis ?? 0}<br>
      ${item.temel_skor?.ogrenmeHizi ? `Öğrenme Hızı: ${item.temel_skor.ogrenmeHizi}/100<br>` : ''}
      Tarih: ${item.tarih ? new Date(item.tarih).toLocaleString("tr-TR") : "Tarih bilinmiyor"}
    `;

    kart.onclick = () => {
      localStorage.setItem("sonOyun", item.oyun);
      window.location.href = (GLOBAL.PLATFORM || "./") + "sonuc.html";
    };

    sonucListe.appendChild(kart);
  });
}

// -------------------------------------------------------------
// 7) 12 ALAN RADAR GRAFİĞİ
// -------------------------------------------------------------
function radarGrafik(data) {
  try {
    const canvas = document.getElementById("radarChart");
    if (!canvas || !window.Chart || data.length === 0) {
      console.warn("⚠ Radar grafiği için veri yok");
      return;
    }

    // Tüm kayıtlardan coklu_alan verilerini topla
    const alanSkorlari = {};
    const alanlar = Object.keys(BRAIN_AREAS || {});

    alanlar.forEach(alanKey => {
      const skorlar = data
        .map(item => {
          // Önce yeni formattan al
          if (item.coklu_alan && item.coklu_alan[alanKey]) {
            return item.coklu_alan[alanKey];
          }
          
          // Eski format kontrolü (skorlar objesi)
          if (item.skorlar && item.skorlar[alanKey]) {
            return item.skorlar[alanKey];
          }
          
          // Eğer hiç veri yoksa, trials'dan hesapla
          if (item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
            const total = item.trials.length;
            const dogru = item.trials.filter(t => t.correct).length;
            const accuracy = total > 0 ? dogru / total : 0;
            const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 1000), 0) / total;
            const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
            
            // Alan bazlı skor hesaplama (basit versiyon)
            let skor = 0;
            if (alanKey === "attention") {
              skor = Math.round(accuracy * 60 + reactionScore * 0.4);
            } else if (alanKey === "perception") {
              skor = Math.round(accuracy * 70 + reactionScore * 0.3);
            } else if (alanKey === "executive") {
              skor = Math.round(accuracy * 50 + reactionScore * 0.5);
            } else if (alanKey === "logic") {
              skor = Math.round(accuracy * 80 + reactionScore * 0.2);
            } else {
              skor = Math.round(accuracy * 70 + reactionScore * 0.3);
            }
            return skor;
          }
          
          return 0;
        })
        .filter(s => s > 0);
        
      alanSkorlari[alanKey] = skorlar.length > 0 
        ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
        : 0;
    });
    
    console.log("📊 Radar grafik alan skorları:", alanSkorlari);

    const labels = alanlar.map(k => BRAIN_AREAS[k]?.ad || k);
    const values = alanlar.map(k => alanSkorlari[k]);

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "radar",
      data: {
        labels: labels.slice(0, 12),
        datasets: [{
          label: "Zihin Alanları",
          data: values.slice(0, 12),
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Radar grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 8) TREND GRAFİĞİ
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
// 9) ÖĞRENME HIZI GRAFİĞİ
// -------------------------------------------------------------
function ogrenmeHiziGrafik(data) {
  try {
    const canvas = document.getElementById("ogrenmeHiziChart");
    if (!canvas || !window.Chart || data.length === 0) return;

    const ogrenmeHizlari = data
      .map(item => {
        // Geriye uyumluluk: hem ogrenmeHizi hem learning_velocity kontrol et
        const hiz = item.temel_skor?.ogrenmeHizi || 
                   item.temel_skor?.learning_velocity ||
                   item.ogrenmeHizi ||
                   item.learning_velocity ||
                   null;
        
        // Eğer hala null ise, trials'dan hesapla
        let calculatedHiz = null;
        if (hiz === null && item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const dogruTrials = item.trials.filter(t => t.correct);
          const total = item.trials.length;
          if (total > 0) {
            const accuracy = dogruTrials.length / total;
            const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 0), 0) / total;
            // Öğrenme hızı hesaplama (basit versiyon)
            calculatedHiz = Math.round(accuracy * 100 * (1 - Math.min(avgReaction / 2000, 0.5)));
          }
        }
        
        return {
          tarih: item.tarih ? new Date(item.tarih).toLocaleDateString("tr-TR") : "Tarih yok",
          hiz: hiz !== null ? hiz : calculatedHiz
        };
      })
      .filter(item => item.hiz !== null && item.hiz !== undefined);

    if (ogrenmeHizlari.length === 0) {
      console.warn("⚠ Öğrenme hızı verisi bulunamadı");
      return;
    }

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "line",
      data: {
        labels: ogrenmeHizlari.map(item => item.tarih),
        datasets: [{
          label: "Öğrenme Hızı",
          data: ogrenmeHizlari.map(item => item.hiz),
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 2,
          fill: true
        }]
      },
      options: {
        scales: {
          y: {
            min: 0,
            max: 100
          }
        }
      }
    });
  } catch (err) {
    console.warn("⚠ Öğrenme hızı grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 10) ALAN BAZLI SKOR TABLOSU
// -------------------------------------------------------------
function alanTablo(data) {
  const tbody = document.getElementById("alanTabloBody");
  if (!tbody) return;

  const alanlar = Object.keys(BRAIN_AREAS || {});
  if (alanlar.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>Veri bulunamadı.</td></tr>";
    return;
  }

  let html = "";
  alanlar.forEach(alanKey => {
    const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
    const skorlar = data
      .map(item => {
        // Önce yeni formattan al
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eski format kontrolü (skorlar objesi)
        if (item.skorlar && item.skorlar[alanKey]) {
          return item.skorlar[alanKey];
        }
        
        // Eğer hiç veri yoksa, trials'dan hesapla
        if (item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const total = item.trials.length;
          const dogru = item.trials.filter(t => t.correct).length;
          const accuracy = total > 0 ? dogru / total : 0;
          const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 1000), 0) / total;
          const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
          
          // Alan bazlı skor hesaplama (basit versiyon)
          let skor = 0;
          if (alanKey === "attention") {
            skor = Math.round(accuracy * 60 + reactionScore * 0.4);
          } else if (alanKey === "perception") {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          } else if (alanKey === "executive") {
            skor = Math.round(accuracy * 50 + reactionScore * 0.5);
          } else if (alanKey === "logic") {
            skor = Math.round(accuracy * 80 + reactionScore * 0.2);
          } else {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          }
          return skor;
        }
        
        return 0;
      })
      .filter(s => s > 0);
    
    const sonSkor = skorlar.length > 0 ? skorlar[skorlar.length - 1] : 0;
    const ortalama = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
    
    const trend = skorlar.length >= 2 
      ? (sonSkor > skorlar[0] ? "📈" : sonSkor < skorlar[0] ? "📉" : "➖")
      : "➖";
    
    const gunlukHayat = BRAIN_AREAS[alanKey]?.gunlukHayat || "-";

    html += `<tr>
      <td>${alanAd}</td>
      <td>${Math.round(sonSkor)}</td>
      <td>${Math.round(ortalama)}</td>
      <td>${trend}</td>
      <td>${gunlukHayat}</td>
    </tr>`;
  });

  tbody.innerHTML = html || "<tr><td colspan='5'>Veri bulunamadı.</td></tr>";
  console.log("📊 Alan tablosu oluşturuldu,", alanlar.length, "alan");
}

// -------------------------------------------------------------
// 11) HATA TÜRLERİ DAĞILIMI
// -------------------------------------------------------------
function hataTurleriGrafik(data) {
  try {
    const canvas = document.getElementById("hataTurleriChart");
    if (!canvas || !window.Chart || data.length === 0) return;

    const hataToplam = {
      impulsivite: 0,
      karistirma: 0,
      dikkatsizlik: 0
    };

    data.forEach(item => {
      const hatalar = item.temel_skor?.hataTurleri || {};
      hataToplam.impulsivite += hatalar.impulsivite || 0;
      hataToplam.karistirma += hatalar.karistirma || 0;
      hataToplam.dikkatsizlik += hatalar.dikkatsizlik || 0;
    });

    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["İmpulsivite", "Karıştırma", "Dikkatsizlik"],
        datasets: [{
          data: [
            hataToplam.impulsivite,
            hataToplam.karistirma,
            hataToplam.dikkatsizlik
          ],
          backgroundColor: ["#e53935", "#ff9800", "#fbc02d"]
        }]
      }
    });
  } catch (err) {
    console.warn("⚠ Hata türleri grafiği çizilemedi:", err);
  }
}

// -------------------------------------------------------------
// 12) GÜÇLÜ VE ZAYIF ALANLAR
// -------------------------------------------------------------
function gucluVeZayifAnaliz(data) {
  const gucluListe = document.getElementById("gucluYonler");
  const zayifListe = document.getElementById("gelistirilecekYonler");
  if (!gucluListe || !zayifListe) return;

  const alanSkorlari = {};
  const alanlar = Object.keys(BRAIN_AREAS || {});

  alanlar.forEach(alanKey => {
    const skorlar = data
      .map(item => {
        // Önce yeni formattan al
        if (item.coklu_alan && item.coklu_alan[alanKey]) {
          return item.coklu_alan[alanKey];
        }
        
        // Eski format kontrolü (skorlar objesi)
        if (item.skorlar && item.skorlar[alanKey]) {
          return item.skorlar[alanKey];
        }
        
        // Eğer hiç veri yoksa, trials'dan hesapla
        if (item.trials && Array.isArray(item.trials) && item.trials.length > 0) {
          const total = item.trials.length;
          const dogru = item.trials.filter(t => t.correct).length;
          const accuracy = total > 0 ? dogru / total : 0;
          const avgReaction = item.trials.reduce((sum, t) => sum + (t.reaction_ms || 1000), 0) / total;
          const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 20)));
          
          // Alan bazlı skor hesaplama (basit versiyon)
          let skor = 0;
          if (alanKey === "attention") {
            skor = Math.round(accuracy * 60 + reactionScore * 0.4);
          } else if (alanKey === "perception") {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          } else if (alanKey === "executive") {
            skor = Math.round(accuracy * 50 + reactionScore * 0.5);
          } else if (alanKey === "logic") {
            skor = Math.round(accuracy * 80 + reactionScore * 0.2);
          } else {
            skor = Math.round(accuracy * 70 + reactionScore * 0.3);
          }
          return skor;
        }
        
        return 0;
      })
      .filter(s => s > 0);
    alanSkorlari[alanKey] = skorlar.length > 0 
      ? Math.round(skorlar.reduce((a, b) => a + b, 0) / skorlar.length)
      : 0;
  });

  const siralanmis = Object.entries(alanSkorlari)
    .sort((a, b) => b[1] - a[1]);

  const guclu = siralanmis.filter(([_, skor]) => skor >= 70).slice(0, 5);
  const zayif = siralanmis.filter(([_, skor]) => skor < 50).slice(-5).reverse();

  gucluListe.innerHTML = guclu.length > 0
    ? guclu.map(([key, skor]) => 
        `<li>${BRAIN_AREAS[key]?.ad || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";

  zayifListe.innerHTML = zayif.length > 0
    ? zayif.map(([key, skor]) => 
        `<li>${BRAIN_AREAS[key]?.ad || key}: ${skor}/100</li>`
      ).join("")
    : "<li>Henüz yeterli veri yok.</li>";
}

// -------------------------------------------------------------
// 13) AI ÖNERİ MOTORU
// -------------------------------------------------------------
function aiOneri(data) {
  const oneriDiv = document.getElementById("aiOneri");
  if (!oneriDiv || data.length === 0) {
    if (oneriDiv) oneriDiv.innerHTML = "<p>Analiz için yeterli veri yok.</p>";
    return;
  }

  const son = data.at(-1);
  if (!son) {
    if (oneriDiv) oneriDiv.innerHTML = "<p>Analiz için yeterli veri yok.</p>";
    return;
  }
  
  const oneri = aiAdvice(son);
  oneriDiv.innerHTML = `<p>${oneri.replace(/\n/g, "<br>")}</p>`;
}

// -------------------------------------------------------------
// 14) RADAR GRAFİĞİ KARŞILAŞTIRMA
// -------------------------------------------------------------
function compareGrafik(data) {
  try {
    const canvas = document.getElementById("compareChart");
    if (!canvas || data.length < 2) return;

    const sonItem = data.at(-1);
    if (!sonItem) return;
    const son = sonItem.skorlar || {};

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
// 15) EVENTLER
// -------------------------------------------------------------
oyunFiltre?.addEventListener("change", filtrele);
tarihFiltre?.addEventListener("change", filtrele);

// -------------------------------------------------------------
// 16) BAŞLAT
// -------------------------------------------------------------
if (role === ROLES.OGRETMEN || role === ROLES.INSTITUTION || role === ROLES.ADMIN) {
  yukleFirestoreGecmis();
} else if (role === ROLES.OGRENCI) {
  yukleOgrenciGecmis();
} else {
  yukleLocalGecmis();
}

console.log("📊 analiz.js yüklendi (v8.0 — Yeni Şema Desteği)");
