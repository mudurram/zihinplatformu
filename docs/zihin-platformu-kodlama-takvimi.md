<!--
  📅 Zihin Platformu Kodlama Takvimi
  Oluşturma: 2025-11-18
  Açıklama: 8 sprintlik ayrıntılı geliştirme planı
-->

# 🧠 Zihin Platformu Kodlama Takvimi (8 Sprint)

| Sprint | Tarih Aralığı | Hedef Başlık | Ana Çıktılar | Bağımlılıklar |
| ------ | ------------- | ------------ | ------------ | ------------- |
| 1 | 18-29 Kasım | Altyapı & Veri Modeli | `GLOBAL` genişlemesi (GAME_MAP v2, alan sözlükleri), `profiles` şema güncellemeleri, Firestore security rules, migasyon scripti | Mevcut kullanıcı verisi erişimi |
| 2 | 2-13 Aralık | Kayıt & Onay Akışları | Öğrenci/öğretmen/kurum kayıt formları, `requests` koleksiyonu, davet yönetimi UI, bildirim komponenti | Sprint 1 veri modeli |
| 3 | 16-27 Aralık | Zihin Alanı Menüsü & Oyun Meta | 12 alan → alt beceri → oyun seçimi akışı, hazırlık ekranı revizyonu, oyun motorunda meta aktarımı | Sprint 2 kullanıcı bağlantıları |
| 4 | 30 Aralık - 10 Ocak | 4 Sekmeli Sonuç & Günlük Hayat Modülü | `sonuc.html` revizyonu, skor hesaplayıcı servisleri, AI günlük hayat eşlemesi, Firestore sonuç şeması genişlemesi | Sprint 3 oyun meta |
| 5 | 13-24 Ocak | Genel Analiz & Akademik Panel | Radar/trend/heatmap grafikleri, AI öneri motoru, akademik panel ve ders tahminleri, rapor çıktıları | Sprint 4 sonuç verileri |
| 6 | 27 Ocak - 7 Şubat | Tarihsel Gelişim & Çoklu Öğretmen Raporu | `historyService`, timeline tabloları, çoklu öğretmen filtreleri, PDF/Word rapor iyileştirmeleri | Sprint 5 analiz motorları |
| 7 | 10-21 Şubat | Mesajlaşma & Öğretmen Yorumları | Firestore `messages` koleksiyonu, real-time chat bileşeni, öğretmen notları ve paylaşımı | Sprint 6 öğrenci/öğretmen paneli |
| 8 | 24 Şubat - 7 Mart | QA, Performans, Dokümantasyon | Entegrasyon testleri, performans optimizasyonu, kullanıcı/teknik dokümantasyon, yayın checklist | Tüm sprint çıktıları |

---

## Sprint Detay Kartları

### Sprint 1 — Altyapı & Veri Modeli
- `globalConfig.js`: `BRAIN_AREAS`, `SUBSKILLS`, `PERFORMANCE_KEYS`, `GAME_MAP` meta objeleri.
- Firestore şeması: `profiles/{uid}` içinde `role`, `institution`, `teachers`, `students`, `pendingRequests`, `connections`.
- Security rules: rol bazlı yetkilendirme; öğretmen yalnızca bağlı öğrencileri okuyabilir/yazabilir.
- `scripts/migrateProfiles.js`: eski profillere default alan ekleme.

### Sprint 2 — Kayıt & Onay Akışları
- `auth/register.html/js`: rol seçimi, kurum alanları, telefon doğrulama (opsiyonel).
- `services/requestService.js`: `createRequest`, `respondRequest`, `listRequests`.
- `platform/teacher_panel.html` & `institution_panel.html`: davet listeleri, kabul/ret UI, badge sayacı.
- Bildirim bileşeni (`components/alert.js`): pending request sayısını göster.

### Sprint 3 — Zihin Alanı Menüsü & Oyun Meta
- `platform/index.html/js`: 12 alan grid’i, alt beceri paneli, oyun kartları.
- `platform/hazirlik.html/js`: seçilen oyun meta verisini (hedef beceriler, ölçüm parametreleri) göster.
- `engine/gameEngine.js`: `window.gameMeta` → `saveGameResult` entegrasyonu.

