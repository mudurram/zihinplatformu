# 📩 Öğrenciden Öğretmene Talep Gönderme Rehberi

## 🎯 Genel Bakış

Öğrenciler, öğretmenlerin kullanıcı adını girerek bağlantı talebi gönderebilirler. Öğretmen talebi onayladığında, öğrenci ve öğretmen birbirine bağlanır.

## 📋 Adım Adım Talep Gönderme

### 1️⃣ Ana Menüye Git
- Öğrenci hesabıyla giriş yap
- Ana menü sayfasına (`index.html`) git

### 2️⃣ Talep Paneline Eriş
- Ana menüde **"📩 Öğretmen Talepleri"** bölümü görünür
- Bu bölüm otomatik olarak öğrenci rolü için gösterilir

### 3️⃣ Öğretmen Kullanıcı Adını Gir
- **"➕ Öğretmene Talep Gönder"** bölümünde
- **Kullanıcı adı alanına** öğretmenin kullanıcı adını gir
  - Örnek: `ahmet.ogretmen`
  - Örnek: `mehmet.hoca`
  - ⚠️ **Email değil, kullanıcı adı girmelisin!**

### 4️⃣ Talep Gönder
- **"📤 Talep Gönder"** butonuna tıkla
- Veya **Enter** tuşuna bas

### 5️⃣ Sonuç
- ✅ **Başarılı:** "Talep başarıyla gönderildi! Öğretmen onayı bekleniyor."
- ❌ **Hata:** Hata mesajı görüntülenir (ör: "Öğretmen bulunamadı")

## 🔍 Öğretmen Kullanıcı Adını Nasıl Bulurum?

### Seçenek 1: Öğretmenden Sor
- Öğretmeninize kullanıcı adını sorun
- Kayıt sırasında belirlenen kullanıcı adıdır

### Seçenek 2: Kayıt Sırasında
- Kayıt olurken `teacherUsername` alanına öğretmen kullanıcı adı girilirse
- Otomatik olarak talep gönderilir

## 📥 Gelen Talepleri Onaylama

### Öğrenci Tarafı
- **"📥 Bekleyen Öğretmen Talepleri"** bölümünde
- Öğretmenlerden gelen talepler listelenir
- **"✓ Kabul"** veya **"✗ Red"** butonlarıyla yanıt verilir

### Öğretmen Tarafı
- Öğretmen panelinde (`teacher_panel.html`)
- **"Talepler"** sekmesinde öğrenci talepleri görünür
- **"Kabul"** veya **"Red"** ile yanıt verilir

## 🔄 Talep Durumları

1. **Beklemede:** Talep gönderildi, onay bekleniyor
2. **Kabul:** Talep onaylandı, bağlantı kuruldu
3. **Red:** Talep reddedildi

## ⚠️ Önemli Notlar

1. **Kullanıcı Adı vs Email:**
   - ✅ Doğru: `ahmet.ogretmen` (kullanıcı adı)
   - ❌ Yanlış: `ahmet@example.com` (email)

2. **Öğretmen Rolü:**
   - Sadece öğretmen rolündeki kullanıcılara talep gönderilebilir
   - Öğrenci veya diğer rollere talep gönderilemez

3. **Tekrar Talep:**
   - Aynı öğretmene zaten talep gönderildiyse
   - Yeni talep oluşturulmaz (mevcut talep beklenir)

4. **Bağlantı Durumu:**
   - Talep kabul edildikten sonra
   - Öğrenci ve öğretmen birbirini görebilir
   - Mesajlaşma başlatılabilir

## 🐛 Sorun Giderme

### "Öğretmen bulunamadı" Hatası
- ✅ Kullanıcı adını doğru yazdığınızdan emin olun
- ✅ Öğretmenin hesabının aktif olduğunu kontrol edin
- ✅ Büyük/küçük harf duyarlılığına dikkat edin

### "Bu kullanıcı öğretmen değil" Hatası
- ✅ Kullanıcı adının öğretmen rolünde olduğunu kontrol edin
- ✅ Yanlış kullanıcı adı girmiş olabilirsiniz

### Talep Gönderilmiyor
- ✅ İnternet bağlantınızı kontrol edin
- ✅ Sayfayı yenileyin ve tekrar deneyin
- ✅ Browser console'da hata var mı kontrol edin

## 📱 Ekran Görüntüleri

### Talep Gönderme Formu
```
┌─────────────────────────────────────────┐
│ ➕ Öğretmene Talep Gönder               │
│                                         │
│ Öğretmeninizin kullanıcı adını girerek │
│ bağlantı talebi gönderebilirsiniz.     │
│                                         │
│ [Öğretmen kullanıcı adı...] [📤 Gönder]│
│                                         │
│ ✅ Talep başarıyla gönderildi!          │
└─────────────────────────────────────────┘
```

### Bekleyen Talepler
```
┌─────────────────────────────────────────┐
│ 📥 Bekleyen Öğretmen Talepleri          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ahmet.ogretmen öğretmeni seni      │ │
│ │ eklemek istiyor.                   │ │
│ │                    [✓ Kabul] [✗ Red]│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

**Son Güncelleme:** Öğrenciden öğretmene talep gönderme özelliği eklendi ✅



