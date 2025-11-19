// ==================================================================
// 📌 Zihin Platformu — Ortak Sonuç JS (v8.0 - Yeni Şema Desteği)
// 4 Sekmeli Analiz: Temel Skor, Çoklu Alan, Oyun Özel, Performans
// ==================================================================

import { GLOBAL, ROLES, BRAIN_AREAS, GUNLUK_HAYAT_KARSILIKLARI } from "./globalConfig.js";
import { aiAdvice } from "../engine/aiAdvisor.js";
import { addComment, getCommentsByGameResult, updateComment, deleteComment } from "../data/commentService.js";

// ==================================================================
// 🔵 GLOBAL SEKME DEĞİŞTİRME FONKSİYONU (HTML onclick için)
// ==================================================================
// Not: Bu fonksiyon artık sonuc.html'de inline script olarak tanımlı
// Burada sadece referans olarak bırakıldı (gerekirse kullanılabilir)

// -------------------------------------------------------------
// 1) 📌 Rol & Öğrenci Erişim Kontrolü
// -------------------------------------------------------------
const role = localStorage.getItem("role");
const aktifOgrenciId = localStorage.getItem("aktifOgrenciId");

if (role === ROLES.OGRETMEN && !aktifOgrenciId) {
  alert("ℹ Önce bir öğrenci seçmeniz gerekiyor.");
  window.location.href = "teacher_panel.html";
  throw new Error("Öğretmen öğrenci seçmeden sonuç ekranına erişemez.");
}

if (role === ROLES.ADMIN || role === ROLES.EDITOR) {
  alert("⛔ Bu ekran admin/editor için kapalıdır.");
  window.location.href = "index.html";
  throw new Error("Admin/Editor yetkisiz sonuç ekranı erişimi.");
}

// -------------------------------------------------------------
// 2) 📌 Yerel Oyun Geçmişi → Son Kayıt
// -------------------------------------------------------------
let gecmis;
try {
  gecmis = JSON.parse(localStorage.getItem("oyunGecmisi")) || [];
  if (!Array.isArray(gecmis)) throw 0;
} catch {
  console.warn("⚠ oyunGecmisi bozuk → sıfırlandı.");
  gecmis = [];
}

const son = gecmis.at(-1);

if (!son) {
  alert("Henüz bir oyun sonucu kayıtlı değil.");
  window.location.href = "index.html";
  throw new Error("Sonuç bulunamadı.");
}

// -------------------------------------------------------------
// 3) 📌 Oyun Adı & Meta
// -------------------------------------------------------------
const oyunKod = son.oyun || "bilinmiyor";
const oyunAdi = GLOBAL.OYUN_ADLARI?.[oyunKod] || 
                (oyunKod && oyunKod !== "bilinmiyor" ? oyunKod.replace(/_/g, " ").toUpperCase() : "Oyun Sonucu");
const oyunBaslikEl = document.getElementById("oyunBaslik");
if (oyunBaslikEl) oyunBaslikEl.textContent = oyunAdi;

// Oyun meta bilgisi (GAME_MAP'ten)
const oyunMeta = GLOBAL.GAME_MAP?.[oyunKod] || {};

// -------------------------------------------------------------
// 4) 📌 Sekme Yönetimi ve Tüm İçerik Yükleme
// -------------------------------------------------------------
function initSonucSayfasi() {
  // İçerikleri yükle
  yukleTemelSkor();
  yukleCokluAlan();
  yukleOyunOzel();
  yuklePerformans();
}