### Sprint 4 — 4 Sekmeli Sonuç & Günlük Hayat Modülü
- `platform/sonuc.html/js`: Temel Skor, Çoklu Zihin Alanı, Oyun Özel, Performans Tablosu.
- `engine/componentCalculator.js`: accuracy, reaction, learning velocity fonksiyonları.
- `engine/aiAdvisor.js`: günlük hayat karşılığı sözlüğü ve yorum üretimi.
- `data/gameResultService.js`: uitgebreide sonuç şeması (`temel_skor`, `coklu_alan`, `oyun_ozel`, `hata_turleri`, `wpm`, `trendMeta`).

### Sprint 5 — Genel Analiz & Akademik Panel
- `platform/analiz.html/js`: radar grafiği (D3/Chart.js), heatmap, trend çizgileri, güçlü/geliştirilecek alan listesi.
- `engine/trendAI.js`, `engine/heatmap.js`: yeni veri kaynaklarıyla entegrasyon.
- Akademik panel (`platform/akademik.html` veya admin panel sekmesi): ders-bilişsel bağlantı tablosu, AI tahminleri.
- Rapor çıktıları (`management/report.js`): günlük hayat karşılığı ve alan skor tablosu.

### Sprint 6 — Tarihsel Gelişim & Çoklu Öğretmen Raporu
- `services/historyService.js`: günlük/haftalık/aylık sorgular, trend ikonları.
- `management/reportHistory.js`: timeline tabloları, çoklu öğretmen filtreleri.
- PDF/Word rapor güncellemesi: tarihli skor tablosu, trend grafikleri.

### Sprint 7 — Mesajlaşma & Öğretmen Yorumları
- Firestore `messages/{chatID}` koleksiyonu, `chatService.js`.
- `platform/teacher_panel.html` mesaj sekmesi: real-time listener, okundu durumu.
- Öğretmen yorum formu, `profiles/teacherID/ogrenciler/{ogrID}/yorumlar`.

### Sprint 8 — QA, Performans, Dokümantasyon
- Entegrasyon test planı (login → oyun → analiz → rapor).
- Performans optimizasyonu (lazy load grafikler, caching).
- Kullanıcı kılavuzu (öğretmen, öğrenci, kurum), teknik dökümantasyon, release checklist.

---

## Milestones & Çapraz Kontroller
- **M1 (Sprint 3 Sonu):** Zihin alanı menüsü → oyun meta akışı uçtan uca çalışır.
- **M2 (Sprint 5 Sonu):** 4 sekmeli analiz + genel panel + akademik panel entegre.
- **M3 (Sprint 7 Sonu):** Çoklu öğretmen desteği + mesajlaşma + raporlar tamamlanır.
- **M4 (Sprint 8 Sonu):** QA + dokümantasyon tamamlanmış, yayın hazır.

---

## Notlar
- Tarih aralıkları örnek niteliğinde; ekip kapasitesine göre güncellenebilir.
- Her sprintin ilk 2 günü planlama/demo, son 2 günü test/stabilizasyon için ayrılmalı.
- Gerektiğinde Sprint 5-6 arasına ek destek sprinti eklenebilir (ör. yeni oyun entegrasyonları).

> Bu dosya takvim paylaşımı veya yazdırma için `.md` formatında hazırlanmıştır. Word/PDF’e dönüştürmek için çevrim araçları kullanılabilir.

---

# 🔁 Ek: Sprint 1 Veri Modeli Planı (WIP)

## Firestore Koleksiyon Şeması

