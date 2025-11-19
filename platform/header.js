// =============================================================
// 📌 header.js — Zihin Platformu Ortak Üst Menü
// Tüm platform sayfalarında kullanılır
// =============================================================

import { ROLES, GLOBAL } from "./globalConfig.js";
import { logout } from "../auth/auth.js";

console.log("header.js yüklendi ✔");

// =============================================================
// 1) HEADER HTML OLUŞTUR
// =============================================================
export function createHeader(basePath = '') {
  const role = localStorage.getItem("role") || ROLES.OGRENCI;
  const username = localStorage.getItem("username") || localStorage.getItem("loggedUser") || "Kullanıcı";
  const uid = localStorage.getItem("uid") || "";

  // Rol bazlı menü öğeleri
  const menuItems = getMenuItemsForRole(role, basePath);

  // Öğrenci için öğretmen bölümü
  const ogrenciOgretmenBolumu = role === ROLES.OGRENCI ? `
    <div class="header-ogretmen-dropdown" id="headerOgretmenDropdown">
      <button class="header-ogretmen-btn" onclick="toggleOgretmenDropdown()">
        👩‍🏫 Öğretmenler
      </button>
      <div class="header-ogretmen-menu" id="headerOgretmenMenu" style="display:none;">
        <div class="ogretmen-talep-gonder">
          <input type="text" id="headerOgretmenUsernameInput" placeholder="Öğretmen kullanıcı adı" style="width:100%;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #ddd;">
          <button onclick="headerOgretmenTalepGonder()" style="width:100%;padding:8px;background:#4a90e2;color:white;border:none;border-radius:6px;cursor:pointer;">📤 Talep Gönder</button>
          <div id="headerTalepMesaji" style="margin-top:8px;font-size:12px;"></div>
        </div>
        <div class="ogretmen-bekleyen-talepler" style="margin-top:15px;border-top:1px solid #ddd;padding-top:15px;">
          <div style="font-weight:600;margin-bottom:10px;font-size:14px;">📥 Bekleyen Talepler</div>
          <ul id="headerOgretmenTalepListesi" style="list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto;">
            <li style="padding:8px;color:#999;font-size:12px;">Yükleniyor...</li>
          </ul>
        </div>
        <div class="ogretmen-listesi" style="margin-top:15px;border-top:1px solid #ddd;padding-top:15px;">
          <div style="font-weight:600;margin-bottom:10px;font-size:14px;">👥 Öğretmenlerim</div>
          <div id="headerOgretmenListesi" style="max-height:200px;overflow-y:auto;">
            <div style="padding:8px;color:#999;font-size:12px;">Yükleniyor...</div>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  const headerHTML = `
    <header class="platform-header">
      <div class="header-left">
        <div class="logo" onclick="window.location.href='${basePath}index.html'">
          🧠 Zihin Platformu
        </div>
      </div>
      
      <div class="header-center">
        <div class="user-info">
          <span class="user-name">👤 ${username}</span>
          <span class="user-role">${getRoleDisplayName(role)}</span>
        </div>
      </div>
      
      <div class="header-right">
        ${ogrenciOgretmenBolumu}
        <nav class="header-nav">
          ${menuItems.map(item => `
            <a href="${basePath}${item.href}" class="nav-link ${item.active ? 'active' : ''}">
              ${item.icon} ${item.text}
            </a>
          `).join('')}
        </nav>
        <button class="header-logout-btn" onclick="handleLogout('${basePath}')">
          🚪 Çıkış
        </button>
      </div>
    </header>
  `;

  return headerHTML;
}

// =============================================================
// 2) ROL BAZLI MENÜ ÖĞELERİ
// =============================================================
function getMenuItemsForRole(role, basePath = '') {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  const baseItems = [
    { icon: '🏠', text: 'Ana Menü', href: 'index.html', active: currentPage === 'index.html' }
  ];

  switch (role) {
    case ROLES.OGRENCI:
      return [
        ...baseItems,
        { icon: '📊', text: 'Genel Analiz', href: 'analiz.html', active: currentPage === 'analiz.html' },
        { icon: '📈', text: 'Akademik Performans', href: 'akademik.html', active: currentPage === 'akademik.html' },
        { icon: '📉', text: 'Gelişim', href: 'gelisim.html', active: currentPage === 'gelisim.html' },
        { icon: '💬', text: 'Mesajlaşma', href: 'mesajlasma.html', active: currentPage === 'mesajlasma.html' }
      ];

    case ROLES.OGRETMEN:
      return [
        ...baseItems,
        { icon: '👥', text: 'Öğrenciler', href: 'teacher_panel.html', active: currentPage === 'teacher_panel.html' }
      ];

    case ROLES.ADMIN:
      return [
        ...baseItems,
        { icon: '⚙️', text: 'Admin Panel', href: 'admin_panel.html', active: currentPage === 'admin_panel.html' }
      ];

    case ROLES.EDITOR:
      return [
        ...baseItems,
        { icon: '✏️', text: 'Editör Panel', href: 'editor_panel.html', active: currentPage === 'editor_panel.html' }
      ];

    case ROLES.INSTITUTION:
      return [
        ...baseItems,
        { icon: '🏢', text: 'Kurum Panel', href: 'institution_panel.html', active: currentPage === 'institution_panel.html' }
      ];

    default:
      return baseItems;
  }
}

// =============================================================
// 3) ROL GÖSTERİM ADI
// =============================================================
function getRoleDisplayName(role) {
  const roleNames = {
    [ROLES.OGRENCI]: 'Öğrenci',
    [ROLES.OGRETMEN]: 'Öğretmen',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.EDITOR]: 'Editör',
    [ROLES.INSTITUTION]: 'Kurum'
  };
  return roleNames[role] || 'Kullanıcı';
}

// =============================================================
// 4) HEADER'I SAYFAYA EKLE
// =============================================================
export function initHeader() {
  // Eğer login sayfasındaysak header ekleme
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  // Oyun sayfaları için doğru yolları ayarla
  const isOyunSayfasi = window.location.pathname.includes('/oyunlar/');
  const basePath = isOyunSayfasi ? '../../platform/' : '';

  // Mevcut header'ı kontrol et (hem .platform-header hem .ust-panel hem de .nav-bar, .topBar)
  const existingHeader = document.querySelector('.platform-header, .ust-panel, .nav-bar, #navBar, .topBar');
  if (existingHeader) {
    // Eski header'ı yeni header ile değiştir
    const newHeader = document.createElement('div');
    newHeader.innerHTML = createHeader(basePath);
    existingHeader.replaceWith(newHeader.firstElementChild);
  } else {
    // Body'nin en üstüne header ekle
    const headerDiv = document.createElement('div');
    headerDiv.innerHTML = createHeader(basePath);
    document.body.insertBefore(headerDiv.firstElementChild, document.body.firstChild);
  }

  // Logout fonksiyonunu global scope'a ekle
  window.handleLogout = async function(basePath = '') {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
      window.location.href = basePath + 'login.html';
    }
  };

  // Öğrenci için öğretmen bölümü fonksiyonlarını başlat
  if (localStorage.getItem("role") === ROLES.OGRENCI) {
    initOgrenciOgretmenBolumu();
  }
}

// =============================================================
// 6) ÖĞRENCİ İÇİN ÖĞRETMEN BÖLÜMÜ
// =============================================================
async function initOgrenciOgretmenBolumu() {
  // Dropdown açma/kapama
  window.toggleOgretmenDropdown = function() {
    const menu = document.getElementById("headerOgretmenMenu");
    if (menu) {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    }
  };

  // Talep gönderme
  window.headerOgretmenTalepGonder = async function() {
    const input = document.getElementById("headerOgretmenUsernameInput");
    const mesajDiv = document.getElementById("headerTalepMesaji");
    
    if (!input || !mesajDiv) return;
    
    const username = input.value.trim();
    if (!username) {
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>⚠ Lütfen öğretmen kullanıcı adı girin.</span>";
      return;
    }

    mesajDiv.innerHTML = "<span style='color:#3498db;'>⏳ Kontrol ediliyor...</span>";
    
    try {
      const { db } = await import("../data/firebaseConfig.js");
      const { doc, getDoc, query, collection, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      const { createStudentTeacherRequest } = await import("../data/requestService.js");
      const { ROLES } = await import("./globalConfig.js");
      
      if (!db) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Veritabanı bağlantısı yok.</span>";
        return;
      }

      // Öğretmeni bul
      const q = query(collection(db, "profiles"), where("username", "==", username));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Öğretmen bulunamadı.</span>";
        return;
      }

      const teacherId = snap.docs[0].id;
      const teacherData = snap.docs[0].data();
      
      if (teacherData.role !== ROLES.OGRETMEN) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bu kullanıcı öğretmen değil.</span>";
        return;
      }

      const studentId = localStorage.getItem("uid");
      if (!studentId) {
        mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Oturum hatası.</span>";
        return;
      }

      const result = await createStudentTeacherRequest(studentId, teacherId);
      
      if (result.success) {
        mesajDiv.innerHTML = "<span style='color:#27ae60;'>✅ Talep gönderildi!</span>";
        input.value = "";
        setTimeout(() => {
          mesajDiv.innerHTML = "";
        }, 3000);
        yukleHeaderOgretmenTalepleri();
      } else {
        mesajDiv.innerHTML = `<span style='color:#e74c3c;'>❌ ${result.message || "Hata"}</span>`;
      }
    } catch (err) {
      console.error("Talep gönderme hatası:", err);
      mesajDiv.innerHTML = "<span style='color:#e74c3c;'>❌ Bir hata oluştu.</span>";
    }
  };

  // Bekleyen talepleri yükle
  yukleHeaderOgretmenTalepleri();
  
  // Öğretmen listesini yükle
  yukleHeaderOgretmenListesi();

  // Dışarı tıklanınca dropdown'ı kapat
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("headerOgretmenDropdown");
    const menu = document.getElementById("headerOgretmenMenu");
    if (dropdown && menu && !dropdown.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}

async function yukleHeaderOgretmenTalepleri() {
  const liste = document.getElementById("headerOgretmenTalepListesi");
  if (!liste) return;

  try {
    const { db } = await import("../data/firebaseConfig.js");
    const { listRequestsByUser } = await import("../data/requestService.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    if (!db) return;

    const studentId = localStorage.getItem("uid");
    if (!studentId) return;

    const talepler = await listRequestsByUser(studentId);
    const bekleyenTalepler = talepler.filter(req => req.type === "teacher_student" && req.status === "beklemede");

    if (!bekleyenTalepler.length) {
      liste.innerHTML = "<li style='padding:8px;color:#999;font-size:12px;'>Bekleyen talep yok.</li>";
      return;
    }

    liste.innerHTML = "";
    
    for (const req of bekleyenTalepler) {
      let teacherName = req.fromId;
      try {
        const teacherRef = doc(db, "profiles", req.fromId);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          teacherName = teacherData.fullName || teacherData.username || teacherData.ad || req.fromId;
        }
      } catch (err) {
        console.warn("Öğretmen bilgisi alınamadı:", err);
      }

      const li = document.createElement("li");
      li.style.cssText = "padding:8px;margin-bottom:6px;background:#f0f8ff;border-radius:6px;display:flex;justify-content:space-between;align-items:center;font-size:12px;";
      li.innerHTML = `
        <span><strong>${teacherName}</strong> öğretmeni seni eklemek istiyor.</span>
        <div style="display:flex;gap:6px;">
          <button onclick="headerTalepKabul('${req.id}')" style="padding:4px 10px;background:#27ae60;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">✓ Kabul</button>
          <button onclick="headerTalepRed('${req.id}')" style="padding:4px 10px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">✗ Red</button>
        </div>
      `;
      liste.appendChild(li);
    }
  } catch (err) {
    console.error("Talepler yüklenemedi:", err);
    liste.innerHTML = "<li style='padding:8px;color:#e74c3c;font-size:12px;'>Hata oluştu.</li>";
  }
}

window.headerTalepKabul = async function(requestId) {
  try {
    const { respondRequest } = await import("../data/requestService.js");
    const uid = localStorage.getItem("uid");
    await respondRequest(requestId, "kabul", uid);
    yukleHeaderOgretmenTalepleri();
    yukleHeaderOgretmenListesi();
  } catch (err) {
    console.error("Talep kabul hatası:", err);
  }
};

window.headerTalepRed = async function(requestId) {
  try {
    const { respondRequest } = await import("../data/requestService.js");
    const uid = localStorage.getItem("uid");
    await respondRequest(requestId, "red", uid);
    yukleHeaderOgretmenTalepleri();
  } catch (err) {
    console.error("Talep red hatası:", err);
  }
};

async function yukleHeaderOgretmenListesi() {
  const liste = document.getElementById("headerOgretmenListesi");
  if (!liste) return;

  try {
    const { db } = await import("../data/firebaseConfig.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    if (!db) return;

    const studentId = localStorage.getItem("uid");
    if (!studentId) return;

    const studentRef = doc(db, "profiles", studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      liste.innerHTML = "<div style='padding:8px;color:#999;font-size:12px;'>Profil bulunamadı.</div>";
      return;
    }

    const studentData = studentSnap.data();
    const teachers = studentData.teachers || {};
    const ogretmenIds = Object.keys(teachers).filter(tid => teachers[tid] === "kabul");

    if (!ogretmenIds.length) {
      liste.innerHTML = "<div style='padding:8px;color:#999;font-size:12px;'>Henüz öğretmenin yok.</div>";
      return;
    }

    liste.innerHTML = "";
    
    for (const teacherId of ogretmenIds) {
      try {
        const teacherRef = doc(db, "profiles", teacherId);
        const teacherSnap = await getDoc(teacherRef);
        
        if (!teacherSnap.exists()) continue;

        const teacherData = teacherSnap.data();
        const teacherName = teacherData.fullName || teacherData.username || teacherData.ad || "Öğretmen";

        const div = document.createElement("div");
        div.style.cssText = "padding:8px;margin-bottom:6px;background:#f0f8ff;border-radius:6px;font-size:12px;cursor:pointer;";
        div.textContent = teacherName;
        div.onclick = () => {
          window.location.href = "mesajlasma.html";
        };
        liste.appendChild(div);
      } catch (err) {
        console.warn("Öğretmen bilgisi alınamadı:", teacherId, err);
      }
    }
  } catch (err) {
    console.error("Öğretmen listesi yüklenemedi:", err);
    liste.innerHTML = "<div style='padding:8px;color:#e74c3c;font-size:12px;'>Hata oluştu.</div>";
  }
}

// =============================================================
// 5) OTOMATIK BAŞLATMA
// =============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

