# 1 BASAMAK EŞLEME OYUNU - ANALİZ RAPORU

Bu doküman, 1 basamak eşleme oyunu için tüm analiz sayfalarında yapılan analizleri detaylı olarak listeler.

---

## 📊 1. SONUÇ EKRANI (sonuc.html / sonuc.js)

Oyun bitiminde gösterilen detaylı sonuç ekranı. 4 ana sekme içerir.

### 🔹 Sekme 1: Temel Skor

**Gösterilen Metrikler:**
- ✅ **Doğru Sayısı** (`toplamDogru`)
  - Kaynak: `son.oyunDetaylari.toplamDogru` → `son.temel_skor.dogru` → `son.dogru`
- ❌ **Yanlış Sayısı** (`toplamYanlis`)
  - Kaynak: `son.oyunDetaylari.toplamYanlis` → `son.temel_skor.yanlis` → `son.yanlis`
- ⏱️ **Toplam Süre** (`toplamOyunSuresi`)
  - Kaynak: `son.oyunDetaylari.toplamOyunSuresi` → `son.temel_skor.sure` → `son.sure`
- ⚡ **Ortalama Tepki Süresi** (`ortalamaTepkiSuresi`)
  - Kaynak: `son.oyunDetaylari.ortalamaTepkiSuresi` → `son.temel_skor.ortalamaTepki`
  - Hesaplama: Doğru cevapların `reaction_ms` ortalaması
- 🚀 **En Hızlı Tepki** (`enHizliTepki`)
  - Kaynak: `son.oyunDetaylari.enHizliTepki` → trials'dan `Math.min(reaction_ms)`
- 🐌 **En Yavaş Tepki** (`enYavasTepki`)
  - Kaynak: `son.oyunDetaylari.enYavasTepki` → trials'dan `Math.max(reaction_ms)`
- 📈 **Öğrenme Hızı Skoru** (`ogrenmeHiziSkoru`)
  - Kaynak: `son.oyunDetaylari.ogrenmeHiziSkoru` → `son.temel_skor.ogrenmeHizi`
  - Hesaplama: İlk yarı vs son yarı doğru oranı farkı (0-100)

**Grafikler:**
- 📊 **Bar Grafik (Doğru/Yanlış)**
  - Chart.js bar chart
  - Doğru ve yanlış sayılarını gösterir
- 🍩 **Doughnut Grafik (Hata Türleri)**
  - Chart.js doughnut chart
  - Hata türleri dağılımı: `impulsivite`, `dikkatsizlik`, `karistirma`, `kategori_hatasi`

---

### 🔹 Sekme 2: Çoklu Zihinsel Alan Analizi

