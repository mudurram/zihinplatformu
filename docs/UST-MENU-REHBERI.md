# 🎨 Üst Menü (Header) Rehberi

## 📋 Genel Bakış

Tüm platform sayfalarında ortak bir üst menü (header) sistemi oluşturuldu. Bu menü:
- **Rol bazlı** menü öğeleri gösterir
- **Kullanıcı bilgilerini** gösterir
- **Hızlı navigasyon** sağlar
- **Responsive** tasarıma sahiptir

## 🎯 Özellikler

### 1. Logo ve Platform Adı
- Sol tarafta "🧠 Zihin Platformu" logosu
- Tıklanabilir → Ana menüye yönlendirir

### 2. Kullanıcı Bilgisi
- Ortada kullanıcı adı ve rolü gösterilir
- Rol badge'i ile görsel olarak vurgulanır

### 3. Rol Bazlı Menü Öğeleri

#### Öğrenci:
- 🏠 Ana Menü
- 📊 Genel Analiz
- 📈 Akademik Performans
- 📉 Gelişim
- 💬 Mesajlaşma

#### Öğretmen:
- 🏠 Ana Menü
- 👥 Öğrenciler

#### Admin:
- 🏠 Ana Menü
- ⚙️ Admin Panel

#### Editör:
- 🏠 Ana Menü
- ✏️ Editör Panel

#### Kurum:
- 🏠 Ana Menü
- 🏢 Kurum Panel

### 4. Çıkış Butonu
- Sağ tarafta "🚪 Çıkış" butonu
- Tıklanınca onay ister ve çıkış yapar

## 📁 Dosya Yapısı

```
platform/
├── header.js          # Header komponenti (JavaScript)
├── style.css          # Header stilleri (CSS)
└── *.html            # Tüm sayfalar header.js'i import eder
```

## 🔧 Kullanım

### Sayfalara Header Ekleme

Herhangi bir HTML sayfasına header eklemek için:

```html
<head>
  <!-- ... diğer head içeriği ... -->
  
  <!-- Header Script -->
  <script type="module" src="header.js"></script>
</head>

<body>
  <!-- Header otomatik olarak eklenir -->
  <!-- Eski header varsa otomatik değiştirilir -->
  
  <!-- Sayfa içeriği -->
</body>
```

### Eski Header'ı Kaldırma

Eski `.ust-panel` veya `.nav-bar` elementlerini kaldırın:

```html
<!-- ESKİ (Kaldırılmalı) -->
<header class="ust-panel">
  <!-- ... -->
</header>

<!-- YENİ (Otomatik eklenir) -->
<!-- Header header.js tarafından otomatik eklenecek -->
```

## 🎨 Stil Özelleştirme

Header stilleri `platform/style.css` dosyasında `.platform-header` class'ı altında tanımlıdır:

```css
.platform-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* ... */
}
```

## 📱 Responsive Tasarım

- **Desktop (>768px):** Tüm menü öğeleri görünür
- **Tablet (≤768px):** Menü öğeleri alt satıra geçer
- **Mobil (≤480px):** Menü öğeleri gizlenir, sadece logo ve çıkış görünür

## ✅ Uygulanan Sayfalar

- ✅ `index.html` - Ana menü
- ✅ `teacher_panel.html` - Öğretmen paneli
- ✅ `analiz.html` - Genel analiz
- ✅ `akademik.html` - Akademik performans
- ✅ `gelisim.html` - Gelişim
- ✅ `sonuc.html` - Oyun sonucu
- ✅ `mesajlasma.html` - Mesajlaşma
- ✅ `hazirlik.html` - Hazırlık ekranı
- ✅ `admin_panel.html` - Admin paneli
- ✅ `editor_panel.html` - Editör paneli
- ✅ `institution_panel.html` - Kurum paneli

## 🔄 Otomatik Güncelleme

Header otomatik olarak:
- Mevcut sayfayı algılar ve aktif menü öğesini vurgular
- Kullanıcı rolünü kontrol eder ve uygun menüyü gösterir
- LocalStorage'dan kullanıcı bilgilerini okur

## 🐛 Sorun Giderme

### Header görünmüyor
1. `header.js` dosyasının import edildiğinden emin olun
2. Browser console'da hata var mı kontrol edin
3. `style.css` dosyasının yüklendiğinden emin olun

### Menü öğeleri yanlış
1. LocalStorage'da `role` değerini kontrol edin
2. `header.js` dosyasındaki `getMenuItemsForRole` fonksiyonunu kontrol edin

### Çıkış butonu çalışmıyor
1. `auth/auth.js` dosyasındaki `logout` fonksiyonunu kontrol edin
2. Browser console'da hata var mı kontrol edin

---

**Son Güncelleme:** Üst menü sistemi tüm platforma uygulandı ✅


