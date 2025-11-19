# 🧪 Zihin Platformu - Yerel Test Rehberi

## 📋 Ön Gereksinimler

1. **Web Tarayıcı:** Chrome, Firefox, Edge (güncel sürüm)
2. **Firebase Projesi:** Aktif Firebase projesi (zihin-platformu)
3. **Local Server:** Python veya Node.js (opsiyonel, ancak önerilir)

---

## 🚀 ADIM 1: Dosya Yapısını Kontrol Et

Proje klasör yapısı şu şekilde olmalı:
```
Zihin Platformu 16.11.2025/
├── platform/
│   ├── index.html
│   ├── login.html
│   ├── teacher_panel.html
│   ├── admin_panel.html
│   ├── editor_panel.html
│   ├── institution_panel.html
│   ├── analiz.html
│   ├── sonuc.html
│   ├── hazirlik.html
│   ├── mesajlasma.html
│   ├── akademik.html
│   ├── gelisim.html
│   └── *.js dosyaları
├── auth/
│   ├── login.html
│   ├── register.html
│   └── *.js dosyaları
├── data/
│   └── *.js dosyaları
├── engine/
│   └── *.js dosyaları
└── oyunlar/
    └── ...
```

---

## 🌐 ADIM 2: Local Server Başlat

### Seçenek 1: Python (Önerilen - En Kolay)

**Windows PowerShell'de:**
```powershell
# Python 3 varsa
python -m http.server 8000

# Veya Python 2 varsa
python -m SimpleHTTPServer 8000
```

**Tarayıcıda aç:**
```
http://localhost:8000/platform/login.html
```

### Seçenek 2: Node.js (http-server)

```bash
# Önce yükle (bir kez)
npm install -g http-server

# Sonra çalıştır
http-server -p 8000
```

**Tarayıcıda aç:**
```
http://localhost:8000/platform/login.html
```

### Seçenek 3: VS Code Live Server

1. VS Code'da projeyi aç
2. "Live Server" extension'ını yükle
3. `platform/login.html` dosyasına sağ tık → "Open with Live Server"

---

## 🔥 ADIM 3: Firebase Yapılandırmasını Kontrol Et

### 3.1 Firebase Console'dan Bilgileri Al

1. [Firebase Console](https://console.firebase.google.com/) → Proje: `zihin-platformu`
2. ⚙️ Project Settings → General
3. **Firebase SDK snippet** → Config bölümünden bilgileri kopyala

### 3.2 `data/firebaseConfig.js` Dosyasını Kontrol Et

Dosya şu bilgileri içermeli:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "zihin-platformu.firebaseapp.com",
  projectId: "zihin-platformu",
  storageBucket: "zihin-platformu.firebasestorage.app",
  messagingSenderId: "328349672879",
  appId: "1:328349672879:web:..."
};
```

**✅ Kontrol:** `data/firebaseConfig.js` dosyasındaki bilgiler Firebase Console'dakiyle eşleşiyor mu?

---

## 🧪 ADIM 4: İlk Test - Login Sayfası

1. **Tarayıcıda aç:**
   ```
   http://localhost:8000/platform/login.html
   ```

2. **Konsolu aç:** F12 → Console sekmesi

3. **Beklenen loglar:**
   ```
   ⚡ firebaseConfig.js yükleniyor...
   ✔ Firebase başlatıldı: [DEFAULT]
   🔥 Auth hazır (v7.2)
   📚 Firestore hazır (v7.2)
   router.js yüklendi ✔
   ```

4. **Hata varsa:**
   - ❌ "Firebase başlatılamadı" → Firebase config kontrolü
   - ❌ "CORS hatası" → Local server kullan (dosya:// protokolü çalışmaz)
   - ❌ "Module not found" → Dosya yollarını kontrol et

---

## 👤 ADIM 5: Test Kullanıcısı Oluştur

### 5.1 Kayıt Sayfası

1. **Login sayfasında:** "Kayıt Ol" linkine tıkla
2. **Veya direkt aç:**
   ```
   http://localhost:8000/auth/register.html
   ```

3. **Test kullanıcısı oluştur:**
   - **Email:** `test@example.com`
   - **Şifre:** `test123456` (min 6 karakter)
   - **Kullanıcı Adı:** `testuser`
   - **Ad Soyad:** `Test Kullanıcı`
   - **Rol:** `Öğrenci` seç

4. **Kayıt butonuna tıkla**

5. **Beklenen:**
   - ✅ "Kayıt başarılı" mesajı
   - ✅ Otomatik login olur
   - ✅ `platform/index.html` sayfasına yönlendirilir

---

## 🎮 ADIM 6: Oyun Testi

### 6.1 Ana Menüden Oyun Seç

1. **Ana menüde:** Bir zihin alanına tıkla (örn: "Dikkat")
2. **Alt beceri seç:** (örn: "Eşleme Dikkati")
3. **Oyun seç:** (örn: "Renk / Şekil Eşleme")
4. **Hazırlık ekranı:** "Başla" butonuna tıkla

### 6.2 Oyunu Oyna

1. **Oyun başlar:** 30 saniye süre
2. **Birkaç soru cevapla:** Doğru/yanlış
3. **"Bitir" butonuna tıkla** (veya süre bitince otomatik)

### 6.3 Sonuç Ekranı

1. **Otomatik yönlendirme:** `platform/sonuc.html`
2. **Kontrol et:**
   - ✅ 4 sekme görünüyor mu? (Temel Skor, Çoklu Alan, Oyun Özel, Performans)
   - ✅ Grafikler çiziliyor mu?
   - ✅ Veriler doğru mu?

---

## 📊 ADIM 7: Analiz Paneli Testi

1. **Ana menüden:** "Genel Analiz" butonuna tıkla
2. **Veya direkt aç:**
   ```
   http://localhost:8000/platform/analiz.html
   ```

3. **Kontrol et:**
   - ✅ Filtreler çalışıyor mu?
   - ✅ Grafikler görünüyor mu?
   - ✅ Tablolar dolu mu?

---

## 👩‍🏫 ADIM 8: Öğretmen Paneli Testi

### 8.1 Öğretmen Kullanıcısı Oluştur

1. **Yeni kayıt:** `ogretmen@example.com` → Rol: `Öğretmen`
2. **Login ol**

### 8.2 Öğretmen Paneli

1. **Açılır:** `platform/teacher_panel.html`
2. **Kontrol et:**
   - ✅ Öğrenci listesi görünüyor mu?
   - ✅ Talepler sekmesi çalışıyor mu?
   - ✅ Mesajlaşma sekmesi çalışıyor mu?

---

## 🔍 ADIM 9: Hata Kontrolü

### 9.1 Browser Console Kontrolü

**F12 → Console sekmesi:**

**✅ Normal loglar:**
- `globalConfig.js yüklendi ✅`
- `router.js yüklendi ✔`
- `Firebase başlatıldı`
- `Auth hazır`
- `Firestore hazır`

**❌ Hata logları:**
- `❌ Firebase başlatılamadı` → Config kontrolü
- `❌ Firestore başlatılamadı` → Config kontrolü
- `Failed to load module` → Dosya yolu hatası
- `Cannot read property` → Null kontrolü eksik (düzeltildi ✅)

### 9.2 Network Tab Kontrolü

**F12 → Network sekmesi:**

**✅ Başarılı istekler:**
- Firebase API istekleri: `200 OK`
- Chart.js CDN: `200 OK`
- Local dosyalar: `200 OK`

**❌ Hata istekleri:**
- `404 Not Found` → Dosya yolu hatası
- `CORS error` → Local server kullan
- `401 Unauthorized` → Firebase auth hatası

---

## 🐛 ADIM 10: Yaygın Hatalar ve Çözümleri

### Hata 1: "CORS policy: Cross origin requests"

**Çözüm:**
- ❌ Dosyayı direkt açma (`file:///C:/...`)
- ✅ Local server kullan (`http://localhost:8000`)

