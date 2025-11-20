// =============================================================
// 📌 header.js — Zihin Platformu Ortak Üst Menü
// Tüm platform sayfalarında kullanılır
// =============================================================

import { ROLES, GLOBAL, BRAIN_AREAS } from "./globalConfig.js";
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

  // Öğrenci için öğretmen bölümü (sadece onaylanmış öğretmenler)
  const ogrenciOgretmenBolumu = role === ROLES.OGRENCI ? `
    <div class="header-ogretmen-dropdown" id="headerOgretmenDropdown">
      <button class="header-ogretmen-btn" onclick="toggleOgretmenDropdown()">
        👩‍🏫 Öğretmenler
      </button>
      <div class="header-ogretmen-menu" id="headerOgretmenMenu" style="display:none;">
        <div class="ogretmen-listesi">
          <div style="font-weight:600;margin-bottom:10px;font-size:14px;">👥 Onaylanmış Öğretmenlerim</div>
          <div id="headerOgretmenListesi" style="max-height:200px;overflow-y:auto;">
            <div style="padding:8px;color:#999;font-size:12px;">Yükleniyor...</div>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  // Tüm profiller için ortak yerleşim düzeni
  // Rol bazlı ikon seçimi
  const roleIcons = {
    [ROLES.OGRENCI]: '👤',
    [ROLES.OGRETMEN]: '👩‍🏫',
    [ROLES.ADMIN]: '⚙️',
    [ROLES.EDITOR]: '✏️',
    [ROLES.INSTITUTION]: '🏢'
  };
  const logoIcon = roleIcons[role] || '🧠';

  // Ana Menü'yü menü öğelerinden ayır
  const anaMenu = menuItems.find(m => m.href === 'index.html');
  const digerMenuItems = menuItems.filter(m => m.href !== 'index.html');
  
  // Mesajlaşma varsa ayrı tut
  const mesajlasma = menuItems.find(m => m.href === 'mesajlasma.html');
  const centerMenuItems = digerMenuItems.filter(m => m.href !== 'mesajlasma.html');
  
  // Sağda gösterilecek menü öğeleri
  const rightMenuItems = [];
  if (anaMenu) rightMenuItems.push(anaMenu);
  if (mesajlasma) rightMenuItems.push(mesajlasma);

  // Öğrenci için öğretmen dropdown'ı ortada (öğretmenler sayfasına yönlendir)
  // Öğretmen için öğrencilerim link'i ortada (ogrencilerim.html sayfasına yönlendir)
  // Kurum için öğretmenler ve öğrenciler link'leri ortada
  const centerSpecialItems = role === ROLES.OGRENCI ? `
    <a href="${basePath}ogretmenler.html" class="nav-link" style="text-decoration:none;">
      👩‍🏫 Öğretmenler
    </a>
  ` : role === ROLES.OGRETMEN ? `
    <a href="${basePath}ogrencilerim.html" class="nav-link" style="text-decoration:none;">
      👥 Öğrencilerim
    </a>
  ` : role === ROLES.INSTITUTION ? `
    <a href="${basePath}institution_panel.html#ogretmenler" class="nav-link" style="text-decoration:none;" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='ogretmenler'; setTimeout(function() { if(window.acSekme) { window.acSekme('ogretmenler'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
      👩‍🏫 Öğretmenler
    </a>
    <a href="${basePath}institution_panel.html#ogrenciler" class="nav-link" style="text-decoration:none;" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='ogrenciler'; setTimeout(function() { if(window.acSekme) { window.acSekme('ogrenciler'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
      👥 Öğrenciler
    </a>
  ` : '';

  const headerHTML = `
    <header class="platform-header role-header role-${role}">
      <div class="header-left">
        <div class="logo-icon">${logoIcon}</div>
        <div class="logo" onclick="window.location.href='${basePath}index.html'">
          Zihin Platformu
        </div>
      </div>
      
      <div class="header-center role-center-nav">
        ${centerSpecialItems}
        <nav class="header-nav role-center-nav-items">
          ${centerMenuItems.map(item => `
            <a href="${basePath}${item.href}" class="nav-link ${item.active ? 'active' : ''}">
              ${item.icon} ${item.text}
            </a>
          `).join('')}
        </nav>
      </div>
      
      <div class="header-right role-right-nav">
        ${getProfileMenuForRole(role, username, basePath)}
      </div>
    </header>
  `;

  return headerHTML;
}

// =============================================================
// 2) ROL BAZLI PROFİL MENÜSÜ
// =============================================================
function getProfileMenuForRole(role, username, basePath) {
  const profileIcon = role === ROLES.OGRENCI ? '👤' : 
                     role === ROLES.OGRETMEN ? '👩‍🏫' :
                     role === ROLES.INSTITUTION ? '🏢' :
                     role === ROLES.ADMIN ? '⚙️' :
                     role === ROLES.EDITOR ? '✏️' : '👤';

  if (role === ROLES.OGRENCI) {
    return `
      <div style="display:flex;align-items:center;gap:12px;">
        <!-- Mesaj Düğmesi -->
        <div class="header-message-btn-wrapper" id="headerMessageBtnWrapper">
          <a href="${basePath}mesajlasma.html" class="header-message-btn" id="headerMessageBtn" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:#FFFFFF;border:1px solid #D0D7E1;border-radius:8px;color:#0056B3;text-decoration:none;font-size:18px;transition:all 0.2s;">
            💬
            <span class="message-badge" id="messageBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#e74c3c;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;min-width:20px;padding:0 4px;">0</span>
          </a>
        </div>
        
        <!-- Profil Dropdown -->
        <div class="profile-dropdown" id="profileDropdown">
          <button class="profile-btn" onclick="toggleProfileMenu()">
            <span class="profile-icon">${profileIcon}</span>
            <span class="profile-name">${username}</span>
            <span class="profile-arrow">▼</span>
          </button>
          <div class="profile-menu" id="profileMenu" style="display:none;">
            <!-- Zihin Platformu -->
            <div class="menu-section">
              <div class="menu-item-large with-submenu" onclick="toggleSubmenu('zihinAlanlariSubmenu')">
                <span>🧠 Zihin Platformu</span>
                <span class="submenu-arrow">▶</span>
              </div>
              <div class="submenu" id="zihinAlanlariSubmenu" style="display:none;">
                ${Object.values(BRAIN_AREAS).map(area => `
                  <a href="${basePath}index.html" class="submenu-item" onclick="event.preventDefault(); localStorage.setItem('aktifAlan', '${area.id}'); window.location.href='${basePath}index.html';">
                    <span style="display:inline-block;width:12px;height:12px;background:${area.renk};border-radius:50%;margin-right:8px;vertical-align:middle;"></span>
                    <span>${area.ad}</span>
                  </a>
                `).join('')}
              </div>
            </div>
            
            <!-- Platform Alanları -->
            <div class="menu-section">
              <div class="menu-item-large with-submenu" onclick="toggleSubmenu('platformSubmenu')">
                <span>🎮 Platform Alanları</span>
                <span class="submenu-arrow">▶</span>
              </div>
              <div class="submenu" id="platformSubmenu" style="display:none;">
                <a href="${basePath}index.html" class="submenu-item">🏠 Ana Menü</a>
                <a href="${basePath}analiz.html" class="submenu-item">📊 Genel Analiz</a>
                <a href="${basePath}akademik.html" class="submenu-item">📈 Akademik Performans</a>
                <a href="${basePath}gelisim.html" class="submenu-item">📉 Gelişim</a>
                <a href="${basePath}profil.html" class="submenu-item">👤 Tam Öğrenci Profili</a>
                <a href="${basePath}mesajlasma.html" class="submenu-item">💬 Mesajlaşma</a>
              </div>
            </div>
            
            <!-- Mesajlaşma -->
            <div class="menu-section">
              <a href="${basePath}mesajlasma.html" class="menu-item-large" style="background:#f0f7ff;border-left:4px solid #4a90e2;">
                <span>💬 Mesajlaşma</span>
                <span class="message-badge-menu" id="messageBadgeMenu" style="display:none;margin-left:auto;background:#e74c3c;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;min-width:20px;padding:0 4px;">0</span>
              </a>
            </div>
            
            <!-- Takip İstekleri -->
            <div class="menu-section">
              <a href="${basePath}takip-istekleri.html" class="menu-item-large">
                <span>📩 Takip İstekleri</span>
              </a>
            </div>
            
            <!-- Öğretmenler -->
            <div class="menu-section">
              <a href="${basePath}ogretmenler.html" class="menu-item-large">
                <span>👩‍🏫 Öğretmenler</span>
              </a>
            </div>
            
            <!-- Kurum -->
            <div class="menu-section">
              <a href="${basePath}kurum.html" class="menu-item-large">
                <span>🏢 Kurum</span>
              </a>
            </div>
            
            <!-- Hesap Bilgileri -->
            <div class="menu-section">
              <a href="${basePath}hesap-bilgileri.html" class="menu-item-large">
                <span>⚙️ Hesap Bilgileri</span>
              </a>
            </div>
            
            <!-- Çıkış -->
            <div class="menu-section">
              <button class="menu-item-large logout-item" onclick="handleLogout('${basePath}')">
                <span>🚪 Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (role === ROLES.OGRETMEN) {
    return `
      <div style="display:flex;align-items:center;gap:12px;">
        <!-- Mesaj Düğmesi -->
        <div class="header-message-btn-wrapper" id="headerMessageBtnWrapper">
          <a href="${basePath}teacher_panel.html#mesajlar" class="header-message-btn" id="headerMessageBtn" onclick="if(window.location.pathname.includes('teacher_panel.html')) { event.preventDefault(); window.location.hash='mesajlar'; if(window.acSekme) window.acSekme('mesajlar'); }" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;text-decoration:none;font-size:18px;transition:all 0.2s;">
            💬
            <span class="message-badge" id="messageBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#e74c3c;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;min-width:20px;padding:0 4px;">0</span>
          </a>
        </div>
        
        <!-- Profil Dropdown -->
        <div class="profile-dropdown" id="profileDropdown">
          <button class="profile-btn" onclick="toggleProfileMenu()">
            <span class="profile-icon">${profileIcon}</span>
            <span class="profile-name">${username}</span>
            <span class="profile-arrow">▼</span>
          </button>
          <div class="profile-menu" id="profileMenu" style="display:none;">
            <!-- Öğretmen Paneli -->
            <div class="menu-section">
              <a href="${basePath}teacher_panel.html" class="menu-item-large">
                <span>👩‍🏫 Öğretmen Paneli</span>
              </a>
            </div>
            
            <!-- Öğrencilerim -->
            <div class="menu-section">
              <a href="${basePath}ogrencilerim.html" class="menu-item-large">
                <span>👥 Öğrencilerim</span>
              </a>
            </div>
            
            <!-- Kurum -->
            <div class="menu-section">
              <a href="${basePath}teacher_panel.html#kurum" class="menu-item-large">
                <span>🏢 Kurum</span>
              </a>
            </div>
            
            <!-- Mesajlaşma -->
            <div class="menu-section">
              <a href="${basePath}teacher_panel.html#mesajlar" class="menu-item-large" onclick="if(window.location.pathname.includes('teacher_panel.html')) { event.preventDefault(); window.location.hash='mesajlar'; if(window.acSekme) window.acSekme('mesajlar'); }">
                <span>💬 Mesajlaşma</span>
              </a>
            </div>
            
            <!-- Talepler -->
            <div class="menu-section">
              <a href="${basePath}teacher_panel.html#talepler" class="menu-item-large">
                <span>📩 Talepler</span>
              </a>
            </div>
            
            <!-- Hesap Bilgileri -->
            <div class="menu-section">
              <a href="${basePath}hesap-bilgileri.html" class="menu-item-large">
                <span>⚙️ Hesap Bilgileri</span>
              </a>
            </div>
            
            <!-- Çıkış -->
            <div class="menu-section">
              <button class="menu-item-large logout-item" onclick="handleLogout('${basePath}')">
                <span>🚪 Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (role === ROLES.INSTITUTION) {
    return `
      <div style="display:flex;align-items:center;gap:12px;">
        <!-- Mesaj Düğmesi -->
        <div class="header-message-btn-wrapper" id="headerMessageBtnWrapper">
          <a href="${basePath}institution_panel.html#mesajlar" class="header-message-btn" id="headerMessageBtn" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='mesajlar'; setTimeout(function() { if(window.acSekme) { window.acSekme('mesajlar'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }" style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;text-decoration:none;font-size:18px;transition:all 0.2s;">
            💬
            <span class="message-badge" id="messageBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#e74c3c;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;min-width:20px;padding:0 4px;">0</span>
          </a>
        </div>
        
        <!-- Profil Dropdown -->
        <div class="profile-dropdown" id="profileDropdown">
          <button class="profile-btn" onclick="toggleProfileMenu()">
            <span class="profile-icon">${profileIcon}</span>
            <span class="profile-name">${username}</span>
            <span class="profile-arrow">▼</span>
          </button>
          <div class="profile-menu" id="profileMenu" style="display:none;">
            <!-- Kurum Paneli -->
            <div class="menu-section">
              <a href="${basePath}institution_panel.html" class="menu-item-large">
                <span>🏢 Kurum Paneli</span>
              </a>
            </div>
            
            <!-- Öğretmenler -->
            <div class="menu-section">
              <a href="${basePath}institution_panel.html#ogretmenler" class="menu-item-large" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='ogretmenler'; setTimeout(function() { if(window.acSekme) { window.acSekme('ogretmenler'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
                <span>👩‍🏫 Öğretmenlerim</span>
              </a>
            </div>
            
            <!-- Öğrenciler -->
            <div class="menu-section">
              <a href="${basePath}institution_panel.html#ogrenciler" class="menu-item-large" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='ogrenciler'; setTimeout(function() { if(window.acSekme) { window.acSekme('ogrenciler'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
                <span>👥 Öğrenciler</span>
              </a>
            </div>
            
            <!-- Mesajlaşma -->
            <div class="menu-section">
              <a href="${basePath}institution_panel.html#mesajlar" class="menu-item-large" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='mesajlar'; setTimeout(function() { if(window.acSekme) { window.acSekme('mesajlar'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
                <span>💬 Mesajlaşma</span>
              </a>
            </div>
            
            <!-- Talepler -->
            <div class="menu-section">
              <a href="${basePath}institution_panel.html#talepler" class="menu-item-large" onclick="if(window.location.pathname.includes('institution_panel.html')) { event.preventDefault(); window.location.hash='talepler'; setTimeout(function() { if(window.acSekme) { window.acSekme('talepler'); } else { const e = new Event('hashchange'); window.dispatchEvent(e); } }, 100); }">
                <span>📩 Talepler</span>
              </a>
            </div>
            
            <!-- Hesap Bilgileri -->
            <div class="menu-section">
              <a href="${basePath}hesap-bilgileri.html" class="menu-item-large">
                <span>⚙️ Hesap Bilgileri</span>
              </a>
            </div>
            
            <!-- Çıkış -->
            <div class="menu-section">
              <button class="menu-item-large logout-item" onclick="handleLogout('${basePath}')">
                <span>🚪 Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (role === ROLES.ADMIN) {
    return `
      <div class="profile-dropdown" id="profileDropdown">
        <button class="profile-btn" onclick="toggleProfileMenu()">
          <span class="profile-icon">${profileIcon}</span>
          <span class="profile-name">${username}</span>
          <span class="profile-arrow">▼</span>
        </button>
        <div class="profile-menu" id="profileMenu" style="display:none;">
          <!-- Admin Paneli -->
          <div class="menu-section">
            <a href="${basePath}admin_panel.html" class="menu-item-large">
              <span>⚙️ Admin Paneli</span>
            </a>
          </div>
          
          <!-- Kullanıcılar -->
          <div class="menu-section">
            <a href="${basePath}admin_panel.html" class="menu-item-large">
              <span>👥 Kullanıcılar</span>
            </a>
          </div>
          
          <!-- Öğrenci Analizleri -->
          <div class="menu-section">
            <a href="${basePath}admin_panel.html" class="menu-item-large">
              <span>📊 Öğrenci Analizleri</span>
            </a>
          </div>
          
          <!-- Hesap Bilgileri -->
          <div class="menu-section">
            <a href="${basePath}hesap-bilgileri.html" class="menu-item-large">
              <span>⚙️ Hesap Bilgileri</span>
            </a>
          </div>
          
          <!-- Çıkış -->
          <div class="menu-section">
            <button class="menu-item-large logout-item" onclick="handleLogout('${basePath}')">
              <span>🚪 Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (role === ROLES.EDITOR) {
    return `
      <div class="profile-dropdown" id="profileDropdown">
        <button class="profile-btn" onclick="toggleProfileMenu()">
          <span class="profile-icon">${profileIcon}</span>
          <span class="profile-name">${username}</span>
          <span class="profile-arrow">▼</span>
        </button>
        <div class="profile-menu" id="profileMenu" style="display:none;">
          <!-- Editör Paneli -->
          <div class="menu-section">
            <a href="${basePath}editor_panel.html" class="menu-item-large">
              <span>✏️ Editör Paneli</span>
            </a>
          </div>
          
          <!-- Hesap Bilgileri -->
          <div class="menu-section">
            <a href="${basePath}hesap-bilgileri.html" class="menu-item-large">
              <span>⚙️ Hesap Bilgileri</span>
            </a>
          </div>
          
          <!-- Çıkış -->
          <div class="menu-section">
            <button class="menu-item-large logout-item" onclick="handleLogout('${basePath}')">
              <span>🚪 Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Varsayılan (diğer roller için)
  return `
    <div class="user-info-inline">
      <span class="user-name-inline">${profileIcon} ${username} <span class="user-role-inline">${getRoleDisplayName(role)}</span></span>
    </div>
    <button class="header-logout-btn" onclick="handleLogout('${basePath}')">
      🚪 Çıkış
    </button>
  `;
}

// =============================================================
// 3) ROL BAZLI MENÜ ÖĞELERİ
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
        { icon: '👤', text: 'Tam Öğrenci Profili', href: 'profil.html', active: currentPage === 'profil.html' },
        { icon: '💬', text: 'Mesajlaşma', href: 'mesajlasma.html', active: currentPage === 'mesajlasma.html' }
      ];

    case ROLES.OGRETMEN:
      return [
        ...baseItems,
        { icon: '👩‍🏫', text: 'Öğretmen Paneli', href: 'teacher_panel.html', active: currentPage === 'teacher_panel.html' }
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
    initOgrenciMesajSayisi();
  }

  // Öğretmen için mesaj sayısı fonksiyonunu başlat
  // (Öğrenci dropdown'ı kaldırıldı, artık direkt link var)
  if (localStorage.getItem("role") === ROLES.OGRETMEN) {
    initOgretmenMesajSayisi();
  }

  // Kurum için mesaj sayısı fonksiyonunu başlat
  if (localStorage.getItem("role") === ROLES.INSTITUTION) {
    initKurumMesajSayisi();
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

  // Öğretmen listesini yükle (sadece onaylanmış öğretmenler)
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

// =============================================================
// 7) ÖĞRETMEN İÇİN ÖĞRENCİ BÖLÜMÜ
// =============================================================
async function initOgretmenOgrenciBolumu() {
  // Dropdown açma/kapama
  window.toggleOgrenciDropdown = function() {
    const menu = document.getElementById("headerOgrenciMenu");
    if (menu) {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    }
  };

  // Öğrenci listesini yükle (sadece onaylanmış öğrenciler)
  yukleHeaderOgrenciListesi();

  // Dışarı tıklanınca dropdown'ı kapat
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("headerOgrenciDropdown");
    const menu = document.getElementById("headerOgrenciMenu");
    if (dropdown && menu && !dropdown.contains(e.target)) {
      menu.style.display = "none";
    }
  });
}

async function yukleHeaderOgrenciListesi() {
  const liste = document.getElementById("headerOgrenciListesi");
  if (!liste) return;

  try {
    const { db } = await import("../data/firebaseConfig.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    if (!db) return;

    const teacherId = localStorage.getItem("uid");
    if (!teacherId) return;

    const teacherRef = doc(db, "profiles", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    
    if (!teacherSnap.exists()) {
      liste.innerHTML = "<div style='padding:8px;color:#999;font-size:12px;'>Öğretmen profili bulunamadı.</div>";
      return;
    }

    const teacherData = teacherSnap.data();
    const students = teacherData.students || {};
    const approvedStudents = Object.keys(students).filter(id => students[id] === "kabul");

    if (!approvedStudents.length) {
      liste.innerHTML = "<div style='padding:8px;color:#999;font-size:12px;'>Henüz onaylanmış öğrenci yok.</div>";
      return;
    }

    liste.innerHTML = "";
    
    for (const studentId of approvedStudents) {
      try {
        const studentRef = doc(db, "profiles", studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const studentName = studentData.username || studentData.ad || studentData.fullName || "İsimsiz";
          
          const item = document.createElement("div");
          item.style.cssText = "padding:10px;cursor:pointer;border-bottom:1px solid #eee;transition:background 0.2s;";
          item.onmouseover = () => item.style.background = "#f0f8ff";
          item.onmouseout = () => item.style.background = "transparent";
          item.onclick = () => {
            localStorage.setItem("aktifOgrenciId", studentId);
            localStorage.setItem("aktifOgrenci", studentName);
            window.location.href = "analiz.html";
          };
          item.innerHTML = `<div style="font-weight:500;color:#1e3d59;">${studentName}</div>`;
          liste.appendChild(item);
        }
      } catch (err) {
        console.warn("Öğrenci bilgisi alınamadı:", studentId, err);
      }
    }
  } catch (err) {
    console.error("Öğrenci listesi yüklenemedi:", err);
    liste.innerHTML = "<div style='padding:8px;color:#999;font-size:12px;'>Bir hata oluştu.</div>";
  }
}

// =============================================================
// 8) ÖĞRETMEN İÇİN MESAJ SAYISI
// =============================================================
async function initOgretmenMesajSayisi() {
  const badge = document.getElementById("messageBadge");
  if (!badge) return;

  try {
    const { getUnreadMessageCount } = await import("../data/messageService.js");
    const teacherId = localStorage.getItem("uid");
    
    if (!teacherId) return;

    const updateMessageCount = async () => {
      const count = await getUnreadMessageCount(teacherId);
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count.toString();
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    };

    // İlk yükleme
    await updateMessageCount();

    // Her 10 saniyede bir güncelle
    setInterval(updateMessageCount, 10000);
  } catch (err) {
    console.error("Mesaj sayısı yüklenemedi:", err);
  }
}

// =============================================================
// 8A) ÖĞRENCİ İÇİN MESAJ SAYISI
// =============================================================
async function initOgrenciMesajSayisi() {
  const badge = document.getElementById("messageBadge");
  const badgeMenu = document.getElementById("messageBadgeMenu");
  if (!badge && !badgeMenu) return;

  try {
    const { getUnreadMessageCount } = await import("../data/messageService.js");
    const studentId = localStorage.getItem("uid") || localStorage.getItem("studentID");
    
    if (!studentId) return;

    const updateMessageCount = async () => {
      const count = await getUnreadMessageCount(studentId);
      if (count > 0) {
        const countText = count > 99 ? "99+" : count.toString();
        if (badge) {
          badge.textContent = countText;
          badge.style.display = "flex";
        }
        if (badgeMenu) {
          badgeMenu.textContent = countText;
          badgeMenu.style.display = "flex";
        }
      } else {
        if (badge) badge.style.display = "none";
        if (badgeMenu) badgeMenu.style.display = "none";
      }
    };

    // İlk yükleme
    await updateMessageCount();

    // Her 10 saniyede bir güncelle
    setInterval(updateMessageCount, 10000);
  } catch (err) {
    console.error("Öğrenci mesaj sayısı yüklenemedi:", err);
  }
}

// =============================================================
// 8B) KURUM İÇİN MESAJ SAYISI
// =============================================================
async function initKurumMesajSayisi() {
  const badge = document.getElementById("messageBadge");
  if (!badge) return;

  try {
    const { db } = await import("../data/firebaseConfig.js");
    const { 
      getInstitutionStudentChatList, 
      getInstitutionTeacherChatList 
    } = await import("../data/messageService.js");
    const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    
    const institutionId = localStorage.getItem("uid");
    if (!institutionId || !db) return;

    const updateMessageCount = async () => {
      try {
        let totalUnread = 0;

        // Öğrenci chat'lerinden okunmamış mesajları say
        const studentChats = await getInstitutionStudentChatList(institutionId);
        for (const chat of studentChats) {
          try {
            const chatId = chat.chatId;
            const messagesRef = collection(db, "messages", chatId, "messages");
            const q = query(
              messagesRef,
              where("to", "==", institutionId),
              where("read", "==", false)
            );
            const snapshot = await getDocs(q);
            totalUnread += snapshot.size;
          } catch (err) {
            console.warn("Öğrenci mesaj sayısı alınamadı:", chat.chatId, err);
          }
        }

        // Öğretmen chat'lerinden okunmamış mesajları say
        const teacherChats = await getInstitutionTeacherChatList(institutionId);
        for (const chat of teacherChats) {
          try {
            const chatId = chat.chatId;
            const messagesRef = collection(db, "messages", chatId, "messages");
            const q = query(
              messagesRef,
              where("to", "==", institutionId),
              where("read", "==", false)
            );
            const snapshot = await getDocs(q);
            totalUnread += snapshot.size;
          } catch (err) {
            console.warn("Öğretmen mesaj sayısı alınamadı:", chat.chatId, err);
          }
        }

        if (totalUnread > 0) {
          badge.textContent = totalUnread > 99 ? "99+" : totalUnread.toString();
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      } catch (err) {
        console.error("Mesaj sayısı hesaplama hatası:", err);
      }
    };

    // İlk yükleme
    await updateMessageCount();

    // Her 10 saniyede bir güncelle
    setInterval(updateMessageCount, 10000);
  } catch (err) {
    console.error("Kurum mesaj sayısı yüklenemedi:", err);
  }
}

// =============================================================
// 9) HESAP BİLGİLERİ FONKSİYONLARI
// =============================================================
window.acSifreDegistir = async function() {
  const mevcutSifre = prompt("Mevcut şifrenizi girin:");
  if (!mevcutSifre) return;

  const yeniSifre = prompt("Yeni şifrenizi girin (en az 6 karakter):");
  if (!yeniSifre || yeniSifre.length < 6) {
    alert("Şifre en az 6 karakter olmalıdır.");
    return;
  }

  const yeniSifreTekrar = prompt("Yeni şifrenizi tekrar girin:");
  if (yeniSifre !== yeniSifreTekrar) {
    alert("Şifreler eşleşmiyor.");
    return;
  }

  try {
    const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("❌ Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    // Mevcut şifreyi doğrula
    const credential = EmailAuthProvider.credential(user.email, mevcutSifre);
    await reauthenticateWithCredential(user, credential);

    // Şifreyi güncelle
    await updatePassword(user, yeniSifre);

    alert("✅ Şifre başarıyla değiştirildi!");
  } catch (err) {
    console.error("Şifre değiştirme hatası:", err);
    if (err.code === "auth/wrong-password") {
      alert("❌ Mevcut şifre yanlış.");
    } else if (err.code === "auth/weak-password") {
      alert("❌ Şifre çok zayıf. Daha güçlü bir şifre seçin.");
    } else {
      alert(`❌ Hata: ${err.message || "Şifre değiştirilemedi."}`);
    }
  }
};

window.acHesapSil = async function() {
  if (!confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.")) {
    return;
  }

  const onay = prompt("Silmek için 'SİL' yazın:");
  if (onay !== "SİL") {
    alert("İşlem iptal edildi.");
    return;
  }

  try {
    const { getAuth, deleteUser } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const { db } = await import("../data/firebaseConfig.js");
    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const auth = getAuth();
    const user = auth.currentUser;
    const uid = localStorage.getItem("uid");

    if (!user || !uid) {
      alert("❌ Oturum bulunamadı.");
      return;
    }

    // Profili sil
    if (db) {
      try {
        const userRef = doc(db, "profiles", uid);
        await deleteDoc(userRef);
      } catch (err) {
        console.warn("Profil silme hatası:", err);
      }
    }

    // Kullanıcıyı sil
    await deleteUser(user);

    // LocalStorage'ı temizle
    localStorage.clear();

    alert("✅ Hesabınız silindi. Giriş sayfasına yönlendiriliyorsunuz...");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Hesap silme hatası:", err);
    alert(`❌ Hata: ${err.message || "Hesap silinemedi."}`);
  }
};

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
// 5) PROFİL MENÜSÜ FONKSİYONLARI (Öğrenci için)
// =============================================================
window.toggleProfileMenu = function() {
  const menu = document.getElementById("profileMenu");
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
};

window.toggleSubmenu = function(submenuId) {
  const submenu = document.getElementById(submenuId);
  const arrow = event.currentTarget.querySelector('.submenu-arrow');
  if (submenu) {
    const isOpen = submenu.style.display === "block";
    submenu.style.display = isOpen ? "none" : "block";
    if (arrow) {
      arrow.textContent = isOpen ? "▶" : "▼";
    }
  }
};

// Dışarı tıklanınca menüyü kapat
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("profileDropdown");
  const menu = document.getElementById("profileMenu");
  if (dropdown && menu && !dropdown.contains(e.target)) {
    menu.style.display = "none";
    // Tüm alt menüleri kapat
    const submenus = document.querySelectorAll('.submenu');
    submenus.forEach(sub => sub.style.display = "none");
    const arrows = document.querySelectorAll('.submenu-arrow');
    arrows.forEach(arrow => arrow.textContent = "▶");
  }
});

// =============================================================
// 6) OTOMATIK BAŞLATMA
// =============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