// -------------------------------------------------------------
// 5) 📌 1. TEMEL SKOR SEKMESİ
// -------------------------------------------------------------
function yukleTemelSkor() {
  console.log("yukleTemelSkor çağrıldı, son:", son);
  
  const temelSkor = son.temel_skor || {};
  const dogruEl = document.getElementById("dogru");
  const yanlisEl = document.getElementById("yanlis");
  const sureEl = document.getElementById("sure");
  const ortalamaTepkiEl = document.getElementById("ortalamaTepki");
  const ogrenmeHiziEl = document.getElementById("ogrenmeHizi");
  const tarihEl = document.getElementById("tarih");

  console.log("Elementler:", { dogruEl, yanlisEl, sureEl, ortalamaTepkiEl, ogrenmeHiziEl, tarihEl });

  // Doğru ve yanlış sayıları
  const dogruSayi = son.dogru ?? temelSkor.dogru ?? 0;
  const yanlisSayi = son.yanlis ?? temelSkor.yanlis ?? 0;
  
  if (dogruEl) {
    dogruEl.textContent = dogruSayi;
    console.log("Doğru sayısı yazıldı:", dogruSayi);
  } else {
    console.error("dogru elementi bulunamadı!");
  }
  
  if (yanlisEl) {
    yanlisEl.textContent = yanlisSayi;
    console.log("Yanlış sayısı yazıldı:", yanlisSayi);
  } else {
    console.error("yanlis elementi bulunamadı!");
  }
  
  // Süre
  const sureDegeri = temelSkor.sure || son.sure || 0;
  if (sureEl) {
    sureEl.textContent = sureDegeri > 0 ? `${sureDegeri} saniye` : "-";
    console.log("Süre yazıldı:", sureDegeri);
  }
  
  // Ortalama tepki süresi
  const ortalamaTepkiMs = temelSkor.ortalamaTepki || temelSkor.reaction_avg || null;
  if (ortalamaTepkiEl) {
    ortalamaTepkiEl.textContent = ortalamaTepkiMs ? `${Math.round(ortalamaTepkiMs)} ms` : "-";
    console.log("Ortalama tepki yazıldı:", ortalamaTepkiMs);
  }
  
  // Öğrenme hızı
  const ogrenmeHiziDegeri = temelSkor.ogrenmeHizi || temelSkor.learning_velocity || null;
  if (ogrenmeHiziEl) {
    ogrenmeHiziEl.textContent = ogrenmeHiziDegeri !== null ? `${ogrenmeHiziDegeri} / 100` : "-";
    console.log("Öğrenme hızı yazıldı:", ogrenmeHiziDegeri);
  }
  
  // Tarih
  if (tarihEl) {
    const tarih = son.tarih ? new Date(son.tarih) : new Date();
    tarihEl.textContent = tarih.toLocaleString("tr-TR");
    console.log("Tarih yazıldı:", tarih);
  }

  // Bilişsel bileşenler
  const skor = son.skorlar || {};
  const reaction = Math.round(skor.reaction_speed ?? 0);
  const inhib = Math.round(skor.inhibitory_control ?? 0);
  const sustain = Math.round(skor.sustained_attention ?? 0);

  const reactionSpeedEl = document.getElementById("reactionSpeed");
  const inhibControlEl = document.getElementById("inhibControl");
  const sustainedAttentionEl = document.getElementById("sustainedAttention");

  if (reactionSpeedEl) {
    reactionSpeedEl.textContent = `${reaction} / 100`;
    console.log("Tepki hızı yazıldı:", reaction);
  }
  if (inhibControlEl) {
    inhibControlEl.textContent = `${inhib} / 100`;
    console.log("İnhibisyon yazıldı:", inhib);
  }
  if (sustainedAttentionEl) {
    sustainedAttentionEl.textContent = `${sustain} / 100`;
    console.log("Dikkat sürekliliği yazıldı:", sustain);
  }

  // Günlük hayat karşılığı (Temel)
  const gunlukHayatTemel = document.getElementById("gunlukHayatTemel");
  if (gunlukHayatTemel && ortalamaTepkiMs) {
    const ms = ortalamaTepkiMs;
    let yorum = "";
    if (ms < 400) yorum = "⚡ Karar verme hızın çok iyi. Günlük hayatta hızlı tepki gerektiren durumlarda başarılısın.";
    else if (ms < 600) yorum = "⚡ Karar verme hızın normal seviyede. Pratikle daha da gelişebilir.";
    else yorum = "⚡ Karar verme hızın düşük. Acele etmeden düşünerek karar vermek faydalı olacaktır.";
    gunlukHayatTemel.textContent = yorum;
    gunlukHayatTemel.style.display = "block";
  }

  // Bar Grafik
  const skorCanvas = document.getElementById("skorGrafik");
  if (skorCanvas && window.Chart) {
    // Önceki chart'ı destroy et (varsa)
    const existingChart = Chart.getChart(skorCanvas);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(skorCanvas, {
      type: "bar",
      data: {
        labels: ["Doğru", "Yanlış"],
        datasets: [{
            data: [dogruSayi, yanlisSayi],
            backgroundColor: ["#4A90E2", "#E53935"],
            borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  
  console.log("✅ yukleTemelSkor tamamlandı");
}

// -------------------------------------------------------------
// 6) 📌 2. ÇOKLU ALAN SEKMESİ
// -------------------------------------------------------------
function yukleCokluAlan() {
  const cokluAlan = son.coklu_alan || {};
  const cokluAlanListe = document.getElementById("cokluAlanListe");

if (cokluAlanListe) {
  const alanlar = Object.keys(BRAIN_AREAS || {});
  if (alanlar.length === 0) {
    cokluAlanListe.innerHTML = "<p>Çoklu alan verisi henüz hesaplanmadı.</p>";
  } else {
    let html = "<ul style='list-style:none; padding:0;'>";
    alanlar.forEach(alanKey => {
      const skor = cokluAlan[alanKey] || 0;
      const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
      html += `<li style='padding:8px; margin:5px 0; background:#f5f5f5; border-radius:6px;'>
        <strong>${alanAd}:</strong> ${Math.round(skor)} / 100
      </li>`;
    });
    html += "</ul>";
    cokluAlanListe.innerHTML = html;
  }
}

// 12 Alan Radar Grafiği
const cokluAlanRadar = document.getElementById("cokluAlanRadar");
if (cokluAlanRadar && window.Chart) {
  // Önceki chart'ı destroy et (varsa)
  const existingChart = Chart.getChart(cokluAlanRadar);
  if (existingChart) {
    existingChart.destroy();
  }

  const alanlar = Object.keys(BRAIN_AREAS || {});
  const labels = alanlar.map(k => BRAIN_AREAS[k]?.ad || k).slice(0, 12);
  const data = alanlar.map(k => cokluAlan[k] || 0).slice(0, 12);

  new Chart(cokluAlanRadar, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Zihin Alanları",
        data,
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
}

// Günlük hayat karşılığı (Çoklu)
const gunlukHayatCoklu = document.getElementById("gunlukHayatCoklu");
if (gunlukHayatCoklu && Object.keys(cokluAlan).length > 0) {
  const enYuksek = Object.entries(cokluAlan).sort((a, b) => b[1] - a[1])[0];
  if (enYuksek) {
    const alanAd = BRAIN_AREAS[enYuksek[0]]?.ad || enYuksek[0];
    gunlukHayatCoklu.textContent = `💡 En güçlü alanın: ${alanAd} (${Math.round(enYuksek[1])}/100). Bu alan günlük hayatta problem çözme ve öğrenme süreçlerinde avantaj sağlar.`;
    gunlukHayatCoklu.style.display = "block";
  }
}

// -------------------------------------------------------------
// 7) 📌 3. OYUN ÖZEL SEKMESİ
// -------------------------------------------------------------
function yukleOyunOzel() {
  const oyunOzel = son.oyun_ozel || {};
  const oyunOzelListe = document.getElementById("oyunOzelListe");
  const oyunMeta = GLOBAL.GAME_MAP?.[oyunKod] || {};
  const temelSkor = son.temel_skor || {};

  if (oyunOzelListe) {
    // Oyun özel becerileri göster
    const oyunOzelBeceriler = oyunMeta.oyunOzelBeceriler || [];
    const hataTurleri = temelSkor.hataTurleri || {};
  
  let html = "";
  
  // Oyun özel beceriler
  if (oyunOzelBeceriler.length > 0) {
    html += "<h4 style='margin-top:0;'>🎯 Oyun Özel Beceriler</h4>";
    html += "<ul style='list-style:none; padding:0;'>";
    oyunOzelBeceriler.forEach(beceri => {
      // Performans key'lerinden ilgili değeri bul
      // Beceri ID'sini performans key'lerine eşleştir
      let deger = "-";
      const performansKeys = oyunMeta.performansKeys || [];
      
      // Önce doğrudan eşleşme dene
      if (oyunOzel[beceri.id]) {
        deger = oyunOzel[beceri.id];
      } else {
        // Performans key'lerinden ilgili olanı bul
        const ilgiliKey = performansKeys.find(k => k.includes(beceri.id) || beceri.id.includes(k.split('_')[0]));
        if (ilgiliKey && oyunOzel[ilgiliKey]) {
          deger = oyunOzel[ilgiliKey];
        }
      }
      
      const skor = typeof deger === 'number' ? Math.round(deger) : deger;
      const birim = typeof deger === 'number' && (beceri.id.includes('accuracy') || beceri.id.includes('score')) ? '%' : 
                    beceri.id.includes('time') ? ' ms' : '';
      html += `<li style='padding:10px; margin:8px 0; background:#f0f8ff; border-radius:8px; border-left:4px solid #4a90e2;'>
        <strong>${beceri.ad}:</strong> <span style='color:#1e88e5;font-weight:600;'>${skor}${birim}</span>
      </li>`;
    });
    html += "</ul>";
  }
  
  // Performans metrikleri
  if (Object.keys(oyunOzel).length > 0) {
    html += "<h4 style='margin-top:20px;'>📊 Performans Metrikleri</h4>";
    html += "<ul style='list-style:none; padding:0;'>";
    Object.entries(oyunOzel).forEach(([key, value]) => {
      const keyAd = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const skor = typeof value === 'number' ? Math.round(value) : value;
      const birim = key.includes('accuracy') || key.includes('score') || key.includes('discrimination') ? '%' : 
                    key.includes('time') ? ' ms' : 
                    key.includes('speed') ? ' işlem/sn' : '';
      html += `<li style='padding:8px; margin:5px 0; background:#f5f5f5; border-radius:6px;'>
        <strong>${keyAd}:</strong> ${skor}${birim}
      </li>`;
    });
    html += "</ul>";
  }
  
  // Hata türleri analizi
  if (Object.keys(hataTurleri).length > 0 && hataTurleri.toplam > 0) {
    html += "<h4 style='margin-top:20px;'>⚠️ Hata Türleri Analizi</h4>";
    html += "<ul style='list-style:none; padding:0;'>";
    if (hataTurleri.impulsivite > 0) {
      const yuzde = Math.round((hataTurleri.impulsivite / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#fff3cd; border-radius:6px; border-left:4px solid #ffc107;'>
        <strong>İmpulsivite (Acelecilik):</strong> ${hataTurleri.impulsivite} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Çok hızlı tepki vererek hata yapma</div>
      </li>`;
    }
    if (hataTurleri.karistirma > 0) {
      const yuzde = Math.round((hataTurleri.karistirma / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#ffe0b2; border-radius:6px; border-left:4px solid #ff9800;'>
        <strong>Karıştırma:</strong> ${hataTurleri.karistirma} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Benzer öğeleri ayırt edememe</div>
      </li>`;
    }
    if (hataTurleri.dikkatsizlik > 0) {
      const yuzde = Math.round((hataTurleri.dikkatsizlik / hataTurleri.toplam) * 100);
      html += `<li style='padding:8px; margin:5px 0; background:#ffcdd2; border-radius:6px; border-left:4px solid #f44336;'>
        <strong>Dikkatsizlik:</strong> ${hataTurleri.dikkatsizlik} hata (${yuzde}%)
        <div style='font-size:12px;color:#666;margin-top:4px;'>Odaklanma eksikliği</div>
      </li>`;
    }
    html += "</ul>";
  }
  
  if (html === "") {
    html = "<p>Bu oyun için özel performans metrikleri henüz hesaplanmadı.</p>";
  }
  
    oyunOzelListe.innerHTML = html;
  }

  // Günlük hayat karşılığı (Oyun Özel)
  const gunlukHayatOyun = document.getElementById("gunlukHayatOyun");
  if (gunlukHayatOyun && Object.keys(oyunOzel).length > 0) {
    let gunlukHayatMetni = "💡 <strong>Günlük Hayat Karşılığı:</strong><br>";
    
    // Her performans metrik için günlük hayat karşılığını bul
    Object.keys(oyunOzel).forEach(key => {
      const karsilik = GUNLUK_HAYAT_KARSILIKLARI[key] || 
                       Object.values(GUNLUK_HAYAT_KARSILIKLARI).find(k => k.metrik === key);
      if (karsilik) {
        gunlukHayatMetni += `• ${karsilik.karşılık}: ${karsilik.aciklama}<br>`;
      }
    });
    
    if (gunlukHayatMetni === "💡 <strong>Günlük Hayat Karşılığı:</strong><br>") {
      gunlukHayatMetni = "💡 Bu oyunun özel metrikleri, günlük hayattaki benzer görevlerdeki performansını yansıtır.";
    }
    
    gunlukHayatOyun.innerHTML = gunlukHayatMetni;
    gunlukHayatOyun.style.display = "block";
  }
}

// -------------------------------------------------------------
// 8) 📌 4. ZİHİN ALANLARI PERFORMANS SEKMESİ
// -------------------------------------------------------------
function yuklePerformans() {
  const cokluAlan = son.coklu_alan || {};
  const performansTabloBody = document.getElementById("performansTabloBody");
  if (performansTabloBody) {
    const alanlar = Object.keys(BRAIN_AREAS || {});
    if (alanlar.length === 0) {
      performansTabloBody.innerHTML = "<tr><td colspan='5'>Veri bulunamadı.</td></tr>";
    } else {
      let html = "";
      alanlar.forEach(alanKey => {
        const alanAd = BRAIN_AREAS[alanKey]?.ad || alanKey;
        const sonSkor = cokluAlan[alanKey] || 0;
        const ortalama = sonSkor; // Geçmiş verilerden hesaplanacak (şimdilik aynı)
        const trend = son.trendMeta?.trend || "➖";
        const gunlukHayat = BRAIN_AREAS[alanKey]?.gunlukHayat || "-";
        html += `<tr>
          <td>${alanAd}</td>
          <td>${Math.round(sonSkor)}</td>
          <td>${Math.round(ortalama)}</td>
          <td>${trend}</td>
          <td>${gunlukHayat}</td>
        </tr>`;
      });
      performansTabloBody.innerHTML = html;
    }
  }
}

// -------------------------------------------------------------
// 10) 💬 ÖĞRETMEN YORUMLARI SİSTEMİ
// -------------------------------------------------------------
const teacherID = localStorage.getItem("teacherID");
const studentId = role === ROLES.OGRENCI ? localStorage.getItem("uid") || localStorage.getItem("studentID") : aktifOgrenciId;
let currentGameResultId = null;

// Oyun sonucu ID'sini al (localStorage'dan veya son kayıttan)
if (son && son.id) {
  currentGameResultId = son.id;
} else {
  // Eğer ID yoksa, timestamp ve oyun kodundan oluştur
  currentGameResultId = `${son.oyun}_${son.timestamp || Date.now()}`;
}

// Öğretmen için yorum yazma alanını göster
if (role === ROLES.OGRETMEN && teacherID && studentId) {
  const yorumYazmaAlani = document.getElementById("yorumYazmaAlani");
  if (yorumYazmaAlani) {
    yorumYazmaAlani.style.display = "block";
  }

  const yorumGonderBtn = document.getElementById("yorumGonderBtn");
  if (yorumGonderBtn) {
    yorumGonderBtn.onclick = async () => {
      await yorumGonder();
    };
  }
}

// -------------------------------------------------------------
// 9) 📌 DOMContentLoaded - Tüm Sayfayı Başlat
// -------------------------------------------------------------
// Sekme yönetimini başlat (geriye uyumluluk için - onclick zaten HTML'de)
function initSekmeYonetimi() {
  console.log("initSekmeYonetimi çağrıldı (onclick zaten HTML'de)");
  // HTML'de onclick kullanıldığı için burada ek bir şey yapmaya gerek yok
}

// Sekme yönetimini ve içerikleri yükle
function baslatSayfa() {
  console.log("baslatSayfa çağrıldı, readyState:", document.readyState);
  console.log("son verisi:", son);
  
  // Önce içerikleri yükle
  initSonucSayfasi();
  
  // Sonra sekme yönetimini başlat
  initSekmeYonetimi();
  
  // Yorumları yükle
  yukleYorumlar();
}

// DOM hazır olduğunda çalıştır
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded tetiklendi");
    baslatSayfa();
  });
} else {
  // DOM zaten hazır
  console.log("DOM zaten hazır, hemen başlatılıyor");
  // setTimeout ile biraz bekle (header.js gibi diğer scriptler yüklenebilsin)
  setTimeout(() => {
    baslatSayfa();
  }, 300);
}

async function yukleYorumlar() {
  if (!studentId || !currentGameResultId) return;

  const yorumListesi = document.getElementById("yorumListesi");
  if (!yorumListesi) return;

  yorumListesi.innerHTML = "<p style='color:#999;text-align:center;'>Yorumlar yükleniyor...</p>";

  try {
    const yorumlar = await getCommentsByGameResult(studentId, currentGameResultId);

    if (!yorumlar.length) {
      yorumListesi.innerHTML = "<p style='color:#999;text-align:center;'>Henüz yorum yok.</p>";
      return;
    }

    yorumListesi.innerHTML = "";

    yorumlar.forEach(yorum => {
      const yorumDiv = document.createElement("div");
      yorumDiv.className = "yorum-item";

      const tarih = yorum.timestamp ? 
        new Date(yorum.timestamp).toLocaleString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) : "Tarih bilinmiyor";

      const isMyComment = role === ROLES.OGRETMEN && teacherID === yorum.teacherId;

      yorumDiv.innerHTML = `
        <div class="yorum-header">
          <div>
            <span class="yorum-ogretmen">👨‍🏫 ${yorum.teacherName || "Öğretmen"}</span>
            ${yorum.edited ? '<span style="font-size:11px;color:#999;margin-left:5px;">(Düzenlendi)</span>' : ''}
          </div>
          <div>
            <span class="yorum-tarih">${tarih}</span>
            ${isMyComment ? `
              <button class="yorum-duzenle-btn" data-comment-id="${yorum.id}">Düzenle</button>
              <button class="yorum-sil-btn" data-comment-id="${yorum.id}">Sil</button>
            ` : ''}
          </div>
        </div>
        <div class="yorum-text">${yorum.text}</div>
      `;

      // Düzenle ve sil butonları
      if (isMyComment) {
        const duzenleBtn = yorumDiv.querySelector(".yorum-duzenle-btn");
        const silBtn = yorumDiv.querySelector(".yorum-sil-btn");

        if (duzenleBtn) {
          duzenleBtn.onclick = () => yorumDuzenle(yorum.id, yorum.text);
        }

        if (silBtn) {
          silBtn.onclick = () => yorumSil(yorum.id);
        }
      }

      yorumListesi.appendChild(yorumDiv);
    });

  } catch (err) {
    console.error("❌ Yorumlar yüklenemedi:", err);
    yorumListesi.innerHTML = "<p style='color:#f44336;text-align:center;'>Yorumlar yüklenirken bir hata oluştu.</p>";
  }
}

async function yorumGonder() {
  const yorumInput = document.getElementById("yorumInput");
  if (!yorumInput || !teacherID || !studentId || !currentGameResultId) return;

  const text = yorumInput.value.trim();
  if (!text) {
    alert("Lütfen bir yorum yazın.");
    return;
  }

  const gonderBtn = document.getElementById("yorumGonderBtn");
  if (gonderBtn) {
    gonderBtn.disabled = true;
    gonderBtn.textContent = "Gönderiliyor...";
  }

  const result = await addComment(studentId, currentGameResultId, teacherID, text);

  if (gonderBtn) {
    gonderBtn.disabled = false;
    gonderBtn.textContent = "Yorum Gönder";
  }

  if (result.success) {
    yorumInput.value = "";
    await yukleYorumlar();
  } else {
    alert("Yorum gönderilemedi: " + result.message);
  }
}

async function yorumDuzenle(commentId, currentText) {
  const newText = prompt("Yorumu düzenleyin:", currentText);
  if (!newText || newText.trim() === currentText) return;

  const result = await updateComment(studentId, commentId, newText.trim(), teacherID);
  
  if (result.success) {
    await yukleYorumlar();
  } else {
    alert("Yorum güncellenemedi: " + result.message);
  }
}

async function yorumSil(commentId) {
  if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

  const result = await deleteComment(studentId, commentId, teacherID);
  
  if (result.success) {
    await yukleYorumlar();
  } else {
    alert("Yorum silinemedi: " + result.message);
  }
}

// -------------------------------------------------------------
// 11) 🔁 Eski Radar Grafik (Geriye Uyumluluk)
// -------------------------------------------------------------
const radarCanvas = document.getElementById("radarGrafik");
if (radarCanvas && window.Chart) {
  // Önceki chart'ı destroy et (varsa)
  const existingChart = Chart.getChart(radarCanvas);
  if (existingChart) {
    existingChart.destroy();
  }

  const scale = (window.devicePixelRatio || 1) * 1.25;
  radarCanvas.width = radarCanvas.clientWidth * scale;
  radarCanvas.height = radarCanvas.clientHeight * scale;
  const ctx = radarCanvas.getContext("2d");
  if (ctx) {
    ctx.scale(scale, scale);
  }

  new Chart(radarCanvas, {
    type: "radar",
    data: {
      labels: ["Tepki Hızı", "İnhibisyon", "Dikkat Sürekliliği"],
      datasets: [{
          label: "Bilişsel Profil",
          data: [reaction, inhib, sustain],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.25)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
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

console.log("📘 sonuc.js yüklendi (v8.0 — Yeni Şema Desteği)");
