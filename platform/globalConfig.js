// =============================================================
// 📌 ZİHİN PLATFORMU — globalConfig.js (Final Stabil v7.6)
// Kurum Sistemi + Çoklu Öğretmen Sistemi + Timeline desteği
// ANA MERKEZ — Tüm modüller bu dosyadan beslenir
// =============================================================

console.log("globalConfig.js yüklendi ✅");

// =============================================================
// 0) ROL SABITLERI — Router.js ile birebir uyumlu
// =============================================================
export const ROLES = {
  OGRENCI: "ogrenci",
  OGRETMEN: "ogretmen",
  ADMIN: "admin",
  EDITOR: "editor",
  INSTITUTION: "institution"   // ✔ Kurum paneli
};

// =============================================================
// 1) GLOBAL ANA OBJE
// =============================================================
export const GLOBAL = {

  // -----------------------------------------------------------
  // 1) ANA KLASÖRLER
  // -----------------------------------------------------------
  ROOT: "../",
  PLATFORM: "../platform/",
  OYUNLAR: "../oyunlar/",
  SESLER: "../sesler/",
  MANAGEMENT: "../management/",
  DATA: "../data/",

  // -----------------------------------------------------------
  // 2) LOCALSTORAGE ANAHTARLARI
  // -----------------------------------------------------------
  LS_KEYS: {
    UID: "uid",
    ROLE: "role",

    // Kurum & Çoklu Öğretmen Sistemi
    INSTITUTION_ID: "institutionID",
    TEACHER_IDS: "teacherIDs",

    // Öğrenci Sistemi
    AKTIF_KULLANICI: "aktifKullanici",
    AKTIF_OGRENCI: "aktifOgrenci",
    AKTIF_OGRENCI_ID: "aktifOgrenciId",

    // Oyun Sistemi
    AKTIF_OYUN: "aktifOyun",
    SON_OYUN: "sonOyun",
    OYUN_GECMISI: "oyunGecmisi",

    // Timeline için
    TEACHER_NAME: "teacherName"
  },

  // -----------------------------------------------------------
  // 3) FIRESTORE KOLEKSİYONLARI
  // -----------------------------------------------------------
  FIRESTORE: {
    PROFILES: "profiles",
    INSTITUTIONS: "institutions",
    TEACHERS: "teachers",
    STUDENTS: "students",
    GAMES: "games",
    RESULTS: "results"
  },

  // -----------------------------------------------------------
  // 4) OYUN KODLARI
  // -----------------------------------------------------------
  OYUN_KODLARI: {
    RENK_ESLEME: "renk_esleme",
    AYIRT_ETME: "ayirt_etme"
  },

  // -----------------------------------------------------------
  // 5) OYUN YOLLARI
  // -----------------------------------------------------------
  OYUN_YOLLARI: {
    renk_esleme: "../oyunlar/1_basamak_esleme/esleme.html",
    ayirt_etme: "../oyunlar/2_basamak_ayirt_etme/ayirtetme.html"
  },

  // -----------------------------------------------------------
  // 6) OYUN ADLARI
  // -----------------------------------------------------------
  OYUN_ADLARI: {
    renk_esleme: "Renk Eşleme",
    ayirt_etme: "Ayırt Etme"
  },

  // -----------------------------------------------------------
  // 7) SES DOSYALARI
  // -----------------------------------------------------------
  SES: {
    DOGRU: "../sesler/dogru.mp3",
    YANLIS: "../sesler/yanlis.mp3"
  },

  // -----------------------------------------------------------
  // 8) SONUÇ ŞEMASI — (Tüm sistem bu formatı kullanır)
  // -----------------------------------------------------------
  SONUC_SEMASI: {
    oyun: "",
    level: "",
    dogru: 0,
    yanlis: 0,
    sure: 0,
    tarih: "",
    beceriler: [],

    skorlar: {
      reaction_speed: 0,
      inhibitory_control: 0,
      sustained_attention: 0
    },

    // Yeni meta
    institutionID: "",
    teacherIDs: [],
    studentID: "",
    teacherName: ""
  },

  // -----------------------------------------------------------
  // 9) ANALİZ AYARLARI
  // -----------------------------------------------------------
  ANALIZ: {
    MAKS_GECMIS: 20,
    RADAR_MIN: 0,
    RADAR_MAX: 100
  },

  // -----------------------------------------------------------
  // 10) ROL DİZİNİ
  // -----------------------------------------------------------
  ROLES: ROLES,

  // -----------------------------------------------------------
  // 11) PANEL ROUTES
  // -----------------------------------------------------------
  ROUTES: {
    [ROLES.OGRENCI]: "../platform/index.html",
    [ROLES.OGRETMEN]: "../platform/teacher_panel.html",
    [ROLES.ADMIN]: "../platform/admin_panel.html",
    [ROLES.EDITOR]: "../platform/editor_panel.html",
    [ROLES.INSTITUTION]: "../platform/institution_panel.html"
  }
};

// =============================================================
// ✔ Final Notlar (v7.6)
// =============================================================
// • Kurum Sistemi %100 çalışır
// • Çoklu öğretmen sistemi aktif
// • Analiz, sonuç, hazırlık, oyun motoru uyumlu
// • Admin panel tam entegre
// • Önceki sürümlerle %100 uyumlu (kırılma yok)
// =============================================================