// ==========================================================
// 🎯 2. Basamak - Alt Oyun Seçim Ekranı
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";

// ==========================================================
// 🎨 ALT OYUN TANIMLARI
// ==========================================================
const ALT_OYUNLAR = {
  boyut: [
    { id: "buyuk_kucuk", ad: "Büyük – Küçük", icon: "📏" },
    { id: "uzun_kisa", ad: "Uzun – Kısa", icon: "📐" },
    { id: "ince_kalin", ad: "İnce – Kalın", icon: "📊" }
  ],
  konum_yon: [
    { id: "sag_sol", ad: "Sağ – Sol", icon: "↔️" },
    { id: "yukari_asagi", ad: "Yukarı – Aşağı", icon: "↕️" },
    { id: "on_arka", ad: "Ön – Arka", icon: "🔄" },
    { id: "yon_ok", ad: "Yön (Ok)", icon: "➡️" }
  ],
  miktar: [
    { id: "az_cok", ad: "Az – Çok", icon: "⚖️" },
    { id: "bos_dolu", ad: "Boş – Dolu", icon: "📦" },
    { id: "yarim_tam", ad: "Yarım – Tam", icon: "🥤" }
  ],
  sayi_tane: [
    { id: "sayi_karsilastirma", ad: "Sayı Karşılaştırma", icon: "🔢" },
    { id: "tane_sayma", ad: "Tane Sayma", icon: "🔢" },
    { id: "esit_fazla_az", ad: "Eşit / Fazla / Az", icon: "⚖️" }
  ],
  kategori: [
    { id: "hayvan_bitki", ad: "Hayvan – Bitki", icon: "🌳" },
    { id: "yiyecek_icecek", ad: "Yiyecek – İçecek", icon: "🍎" },
    { id: "tasit_esya", ad: "Taşıt – Eşya", icon: "🚗" },
    { id: "renk_sekil", ad: "Renk – Şekil", icon: "🎨" }
  ],
  duygu: [
    { id: "mutlu_uzgun", ad: "Mutlu – Üzgün", icon: "😊" },
    { id: "kizgin_sakin", ad: "Kızgın – Sakin", icon: "😠" },
    { id: "korkulu_guvenli", ad: "Korkulu – Güvenli", icon: "😨" }
  ],
  ses_isitsel: [
    { id: "yuksek_alcak", ad: "Yüksek – Alçak", icon: "🔊" },
    { id: "hizli_yavas", ad: "Hızlı – Yavaş", icon: "⏱️" },
    { id: "uzun_kisa_ses", ad: "Uzun – Kısa Ses", icon: "🎵" }
  ],
  mantiksal: [
    { id: "benzer_farkli", ad: "Benzer – Farklı", icon: "🔀" },
    { id: "ayni_farkli", ad: "Aynı – Farklı", icon: "🔄" },
    { id: "sebep_sonuc", ad: "Sebep – Sonuç", icon: "🧩" }
  ],
  doku_materyal: [
    { id: "yumusak_sert", ad: "Yumuşak – Sert", icon: "🧵" },
    { id: "purlu_dusuk", ad: "Pürüzlü – Düz", icon: "🪨" },
    { id: "isikli_karanlik", ad: "Işıklı – Karanlık", icon: "💡" }
  ],
  gunluk_yasam: [
    { id: "temiz_kirli", ad: "Temiz – Kirli", icon: "🧼" },
    { id: "soguk_sicak", ad: "Soğuk – Sıcak", icon: "🌡️" },
    { id: "ac_tok", ad: "Aç – Tok", icon: "🍽️" },
    { id: "uykulu_uyanik", ad: "Uykulu – Uyanık", icon: "😴" },
    { id: "yaz_kis", ad: "Yaz – Kış", icon: "🌦️" },
    { id: "gunduz_gece", ad: "Gündüz – Gece", icon: "🌅" },
    { id: "hava_durumu", ad: "Hava Durumu", icon: "🌤️" }
  ],
  sira_dizilim: [
    { id: "sira_sayisi", ad: "Sıra Sayısı", icon: "🔢" },
    { id: "once_sonra", ad: "Önce – Sonra", icon: "⏰" },
    { id: "ilk_son", ad: "İlk – Son", icon: "1️⃣" }
  ],
  renk: [
    { id: "renk_ayirt", ad: "Renk Ayırt Etme", icon: "🎨" }
  ]
};

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const kategoriId = localStorage.getItem("ayirtEtmeKategori");
  if (!kategoriId) {
    alert("Kategori seçilmedi. Ana menüye yönlendiriliyorsunuz.");
    window.location.href = "menu.html";
    return;
  }

  const kategoriAdlari = {
    boyut: "Boyut Ayırt Etme",
    konum_yon: "Konum – Yön Ayırt Etme",
    miktar: "Miktar Ayırt Etme",
    sayi_tane: "Sayı/Tane Ayırt Etme",
    kategori: "Kategori Ayırt Etme",
    duygu: "Duygu Ayırt Etme",
    ses_isitsel: "Ses / İşitsel Ayırt Etme",
    mantiksal: "Mantıksal Ayırt Etme",
    doku_materyal: "Doku / Materyal Ayırt Etme",
    gunluk_yasam: "Günlük Yaşam – Kavram Ayırt Etme",
    sira_dizilim: "Sıra / Dizilim Ayırt Etme",
    renk: "Renk Ayırt Etme"
  };

  const baslik = document.getElementById("kategoriBaslik");
  if (baslik) {
    baslik.textContent = kategoriAdlari[kategoriId] || "Alt Oyunlar";
  }

  const altOyunlar = ALT_OYUNLAR[kategoriId] || [];
  const liste = document.getElementById("altOyunListesi");
  if (!liste) return;

  liste.innerHTML = "";

  if (altOyunlar.length === 0) {
    liste.innerHTML = "<p style='text-align:center;color:#999;padding:40px;'>Bu kategori için alt oyun tanımlanmamış.</p>";
    return;
  }

  altOyunlar.forEach(oyun => {
    const kart = document.createElement("div");
    kart.className = "kategori-kart";
    kart.innerHTML = `
      <div class="kategori-icon">${oyun.icon}</div>
      <div class="kategori-ad">${oyun.ad}</div>
    `;
    kart.onclick = () => {
      localStorage.setItem("ayirtEtmeAltOyun", oyun.id);
      localStorage.setItem("ayirtEtmeKategori", kategoriId);
      window.location.href = "ayirtetme.html";
    };
    liste.appendChild(kart);
  });
});

