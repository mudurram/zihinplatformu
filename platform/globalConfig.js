// =============================================================
// 📌 ZİHİN PLATFORMU — globalConfig.js (Final Stabil v7.6)
// Kurum Sistemi + Çoklu Öğretmen Sistemi + Timeline desteği
// ANA MERKEZ — Tüm modüller bu dosyadan beslenir
// =============================================================

console.log("globalConfig.js yüklendi ✅");

// =============================================================
// 🧠 Zihin Alanı Kataloğu — Sprint 1 veri modeli
// =============================================================
export const BRAIN_AREAS = {
  attention: {
    id: "attention",
    ad: "Dikkat",
    renk: "#f39c12",
    tanim: "Seçici, sürdürülen, bölünmüş dikkat ve tepki kontrolü.",
    gunlukHayat: "Günlük hayatta dikkat gerektiren görevlerde başarılı olma, odaklanma ve dikkat dağınıklığını önleme."
  },
  memory: {
    id: "memory",
    ad: "Hafıza",
    renk: "#9b59b6",
    tanim: "Görsel, işitsel, çalışma ve sıralama hafızası.",
    gunlukHayat: "Bilgileri hatırlama, öğrenilenleri saklama ve gerektiğinde geri çağırma becerisi."
  },
  perception: {
    id: "perception",
    ad: "Algısal İşlemleme",
    renk: "#1abc9c",
    tanim: "Görsel tarama, mekansal seçicilik ve hızlı işlemleme.",
    gunlukHayat: "Görsel ve işitsel bilgileri hızlı ve doğru işleme, detayları fark etme."
  },
  executive: {
    id: "executive",
    ad: "Yürütücü İşlev",
    renk: "#e67e22",
    tanim: "Planlama, kural değiştirme, inhibisyon ve karar verme.",
    gunlukHayat: "Görevleri planlama, organize olma, dürtüleri kontrol etme ve hedefe odaklanma."
  },
  logic: {
    id: "logic",
    ad: "Mantıksal Düşünme",
    renk: "#2ecc71",
    tanim: "İlişki kurma, akıl yürütme ve örüntü tanıma.",
    gunlukHayat: "Problem çözme, mantıksal bağlantılar kurma ve analitik düşünme."
  },
  literacy: {
    id: "literacy",
    ad: "Okuma - Dil",
    renk: "#3498db",
    tanim: "Kelime tanıma, akıcı okuma, anlamlandırma.",
    gunlukHayat: "Okuma akıcılığı, kelime bilgisi ve dil becerilerinde başarı."
  },
  dyslexia: {
    id: "dyslexia",
    ad: "Disleksi Destek",
    renk: "#8e44ad",
    tanim: "Harf-ses eşleme, fonolojik farkındalık ve görsel takip.",
    gunlukHayat: "Okuma zorluklarını aşma, harf-ses ilişkilerini anlama ve görsel takip becerisi."
  },
  writing: {
    id: "writing",
    ad: "Yazı - Motor",
    renk: "#c0392b",
    tanim: "İnce motor, çizgi yönü, harf formasyonu.",
    gunlukHayat: "Yazı yazma becerisi, el-göz koordinasyonu ve ince motor kontrolü."
  },
  math: {
    id: "math",
    ad: "Matematik",
    renk: "#16a085",
    tanim: "Sayı belleği, mantıksal çözüm, zihinden işlem.",
    gunlukHayat: "Matematiksel işlemler, sayı kavramı ve problem çözme becerisi."
  },
  emotional: {
    id: "emotional",
    ad: "Duygusal Farkındalık",
    renk: "#d35400",
    tanim: "Yüz ifadeleri, duygu adlandırma, yoğunluk analizi.",
    gunlukHayat: "Duyguları tanıma, ifade etme ve yönetme becerisi."
  },
  social: {
    id: "social",
    ad: "Sosyal Biliş",
    renk: "#2980b9",
    tanim: "Empati, ortak dikkat, niyet okuma, zihin kuramı.",
    gunlukHayat: "Sosyal ilişkiler, empati kurma ve sosyal durumları anlama."
  },
  comprehension: {
    id: "comprehension",
    ad: "Anlama",
    renk: "#7f8c8d",
    tanim: "Okuduğunu, dinlediğini ve görsel içerikleri anlama.",
    gunlukHayat: "Okuduğunu ve dinlediğini anlama, bilgileri yorumlama ve çıkarım yapma."
  }
};