**Gösterilen Alanlar (7 Alan):**
1. **Dikkat** (`dikkat` / `attention`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.dikkat` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)` → "Yüksek" (70-100) / "Orta" (40-69) / "Düşük" (0-39)
   - Yorum: `yorumMetinleri.dikkat[seviye]`

2. **Algısal İşlemleme** (`algisal_islemleme` / `perception`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.algisal_islemleme` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.algisal_islemleme[seviye]`

3. **Hafıza** (`hafiza` / `memory`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.hafiza` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.hafiza[seviye]`

4. **Yürütücü İşlev** (`yuruteci_islev` / `executive`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.yuruteci_islev` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.yuruteci_islev[seviye]`

5. **Mantık** (`mantik` / `logic`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.mantik` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.mantik[seviye]`

6. **Okuma-Dil** (`okuma_dil` / `literacy`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.okuma_dil` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.okuma_dil[seviye]`

7. **Sosyal Biliş** (`sosyal_bilis` / `social`)
   - Puan: `son.oyunDetaylari.zihinselAlanlar.sosyal_bilis` (0-100)
   - Seviye: `puaniSeviyeyeCevir(puan)`
   - Yorum: `yorumMetinleri.sosyal_bilis[seviye]`

**Gösterim Formatı:**
- Her alan için kart gösterimi
- Puan (0-100)
- Seviye etiketi (Yüksek/Orta/Düşük)
- Açıklayıcı yorum metni
- Renk kodlaması (Yeşil: Yüksek, Turuncu: Orta, Kırmızı: Düşük)

---

### 🔹 Sekme 3: Oyun Özel

#### 3.1. Özel Performans Alanları (8 Alan)

**Kart Gösterimi:**
1. **Renk Ayırt Etme** (`renk_ayirt_etme`)
   - Seviye: `ozelPerformansAlanlari.renk_ayirt_etme.seviye` ("Yüksek" / "Orta" / "Düşük")
   - Doğru Oranı: `dogruOran` (%)
   - Ortalama Tepki: `ortalamaRT` (ms)
   - Soru Sayısı: `soruSayisi`
   - Hesaplama: Sadece `bolum === "renk"` olan trial'lar

2. **Şekil Tanıma** (`sekil_tanima`)
   - Seviye: `ozelPerformansAlanlari.sekil_tanima.seviye`
   - Doğru Oranı: `dogruOran` (%)
   - Karıştırma Oranı: `karistirmaOrani` (%)
   - Ortalama Tepki: `ortalamaRT` (ms)
   - Soru Sayısı: `soruSayisi`
   - Hesaplama: Sadece `bolum === "sekil"` olan trial'lar

3. **Görsel Kalıp Algısı** (`gorsel_kalip_algisi`)
   - Seviye: `ozelPerformansAlanlari.gorsel_kalip_algisi.seviye`
   - Doğru Oranı: `dogruOran` (%)
   - Karıştırma Oranı: `karistirmaOrani` (%)
   - Zor Soru Sayısı: `zorSoruSayisi` (secenekSayisi >= 3)
   - Hesaplama: `bolum in ["sekil","golge","parca"]` ve `secenekSayisi >= 3`

4. **Kategori / Sınıf Eşleme** (`kategori_sinif_esleme`)
   - Seviye: `ozelPerformansAlanlari.kategori_sinif_esleme.seviye`
   - Kategori Hata Oranı: `kategoriHataOrani` (%)
   - Kategori Hata Sayısı: `kategoriHataSayisi`
   - Toplam Yanlış: `toplamYanlis`
   - Hesaplama: `hataTuru === "kategori_hatasi"` olan trial'lar

5. **Görsel Tamamlama** (`gorsel_tamamlama`)
   - Seviye: `ozelPerformansAlanlari.gorsel_tamamlama.seviye`
   - Doğru Oranı: `dogruOran` (%)
   - Karıştırma Oranı: `karistirmaOrani` (%)
   - Kategori Hata Oranı: `kategoriHataOrani` (%)
   - Soru Sayısı: `soruSayisi`
   - Hesaplama: Sadece `bolum === "parca"` olan trial'lar

6. **Benzer – Farklı Ayırt Etme** (`benzer_farkli_ayirt_etme`)
   - Seviye: `ozelPerformansAlanlari.benzer_farkli_ayirt_etme.seviye`
   - Karıştırma Oranı: `karistirmaOrani` (%)
   - Karıştırma Sayısı: `karistirmaSayisi`
   - Zor Soru Sayısı: `zorSoruSayisi` (secenekSayisi >= 3)
   - Hesaplama: `secenekSayisi >= 3` ve `hataTuru === "karistirma"`

7. **Detay Tarama Hızı** (`detay_tarama_hizi`)
   - Seviye: `ozelPerformansAlanlari.detay_tarama_hizi.seviye`
   - Doğru Oranı: `dogruOran` (%)
   - Ortalama Tepki: `ortalamaRT` (ms)
   - Zor Soru Sayısı: `zorSoruSayisi` (secenekSayisi >= 3)
   - Hesaplama: `secenekSayisi >= 3` olan trial'lar

8. **Yönlük / Figür–Zemin Algısı** (`yonluk_figur_zemin`)
   - Seviye: `ozelPerformansAlanlari.yonluk_figur_zemin.seviye`
   - Doğru Oranı: `dogruOran` (%)
   - Karıştırma Oranı: `karistirmaOrani` (%)
   - Ortalama Tepki: `ortalamaRT` (ms)
   - Soru Sayısı: `soruSayisi`
   - Hesaplama: Sadece `bolum === "golge"` olan trial'lar

#### 3.2. Bölüm Bazlı Performans Tablosu

**4 Bölüm:**
- 🎨 **Renk** (`bolum === "renk"`)
  - Toplam: `bolumSkorlari.renk.toplam`
  - Doğru: `bolumSkorlari.renk.dogru`
  - Yanlış: `bolumSkorlari.renk.yanlis`
  - Doğru Oranı: `bolumSkorlari.renk.dogruOrani` (%)
  - Seviye: `bolumSkorlari.renk.seviye`

- 🔷 **Şekil** (`bolum === "sekil"`)
  - Toplam: `bolumSkorlari.sekil.toplam`
  - Doğru: `bolumSkorlari.sekil.dogru`
  - Yanlış: `bolumSkorlari.sekil.yanlis`
  - Doğru Oranı: `bolumSkorlari.sekil.dogruOrani` (%)
  - Seviye: `bolumSkorlari.sekil.seviye`

- 🌑 **Gölge** (`bolum === "golge"`)
  - Toplam: `bolumSkorlari.golge.toplam`
  - Doğru: `bolumSkorlari.golge.dogru`
  - Yanlış: `bolumSkorlari.golge.yanlis`
  - Doğru Oranı: `bolumSkorlari.golge.dogruOrani` (%)
  - Seviye: `bolumSkorlari.golge.seviye`

- 🧩 **Parça-Bütün** (`bolum === "parca"`)
  - Toplam: `bolumSkorlari.parca.toplam`
  - Doğru: `bolumSkorlari.parca.dogru`
  - Yanlış: `bolumSkorlari.parca.yanlis`
  - Doğru Oranı: `bolumSkorlari.parca.dogruOrani` (%)
  - Seviye: `bolumSkorlari.parca.seviye`

#### 3.3. Bölüm Bazlı Hata Analizi Tablosu

**Her Bölüm İçin:**
- ⚡ **İmpulsivite** (`hataTuru === "impulsivite"`)
  - Sayı: Her bölümde `reaction_ms < 300` ve `correct === false` olan trial'lar
- ⚠️ **Dikkatsizlik** (`hataTuru === "dikkatsizlik"`)
  - Sayı: Her bölümde `reaction_ms >= 3000` ve `correct === false` olan trial'lar
- 🔀 **Karıştırma** (`hataTuru === "karistirma"`)
  - Sayı: Her bölümde diğer yanlış cevaplar (görsel bölümler için)
- 📋 **Kategori Hatası** (`hataTuru === "kategori_hatasi"`)
  - Sayı: Her bölümde kategori hatası olan trial'lar (renk bölümü için)
- ❌ **Toplam Hata**: Tüm hata türlerinin toplamı

#### 3.4. Günlük Hayat Karşılığı (6 Alan)

**Kaynak:** `son.oyunDetaylari.gunlukHayatKarsiligi`

1. **Tepki Süresi → Karar Verme Hızı**
   - Ortalama ms: `kararVermeHizi.ortalamaMs`
   - Seviye: `kararVermeHizi.seviye` ("Hızlı" / "Orta" / "Yavaş")
   - En Hızlı Tepki: `kararVermeHizi.enHizliTepki` (ms)
   - En Yavaş Tepki: `kararVermeHizi.enYavasTepki` (ms)
   - Açıklama: Ortalama tepki süren, günlük hayatta karar verme hızını gösterir.

2. **Hata Tipi → Acelecilik / Dikkatsizlik Ayrımı**
   - İmpulsivite Oranı: `hataTipiAnalizi.impulsiviteOrani` (%)
   - Dikkatsizlik Oranı: `hataTipiAnalizi.dikkatsizlikOrani` (%)
   - Baskın Tip: `hataTipiAnalizi.baskinTip` ("aceleci" / "dikkatsiz" / "dengeli")
   - Açıklama: İmpulsivite hataları yüksek → aceleci kararlar veriyorsun. Dikkatsizlik hataları yüksek → sınıf içi performansta sık dalgınlık görülebilir.

3. **Görsel Tarama → Okuma Sırasında Satır Takibi**
   - Seviye: `gorselTarama.seviye` ("Yüksek" / "Orta" / "Düşük")
   - Doğru Oranı: `gorselTarama.dogruOran` (%)
   - Ortalama Tepki: `gorselTarama.ortalamaRT` (ms)
   - Zor Soru Sayısı: `gorselTarama.soruSayisi` (secenekSayisi >= 3)
   - Açıklama: Görsel tarama becerin, okuma sırasında satır takibi ve harf atlama sorunlarını azaltır.

4. **Çalışma Belleği → Yönergeyi Eksiksiz Uygulama Kapasitesi**
   - Seviye: `calismaBellegi.seviye` ("Yüksek" / "Orta" / "Düşük")
   - En Uzun Doğru Seri: `calismaBellegi.enUzunDogruSeri`
   - İlk Yarı Doğru Oranı: `calismaBellegi.ilkYariDogruOrani` (%)
   - Son Yarı Doğru Oranı: `calismaBellegi.sonYariDogruOrani` (%)
   - Gelişim Farkı: `calismaBellegi.gelisimFarki` (%)
   - Açıklama: Çalışma belleğin güçlüyse, çok adımlı yönergeleri eksiksiz uygulayabilirsin.

5. **Mantık → Problem Çözme**
   - Seviye: `mantik.seviye` ("Yüksek" / "Orta" / "Düşük")
   - Genel Doğru Oranı: `mantik.genelDogruOran` (%)
   - Zor Sorularda Doğru Oranı: `mantik.zorDogruOran` (%)
   - Toplam Soru: `mantik.soruSayisi`
   - Açıklama: Mantıksal düşünme becerin, günlük problemleri çözmede ve karar vermede önemlidir.

6. **Sosyal-Duygusal → Akran İlişkileri, Uygun Tepki**
   - Profil: `sosyalDuygusal.profil` ("aceleci" / "dikkati_dagilan" / "dengeli")
   - İmpulsivite Oranı: `sosyalDuygusal.impulsiviteOrani` (%)
   - Dikkatsizlik Oranı: `sosyalDuygusal.dikkatsizlikOrani` (%)
   - Toplam Yanlış: `sosyalDuygusal.toplamYanlis`
   - Açıklama: Sosyal biliş becerin, akran ilişkilerinde ve uygun tepki vermede önemlidir.

---

### 🔹 Sekme 4: Zihin Alanları Performans Tablosu

**Gösterilen Tablo:**
- **Alan Adı**: 7 zihinsel alanın adı
- **Puan**: `son.oyunDetaylari.zihinselAlanlar[alan]` (0-100)
- **Seviye**: `puaniSeviyeyeCevir(puan)` → "Yüksek" / "Orta" / "Düşük"
- **Yorum**: `yorumMetinleri[alan][seviye]`

**Kaynak Önceliği:**
1. `son.oyunDetaylari.zihinselAlanlar` (öncelikli)
2. `son.coklu_alan` (fallback)

---

## 📈 2. GENEL ANALİZ SAYFASI (analiz.html / analiz.js)

Tüm oyun geçmişini analiz eden sayfa. Birden fazla grafik ve analiz içerir.

### 🔹 Oyun Sonuç Kartları

**Her Oyun İçin Gösterilen:**
- 🎮 Oyun Adı
- 📅 Tarih
- ✅ Doğru / ❌ Yanlış
- ⏱️ Süre
- 📊 Bölüm Skorları (Eşleme oyunu için):
  - Format: "🎨 85% | 🔷 70% | 🌑 90% | 🧩 75%"
  - Kaynak: `item.oyunDetaylari.bolumSkorlari`

### 🔹 Radar Grafik (12 Zihin Alanı)

**Gösterilen Alanlar:**
- Dikkat (`attention`)
- Algısal İşlemleme (`perception`)
- Hafıza (`memory`)
- Yürütücü İşlev (`executive`)
- Mantık (`logic`)
- Okuma-Dil (`literacy`)
- Sosyal Biliş (`social`)
- (Diğer 5 alan)

**Hesaplama:**
- Tüm kayıtlardan `coklu_alan` verilerini toplar
- Ortalama skorları hesaplar (0-100)
- Chart.js radar chart ile gösterir

**Eşleme Oyunu Özel:**
- `bolumSkorlari` kullanılarak `perception` alanı hesaplanır
- `bolumSkorlari.sekil`, `bolumSkorlari.golge`, `bolumSkorlari.parca` toplanır

### 🔹 Trend Grafik (Zaman İçinde Değişim)

**Gösterilen:**
- X Ekseni: Tarih (kronolojik sıra)
- Y Ekseni: Skor (0-100)
- Çizgi: Tüm alanların ortalaması veya seçilen alan

**Hesaplama:**
- Her tarih için `coklu_alan` skorlarının ortalaması
- Chart.js line chart

### 🔹 Öğrenme Hızı Grafik

**Gösterilen:**
- X Ekseni: Oyun sırası
- Y Ekseni: Öğrenme hızı skoru (0-100)
- Çizgi: İlk yarı vs son yarı doğru oranı farkı

**Hesaplama:**
- `item.oyunDetaylari.ogrenmeHiziSkoru` veya `item.temel_skor.ogrenmeHizi`
- Chart.js line chart

### 🔹 Alan Tablosu

**Gösterilen Kolonlar:**
- Alan Adı
- Ortalama Skor (0-100)
- En Yüksek Skor
- En Düşük Skor
- Oyun Sayısı

**Hesaplama:**
- Tüm kayıtlardan her alan için skorları toplar
- Ortalama, max, min hesaplar

### 🔹 Hata Türleri Grafik

**Gösterilen:**
- Chart.js doughnut chart
- Hata türleri dağılımı:
  - İmpulsivite (`impulsivite`)
  - Dikkatsizlik (`dikkatsizlik`)
  - Karıştırma (`karistirma`)
  - Kategori Hatası (`kategori_hatasi`)

**Hesaplama:**
- `item.oyunDetaylari.hataTurleriDetay` veya `item.temel_skor.hataTurleri`
- Tüm kayıtlardan toplam hata sayıları

### 🔹 Güçlü ve Zayıf Yönler Analizi

**Gösterilen:**
- ✅ **Güçlü Yönler**: En yüksek skorlu 3 alan
- ⚠️ **Zayıf Yönler**: En düşük skorlu 3 alan

**Hesaplama:**
- Tüm kayıtlardan `coklu_alan` skorlarını toplar
- Ortalama skorları hesaplar
- Sıralar ve en yüksek/düşük 3'ü seçer

**Eşleme Oyunu Özel:**
- `bolumSkorlari` kullanılarak `perception` alanı hesaplanır

### 🔹 AI Öneri Motoru

**Gösterilen:**
- Zayıf alanlar için özel öneriler
- Oyun önerileri
- Geliştirme planı

**Eşleme Oyunu Özel:**
- `bolumSkorlari` analiz edilir
- Zayıf bölümler için özel öneriler:
  - "Renk eşleme zayıf: Renk ayırt etme oyunları önerilir."
  - "Şekil eşleme zayıf: Şekil tanıma oyunları önerilir."
  - vb.

### 🔹 Karşılaştırma Grafik

**Gösterilen:**
- İlk oyun vs son oyun performans karşılaştırması
- Chart.js bar chart

---

## 🎓 3. AKADEMİK PERFORMANS SAYFASI (akademik.html / akademik.js)

Ders bazlı performans analizi. 4 ana ders için tahmini skorlar hesaplar.

### 🔹 Ders Kartları (4 Ders)

**1. Türkçe**
- Tahmini Skor: `hesaplaDersSkoru("turkce", ...)` (0-100)
- Seviye: "Mükemmel" (80-100) / "İyi" (60-79) / "Orta" (40-59) / "Geliştirilmeli" (0-39)
- İlgili Alanlar: `attention`, `perception`, `literacy`, `memory`
- Bağlantılı Beceriler: Okuma, yazma, anlama, dikkat

**2. Matematik**
- Tahmini Skor: `hesaplaDersSkoru("matematik", ...)` (0-100)
- Seviye: Aynı seviye sistemi
- İlgili Alanlar: `logic`, `executive`, `attention`, `perception`
- Bağlantılı Beceriler: Problem çözme, mantık, dikkat

**3. Fen Bilimleri**
- Tahmini Skor: `hesaplaDersSkoru("fen", ...)` (0-100)
- Seviye: Aynı seviye sistemi
- İlgili Alanlar: `logic`, `perception`, `attention`, `memory`
- Bağlantılı Beceriler: Gözlem, analiz, mantık

**4. Sosyal Bilgiler**
- Tahmini Skor: `hesaplaDersSkoru("sosyal", ...)` (0-100)
- Seviye: Aynı seviye sistemi
- İlgili Alanlar: `memory`, `literacy`, `social`, `attention`
- Bağlantılı Beceriler: Hafıza, okuma, sosyal biliş

**Eşleme Oyunu Özel Hesaplama:**
- `bolumSkorlari` kullanılarak ilgili alanlar hesaplanır:
  - `perception`: `bolumSkorlari.sekil`, `bolumSkorlari.golge`, `bolumSkorlari.parca` toplanır
  - `attention`: Tüm bölümlerin ortalaması
  - `logic`: Genel doğru oranı
  - `memory`: Çalışma belleği metrikleri

### 🔹 Bağlantı Tablosu

**Gösterilen:**
- Ders ↔ Zihin Alanı bağlantıları
- Her ders için hangi alanların önemli olduğu
- Tablo formatında gösterim

### 🔹 Ders Skorları Grafik

**Gösterilen:**
- Chart.js bar chart
- 4 ders için tahmini skorlar
- Renk kodlaması (her ders için farklı renk)

### 🔹 Akademik Güçlü ve Destek Alanları

**Gösterilen:**
- ✅ Güçlü dersler (yüksek skorlu)
- ⚠️ Destek gereken dersler (düşük skorlu)

### 🔹 AI Akademik Öneri

**Gösterilen:**
- Zayıf dersler için özel öneriler
- Hangi alanları geliştirmesi gerektiği
- Oyun önerileri

---

## 📊 4. GELİŞİM SAYFASI (gelisim.html / gelisim.js)

Zaman içindeki gelişimi gösteren sayfa. Günlük, haftalık, aylık trendler.

### 🔹 Zaman Filtreleri

**Seçenekler:**
- 📅 Günlük
- 📅 Haftalık
- 📅 Aylık
- 📅 Tümü

### 🔹 Genel Trend Grafik

**Gösterilen:**
- X Ekseni: Tarih (gün/hafta/ay)
- Y Ekseni: Skor (0-100)
- Çizgi: Seçilen alan veya tüm alanların ortalaması
- Chart.js line chart

**Hesaplama:**
- `veriGrupla(zamanTipi)` ile veriler gruplanır
- Her grup için `coklu_alan` skorlarının ortalaması hesaplanır

### 🔹 Alan Grafikleri

**Gösterilen:**
- Her zihin alanı için ayrı mini grafik
- X Ekseni: Tarih
- Y Ekseni: Skor (0-100)
- Chart.js line chart

### 🔹 Tarih Tablosu

**Gösterilen Kolonlar:**
- 📅 Tarih
- 🎮 Oyun
- ✅ Doğru / ❌ Yanlış
- ⏱️ Süre
- 📊 Bölüm Skorları (Eşleme oyunu için):
  - Format: "Renk: 85%, Şekil: 70%, Gölge: 90%, Parça: 75%"
  - Kaynak: `item.oyunDetaylari.bolumSkorlari`

**Eşleme Oyunu Özel:**
- `bolumSkorlari` gösterilir:
  - `bolumSkorlari.renk.dogruOrani`
  - `bolumSkorlari.sekil.dogruOrani`
  - `bolumSkorlari.golge.dogruOrani`
  - `bolumSkorlari.parca.dogruOrani`

### 🔹 Alan Filtresi

**Seçenekler:**
- Tüm Alanlar
- Dikkat
- Algısal İşlemleme
- Hafıza
- Yürütücü İşlev
- Mantık
- Okuma-Dil
- Sosyal Biliş
- (Diğer alanlar)

---

## 👤 5. TAM ÖĞRENCI PROFİLİ (profil.html / profil.js)

Kapsamlı öğrenci profili. Tüm metrikleri bir arada gösterir.

### 🔹 Radar Grafik (12 Zihin Alanı)

**Gösterilen:**
- 12 zihin alanının skorları (0-100)
- Chart.js radar chart

**Hesaplama:**
- Tüm kayıtlardan `coklu_alan` verilerini toplar
- `zihinselAlanlar` varsa öncelikli kullanır
- Eşleme oyunu için `bolumSkorlari` kullanılarak `perception` hesaplanır

### 🔹 Alan Tablosu

**Gösterilen Kolonlar:**
- Alan Adı
- Ortalama Skor (0-100)
- En Yüksek Skor
- En Düşük Skor
- Oyun Sayısı
- Trend (↑ / ↓ / →)

**Hesaplama:**
- Tüm kayıtlardan her alan için skorları toplar
- İlk yarı vs son yarı karşılaştırması ile trend hesaplanır

### 🔹 Öğrenme Hızı Profili

**Gösterilen:**
- Ortalama Öğrenme Hızı: `ogrenmeHizlari` ortalaması (0-100)
- En Yüksek: `ogrenmeHizlari` max
- En Düşük: `ogrenmeHizlari` min
- Trend: İlk oyunlar vs son oyunlar

**Hesaplama:**
- `item.oyunDetaylari.ogrenmeHiziSkoru` veya `item.temel_skor.ogrenmeHizi`
- Tüm kayıtlardan toplanır

### 🔹 Güçlü ve Zayıf Yönler

**Gösterilen:**
- ✅ **Güçlü Yönler**: En yüksek skorlu 3 alan
  - Alan adı
  - Skor (0-100)
  - Açıklama
- ⚠️ **Zayıf Yönler**: En düşük skorlu 3 alan
  - Alan adı
  - Skor (0-100)
  - Açıklama

**Hesaplama:**
- Tüm kayıtlardan `coklu_alan` skorlarını toplar
- Eşleme oyunu için `bolumSkorlari` kullanılarak `perception` hesaplanır
- Ortalama skorları hesaplar ve sıralar

### 🔹 Akademik Profil

**Gösterilen:**
- 4 ders için tahmini skorlar (0-100)
- Seviye etiketleri
- Renk kodlaması

**Hesaplama:**
- `hesaplaDersSkoru()` fonksiyonu kullanılır
- Eşleme oyunu için `bolumSkorlari` kullanılarak ilgili alanlar hesaplanır

### 🔹 Sosyal-Duygusal Profil

**Gösterilen:**
- Profil Tipi: "Aceleci" / "Dikkati Dağılan" / "Dengeli"
- İmpulsivite Oranı (%)
- Dikkatsizlik Oranı (%)
- Açıklama

**Hesaplama:**
- `item.oyunDetaylari.gunlukHayatKarsiligi.sosyalDuygusal` kullanılır
- Tüm kayıtlardan toplanır ve ortalama hesaplanır

### 🔹 Günlük Hayat Etkisi

**Gösterilen:**
- 6 günlük hayat karşılığı alanının özeti
- Her alan için seviye ve açıklama

**Hesaplama:**
- `item.oyunDetaylari.gunlukHayatKarsiligi` kullanılır
- Tüm kayıtlardan toplanır

### 🔹 AI Gelişim Planı

**Gösterilen:**
- Zayıf alanlar için özel gelişim planı
- Oyun önerileri
- Haftalık hedefler
- İlerleme takibi

**Hesaplama:**
- Zayıf yönler analizi kullanılır
- Her zayıf alan için özel öneriler üretilir
- Eşleme oyunu için `bolumSkorlari` analiz edilir

---

## 🔧 TEKNİK DETAYLAR

### Veri Kaynakları

**Öncelik Sırası:**
1. `son.oyunDetaylari` (en güncel ve detaylı)
2. `son.temel_skor` (fallback)
3. `son.coklu_alan` (fallback)
4. `son.trials` (ham veri, hesaplama için)

### Eşleme Oyunu Özel Veriler

**`engine.oyunDetaylari` İçeriği:**
```javascript
{
  toplamSoruSayisi,
  toplamDogru,
  toplamYanlis,
  ortalamaTepkiSuresi,
  toplamOyunSuresi,
  zorlukSeviyesi,
  hataTurleriDetay,
  baskınHataTuru,
  ilk5OrtalamaTepki,
  son5OrtalamaTepki,
  tepkiEgilimi,
  ilkYariDogruOrani,
  sonYariDogruOrani,
  ilk5DogruOrani,
  son5DogruOrani,
  enHizliTepki,
  enYavasTepki,
  baslangicSeviyesi,
  bitisSeviyesi,
  zorlukAdaptasyonu,
  ogrenmeHiziSkoru,
  bolumSkorlari: {
    renk: { toplam, dogru, yanlis, dogruOrani, seviye },
    sekil: { toplam, dogru, yanlis, dogruOrani, seviye },
    golge: { toplam, dogru, yanlis, dogruOrani, seviye },
    parca: { toplam, dogru, yanlis, dogruOrani, seviye }
  },
  oyunBaslangicZamani,
  oyunBitisZamani,
  zihinselAlanlar: {
    dikkat: 0-100,
    algisal_islemleme: 0-100,
    hafiza: 0-100,
    yuruteci_islev: 0-100,
    mantik: 0-100,
    okuma_dil: 0-100,
    sosyal_bilis: 0-100
  },
  ozelPerformansAlanlari: {
    renk_ayirt_etme: { seviye, dogruOran, ortalamaRT, soruSayisi },
    sekil_tanima: { seviye, dogruOran, karistirmaOrani, ortalamaRT, soruSayisi },
    gorsel_kalip_algisi: { seviye, dogruOran, karistirmaOrani, zorSoruSayisi },
    kategori_sinif_esleme: { seviye, kategoriHataOrani, kategoriHataSayisi, toplamYanlis },
    gorsel_tamamlama: { seviye, dogruOran, karistirmaOrani, kategoriHataOrani, soruSayisi },
    benzer_farkli_ayirt_etme: { seviye, karistirmaOrani, karistirmaSayisi, zorSoruSayisi },
    detay_tarama_hizi: { seviye, dogruOran, ortalamaRT, zorSoruSayisi },
    yonluk_figur_zemin: { seviye, dogruOran, karistirmaOrani, ortalamaRT, soruSayisi }
  },
  gunlukHayatKarsiligi: {
    kararVermeHizi: { ortalamaMs, seviye, enHizliTepki, enYavasTepki },
    hataTipiAnalizi: { impulsiviteOrani, dikkatsizlikOrani, baskinTip, ... },
    gorselTarama: { seviye, dogruOran, ortalamaRT, soruSayisi },
    calismaBellegi: { seviye, enUzunDogruSeri, ilkYariDogruOrani, sonYariDogruOrani, gelisimFarki },
    mantik: { seviye, genelDogruOran, zorDogruOran, soruSayisi },
    sosyalDuygusal: { profil, impulsiviteOrani, dikkatsizlikOrani, toplamYanlis }
  }
}
```

### Hesaplama Fonksiyonları

**Oyun Sonunda (`esleme.js`):**
- `oyunSonuAnaliziniHazirla()`: Ana analiz fonksiyonu
- `hesaplaZihinselAlanlar()`: 7 zihin alanı skorları
- `hesaplaOzelPerformansAlanlari()`: 8 özel performans alanı
- `hesaplaGunlukHayatKarsiligi()`: 6 günlük hayat karşılığı
- `hesaplaBolumSkorlari()`: 4 bölüm skorları

**Sonuç Sayfasında (`sonuc.js`):**
- `yukleTemelSkor()`: Temel metrikler
- `yukleCokluAlan()`: Çoklu alan analizi
- `yukleOyunOzel()`: Oyun özel analiz
- `yuklePerformans()`: Zihin alanları tablosu

**Diğer Sayfalarda:**
- `radarGrafik()`: Radar grafik çizimi
- `trendGrafik()`: Trend grafik çizimi
- `hesaplaDersSkoru()`: Ders skoru hesaplama
- `gucluVeZayifAnaliz()`: Güçlü/zayıf yönler analizi

---

## 📝 ÖZET

1 basamak eşleme oyunu için **5 ana analiz sayfası** ve **toplam 50+ analiz metrik** bulunmaktadır:

1. **Sonuç Ekranı**: 4 sekme, 30+ metrik
2. **Genel Analiz**: 8 grafik/analiz
3. **Akademik Performans**: 4 ders, 3 analiz
4. **Gelişim**: 3 grafik, 1 tablo
5. **Tam Öğrenci Profili**: 8 analiz bölümü

Tüm analizler `engine.oyunDetaylari` içindeki verileri kullanır ve kullanıcıya kapsamlı bir performans raporu sunar.