### Hata 2: "Firebase: Error (auth/invalid-api-key)"

**Çözüm:**
1. Firebase Console → Project Settings
2. `data/firebaseConfig.js` dosyasındaki `apiKey`'i güncelle

### Hata 3: "Cannot read property 'currentUser' of null"

**Çözüm:**
- ✅ Bu hata düzeltildi! `auth` null kontrolü eklendi.

### Hata 4: "Chart is not defined"

**Çözüm:**
1. HTML'de Chart.js script tag'i var mı kontrol et:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```
2. İnternet bağlantısı var mı kontrol et

### Hata 5: "Module not found"

**Çözüm:**
1. Dosya yollarını kontrol et
2. Import path'lerini kontrol et
3. Local server kullan (ES6 modules için gerekli)

---

## ✅ ADIM 11: Test Senaryoları

### Senaryo 1: Öğrenci Akışı
1. ✅ Kayıt ol (Öğrenci)
2. ✅ Login ol
3. ✅ Oyun seç ve oyna
4. ✅ Sonuç ekranını gör
5. ✅ Analiz paneline git
6. ✅ Mesajlaşma sayfasına git

### Senaryo 2: Öğretmen Akışı
1. ✅ Kayıt ol (Öğretmen)
2. ✅ Login ol
3. ✅ Öğrenci listesini gör
4. ✅ Öğrenci seç
5. ✅ Analiz paneline git
6. ✅ Mesajlaşma sekmesini aç

### Senaryo 3: Kurum Akışı
1. ✅ Kayıt ol (Kurum)
2. ✅ Login ol
3. ✅ Öğretmen davet et
4. ✅ Talepleri gör

---

## 📝 ADIM 12: Test Sonuçlarını Kaydet

Test sırasında bulduğun hataları not al:
- Hata mesajı
- Hangi sayfada
- Konsol logları
- Ekran görüntüsü (opsiyonel)

---

## 🎯 Hızlı Test Komutları

**PowerShell'de (proje klasöründe):**
```powershell
# Python server başlat
python -m http.server 8000

# Tarayıcıda aç (otomatik)
Start-Process "http://localhost:8000/platform/login.html"
```

**Test için hazır kullanıcılar:**
- Öğrenci: `ogrenci@test.com` / `test123`
- Öğretmen: `ogretmen@test.com` / `test123`
- Admin: `admin@test.com` / `test123`

---

## 🚨 Acil Durumlar

**Hiçbir şey çalışmıyorsa:**
1. Browser cache'i temizle (Ctrl+Shift+Delete)
2. Hard refresh yap (Ctrl+F5)
3. Local server'ı yeniden başlat
4. Firebase Console'da projenin aktif olduğunu kontrol et

**Hala çalışmıyorsa:**
- Console'daki hata mesajlarını kopyala
- `docs/ULTRA-KAPSAMLI-ANALIZ-RAPORU.md` dosyasını kontrol et
- Firebase Console → Firestore Database → Rules'ı kontrol et

---

## 📞 Test Sırasında Yardım

Test sırasında bir hata görürsen:
1. **F12 → Console** → Hata mesajını kopyala
2. **F12 → Network** → Kırmızı istekleri kontrol et
3. Hata detaylarını paylaş, birlikte çözelim!

---

**Başarılar! 🚀**