export const SUBSKILLS = {
  attention: [
    { id: "secici_dikkat", ad: "Seçici Dikkat" },
    { id: "surekli_dikkat", ad: "Sürdürülen Dikkat" },
    { id: "bolunmus_dikkat", ad: "Bölünmüş Dikkat" },
    { id: "inhibisyon", ad: "İnhibisyon / Kontrol" },
    { id: "hizli_tepki", ad: "Hızlı Tepki" },
    { id: "esleme_dikkati", ad: "Eşleme Dikkati" },
    { id: "ayirt_etme", ad: "Ayırt Etme" }
  ],
  memory: [
    { id: "gorsel_hafiza", ad: "Görsel Hafıza" },
    { id: "sozel_hafiza", ad: "Sözel Hafıza" },
    { id: "calisma_bellegi", ad: "Çalışma Belleği" },
    { id: "isitsel_hafiza", ad: "İşitsel Hafıza" },
    { id: "cagrisimsal_hafiza", ad: "Çağrışımsal Hafıza" },
    { id: "mekansal_hafiza", ad: "Mekansal Hafıza" },
    { id: "sirali_hafiza", ad: "Sıralı Hafıza" }
  ],
  perception: [
    { id: "gorsel_tarama", ad: "Görsel Tarama" },
    { id: "mekansal_secicilik", ad: "Mekansal Seçicilik" },
    { id: "isitsel_ayirt", ad: "İşitsel Ayırt" },
    { id: "hizli_gorsel_islem", ad: "Hızlı Görsel İşleme" },
    { id: "sekil_zemin", ad: "Şekil-Zemin Ayırımı" },
    { id: "gorsel_motor", ad: "Görsel Motor Entegrasyon" }
  ],
  executive: [
    { id: "planlama", ad: "Planlama" },
    { id: "kural_degistirme", ad: "Kural Değiştirme" },
    { id: "tepki_baskilama", ad: "Tepki Baskılama" },
    { id: "problem_cozme", ad: "Problem Çözme" },
    { id: "karar_verme", ad: "Karar Verme" }
  ],
  logic: [
    { id: "iliski_kurma", ad: "İlişki Kurma" },
    { id: "akil_yurutme", ad: "Akıl Yürütme" },
    { id: "oruntu_tanima", ad: "Örüntü Tanıma" },
    { id: "siniflama", ad: "Sınıflama" },
    { id: "kosullu_mantik", ad: "Koşullu Mantık" }
  ],
  literacy: [
    { id: "sozcuk_tanima", ad: "Sözcük Tanıma" },
    { id: "akici_okuma", ad: "Akıcı Okuma" },
    { id: "anlamlandirma", ad: "Anlamlandırma" },
    { id: "ses_harf", ad: "Ses-Harf Farkındalığı" },
    { id: "sozcuk_bilgisi", ad: "Sözcük Bilgisi" },
    { id: "dilbilgisi", ad: "Dilbilgisel Yapı" }
  ],
  dyslexia: [
    { id: "harf_karistirma", ad: "Harf Karıştırma" },
    { id: "gorsel_takip", ad: "Görsel Takip" },
    { id: "fonolojik", ad: "Fonolojik Farkındalık" },
    { id: "ran", ad: "Hızlı İsimlendirme" }
  ],
  writing: [
    { id: "ince_motor", ad: "İnce Motor" },
    { id: "cizgi_yonu", ad: "Çizgi Yönü" },
    { id: "sekil_stabilitesi", ad: "Şekil Stabilitesi" },
    { id: "harf_formasyonu", ad: "Harf Formasyonu" },
    { id: "yazi_akiciligi", ad: "Yazı Akıcılığı" }
  ],
  math: [
    { id: "sayi_nesne", ad: "Sayı-Nesne Eşleme" },
    { id: "toplama_stratejisi", ad: "Toplama Stratejisi" },
    { id: "mantiksal_cozum", ad: "Mantıksal Çözüm" },
    { id: "temel_aritmetik", ad: "Temel Aritmetik" },
    { id: "sayi_oruntusu", ad: "Sayı Örüntüsü" },
    { id: "zihinden_islem", ad: "Zihinden İşlem" }
  ],
  emotional: [
    { id: "yuz_ifadesi", ad: "Yüz İfadesi Algı" },
    { id: "duygu_adlandirma", ad: "Duygu Adlandırma" },
    { id: "duygu_durum", ad: "Duygu-Durum Eşleme" },
    { id: "duygu_siddeti", ad: "Duygu Şiddeti" },
    { id: "empati_tepkisi", ad: "Empati Tepkisi" }
  ],
  social: [
    { id: "empati", ad: "Empati" },
    { id: "ortak_dikkat", ad: "Ortak Dikkat" },
    { id: "niyet_okuma", ad: "Niyet Okuma" },
    { id: "zihin_kurami", ad: "Zihin Kuramı" },
    { id: "sosyal_ipucu", ad: "Sosyal İpucu Algı" }
  ],
  comprehension: [
    { id: "okudugunu_anlama", ad: "Okuduğunu Anlama" },
    { id: "dinledigini_anlama", ad: "Dinlediğini Anlama" },
    { id: "sozel_anlama", ad: "Sözel Anlama" },
    { id: "gorsel_anlama", ad: "Görsel Anlama" },
    { id: "mantiksal_anlama", ad: "Mantıksal Anlama" }
  ]
};

