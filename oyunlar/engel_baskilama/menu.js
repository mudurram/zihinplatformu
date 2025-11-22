// ==========================================================
// 🎯 Engel Baskılama Oyun Listesi
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎮 OYUN LİSTESİ
// ==========================================================
const ENGEL_BASKILAMA_OYUNLARI = [
  {
    id: "kirmizida_dur_yesilde_bas",
    ad: "Kırmızıda Dur – Yeşilde Bas",
    aciklama: "Yeşil görünce bas, kırmızı görünce dur. 30 saniye içinde olabildiğince çok doğru tepki ver.",
    icon: "🚦"
  },
  {
    id: "yaniltici_oklar",
    ad: "Yanıltıcı Oklar",
    aciklama: "Okun yönüne değil, okun altında yazan yöne bas. Örnek: → (ok sağa) ama altında 'SOL' yazıyor → SOLa tıklanır.",
    icon: "↔️"
  },
  {
    id: "engelle_dusun",
    ad: "Engelle Düşün – Hızlı Karar",
    aciklama: "Ekranda hangi nesne daha küçükse ona bas. Bazen büyük nesne gözünü yanıltacak; sakın ona basma!",
    icon: "🎯"
  },
  {
    id: "aynisı_degil",
    ad: "Aynısı Değil – Farklıya Tıkla",
    aciklama: "Ekranda 3 nesne göreceksin. İkisi aynı, biri farklı. Görevin her zaman farklı olan nesneye tıklamak.",
    icon: "🔍"
  },
  {
    id: "yanlis_aliskanlik",
    ad: "Yanlış Alışkanlığı Baskıla (Yasaklı Simge)",
    aciklama: "Bazı nesneler yasak işaretlidir. Yasaklı simgeye asla basma! Diğerlerine basabilirsin.",
    icon: "🚫"
  },
  {
    id: "no_go_ses",
    ad: "Ses Geldiğinde Değil – Gelmediğinde Bas",
    aciklama: "Ekran boşken ses yoksa ekrana bas. Sesli uyarı gelirse hiç basma!",
    icon: "🔇"
  },
  {
    id: "ters_tepki",
    ad: "Ters Tepki Oyunu (BAS ↔ DUR)",
    aciklama: "Ekranda 'BAS' yazarsa dur. 'DUR' yazarsa bas. Her şey tam tersine!",
    icon: "🔄"
  },
  {
    id: "hizli_seri_yasakli",
    ad: "Hızlı Seri İçinde Yasaklı Öğe",
    aciklama: "Gelen tüm nesnelere bas. Ama yasaklı nesne gelirse hiç basma!",
    icon: "⚡"
  },
  {
    id: "gorev_degisti",
    ad: "Hayır! Görev Değişti",
    aciklama: "Görev oynarken değişebilir. Görev değiştiğinde ekranda kısa bildirim göreceksin. Değişen kurala göre tepki ver.",
    icon: "🔄"
  },
  {
    id: "capraz_tepki",
    ad: "Çapraz Tepki Hız Oyunu",
    aciklama: "Sol tarafta nesne görünürse sağa bas. Sağ tarafta nesne görünürse sola bas. Her şey ters!",
    icon: "↕️"
  }
];

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const liste = document.getElementById("oyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  ENGEL_BASKILAMA_OYUNLARI.forEach(oyun => {
    const kart = document.createElement("div");
    kart.className = "oyun-kart";
    kart.innerHTML = `
      <div class="oyun-bilgi">
        <h3 class="oyun-adi">${oyun.icon} ${oyun.ad}</h3>
        <p class="oyun-aciklama">${oyun.aciklama}</p>
      </div>
      <button class="oyna-btn" data-oyun-id="${oyun.id}">Oyna</button>
    `;
    
    const oynaBtn = kart.querySelector(".oyna-btn");
    oynaBtn.onclick = () => {
      localStorage.setItem("engelBaskilamaOyunId", oyun.id);
      localStorage.setItem("engelBaskilamaOyunAdi", oyun.ad);
      window.location.href = "hazirlik.html";
    };
    
    liste.appendChild(kart);
  });
});

