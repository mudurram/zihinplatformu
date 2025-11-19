# 📩 Talep Sistemi - Nasıl Çalışır?

## 🔍 Genel Bakış

Zihin Platformu'nda talepler **kullanıcı adı (username)** ile başlatılır, ancak **backend'de UID (Firebase User ID)** ile saklanır.

## 🔄 Talep Akışı

### 1. **UI Katmanı (Kullanıcı Görünümü)**
- Kullanıcı **kullanıcı adı** girer (örn: `ahmet.ogretmen`)
- Kullanıcı dostu ve hatırlanması kolay

### 2. **Dönüşüm Katmanı**
- `findUserByUsername(username)` fonksiyonu çağrılır
- Kullanıcı adı → **UID**'ye çevrilir
- Firestore'da `profiles` koleksiyonunda arama yapılır

### 3. **Backend Katmanı (Firestore)**
- Talep **UID'lerle** oluşturulur
- `fromId`: Gönderen kullanıcının UID'si
- `toId`: Alıcı kullanıcının UID'si
- `type`: Talep tipi (`student_teacher`, `teacher_student`, `institution_teacher`)

## 📋 Talep Tipleri

### 1. **Öğrenci → Öğretmen** (`student_teacher`)
- **UI:** Öğrenci öğretmen kullanıcı adını girer
- **Backend:** `createStudentTeacherRequest(studentId, teacherId)`
- **Firestore:** `fromId: studentId`, `toId: teacherId`

### 2. **Öğretmen → Öğrenci** (`teacher_student`)
- **UI:** Öğretmen öğrenci kullanıcı adını girer
- **Backend:** `createTeacherStudentRequest(teacherId, studentId)`
- **Firestore:** `fromId: teacherId`, `toId: studentId`

### 3. **Kurum → Öğretmen** (`institution_teacher`)
- **UI:** Kurum öğretmen kullanıcı adını girer
- **Backend:** `createInstitutionTeacherRequest(teacherId, institutionId)`
- **Firestore:** `fromId: teacherId`, `toId: institutionId`

## 🗄️ Firestore Yapısı

### `requests` Koleksiyonu
```javascript
{
  type: "student_teacher" | "teacher_student" | "institution_teacher",
  fromId: "uid123",        // Gönderen UID
  toId: "uid456",          // Alıcı UID
  payload: {
    teacherId: "uid456",
    studentId: "uid123",
    // Opsiyonel: username, fullName gibi ek bilgiler
  },
  status: "beklemede" | "kabul" | "red",
  createdAt: Timestamp,
  respondedAt: Timestamp,
  responderId: "uid456"
}
```

## 🔍 Kullanıcı Adı → UID Dönüşümü

### Fonksiyon: `findUserByUsername(username)`
```javascript
async function findUserByUsername(username) {
  const q = query(
    collection(db, "profiles"),
    where("username", "==", username)
  );
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  return snap.docs[0].id; // UID döner
}
```

### Kullanım Örneği
```javascript
// 1. Kullanıcı adı girilir
const username = "ahmet.ogretmen";

// 2. UID'ye çevrilir
const teacherUid = await findUserByUsername(username);

// 3. Talep oluşturulur
await createStudentTeacherRequest(studentId, teacherUid);
```

## 📊 Talep Gösterimi

### Öğrenci Paneli
- **Gelen Talepler:** Öğretmenden gelen talepler (`type: "teacher_student"`)
- **Gösterim:** `req.payload?.teacherUsername || req.fromId`
- Önce username varsa gösterilir, yoksa UID gösterilir

### Öğretmen Paneli
- **Gelen Talepler:** Öğrenciden veya kurumdan gelen talepler
- **Gösterim:** Gönderen kullanıcının profilinden `username` veya `fullName` alınır
- Eğer bulunamazsa UID gösterilir

## ✅ Avantajlar

1. **Kullanıcı Dostu:**
   - Kullanıcılar UID bilmek zorunda değil
   - Hatırlanması kolay kullanıcı adları

2. **Güvenlik:**
   - Backend'de UID kullanımı (Firebase standardı)
   - Kullanıcı adı değişse bile UID sabit kalır

3. **Esneklik:**
   - Kullanıcı adı değiştirilebilir
   - UID değişmez (Firebase garantisi)

## ⚠️ Önemli Notlar

1. **Kullanıcı Adı Benzersiz Olmalı:**
   - Firestore'da `username` field'ı unique olmalı
   - Aynı kullanıcı adıyla iki kullanıcı olamaz

2. **Kullanıcı Adı vs Email:**
   - ✅ Kullanıcı adı: `ahmet.ogretmen`
   - ❌ Email: `ahmet@example.com` (kullanılmaz)

3. **Rol Kontrolü:**
   - Talep göndermeden önce kullanıcının rolü kontrol edilir
   - Öğrenci sadece öğretmene talep gönderebilir
   - Öğretmen sadece öğrenciye talep gönderebilir

## 🔧 Teknik Detaylar

### requestService.js
```javascript
// UID'lerle talep oluşturma
export async function createRequest({ type, fromId, toId, payload = {} }) {
  const data = {
    type,
    fromId,  // UID
    toId,    // UID
    payload,
    status: "beklemede",
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, REQUESTS), data);
}
```

### index.js (Öğrenci)
```javascript
// 1. Kullanıcı adı girilir
const username = input.value;

// 2. UID'ye çevrilir
const teacherUid = await findUserByUsername(username);

// 3. Talep gönderilir
await createStudentTeacherRequest(studentId, teacherUid);
```

### teacher_panel.js (Öğretmen)
```javascript
// 1. Kullanıcı adı girilir
const username = input.value;

// 2. UID'ye çevrilir
const studentUid = await findUserByUsername(username);

// 3. Talep gönderilir
await createTeacherStudentRequest(teacherId, studentUid);
```

---

**Özet:** Talepler **kullanıcı adı ile başlatılır**, ancak **backend'de UID ile saklanır ve işlenir**. Bu yaklaşım hem kullanıcı dostu hem de güvenli bir sistem sağlar.