export const PERFORMANCE_KEYS = {
  temel: ["dogru", "yanlis", "sure", "reaction_avg", "learning_velocity"],
  zihinselAlanlar: Object.keys(BRAIN_AREAS),
  hataTurleri: ["impulsivite", "karistirma", "dikkatsizlik"],
  oyunOzel: ["wpm", "pattern_score", "memory_span", "strategy_type"]
};

// =============================================================
// 🎮 OYUN HARİTASI — Her oyun hangi alanlara veri gönderir
// =============================================================
export const GAME_MAP = {
  renk_esleme: {
    id: "renk_esleme",
    ad: "Eşleme Oyunu (4 Bölüm)",
    kategori: "Dikkat",
    alan: "attention",
    altBeceri: "esleme_dikkati",
    // Bu oyun hangi zihinsel alanlara veri gönderir (3-7 modül)
    moduller: ["attention", "perception", "memory", "executive", "logic", "literacy", "social"],
    // Firebase'e kaydedilecek performans metrikleri
    performansKeys: [
      "match_accuracy", 
      "match_time", 
      "visual_discrimination_score",
      "renk_esleme_skor",
      "sekil_esleme_skor",
      "golge_esleme_skor",
      "parca_butun_skor",
      "kategori_esleme",
      "gorsel_tamamlama"
    ],
    path: "../oyunlar/1_basamak_esleme/esleme.html",
    // Oyun özel beceriler (Oyun Bazlı Özel Performans Sekmesi için)
    oyunOzelBeceriler: [
      { id: "renk_ayirt", ad: "Renk Ayırt Etme" },
      { id: "sekil_tanima", ad: "Şekil Tanıma" },
      { id: "gorsel_kalip", ad: "Görsel Kalıp Tanıma" },
      { id: "kategori_esleme", ad: "Kategori Eşleme" },
      { id: "gorsel_tamamlama", ad: "Görsel Tamamlama (Parça-Bütün)" },
      { id: "figur_zemin", ad: "Figür-Zemin Ayırma (Gölge)" },
      { id: "benzer_farkli", ad: "Benzer-Farklı Ayırt Etme" },
      { id: "detay_tarama", ad: "Detay Tarama Hızı" }
    ],
    // Hata türleri bu oyunda ölçülebilir
    hataTurleri: ["dikkatsizlik", "karistirma", "impulsivite"],
    // Çoklu alan skorları için ağırlıklar (0-1 arası)
    sonucMetrics: {
      coklu_alan: {
        attention: 0.9,
        perception: 0.95,
        memory: 0.7,
        executive: 0.8,
        logic: 0.75,
        literacy: 0.6,
        social: 0.5
      },
      oyun_ozel: [
        "renk_esleme_skor",
        "sekil_esleme_skor", 
        "golge_esleme_skor",
        "parca_butun_skor",
        "match_accuracy",
        "match_time",
        "visual_discrimination_score"
      ]
    }
  },
  ayirt_etme: {
    id: "ayirt_etme",
    ad: "Ayırt Etme",
    kategori: "Dikkat",
    alan: "attention",
    altBeceri: "ayirt_etme",
    // Bu oyun hangi zihinsel alanlara veri gönderir (3-7 modül)
    moduller: ["attention", "perception", "executive"],
    // Firebase'e kaydedilecek performans metrikleri
    performansKeys: [
      "difference_detect_accuracy", 
      "micro_discrimination", 
      "visual_discrimination",
      "reaction_speed",
      "inhibitory_control",
      "sustained_attention"
    ],
    path: "../oyunlar/2_basamak_ayirt_etme/menu.html",
    // Oyun özel beceriler (Oyun Bazlı Özel Performans Sekmesi için)
    oyunOzelBeceriler: [
      { id: "renk_ayirt", ad: "Renk Ayırt Etme" },
      { id: "boyut_ayirt", ad: "Boyut Ayırt Etme" },
      { id: "yon_ayirt", ad: "Yön Ayırt Etme" },
      { id: "miktar_ayirt", ad: "Miktar Ayırt Etme" },
      { id: "sayi_ayirt", ad: "Sayı Ayırt Etme" },
      { id: "kategori_ayirt", ad: "Kategori Ayırt Etme" },
      { id: "duygu_ayirt", ad: "Duygu Ayırt Etme" },
      { id: "mantiksal_ayirt", ad: "Mantıksal Ayırt Etme" },
      { id: "gunluk_yasam_ayirt", ad: "Günlük Yaşam Ayırt Etme" }
    ],
    // Hata türleri bu oyunda ölçülebilir
    hataTurleri: ["karistirma", "dikkatsizlik", "impulsivite"],
    // Çoklu alan skorları için ağırlıklar
    sonucMetrics: {
      coklu_alan: {
        attention: 0.9,
        perception: 0.85,
        executive: 0.8
      },
      oyun_ozel: [
        "reaction_speed",
        "inhibitory_control",
        "sustained_attention",
        "difference_detect_accuracy"
      ]
    }
  },
  hizli_tiklama: {
    id: "hizli_tiklama",
    ad: "Hızlı Tıklama",
    kategori: "Dikkat",
    alan: "attention",
    altBeceri: "hizli_tepki",
    moduller: ["attention", "executive"],
    performansKeys: ["reaction_time", "processing_speed"],
    path: "../oyunlar/hizli_tiklama/index.html",
    oyunOzelBeceriler: [
      { id: "tepki_hizi", ad: "Tepki Hızı" },
      { id: "islem_hizi", ad: "İşlem Hızı" }
    ],
    hataTurleri: ["impulsivite"],
    status: "planned"
  }
};