### `profiles/{uid}`
| Alan | Tip | Açıklama | Örnek |
| ---- | --- | -------- | ----- |
| `username` | string | Girişte kullanılan benzersiz kullanıcı adı | `"melis.ogr"` |
| `role` | string (`ogrenci`, `ogretmen`, `institution`, `admin`) | Router/security için temel rol | `"ogretmen"` |
| `fullName` | string | Ad soyad | `"Melis Yılmaz"` |
| `phone` | string | Opsiyonel telefon | `"+90 5xx xxx xx xx"` |
| `institution` | object | Kurum bağı | `{ id: "inst_123", status: "kabul" }` |
| `teachers` | map | Öğrencinin öğretmenleri (`teacherID: status`) | `{ "t_45": "kabul", "t_78": "bekleme" }` |
| `students` | map | Öğretmenin öğrencileri (`studentID: status`) | `{ "s_17": "kabul" }` |
| `pendingRequests` | array<object> | Kullanıcıya gelen davetler | `[ { from:"t_45", type:"teacher_invite", createdAt } ]` |
| `connections` | object | Çoklu öğretmen detayı (bakınız alt koleksiyon) | `{}` |
| `timeline` | object | Son skor özetleri (cache) | `{ lastGame:"ayirt_etme", lastScore:72 }` |

#### Alt Koleksiyonlar
- `connections/{relationId}` → `{ type:"teacher_student", targetId, status, requesterId, responderId, createdAt, updatedAt }`
- `oyunSonuclari/{docId}` → mevcut sonuç şeması (Sprint 4’te genişleyecek)
- `messages/{chatId}` → Sprint 7’de aktif olacak
- `yorumlar/{docId}` → Öğretmen notları (Sprint 7)

### `institutions/{institutionId}`
| Alan | Tip | Açıklama |
| `name` | string | Kurum adı |
| `code` | string | Kurum kodu |
| `address` | string | Adres |
| `phone` | string | İletişim |
| `admins` | array<string> | Kurum admin kullanıcı ID’leri |
| `teachers` | map | `teacherID: status` |
| `students` | map | `studentID: status` |

### `requests/{requestId}`
| Alan | Tip | Açıklama |
| `type` | string (`institution_teacher`, `teacher_student`, `student_teacher`) |
| `fromId` | string | İsteği gönderen uid |
| `toId` | string | Hedef uid |
| `payload` | object | Ek bilgiler (`institutionId`, `note`, vb.) |
| `status` | string (`beklemede`, `kabul`, `red`) |
| `createdAt` | timestamp | Firestore serverTimestamp |
| `respondedAt` | timestamp | Kabul/red zamanı |

## Security Rules Taslakları
```txt
match /profiles/{uid} {
  allow read: if isSelf(uid) || isLinkedTeacher(uid) || isAdmin();
  allow write: if isSelf(uid);

  match /connections/{connId} {
    allow read: if ownsConnection(connId);
    allow write: if requesterOrResponder(connId);
  }

  match /oyunSonuclari/{docId} {
    allow create: if isSelf(uid) && isStudent() || (isTeacher() && hasActiveStudent(uid));
    allow read: if isSelf(uid) || isTeacherOf(uid);
  }
}

match /requests/{requestId} {
  allow create: if isAuthenticated();
  allow read: if isRequesterOrTarget(requestId);
  allow update: if isRequesterOrTarget(requestId);
}

match /institutions/{instId} {
  allow read: if isInstitutionMember(instId) || isAdmin();
  allow write: if isInstitutionAdmin(instId) || isAdmin();
}
```
> `isSelf`, `isTeacherOf`, `hasActiveStudent` gibi fonksiyonlar `role` alanı ve `teachers/students` map’lerine göre çalışacak.

## Migasyon Adımları
1. Var olan `profiles` belgelerini çek ve eksik alanlara default değer ata (`role ?? "ogrenci"`, `teachers ?? {}` vb.).
2. `institution` alanı olmayan kullanıcılar için `{ id:null, status:null }` ekle.
3. Öğretmen profilleri için `students` map’i oluştur; veri yoksa boş nesne.
4. Firestore güvenlik kurallarını yeni alanlara göre deploy etmeden önce staging projede test et.

## Sonraki Aksiyonlar
- JSON örnekleri üzerinden müşteri onayı al.
- `globalConfig.js` sözlüklerini bu şemaya göre güncelle (özellikle `GLOBAL.FIRESTORE` yolları, yeni koleksiyon anahtarları).
- `requestService` API sözleşmesini çıkar.