// =============================================================
// 📊 GÜNLÜK HAYAT KARŞILIĞI EŞLEŞTİRMELERİ
// =============================================================
export const GUNLUK_HAYAT_KARSILIKLARI = {
  tepki_suresi: {
    metrik: "reaction_avg",
    karşılık: "Karar verme hızı",
    aciklama: "Günlük hayatta hızlı karar verme ve tepki gösterme becerisi"
  },
  hata_tipi: {
    metrik: "hata_turleri",
    karşılık: "Dikkatsizlik/Acelecilik ayırımı",
    aciklama: "Hata türüne göre günlük davranışlardaki dikkat seviyesi"
  },
  calisma_bellegi: {
    metrik: "memory_span",
    karşılık: "Yönerge takibi",
    aciklama: "Günlük hayatta verilen yönergeleri hatırlama ve uygulama"
  },
  wpm: {
    metrik: "wpm",
    karşılık: "Okuma hızı / Sınav başarısı",
    aciklama: "Okuma hızı akademik başarıyı doğrudan etkiler"
  },
  mantik: {
    metrik: "logic_score",
    karşılık: "Problem çözme",
    aciklama: "Günlük problemleri mantıksal düşünerek çözme becerisi"
  },
  gorsel_tarama: {
    metrik: "visual_scanning",
    karşılık: "Satır takibi / Harf atlama",
    aciklama: "Okuma sırasında satır takibi ve harf atlama sorunları"
  },
  duygusal: {
    metrik: "emotional_recognition",
    karşılık: "Akran ilişkileri",
    aciklama: "Sosyal durumlarda duyguları anlama ve uygun tepki verme"
  },
  sosyal: {
    metrik: "social_cognition",
    karşılık: "Uygun tepki",
    aciklama: "Sosyal durumlarda uygun davranış sergileme"
  }
};

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
    AKTIF_ALAN: "aktifAlan",
    AKTIF_ALT_BECERI: "aktifAltBeceri",

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
  OYUN_KODLARI: Object.freeze({
    RENK_ESLEME: "renk_esleme",
    AYIRT_ETME: "ayirt_etme",
    HIZLI_TIKLAMA: "hizli_tiklama"
  }),

  // -----------------------------------------------------------
  // 5) OYUN YOLLARI
  // -----------------------------------------------------------
  OYUN_YOLLARI: {
    renk_esleme: GAME_MAP.renk_esleme.path,
    ayirt_etme: GAME_MAP.ayirt_etme.path,
    hizli_tiklama: GAME_MAP.hizli_tiklama.path
  },

  // -----------------------------------------------------------
  // 6) OYUN ADLARI
  // -----------------------------------------------------------
  OYUN_ADLARI: {
    renk_esleme: GAME_MAP.renk_esleme.ad,
    ayirt_etme: GAME_MAP.ayirt_etme.ad,
    hizli_tiklama: GAME_MAP.hizli_tiklama.ad
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
    alan: "",
    altBeceri: "",
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
    temel_skor: {
      dogru: 0,
      yanlis: 0,
      reaction_avg: 0,
      learning_velocity: 0
    },
    coklu_alan: {},
    oyun_ozel: {},
    hata_turleri: [],
    wpm: null,
    trendMeta: {},
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
  BRAIN_AREAS: BRAIN_AREAS,
  SUBSKILLS: SUBSKILLS,
  PERFORMANCE_KEYS: PERFORMANCE_KEYS,
  GAME_MAP: GAME_MAP,

  // -----------------------------------------------------------
  // 11) PANEL ROUTES
  // -----------------------------------------------------------
  ROUTES: {
    [ROLES.OGRENCI]: "./index.html",
    [ROLES.OGRETMEN]: "./teacher_panel.html",
    [ROLES.ADMIN]: "./admin_panel.html",
    [ROLES.EDITOR]: "./editor_panel.html",
    [ROLES.INSTITUTION]: "./institution_panel.html"
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