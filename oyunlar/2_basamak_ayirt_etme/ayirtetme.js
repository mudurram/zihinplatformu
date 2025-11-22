// ==========================================================
// 🎯 2. Basamak - Ayırt Etme Oyunu (Genişletilmiş)
// Tüm alt oyunları destekler
// ==========================================================

import { GLOBAL, ROLES } from "../../platform/globalConfig.js";
import { GameEngine } from "../../engine/gameEngine.js";

// ==========================================================
// 🎨 VERİ HAVUZLARI
// ==========================================================

// SVG Görsel Üreticileri - Gerçekçi Çizimler
// Test: Basit bir SVG oluştur
function testSVG() {
  return `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="10" width="20" height="40" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
    <polygon points="40,10 60,10 50,0" fill="#2C3E50"/>
  </svg>`;
}

function kalemSVG(kalinlik) {
  const width = kalinlik === "kalin" ? 8 : kalinlik === "ince" ? 3 : kalinlik === "orta" ? 5 : 2;
  const height = 60;
  const tipYukseklik = 15;
  const govdeYukseklik = height - tipYukseklik;
  
  return `
    <svg width="80" height="${height}" viewBox="0 0 80 ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Kalem gövdesi -->
      <rect x="${40 - width/2}" y="${tipYukseklik}" width="${width}" height="${govdeYukseklik}" 
            fill="#FFD700" stroke="#DAA520" stroke-width="0.5" rx="1"/>
      <!-- Kalem ucu -->
      <polygon points="${40 - width/2},${tipYukseklik} ${40 + width/2},${tipYukseklik} 40,0" 
               fill="#2C3E50" stroke="#1A252F" stroke-width="0.5"/>
      <!-- Metal bant -->
      <rect x="${40 - width/2 - 1}" y="${tipYukseklik + 2}" width="${width + 2}" height="3" 
            fill="#C0C0C0" opacity="0.8"/>
    </svg>
  `;
}

function kitapSVG(kalinlik) {
  const width = 50;
  const height = kalinlik === "kalin" ? 45 : kalinlik === "ince" ? 15 : kalinlik === "orta" ? 30 : 10;
  
  return `
    <svg width="60" height="${Math.max(height, 20)}" viewBox="0 0 60 ${Math.max(height, 20)}" xmlns="http://www.w3.org/2000/svg">
      <!-- Kitap kapağı -->
      <rect x="5" y="5" width="${width}" height="${height}" 
            fill="#8B4513" stroke="#654321" stroke-width="1" rx="2"/>
      <!-- Sayfalar -->
      <rect x="7" y="7" width="${width - 4}" height="${height - 4}" 
            fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.5"/>
      <!-- Cilt çizgileri -->
      <line x1="30" y1="7" x2="30" y2="${7 + height - 4}" stroke="#654321" stroke-width="0.5"/>
      ${height > 20 ? `<line x1="20" y1="12" x2="40" y2="12" stroke="#D0D0D0" stroke-width="0.3"/>` : ''}
      ${height > 25 ? `<line x1="20" y1="17" x2="40" y2="17" stroke="#D0D0D0" stroke-width="0.3"/>` : ''}
    </svg>
  `;
}

function agacSVG(kalinlik) {
  const govdeGenislik = kalinlik === "kalin" ? 12 : kalinlik === "ince" ? 4 : kalinlik === "orta" ? 8 : 3;
  const govdeYukseklik = 40;
  const yaprakGenislik = 35;
  
  return `
    <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
      <!-- Ağaç gövdesi -->
      <rect x="${25 - govdeGenislik/2}" y="20" width="${govdeGenislik}" height="${govdeYukseklik}" 
            fill="#8B4513" stroke="#654321" stroke-width="0.5" rx="2"/>
      <!-- Yapraklar -->
      <ellipse cx="25" cy="15" rx="${yaprakGenislik/2}" ry="12" fill="#228B22" stroke="#006400" stroke-width="0.5"/>
      <ellipse cx="20" cy="12" rx="8" ry="6" fill="#32CD32" opacity="0.8"/>
      <ellipse cx="30" cy="12" rx="8" ry="6" fill="#32CD32" opacity="0.8"/>
    </svg>
  `;
}

function ipHalatSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 8 : kalinlik === "ince" ? 2 : kalinlik === "orta" ? 5 : 1.5;
  const uzunluk = 50;
  
  return `
    <svg width="60" height="${uzunluk}" viewBox="0 0 60 ${uzunluk}" xmlns="http://www.w3.org/2000/svg">
      <!-- İp/Halat -->
      <rect x="${30 - genislik/2}" y="5" width="${genislik}" height="${uzunluk - 10}" 
            fill="#D2691E" stroke="#8B4513" stroke-width="0.5" rx="${genislik/2}"/>
      <!-- Doku çizgileri -->
      ${kalinlik === "kalin" ? `
        <line x1="${30 - genislik/2 + 1}" y1="10" x2="${30 - genislik/2 + 1}" y2="${uzunluk - 5}" stroke="#8B4513" stroke-width="0.3" opacity="0.5"/>
        <line x1="${30 + genislik/2 - 1}" y1="10" x2="${30 + genislik/2 - 1}" y2="${uzunluk - 5}" stroke="#8B4513" stroke-width="0.3" opacity="0.5"/>
      ` : ''}
    </svg>
  `;
}

function mumSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 10 : kalinlik === "ince" ? 4 : kalinlik === "orta" ? 7 : 3;
  const yukseklik = 45;
  
  return `
    <svg width="50" height="${yukseklik + 10}" viewBox="0 0 50 ${yukseklik + 10}" xmlns="http://www.w3.org/2000/svg">
      <!-- Mum gövdesi -->
      <rect x="${25 - genislik/2}" y="10" width="${genislik}" height="${yukseklik}" 
            fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.5" rx="2"/>
      <!-- Fitil -->
      <line x1="25" y1="5" x2="25" y2="10" stroke="#2C3E50" stroke-width="1"/>
      <circle cx="25" cy="5" r="2" fill="#FFD700"/>
      <!-- Alev -->
      <ellipse cx="25" cy="3" rx="2" ry="3" fill="#FF6B35" opacity="0.8"/>
    </svg>
  `;
}

function boruSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 12 : kalinlik === "ince" ? 4 : kalinlik === "orta" ? 8 : 3;
  const uzunluk = 50;
  
  return `
    <svg width="60" height="${uzunluk}" viewBox="0 0 60 ${uzunluk}" xmlns="http://www.w3.org/2000/svg">
      <!-- Boru -->
      <rect x="${30 - genislik/2}" y="5" width="${genislik}" height="${uzunluk - 10}" 
            fill="#708090" stroke="#556B2F" stroke-width="0.5" rx="${genislik/2}"/>
      <!-- Metalik parlaklık -->
      <ellipse cx="30" cy="${uzunluk/2}" rx="${genislik/2 - 1}" ry="${(uzunluk - 10)/2 - 2}" 
               fill="#C0C0C0" opacity="0.3"/>
    </svg>
  `;
}

function cikolataSVG(kalinlik) {
  const genislik = 40;
  const yukseklik = kalinlik === "kalin" ? 12 : kalinlik === "ince" ? 3 : kalinlik === "orta" ? 7 : 2;
  
  return `
    <svg width="50" height="${Math.max(yukseklik + 5, 15)}" viewBox="0 0 50 ${Math.max(yukseklik + 5, 15)}" xmlns="http://www.w3.org/2000/svg">
      <!-- Çikolata bar -->
      <rect x="5" y="5" width="${genislik}" height="${yukseklik}" 
            fill="#8B4513" stroke="#654321" stroke-width="0.5" rx="2"/>
      <!-- Kareler -->
      <line x1="15" y1="5" x2="15" y2="${5 + yukseklik}" stroke="#654321" stroke-width="0.3"/>
      <line x1="25" y1="5" x2="25" y2="${5 + yukseklik}" stroke="#654321" stroke-width="0.3"/>
      <line x1="35" y1="5" x2="35" y2="${5 + yukseklik}" stroke="#654321" stroke-width="0.3"/>
      <line x1="5" y1="${5 + yukseklik/3}" x2="45" y2="${5 + yukseklik/3}" stroke="#654321" stroke-width="0.3"/>
      <line x1="5" y1="${5 + yukseklik*2/3}" x2="45" y2="${5 + yukseklik*2/3}" stroke="#654321" stroke-width="0.3"/>
    </svg>
  `;
}

function kabloSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 10 : kalinlik === "ince" ? 3 : kalinlik === "orta" ? 6 : 2;
  const uzunluk = 50;
  
  return `
    <svg width="60" height="${uzunluk}" viewBox="0 0 60 ${uzunluk}" xmlns="http://www.w3.org/2000/svg">
      <!-- Kablo -->
      <rect x="${30 - genislik/2}" y="5" width="${genislik}" height="${uzunluk - 10}" 
            fill="#2C3E50" stroke="#1A252F" stroke-width="0.5" rx="${genislik/2}"/>
      <!-- İzolasyon çizgileri -->
      <line x1="${30 - genislik/2}" y1="15" x2="${30 + genislik/2}" y2="15" stroke="#FFD700" stroke-width="0.5"/>
      <line x1="${30 - genislik/2}" y1="25" x2="${30 + genislik/2}" y2="25" stroke="#FFD700" stroke-width="0.5"/>
      <line x1="${30 - genislik/2}" y1="35" x2="${30 + genislik/2}" y2="35" stroke="#FFD700" stroke-width="0.5"/>
    </svg>
  `;
}

function silgiSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 25 : kalinlik === "ince" ? 8 : kalinlik === "orta" ? 16 : 6;
  const yukseklik = 20;
  
  return `
    <svg width="40" height="${yukseklik + 5}" viewBox="0 0 40 ${yukseklik + 5}" xmlns="http://www.w3.org/2000/svg">
      <!-- Silgi -->
      <rect x="${20 - genislik/2}" y="5" width="${genislik}" height="${yukseklik}" 
            fill="#FF69B4" stroke="#FF1493" stroke-width="0.5" rx="3"/>
      <!-- Metal bant -->
      <rect x="${20 - genislik/2}" y="5" width="${genislik}" height="3" 
            fill="#C0C0C0" opacity="0.8"/>
    </svg>
  `;
}

function tebesirSVG(kalinlik) {
  const genislik = kalinlik === "kalin" ? 8 : kalinlik === "ince" ? 3 : kalinlik === "orta" ? 5 : 2;
  const uzunluk = 50;
  
  return `
    <svg width="50" height="${uzunluk}" viewBox="0 0 50 ${uzunluk}" xmlns="http://www.w3.org/2000/svg">
      <!-- Tebeşir -->
      <rect x="${25 - genislik/2}" y="5" width="${genislik}" height="${uzunluk - 10}" 
            fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.5" rx="${genislik/2}"/>
      <!-- Doku -->
      <line x1="${25 - genislik/2 + 1}" y1="10" x2="${25 - genislik/2 + 1}" y2="${uzunluk - 5}" 
            stroke="#D0D0D0" stroke-width="0.3" opacity="0.5"/>
      <line x1="${25 + genislik/2 - 1}" y1="10" x2="${25 + genislik/2 - 1}" y2="${uzunluk - 5}" 
            stroke="#D0D0D0" stroke-width="0.3" opacity="0.5"/>
    </svg>
  `;
}

// SVG fonksiyonunu nesne tipine göre çağıran yardımcı fonksiyon
function nesneSVG(nesneTipi, kalinlik) {
  const svgFonksiyonlari = {
    "kalem": kalemSVG,
    "kitap": kitapSVG,
    "agac": agacSVG,
    "ip": ipHalatSVG,
    "mum": mumSVG,
    "boru": boruSVG,
    "cikolata": cikolataSVG,
    "kablo": kabloSVG,
    "silgi": silgiSVG,
    "tebesir": tebesirSVG
  };
  
  const fonksiyon = svgFonksiyonlari[nesneTipi];
  if (!fonksiyon) {
    console.error("❌ SVG fonksiyonu bulunamadı:", nesneTipi, "Mevcut fonksiyonlar:", Object.keys(svgFonksiyonlari));
    return "";
  }
  const result = fonksiyon(kalinlik);
  if (!result || result.trim() === "") {
    console.error("❌ SVG fonksiyonu boş döndü:", nesneTipi, kalinlik);
  }
  return result || "";
}

// Renkler
const RENKLER = [
  { ad: "Kırmızı", kod: "#e53935" },
  { ad: "Mavi", kod: "#2962ff" },
  { ad: "Yeşil", kod: "#43a047" },
  { ad: "Sarı", kod: "#fdd835" },
  { ad: "Mor", kod: "#8e24aa" },
  { ad: "Turuncu", kod: "#fb8c00" },
  { ad: "Kahverengi", kod: "#6d4c41" },
  { ad: "Pembe", kod: "#f06292" }
];

// Boyutlar - Detaylı Sahne Verileri
const BOYUTLAR = {
  buyuk_kucuk: {
    sahneler: [
      { 
        ustResim: { emoji: "🎈", ad: "Küçük Balon", boyut: "kucuk" },
        buyukSecenek: { emoji: "🎈", ad: "Büyük Balon", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🎈", ad: "Küçük Balon", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🎈", ad: "Orta Balon", boyut: "orta", deger: "orta" },
          { emoji: "🎈", ad: "Çok Küçük Balon", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "⚽", ad: "Küçük Top", boyut: "kucuk" },
        buyukSecenek: { emoji: "⚽", ad: "Büyük Futbol Topu", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "⚽", ad: "Küçük Top", boyut: "kucuk", deger: "kucuk" },
          { emoji: "⚽", ad: "Orta Top", boyut: "orta", deger: "orta" },
          { emoji: "⚽", ad: "Çok Küçük Top", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🌳", ad: "Küçük Ağaç", boyut: "kucuk" },
        buyukSecenek: { emoji: "🌳", ad: "Büyük Ağaç", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🌳", ad: "Küçük Ağaç", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🌳", ad: "Orta Ağaç", boyut: "orta", deger: "orta" },
          { emoji: "🌳", ad: "Çok Küçük Ağaç", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🚗", ad: "Küçük Araba", boyut: "kucuk" },
        buyukSecenek: { emoji: "🚗", ad: "Büyük Araba", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🚗", ad: "Küçük Araba", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🚗", ad: "Orta Araba", boyut: "orta", deger: "orta" },
          { emoji: "🚗", ad: "Çok Küçük Araba", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🏠", ad: "Küçük Ev", boyut: "kucuk" },
        buyukSecenek: { emoji: "🏠", ad: "Büyük Ev", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🏠", ad: "Küçük Ev", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🏠", ad: "Orta Ev", boyut: "orta", deger: "orta" },
          { emoji: "🏠", ad: "Çok Küçük Ev", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🐱", ad: "Küçük Kedi", boyut: "kucuk" },
        buyukSecenek: { emoji: "🐱", ad: "Büyük Kedi", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🐱", ad: "Küçük Kedi", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🐱", ad: "Orta Kedi", boyut: "orta", deger: "orta" },
          { emoji: "🐱", ad: "Çok Küçük Kedi", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "☕", ad: "Küçük Fincan", boyut: "kucuk" },
        buyukSecenek: { emoji: "☕", ad: "Büyük Fincan", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "☕", ad: "Küçük Fincan", boyut: "kucuk", deger: "kucuk" },
          { emoji: "☕", ad: "Orta Fincan", boyut: "orta", deger: "orta" },
          { emoji: "☕", ad: "Çok Küçük Fincan", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🎒", ad: "Küçük Çanta", boyut: "kucuk" },
        buyukSecenek: { emoji: "🎒", ad: "Büyük Çanta", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🎒", ad: "Küçük Çanta", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🎒", ad: "Orta Çanta", boyut: "orta", deger: "orta" },
          { emoji: "🎒", ad: "Çok Küçük Çanta", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "📖", ad: "Küçük Kitap", boyut: "kucuk" },
        buyukSecenek: { emoji: "📖", ad: "Büyük Kitap", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "📖", ad: "Küçük Kitap", boyut: "kucuk", deger: "kucuk" },
          { emoji: "📖", ad: "Orta Kitap", boyut: "orta", deger: "orta" },
          { emoji: "📖", ad: "Çok Küçük Kitap", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🍨", ad: "Küçük Külah", boyut: "kucuk" },
        buyukSecenek: { emoji: "🍦", ad: "Büyük Külah", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🍨", ad: "Küçük Külah", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🍧", ad: "Orta Dondurma", boyut: "orta", deger: "orta" },
          { emoji: "🍨", ad: "Küçük Külah", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🍎", ad: "Küçük Elma", boyut: "kucuk" },
        buyukSecenek: { emoji: "🍎", ad: "Büyük Elma", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🍎", ad: "Küçük Elma", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🍎", ad: "Orta Elma", boyut: "orta", deger: "orta" },
          { emoji: "🍎", ad: "Çok Küçük Elma", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "⭐", ad: "Küçük Yıldız", boyut: "kucuk" },
        buyukSecenek: { emoji: "⭐", ad: "Büyük Yıldız", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "⭐", ad: "Küçük Yıldız", boyut: "kucuk", deger: "kucuk" },
          { emoji: "⭐", ad: "Orta Yıldız", boyut: "orta", deger: "orta" },
          { emoji: "⭐", ad: "Çok Küçük Yıldız", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🪑", ad: "Küçük Sandalye", boyut: "kucuk" },
        buyukSecenek: { emoji: "🪑", ad: "Büyük Sandalye", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🪑", ad: "Küçük Sandalye", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🪑", ad: "Orta Sandalye", boyut: "orta", deger: "orta" },
          { emoji: "🪑", ad: "Çok Küçük Sandalye", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "✏️", ad: "Küçük Kalem", boyut: "kucuk" },
        buyukSecenek: { emoji: "✏️", ad: "Büyük Kalem", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "✏️", ad: "Küçük Kalem", boyut: "kucuk", deger: "kucuk" },
          { emoji: "✏️", ad: "Orta Kalem", boyut: "orta", deger: "orta" },
          { emoji: "✏️", ad: "Çok Küçük Kalem", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      },
      { 
        ustResim: { emoji: "🌺", ad: "Küçük Çiçek", boyut: "kucuk" },
        buyukSecenek: { emoji: "🌺", ad: "Büyük Çiçek", boyut: "buyuk", deger: "buyuk" },
        digerSecenekler: [
          { emoji: "🌺", ad: "Küçük Çiçek", boyut: "kucuk", deger: "kucuk" },
          { emoji: "🌺", ad: "Orta Çiçek", boyut: "orta", deger: "orta" },
          { emoji: "🌺", ad: "Çok Küçük Çiçek", boyut: "cok_kucuk", deger: "cok_kucuk" }
        ]
      }
    ],
    varsayilan: [
      { ad: "Büyük", emoji: "🔴", deger: "buyuk" },
      { ad: "Küçük", emoji: "🔵", deger: "kucuk" }
    ]
  },
  uzun_kisa: {
    sahneler: [
      { 
        ustResim: { emoji: "✏️", ad: "Kısa Kalem", uzunluk: "kisa" },
        uzunSecenek: { emoji: "✏️", ad: "Uzun Kalem", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "✏️", ad: "Kısa Kalem", uzunluk: "kisa", deger: "kisa" },
          { emoji: "✏️", ad: "Orta Kalem", uzunluk: "orta", deger: "orta" },
          { emoji: "✏️", ad: "Çok Kısa Kalem", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "📏", ad: "10 cm Mini Cetvel", uzunluk: "kisa" },
        uzunSecenek: { emoji: "📏", ad: "30 cm Cetvel", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "📏", ad: "10 cm Mini Cetvel", uzunluk: "kisa", deger: "kisa" },
          { emoji: "📏", ad: "20 cm Cetvel", uzunluk: "orta", deger: "orta" },
          { emoji: "📏", ad: "5 cm Mini Cetvel", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🚂", ad: "Kısa Tren", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🚂", ad: "Uzun Tren", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🚂", ad: "Kısa Tren", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🚂", ad: "Orta Tren", uzunluk: "orta", deger: "orta" },
          { emoji: "🚂", ad: "Çok Kısa Tren", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🐍", ad: "Kısa Yılan", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🐍", ad: "Uzun Yılan", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🐍", ad: "Kısa Yılan", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🐍", ad: "Orta Yılan", uzunluk: "orta", deger: "orta" },
          { emoji: "🐍", ad: "Çok Kısa Yılan", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🪑", ad: "Kısa Tekli Koltuk", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🛋️", ad: "Uzun Koltuk Sırası", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🪑", ad: "Kısa Tekli Koltuk", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🪑", ad: "Orta Koltuk", uzunluk: "orta", deger: "orta" },
          { emoji: "🪑", ad: "Çok Kısa Koltuk", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🪜", ad: "Kısa Merdiven", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🪜", ad: "Uzun Merdiven", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🪜", ad: "Kısa Merdiven", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🪜", ad: "Orta Merdiven", uzunluk: "orta", deger: "orta" },
          { emoji: "🪜", ad: "Çok Kısa Merdiven", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🥖", ad: "Kısa Çubuk", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🥖", ad: "Uzun Çubuk", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🥖", ad: "Kısa Çubuk", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🥖", ad: "Orta Çubuk", uzunluk: "orta", deger: "orta" },
          { emoji: "🥖", ad: "Çok Kısa Çubuk", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🍰", ad: "Kısa Pasta Dilimi", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🍰", ad: "Uzun Pasta Dilimi", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🍰", ad: "Kısa Pasta Dilimi", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🍰", ad: "Orta Pasta Dilimi", uzunluk: "orta", deger: "orta" },
          { emoji: "🍰", ad: "Çok Kısa Pasta Dilimi", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🌭", ad: "Kısa Sosis", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🌭", ad: "Uzun Sosis", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🌭", ad: "Kısa Sosis", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🌭", ad: "Orta Sosis", uzunluk: "orta", deger: "orta" },
          { emoji: "🌭", ad: "Çok Kısa Sosis", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      },
      { 
        ustResim: { emoji: "🎀", ad: "Kısa Renkli Şerit", uzunluk: "kisa" },
        uzunSecenek: { emoji: "🎀", ad: "Uzun Renkli Şerit", uzunluk: "uzun", deger: "uzun" },
        digerSecenekler: [
          { emoji: "🎀", ad: "Kısa Renkli Şerit", uzunluk: "kisa", deger: "kisa" },
          { emoji: "🎀", ad: "Orta Renkli Şerit", uzunluk: "orta", deger: "orta" },
          { emoji: "🎀", ad: "Çok Kısa Renkli Şerit", uzunluk: "cok_kisa", deger: "cok_kisa" }
        ]
      }
    ],
    varsayilan: [
      { ad: "Uzun", emoji: "📏", deger: "uzun" },
      { ad: "Kısa", emoji: "📐", deger: "kisa" }
    ]
  },
  ince_kalin: {
    sahneler: [
      { 
        ustResim: { nesneTipi: "kalem", ad: "İnce Uçlu Kalem", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "kalem", ad: "Kalın Gövdeli Kalem", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "kalem", ad: "İnce Uçlu Kalem", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "kalem", ad: "Orta Kalem", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "kalem", ad: "Çok İnce Kalem", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "kitap", ad: "İnce Kitap", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "kitap", ad: "Kalın Roman", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "kitap", ad: "İnce Kitap", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "kitap", ad: "Orta Kitap", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "kitap", ad: "Çok İnce Kitap", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "agac", ad: "İnce Gövdeli Ağaç", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "agac", ad: "Kalın Gövdeli Ağaç", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "agac", ad: "İnce Gövdeli Ağaç", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "agac", ad: "Orta Gövdeli Ağaç", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "agac", ad: "Çok İnce Gövdeli Ağaç", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "ip", ad: "İnce İp", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "ip", ad: "Kalın Halat", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "ip", ad: "İnce İp", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "ip", ad: "Orta İp", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "ip", ad: "Çok İnce İp", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "mum", ad: "İnce Mum", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "mum", ad: "Kalın Mum", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "mum", ad: "İnce Mum", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "mum", ad: "Orta Mum", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "mum", ad: "Çok İnce Mum", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "boru", ad: "İnce Boru", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "boru", ad: "Kalın Boru", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "boru", ad: "İnce Boru", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "boru", ad: "Orta Boru", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "boru", ad: "Çok İnce Boru", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "cikolata", ad: "İnce İnce Bar", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "cikolata", ad: "Kalın Bar", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "cikolata", ad: "İnce İnce Bar", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "cikolata", ad: "Orta Bar", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "cikolata", ad: "Çok İnce Bar", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "kablo", ad: "İnce Kablo", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "kablo", ad: "Kalın Kablo", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "kablo", ad: "İnce Kablo", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "kablo", ad: "Orta Kablo", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "kablo", ad: "Çok İnce Kablo", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "silgi", ad: "İnce Silgi", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "silgi", ad: "Kalın Silgi", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "silgi", ad: "İnce Silgi", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "silgi", ad: "Orta Silgi", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "silgi", ad: "Çok İnce Silgi", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      },
      { 
        ustResim: { nesneTipi: "tebesir", ad: "İnce Tebeşir", kalinlik: "ince" },
        kalinSecenek: { nesneTipi: "tebesir", ad: "Kalın Tebeşir", kalinlik: "kalin", deger: "kalin" },
        digerSecenekler: [
          { nesneTipi: "tebesir", ad: "İnce Tebeşir", kalinlik: "ince", deger: "ince" },
          { nesneTipi: "tebesir", ad: "Orta Tebeşir", kalinlik: "orta", deger: "orta" },
          { nesneTipi: "tebesir", ad: "Çok İnce Tebeşir", kalinlik: "cok_ince", deger: "cok_ince" }
        ]
      }
    ],
    varsayilan: [
      { ad: "İnce", emoji: "📊", deger: "ince" },
      { ad: "Kalın", emoji: "📈", deger: "kalin" }
    ]
  }
};

// Yönler - Detaylı Sahne Verileri
const YONLER = {
  sag_sol: {
    sahneler: [
      { hedef: "sag", emoji: "➡️", ad: "Sağa Bakan Ok", karsit: { emoji: "⬅️", ad: "Sola Bakan Ok", deger: "sol" }, yonergesiz: true },
      { hedef: "sol", emoji: "⬅️", ad: "Sola Bakan Ok", karsit: { emoji: "➡️", ad: "Sağa Bakan Ok", deger: "sag" }, yonergesiz: true },
      { hedef: "sag", emoji: "→", ad: "Sağa Bakan Ok (İnce)", karsit: { emoji: "←", ad: "Sola Bakan Ok (İnce)", deger: "sol" }, yonergesiz: true },
      { hedef: "sol", emoji: "←", ad: "Sola Bakan Ok (İnce)", karsit: { emoji: "→", ad: "Sağa Bakan Ok (İnce)", deger: "sag" }, yonergesiz: true },
      { hedef: "sag", emoji: "⟶", ad: "Sağa Bakan Ok (Uzun)", karsit: { emoji: "⟵", ad: "Sola Bakan Ok (Uzun)", deger: "sol" }, yonergesiz: true },
      { hedef: "sol", emoji: "⟵", ad: "Sola Bakan Ok (Uzun)", karsit: { emoji: "⟶", ad: "Sağa Bakan Ok (Uzun)", deger: "sag" }, yonergesiz: true },
      { hedef: "sag", emoji: "⇢", ad: "Sağa Bakan Ok (Kalın)", karsit: { emoji: "⇠", ad: "Sola Bakan Ok (Kalın)", deger: "sol" }, yonergesiz: true },
      { hedef: "sol", emoji: "⇠", ad: "Sola Bakan Ok (Kalın)", karsit: { emoji: "⇢", ad: "Sağa Bakan Ok (Kalın)", deger: "sag" }, yonergesiz: true },
      { hedef: "sag", emoji: "⤇", ad: "Sağa Bakan Ok (Çift)", karsit: { emoji: "⤆", ad: "Sola Bakan Ok (Çift)", deger: "sol" }, yonergesiz: true },
      { hedef: "sol", emoji: "⤆", ad: "Sola Bakan Ok (Çift)", karsit: { emoji: "⤇", ad: "Sağa Bakan Ok (Çift)", deger: "sag" }, yonergesiz: true }
    ],
    varsayilan: [
      { ad: "Sağ", emoji: "➡️", deger: "sag" },
      { ad: "Sol", emoji: "⬅️", deger: "sol" }
    ]
  },
  yukari_asagi: {
    sahneler: [
      { hedef: "yukari", emoji: "📚", ad: "Üst Rafta Kitap", karsit: { emoji: "📚", ad: "Alt Rafta Kitap", deger: "asagi" } },
      { hedef: "yukari", emoji: "🐦", ad: "Üstte Uçan Kuş", karsit: { emoji: "🐱", ad: "Altta Yürüyen Kedi", deger: "asagi" } },
      { hedef: "yukari", emoji: "☀️", ad: "Üstte Güneş", karsit: { emoji: "🏠", ad: "Altta Ev", deger: "asagi" } },
      { hedef: "yukari", emoji: "🎈", ad: "Üstte Balon", karsit: { emoji: "👶", ad: "Altta Çocuk", deger: "asagi" } },
      { hedef: "yukari", emoji: "☁️", ad: "Üstte Bulut", karsit: { emoji: "🌳", ad: "Altta Ağaç", deger: "asagi" } },
      { hedef: "yukari", emoji: "⭐", ad: "Üst Satırdaki Yıldız", karsit: { emoji: "⭐", ad: "Alt Satırdaki Yıldız", deger: "asagi" } },
      { hedef: "yukari", emoji: "📦", ad: "Üstteki Kutu", karsit: { emoji: "📦", ad: "Alttaki Kutu", deger: "asagi" } },
      { hedef: "yukari", emoji: "🪜", ad: "Merdivenin Üst Basamağı", karsit: { emoji: "🪜", ad: "Merdivenin Alt Basamağı", deger: "asagi" } },
      { hedef: "yukari", emoji: "📚", ad: "Üstte Raf", karsit: { emoji: "🗄️", ad: "Altta Dolap Çekmecesi", deger: "asagi" } },
      { hedef: "yukari", emoji: "💡", ad: "Üstte Lamba", karsit: { emoji: "🪑", ad: "Altta Masa", deger: "asagi" } }
    ],
    varsayilan: [
      { ad: "Yukarı", emoji: "⬆️", deger: "yukari" },
      { ad: "Aşağı", emoji: "⬇️", deger: "asagi" }
    ]
  },
  on_arka: {
    sahneler: [
      { hedef: "on", emoji: "👶", ad: "Önde Duran Çocuk", karsit: { emoji: "👶", ad: "Arkada Duran Çocuk", deger: "arka" } },
      { hedef: "on", emoji: "🚗", ad: "Öndeki Araba", karsit: { emoji: "🚗", ad: "Arkadaki Araba", deger: "arka" } },
      { hedef: "on", emoji: "🌳", ad: "Öndeki Ağaç", karsit: { emoji: "🌳", ad: "Arkadaki Ağaç (Küçük)", deger: "arka" } },
      { hedef: "on", emoji: "🐱", ad: "Önde Kedi", karsit: { emoji: "🏠", ad: "Arkada Ev", deger: "arka" } },
      { hedef: "on", emoji: "🪑", ad: "Öndeki Sandalye", karsit: { emoji: "🪑", ad: "Arkadaki Sandalye", deger: "arka" } },
      { hedef: "on", emoji: "🧸", ad: "Öndeki Oyuncak Ayı", karsit: { emoji: "🧸", ad: "Arkadaki Oyuncak Ayı", deger: "arka" } },
      { hedef: "on", emoji: "🪑", ad: "Önde Masa", karsit: { emoji: "🗄️", ad: "Arkada Dolap", deger: "arka" } },
      { hedef: "on", emoji: "👤", ad: "Önde İnsan Silueti", karsit: { emoji: "🏢", ad: "Arkada Bina", deger: "arka" } },
      { hedef: "on", emoji: "🌺", ad: "Öndeki Çiçek", karsit: { emoji: "🌺", ad: "Arkadaki Çiçek", deger: "arka" } },
      { hedef: "on", emoji: "⚽", ad: "Öndeki Top", karsit: { emoji: "⚽", ad: "Arkadaki Top", deger: "arka" } }
    ],
    varsayilan: [
      { ad: "Ön", emoji: "👁️", deger: "on" },
      { ad: "Arka", emoji: "👤", deger: "arka" }
    ]
  },
  yon_ok: {
    sahneler: [
      { hedef: "saga", emoji: "➡️", ad: "Sağa Bakan Ok", karsit: [
        { emoji: "⬅️", ad: "Sola Bakan Ok", deger: "sola" },
        { emoji: "⬆️", ad: "Yukarı Bakan Ok", deger: "yukari" },
        { emoji: "⬇️", ad: "Aşağı Bakan Ok", deger: "asagi" }
      ]},
      { hedef: "sola", emoji: "⬅️", ad: "Sola Bakan Ok", karsit: [
        { emoji: "➡️", ad: "Sağa Bakan Ok", deger: "saga" },
        { emoji: "⬆️", ad: "Yukarı Bakan Ok", deger: "yukari" },
        { emoji: "⬇️", ad: "Aşağı Bakan Ok", deger: "asagi" }
      ]},
      { hedef: "yukari", emoji: "⬆️", ad: "Yukarı Bakan Ok", karsit: [
        { emoji: "➡️", ad: "Sağa Bakan Ok", deger: "saga" },
        { emoji: "⬅️", ad: "Sola Bakan Ok", deger: "sola" },
        { emoji: "⬇️", ad: "Aşağı Bakan Ok", deger: "asagi" }
      ]},
      { hedef: "asagi", emoji: "⬇️", ad: "Aşağı Bakan Ok", karsit: [
        { emoji: "➡️", ad: "Sağa Bakan Ok", deger: "saga" },
        { emoji: "⬅️", ad: "Sola Bakan Ok", deger: "sola" },
        { emoji: "⬆️", ad: "Yukarı Bakan Ok", deger: "yukari" }
      ]}
    ],
    varsayilan: [
      { ad: "Sağa", emoji: "➡️", deger: "saga" },
      { ad: "Sola", emoji: "⬅️", deger: "sola" },
      { ad: "Yukarı", emoji: "⬆️", deger: "yukari" },
      { ad: "Aşağı", emoji: "⬇️", deger: "asagi" }
    ]
  }
};

// Miktarlar - Detaylı Sahne Verileri
const MIKTARLAR = {
  az_cok: {
    sahneler: [
      { hedef: "cok", emoji: "🍎", ad: "5 Elma", miktar: 5, karsit: { emoji: "🍎", ad: "2 Elma", miktar: 2, deger: "az" } },
      { hedef: "cok", emoji: "🎈", ad: "6 Balon", miktar: 6, karsit: { emoji: "🎈", ad: "3 Balon", miktar: 3, deger: "az" } },
      { hedef: "cok", emoji: "⭐", ad: "7 Yıldız", miktar: 7, karsit: { emoji: "⭐", ad: "1 Yıldız", miktar: 1, deger: "az" } },
      { hedef: "cok", emoji: "✏️", ad: "6 Kalem", miktar: 6, karsit: { emoji: "✏️", ad: "2 Kalem", miktar: 2, deger: "az" } },
      { hedef: "cok", emoji: "🚗", ad: "5 Araba", miktar: 5, karsit: { emoji: "🚗", ad: "1 Araba", miktar: 1, deger: "az" } },
      { hedef: "cok", emoji: "📚", ad: "8 Kitap", miktar: 8, karsit: { emoji: "📚", ad: "3 Kitap", miktar: 3, deger: "az" } },
      { hedef: "cok", emoji: "🌺", ad: "8 Çiçek", miktar: 8, karsit: { emoji: "🌺", ad: "2 Çiçek", miktar: 2, deger: "az" } },
      { hedef: "cok", emoji: "🍪", ad: "Çok Kurabiye", miktar: 10, karsit: { emoji: "🍪", ad: "Az Kurabiye", miktar: 2, deger: "az" } },
      { hedef: "cok", emoji: "⚽", ad: "7 Top", miktar: 7, karsit: { emoji: "⚽", ad: "2 Top", miktar: 2, deger: "az" } },
      { hedef: "cok", emoji: "🐦", ad: "6 Kuş", miktar: 6, karsit: { emoji: "🐦", ad: "1 Kuş", miktar: 1, deger: "az" } }
    ],
    varsayilan: [
      { ad: "Az", emoji: "🔸", deger: "az" },
      { ad: "Çok", emoji: "🔹", deger: "cok" }
    ]
  },
  bos_dolu: {
    sahneler: [
      { hedef: "dolu", emoji: "📦", ad: "Dolu Kutu", karsit: { emoji: "📦", ad: "Boş Kutu", deger: "bos" } },
      { hedef: "dolu", emoji: "🥤", ad: "Dolu Bardak", karsit: { emoji: "🥤", ad: "Boş Bardak", deger: "bos" } },
      { hedef: "dolu", emoji: "🛒", ad: "Dolu Sepet", karsit: { emoji: "🛒", ad: "Boş Sepet", deger: "bos" } },
      { hedef: "dolu", emoji: "🎒", ad: "Dolu Çanta", karsit: { emoji: "🎒", ad: "Boş Çanta", deger: "bos" } },
      { hedef: "dolu", emoji: "📚", ad: "Dolu Kitaplık", karsit: { emoji: "📚", ad: "Boş Kitaplık", deger: "bos" } },
      { hedef: "dolu", emoji: "🍽️", ad: "Dolu Tabak", karsit: { emoji: "🍽️", ad: "Boş Tabak", deger: "bos" } },
      { hedef: "dolu", emoji: "🧺", ad: "Dolu Sepet", karsit: { emoji: "🧺", ad: "Boş Sepet", deger: "bos" } },
      { hedef: "dolu", emoji: "📦", ad: "Dolu Kutu", karsit: { emoji: "📦", ad: "Boş Kutu", deger: "bos" } },
      { hedef: "dolu", emoji: "🪣", ad: "Dolu Kova", karsit: { emoji: "🪣", ad: "Boş Kova", deger: "bos" } },
      { hedef: "dolu", emoji: "🎁", ad: "Dolu Hediye Kutusu", karsit: { emoji: "🎁", ad: "Boş Hediye Kutusu", deger: "bos" } }
    ],
    varsayilan: [
      { ad: "Boş", emoji: "📦", deger: "bos" },
      { ad: "Dolu", emoji: "📦", deger: "dolu" }
    ]
  },
  yarim_tam: {
    sahneler: [
      { hedef: "tam", emoji: "🥤", ad: "Tam Bardak", karsit: { emoji: "🥤", ad: "Yarım Bardak", deger: "yarim" } },
      { hedef: "tam", emoji: "🍕", ad: "Tam Pizza", karsit: { emoji: "🍕", ad: "Yarım Pizza", deger: "yarim" } },
      { hedef: "tam", emoji: "🍎", ad: "Tam Elma", karsit: { emoji: "🍎", ad: "Yarım Elma", deger: "yarim" } },
      { hedef: "tam", emoji: "🍰", ad: "Tam Pasta", karsit: { emoji: "🍰", ad: "Yarım Pasta", deger: "yarim" } },
      { hedef: "tam", emoji: "🥖", ad: "Tam Ekmek", karsit: { emoji: "🥖", ad: "Yarım Ekmek", deger: "yarim" } },
      { hedef: "tam", emoji: "🍊", ad: "Tam Portakal", karsit: { emoji: "🍊", ad: "Yarım Portakal", deger: "yarim" } },
      { hedef: "tam", emoji: "🍉", ad: "Tam Karpuz", karsit: { emoji: "🍉", ad: "Yarım Karpuz", deger: "yarim" } },
      { hedef: "tam", emoji: "🥪", ad: "Tam Sandviç", karsit: { emoji: "🥪", ad: "Yarım Sandviç", deger: "yarim" } },
      { hedef: "tam", emoji: "🍞", ad: "Tam Ekmek Dilimi", karsit: { emoji: "🍞", ad: "Yarım Ekmek Dilimi", deger: "yarim" } },
      { hedef: "tam", emoji: "🧀", ad: "Tam Peynir", karsit: { emoji: "🧀", ad: "Yarım Peynir", deger: "yarim" } }
    ],
    varsayilan: [
      { ad: "Yarım", emoji: "🥤", deger: "yarim" },
      { ad: "Tam", emoji: "🥤", deger: "tam" }
    ]
  }
};

// Sayılar
const SAYILAR = Array.from({ length: 10 }, (_, i) => ({
  ad: (i + 1).toString(),
  emoji: "🔢",
  deger: i + 1
}));

// Kategoriler - Detaylı Sahne Verileri
const KATEGORILER = {
  hayvan_bitki: {
    sahneler: [
      { hedef: "hayvan", emoji: "🐱", ad: "Kedi", karsit: [
        { emoji: "🐶", ad: "Köpek", deger: "hayvan" },
        { emoji: "🚗", ad: "Araba", deger: "tasit" },
        { emoji: "🐦", ad: "Kuş", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🦁", ad: "Aslan", karsit: [
        { emoji: "🐯", ad: "Kaplan", deger: "hayvan" },
        { emoji: "🚌", ad: "Otobüs", deger: "tasit" },
        { emoji: "🐘", ad: "Fil", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🐰", ad: "Tavşan", karsit: [
        { emoji: "🚚", ad: "Kamyon", deger: "tasit" },
        { emoji: "🐮", ad: "İnek", deger: "hayvan" },
        { emoji: "🐑", ad: "Koyun", deger: "hayvan" }
      ]},
      { hedef: "tasit", emoji: "✈️", ad: "Uçak", karsit: [
        { emoji: "🐴", ad: "At", deger: "hayvan" },
        { emoji: "🫏", ad: "Eşek", deger: "hayvan" },
        { emoji: "🐦", ad: "Kuş", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🐟", ad: "Balık", karsit: [
        { emoji: "🚂", ad: "Tren", deger: "tasit" },
        { emoji: "🐢", ad: "Kaplumbağa", deger: "hayvan" },
        { emoji: "🕊️", ad: "Martı", deger: "hayvan" }
      ]},
      { hedef: "tasit", emoji: "🚲", ad: "Bisiklet", karsit: [
        { emoji: "🐶", ad: "Köpek", deger: "hayvan" },
        { emoji: "🦆", ad: "Ördek", deger: "hayvan" },
        { emoji: "🐼", ad: "Panda", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🐱", ad: "Kedi", karsit: [
        { emoji: "🐶", ad: "Köpek", deger: "hayvan" },
        { emoji: "🏍️", ad: "Motosiklet", deger: "tasit" },
        { emoji: "🐦", ad: "Kuş", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🐮", ad: "İnek", karsit: [
        { emoji: "🚢", ad: "Gemi", deger: "tasit" },
        { emoji: "🐔", ad: "Tavuk", deger: "hayvan" },
        { emoji: "🐓", ad: "Horoz", deger: "hayvan" }
      ]},
      { hedef: "tasit", emoji: "🚕", ad: "Taksi", karsit: [
        { emoji: "🐶", ad: "Köpek", deger: "hayvan" },
        { emoji: "🐱", ad: "Kedi", deger: "hayvan" },
        { emoji: "🐦", ad: "Kuş", deger: "hayvan" }
      ]},
      { hedef: "hayvan", emoji: "🫏", ad: "Eşek", karsit: [
        { emoji: "🐮", ad: "İnek", deger: "hayvan" },
        { emoji: "✈️", ad: "Uçak", deger: "tasit" },
        { emoji: "🐑", ad: "Koyun", deger: "hayvan" }
      ]}
    ],
    varsayilan: [
      { ad: "Hayvan", emoji: "🐶", deger: "hayvan" },
      { ad: "Bitki", emoji: "🌳", deger: "bitki" }
    ]
  },
  yiyecek_icecek: {
    sahneler: [
      { hedef: "yiyecek", emoji: "🍎", ad: "Elma", karsit: [
        { emoji: "🍐", ad: "Armut", deger: "yiyecek" },
        { emoji: "🍅", ad: "Domates", deger: "sebze" },
        { emoji: "🍌", ad: "Muz", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🥕", ad: "Havuç", karsit: [
        { emoji: "🍌", ad: "Muz", deger: "yiyecek" },
        { emoji: "🥔", ad: "Patates", deger: "sebze" },
        { emoji: "🫑", ad: "Biber", deger: "sebze" }
      ]},
      { hedef: "yiyecek", emoji: "🍓", ad: "Çilek", karsit: [
        { emoji: "🍒", ad: "Kiraz", deger: "yiyecek" },
        { emoji: "🧅", ad: "Soğan", deger: "sebze" },
        { emoji: "🍉", ad: "Karpuz", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🥦", ad: "Brokoli", karsit: [
        { emoji: "🍎", ad: "Elma", deger: "yiyecek" },
        { emoji: "🍊", ad: "Portakal", deger: "yiyecek" },
        { emoji: "🍌", ad: "Muz", deger: "yiyecek" }
      ]},
      { hedef: "yiyecek", emoji: "🍇", ad: "Üzüm", karsit: [
        { emoji: "🍈", ad: "Kavun", deger: "yiyecek" },
        { emoji: "🥬", ad: "Marul", deger: "sebze" },
        { emoji: "🍑", ad: "Şeftali", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🥒", ad: "Salatalık", karsit: [
        { emoji: "🍒", ad: "Kiraz", deger: "yiyecek" },
        { emoji: "🍉", ad: "Karpuz", deger: "yiyecek" },
        { emoji: "🍐", ad: "Armut", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🍆", ad: "Patlıcan", karsit: [
        { emoji: "🫑", ad: "Biber", deger: "sebze" },
        { emoji: "🍎", ad: "Elma", deger: "yiyecek" },
        { emoji: "🥬", ad: "Kereviz", deger: "sebze" }
      ]},
      { hedef: "yiyecek", emoji: "🍊", ad: "Mandalina", karsit: [
        { emoji: "🥬", ad: "Lahana", deger: "sebze" },
        { emoji: "🍓", ad: "Çilek", deger: "yiyecek" },
        { emoji: "🍌", ad: "Muz", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🎃", ad: "Kabak", karsit: [
        { emoji: "🍐", ad: "Armut", deger: "yiyecek" },
        { emoji: "🍊", ad: "Mandalina", deger: "yiyecek" },
        { emoji: "🍉", ad: "Karpuz", deger: "yiyecek" }
      ]},
      { hedef: "sebze", emoji: "🍅", ad: "Domates", karsit: [
        { emoji: "🫑", ad: "Biber", deger: "sebze" },
        { emoji: "🍓", ad: "Çilek", deger: "yiyecek" },
        { emoji: "🥔", ad: "Patates", deger: "sebze" }
      ]}
    ],
    varsayilan: [
      { ad: "Yiyecek", emoji: "🍎", deger: "yiyecek" },
      { ad: "İçecek", emoji: "🥤", deger: "icecek" }
    ]
  },
  tasit_esya: {
    sahneler: [
      { hedef: "tasit", emoji: "🚗", ad: "Araba", karsit: [
        { emoji: "🚌", ad: "Otobüs", deger: "tasit" },
        { emoji: "🪑", ad: "Sandalye", deger: "esya" },
        { emoji: "🚚", ad: "Kamyon", deger: "tasit" }
      ]},
      { hedef: "esya", emoji: "👕", ad: "Tişört", karsit: [
        { emoji: "👖", ad: "Pantolon", deger: "esya" },
        { emoji: "🚗", ad: "Oyuncak Araba", deger: "tasit" },
        { emoji: "🧥", ad: "Mont", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "👗", ad: "Elbise", karsit: [
        { emoji: "⚽", ad: "Top", deger: "oyuncak" },
        { emoji: "👟", ad: "Ayakkabı", deger: "esya" },
        { emoji: "🧦", ad: "Çorap", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "🧸", ad: "Bebek", karsit: [
        { emoji: "🧢", ad: "Şapka", deger: "esya" },
        { emoji: "🧶", ad: "Kazak", deger: "esya" },
        { emoji: "🧣", ad: "Atkı", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "👔", ad: "Gömlek", karsit: [
        { emoji: "🧩", ad: "Lego", deger: "oyuncak" },
        { emoji: "🧢", ad: "Bere", deger: "esya" },
        { emoji: "🧤", ad: "Eldiven", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "🧥", ad: "Mont", karsit: [
        { emoji: "🧸", ad: "Peluş Ayı", deger: "oyuncak" },
        { emoji: "👕", ad: "Tişört", deger: "esya" },
        { emoji: "👖", ad: "Pantolon", deger: "esya" }
      ]},
      { hedef: "oyuncak", emoji: "🤖", ad: "Oyuncak Robot", karsit: [
        { emoji: "👔", ad: "Gömlek", deger: "esya" },
        { emoji: "🧶", ad: "Kazak", deger: "esya" },
        { emoji: "🧢", ad: "Şapka", deger: "esya" }
      ]},
      { hedef: "tasit", emoji: "🚚", ad: "Oyuncak Kamyon", karsit: [
        { emoji: "🧤", ad: "Eldiven", deger: "esya" },
        { emoji: "🧢", ad: "Bere", deger: "esya" },
        { emoji: "🧥", ad: "Mont", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "👗", ad: "Etek", karsit: [
        { emoji: "🪀", ad: "Topaç", deger: "oyuncak" },
        { emoji: "🧦", ad: "Çorap", deger: "esya" },
        { emoji: "👟", ad: "Ayakkabı", deger: "esya" }
      ]},
      { hedef: "esya", emoji: "👖", ad: "Pantolon", karsit: [
        { emoji: "🧥", ad: "Mont", deger: "esya" },
        { emoji: "⚽", ad: "Top", deger: "oyuncak" },
        { emoji: "👔", ad: "Gömlek", deger: "esya" }
      ]}
    ],
    varsayilan: [
      { ad: "Taşıt", emoji: "🚗", deger: "tasit" },
      { ad: "Eşya", emoji: "🪑", deger: "esya" }
    ]
  },
  renk_sekil: {
    sahneler: [
      { hedef: "renk", emoji: "🔴", ad: "Kırmızı Renk", karsit: [
        { emoji: "🔵", ad: "Mavi Renk", deger: "renk" },
        { emoji: "▲", ad: "Üçgen Şekil", deger: "sekil" },
        { emoji: "■", ad: "Kare Şekil", deger: "sekil" }
      ]},
      { hedef: "sekil", emoji: "●", ad: "Daire Şekil", karsit: [
        { emoji: "🔴", ad: "Kırmızı Renk", deger: "renk" },
        { emoji: "▲", ad: "Üçgen Şekil", deger: "sekil" },
        { emoji: "🔵", ad: "Mavi Renk", deger: "renk" }
      ]},
      { hedef: "renk", emoji: "🟢", ad: "Yeşil Renk", karsit: [
        { emoji: "★", ad: "Yıldız Şekil", deger: "sekil" },
        { emoji: "🔴", ad: "Kırmızı Renk", deger: "renk" },
        { emoji: "⬡", ad: "Altıgen Şekil", deger: "sekil" }
      ]},
      { hedef: "sekil", emoji: "▲", ad: "Üçgen Şekil", karsit: [
        { emoji: "🟡", ad: "Sarı Renk", deger: "renk" },
        { emoji: "●", ad: "Daire Şekil", deger: "sekil" },
        { emoji: "🟣", ad: "Mor Renk", deger: "renk" }
      ]},
      { hedef: "renk", emoji: "🟡", ad: "Sarı Renk", karsit: [
        { emoji: "◆", ad: "Elmas Şekil", deger: "sekil" },
        { emoji: "🔵", ad: "Mavi Renk", deger: "renk" },
        { emoji: "⬟", ad: "Beşgen Şekil", deger: "sekil" }
      ]}
    ],
    varsayilan: [
      { ad: "Renk", emoji: "🎨", deger: "renk" },
      { ad: "Şekil", emoji: "🔷", deger: "sekil" }
    ]
  }
};

// Duygular - Detaylı Sahne Verileri
const DUYGULAR = {
  mutlu_uzgun: {
    sahneler: [
      { hedef: "mutlu", emoji: "😊", ad: "Mutlu Yüz", karsit: [
        { emoji: "😢", ad: "Üzgün Yüz", deger: "uzgun" },
        { emoji: "😠", ad: "Kızgın Yüz", deger: "kizgin" },
        { emoji: "😲", ad: "Şaşkın Yüz", deger: "saskin" }
      ]},
      { hedef: "uzgun", emoji: "😢", ad: "Üzgün Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" }
      ]},
      { hedef: "kizgin", emoji: "😠", ad: "Kızgın Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" },
        { emoji: "😲", ad: "Şaşkın Yüz", deger: "saskin" }
      ]},
      { hedef: "saskin", emoji: "😲", ad: "Şaşkın Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" },
        { emoji: "😢", ad: "Üzgün Yüz", deger: "uzgun" }
      ]},
      { hedef: "korkulu", emoji: "😨", ad: "Korkulu Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" },
        { emoji: "😠", ad: "Kızgın Yüz", deger: "kizgin" }
      ]},
      { hedef: "yorgun", emoji: "😴", ad: "Yorgun Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" },
        { emoji: "😢", ad: "Üzgün Yüz", deger: "uzgun" }
      ]},
      { hedef: "sakin", emoji: "😌", ad: "Sakin Yüz", karsit: [
        { emoji: "😲", ad: "Şaşkın Yüz", deger: "saskin" }
      ]},
      { hedef: "uzgun", emoji: "😢", ad: "Üzgün Yüz", karsit: [
        { emoji: "😲", ad: "Şaşkın Yüz", deger: "saskin" },
        { emoji: "😠", ad: "Kızgın Yüz", deger: "kizgin" }
      ]},
      { hedef: "uzgun", emoji: "😢", ad: "Üzgün Yüz", karsit: [
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" },
        { emoji: "😊", ad: "Mutlu Yüz", deger: "mutlu" }
      ]},
      { hedef: "mutlu", emoji: "😊", ad: "Mutlu Yüz", karsit: [
        { emoji: "😨", ad: "Korkulu Yüz", deger: "korkulu" },
        { emoji: "😲", ad: "Şaşkın Yüz", deger: "saskin" }
      ]}
    ],
    varsayilan: [
      { ad: "Mutlu", emoji: "😊", deger: "mutlu" },
      { ad: "Üzgün", emoji: "😢", deger: "uzgun" }
    ]
  },
  kizgin_sakin: {
    sahneler: [
      { hedef: "sakin", emoji: "😌", ad: "Sakin Yüz", karsit: [
        { emoji: "😠", ad: "Kızgın Yüz", deger: "kizgin" }
      ]},
      { hedef: "kizgin", emoji: "😠", ad: "Kızgın Yüz", karsit: [
        { emoji: "😌", ad: "Sakin Yüz", deger: "sakin" }
      ]}
    ],
    varsayilan: [
      { ad: "Kızgın", emoji: "😠", deger: "kizgin" },
      { ad: "Sakin", emoji: "😌", deger: "sakin" }
    ]
  },
  korkulu_guvenli: {
    sahneler: [
      { hedef: "guvenli", emoji: "😊", ad: "Güvenli Yüz", karsit: [
        { emoji: "😨", ad: "Korkulu Yüz", deger: "korkulu" }
      ]},
      { hedef: "korkulu", emoji: "😨", ad: "Korkulu Yüz", karsit: [
        { emoji: "😊", ad: "Güvenli Yüz", deger: "guvenli" }
      ]}
    ],
    varsayilan: [
      { ad: "Korkulu", emoji: "😨", deger: "korkulu" },
      { ad: "Güvenli", emoji: "😊", deger: "guvenli" }
    ]
  }
};

// Günlük Yaşam - Detaylı Sahne Verileri
const GUNLUK_YASAM = {
  temiz_kirli: {
    sahneler: [
      { hedef: "temiz", emoji: "🧼", ad: "Temiz", karsit: { emoji: "💩", ad: "Kirli", deger: "kirli" } },
      { hedef: "temiz", emoji: "✨", ad: "Temiz Yüzey", karsit: { emoji: "🪣", ad: "Kirli Yüzey", deger: "kirli" } }
    ],
    varsayilan: [
      { ad: "Temiz", emoji: "🧼", deger: "temiz" },
      { ad: "Kirli", emoji: "💩", deger: "kirli" }
    ]
  },
  soguk_sicak: {
    sahneler: [
      { hedef: "sicak", emoji: "🔥", ad: "Sıcak", karsit: { emoji: "❄️", ad: "Soğuk", deger: "soguk" } },
      { hedef: "sicak", emoji: "☀️", ad: "Sıcak Güneş", karsit: { emoji: "❄️", ad: "Soğuk Kar", deger: "soguk" } },
      { hedef: "sicak", emoji: "🍵", ad: "Sıcak Çay", karsit: { emoji: "🧊", ad: "Soğuk İçecek", deger: "soguk" } },
      { hedef: "sicak", emoji: "🔥", ad: "Sıcak Ateş", karsit: { emoji: "❄️", ad: "Soğuk Buz", deger: "soguk" } },
      { hedef: "sicak", emoji: "🌡️", ad: "Sıcak Hava", karsit: { emoji: "❄️", ad: "Soğuk Hava", deger: "soguk" } }
    ],
    varsayilan: [
      { ad: "Soğuk", emoji: "❄️", deger: "soguk" },
      { ad: "Sıcak", emoji: "🔥", deger: "sicak" }
    ]
  },
  ac_tok: {
    sahneler: [
      { hedef: "tok", emoji: "😋", ad: "Tok", karsit: { emoji: "🍽️", ad: "Aç", deger: "ac" } },
      { hedef: "tok", emoji: "😊", ad: "Tok İnsan", karsit: { emoji: "😫", ad: "Aç İnsan", deger: "ac" } }
    ],
    varsayilan: [
      { ad: "Aç", emoji: "🍽️", deger: "ac" },
      { ad: "Tok", emoji: "😋", deger: "tok" }
    ]
  },
  uykulu_uyanik: {
    sahneler: [
      { hedef: "uyanik", emoji: "😊", ad: "Uyanık", karsit: { emoji: "😴", ad: "Uykulu", deger: "uykulu" } },
      { hedef: "uyanik", emoji: "👀", ad: "Uyanık Gözler", karsit: { emoji: "😴", ad: "Uykulu Gözler", deger: "uykulu" } }
    ],
    varsayilan: [
      { ad: "Uykulu", emoji: "😴", deger: "uykulu" },
      { ad: "Uyanık", emoji: "😊", deger: "uyanik" }
    ]
  },
  yaz_kis: {
    sahneler: [
      { hedef: "yaz", emoji: "👕", ad: "Tişört (Yaz)", karsit: { emoji: "🧥", ad: "Mont (Kış)", deger: "kis" } },
      { hedef: "kis", emoji: "🧣", ad: "Atkı (Kış)", karsit: { emoji: "🩳", ad: "Şort (Yaz)", deger: "yaz" } },
      { hedef: "kis", emoji: "🥾", ad: "Bot (Kış)", karsit: { emoji: "👡", ad: "Sandalet (Yaz)", deger: "yaz" } },
      { hedef: "kis", emoji: "❄️", ad: "Kar Manzarası", karsit: { emoji: "🏖️", ad: "Deniz Plajı", deger: "yaz" } },
      { hedef: "kis", emoji: "⛄", ad: "Kardan Adam", karsit: { emoji: "☀️", ad: "Güneşlenen İnsan", deger: "yaz" } },
      { hedef: "kis", emoji: "☕", ad: "Sıcak İçecek", karsit: { emoji: "🍦", ad: "Dondurma", deger: "yaz" } },
      { hedef: "kis", emoji: "🧶", ad: "Kalın Kazak", karsit: { emoji: "👕", ad: "Kısa Kol Tişört", deger: "yaz" } },
      { hedef: "kis", emoji: "🧢", ad: "Kalın Bere", karsit: { emoji: "🧢", ad: "Güneş Şapkası", deger: "yaz" } },
      { hedef: "kis", emoji: "🌲", ad: "Karlı Ağaç", karsit: { emoji: "🌸", ad: "Çiçek Açmış Ağaç", deger: "yaz" } },
      { hedef: "kis", emoji: "🔥", ad: "Soba", karsit: { emoji: "🌀", ad: "Vantilatör", deger: "yaz" } }
    ],
    varsayilan: [
      { ad: "Yaz", emoji: "☀️", deger: "yaz" },
      { ad: "Kış", emoji: "❄️", deger: "kis" }
    ]
  },
  gunduz_gece: {
    sahneler: [
      { hedef: "gunduz", emoji: "☀️", ad: "Güneş", karsit: { emoji: "🌙", ad: "Ay", deger: "gece" } },
      { hedef: "gunduz", emoji: "☀️", ad: "Mavi Gökyüzü", karsit: { emoji: "⭐", ad: "Yıldızlı Gökyüzü", deger: "gece" } },
      { hedef: "gunduz", emoji: "👨‍🎓", ad: "Okula Giden Çocuk", karsit: { emoji: "😴", ad: "Yatakta Uyuyan Çocuk", deger: "gece" } },
      { hedef: "gunduz", emoji: "🏃", ad: "Parkta Oynayan Çocuk", karsit: { emoji: "🌙", ad: "Gece Boş Park", deger: "gece" } },
      { hedef: "gunduz", emoji: "🏠", ad: "Gün Işıklı Ev", karsit: { emoji: "🏠", ad: "Gece Işıkları Yanan Ev", deger: "gece" } },
      { hedef: "gunduz", emoji: "🕶️", ad: "Güneş Gözlüğü", karsit: { emoji: "💡", ad: "Gece Lambası", deger: "gece" } },
      { hedef: "gunduz", emoji: "😊", ad: "Uyanan Çocuk", karsit: { emoji: "😴", ad: "Uyuyan Çocuk", deger: "gece" } },
      { hedef: "gunduz", emoji: "🚗", ad: "Gündüz Trafik", karsit: { emoji: "💡", ad: "Gece Sokak Lambaları", deger: "gece" } },
      { hedef: "gunduz", emoji: "🌳", ad: "Güneşli Bahçe", karsit: { emoji: "🌙", ad: "Ay Işıklı Bahçe", deger: "gece" } },
      { hedef: "gunduz", emoji: "🪟", ad: "Gündüz Açık Pencere", karsit: { emoji: "🪟", ad: "Gece Perdeler Kapalı", deger: "gece" } }
    ],
    varsayilan: [
      { ad: "Gündüz", emoji: "☀️", deger: "gunduz" },
      { ad: "Gece", emoji: "🌙", deger: "gece" }
    ]
  },
  hava_durumu: {
    sahneler: [
      { hedef: "gunesli", emoji: "☀️", ad: "Güneşli Gökyüzü", karsit: [
        { emoji: "🌧️", ad: "Yağmurlu Gökyüzü", deger: "yagmurlu" },
        { emoji: "❄️", ad: "Karlı Gökyüzü", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🧢", ad: "Güneş Şapkası", karsit: [
        { emoji: "☂️", ad: "Şemsiye", deger: "yagmurlu" },
        { emoji: "🧢", ad: "Bere", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🏖️", ad: "Plaj Sahnesi", karsit: [
        { emoji: "☂️", ad: "Yağmurda Şemsiye", deger: "yagmurlu" },
        { emoji: "⛄", ad: "Karda Montlu Çocuk", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "☀️", ad: "Güneş İkonu", karsit: [
        { emoji: "☁️🌧️", ad: "Bulut + Yağmur İkonu", deger: "yagmurlu" },
        { emoji: "❄️", ad: "Kar Tanesi İkonu", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🌳", ad: "Güneşli Park", karsit: [
        { emoji: "🌳", ad: "Yağmurlu Park", deger: "yagmurlu" },
        { emoji: "🌳", ad: "Karlı Park", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🕶️", ad: "Güneş Gözlüğü", karsit: [
        { emoji: "🧥", ad: "Yağmurluk", deger: "yagmurlu" },
        { emoji: "🧤", ad: "Kar Eldiveni", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🧺", ad: "Piknik", karsit: [
        { emoji: "🏃", ad: "Yağmurdan Kaçan İnsanlar", deger: "yagmurlu" },
        { emoji: "⛄", ad: "Kardan Adam", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "🪟", ad: "Açık Pencere", karsit: [
        { emoji: "🪟", ad: "Yağmur Damlalı Cam", deger: "yagmurlu" },
        { emoji: "🪟", ad: "Buzlu Cam", deger: "karli" }
      ]},
      { hedef: "gunesli", emoji: "☀️", ad: "Güneşli Gün", karsit: [
        { emoji: "🌧️", ad: "Sağanak Yağmur", deger: "yagmurlu" },
        { emoji: "❄️", ad: "Tipi", deger: "karli" }
      ]}
    ],
    varsayilan: [
      { ad: "Güneşli", emoji: "☀️", deger: "gunesli" },
      { ad: "Yağmurlu", emoji: "🌧️", deger: "yagmurlu" },
      { ad: "Karlı", emoji: "❄️", deger: "karli" }
    ]
  }
};

// Mantıksal Ayırt Etme
const MANTIKSAL = {
  ayni_farkli: {
    sahneler: [
      { hedef: "ayni", secenekler: [
        { emoji: "🍎", ad: "Elma", kategori: "meyve" },
        { emoji: "🍎", ad: "Elma", kategori: "meyve" },
        { emoji: "🍌", ad: "Muz", kategori: "meyve" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🚗", ad: "Araba", kategori: "tasit" },
        { emoji: "🚌", ad: "Otobüs", kategori: "tasit" },
        { emoji: "🐱", ad: "Kedi", kategori: "hayvan" }
      ]}
    ]
  },
  benzer_farkli: {
    sahneler: [
      { hedef: "farkli", secenekler: [
        { emoji: "🍎", ad: "Elma", kategori: "meyve" },
        { emoji: "🍐", ad: "Armut", kategori: "meyve" },
        { emoji: "🍌", ad: "Muz", kategori: "meyve" },
        { emoji: "🚗", ad: "Araba", kategori: "tasit" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🚗", ad: "Araba", kategori: "tasit" },
        { emoji: "🚌", ad: "Otobüs", kategori: "tasit" },
        { emoji: "🚚", ad: "Kamyon", kategori: "tasit" },
        { emoji: "🐱", ad: "Kedi", kategori: "hayvan" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🐱", ad: "Kedi", kategori: "hayvan" },
        { emoji: "🐶", ad: "Köpek", kategori: "hayvan" },
        { emoji: "🐦", ad: "Kuş", kategori: "hayvan" },
        { emoji: "✈️", ad: "Uçak", kategori: "tasit" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🪑", ad: "Masa", kategori: "esya" },
        { emoji: "🪑", ad: "Sandalye", kategori: "esya" },
        { emoji: "🗄️", ad: "Dolap", kategori: "esya" },
        { emoji: "🐶", ad: "Köpek", kategori: "hayvan" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "✏️", ad: "Kalem", kategori: "esya" },
        { emoji: "📔", ad: "Defter", kategori: "esya" },
        { emoji: "📚", ad: "Kitap", kategori: "esya" },
        { emoji: "⚽", ad: "Top", kategori: "oyuncak" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🧦", ad: "Çorap", kategori: "esya" },
        { emoji: "👟", ad: "Ayakkabı", kategori: "esya" },
        { emoji: "🧥", ad: "Mont", kategori: "esya" },
        { emoji: "🚗", ad: "Oyuncak Araba", kategori: "oyuncak" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🐮", ad: "İnek", kategori: "hayvan" },
        { emoji: "🐑", ad: "Koyun", kategori: "hayvan" },
        { emoji: "🐔", ad: "Tavuk", kategori: "hayvan" },
        { emoji: "💻", ad: "Bilgisayar", kategori: "esya" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🥄", ad: "Kaşık", kategori: "esya" },
        { emoji: "🍴", ad: "Çatal", kategori: "esya" },
        { emoji: "🍽️", ad: "Tabak", kategori: "esya" },
        { emoji: "⚽", ad: "Top", kategori: "oyuncak" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "👔", ad: "Gömlek", kategori: "esya" },
        { emoji: "👖", ad: "Pantolon", kategori: "esya" },
        { emoji: "👗", ad: "Etek", kategori: "esya" },
        { emoji: "🚂", ad: "Tren", kategori: "tasit" }
      ]},
      { hedef: "farkli", secenekler: [
        { emoji: "🍉", ad: "Karpuz", kategori: "meyve" },
        { emoji: "🍎", ad: "Elma", kategori: "meyve" },
        { emoji: "🍇", ad: "Üzüm", kategori: "meyve" },
        { emoji: "🚌", ad: "Otobüs", kategori: "tasit" }
      ]}
    ]
  },
  sebep_sonuc: {
    sahneler: [
      { hedef: "sonuc", sebep: { emoji: "🌧️", ad: "Yağmur" }, sonuc: { emoji: "☂️", ad: "Şemsiye", deger: "sonuc" }, karsit: [
        { emoji: "🌧️", ad: "Yağmur", deger: "sebep" },
        { emoji: "☀️", ad: "Güneş", deger: "diger" },
        { emoji: "❄️", ad: "Kar", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🌙", ad: "Gece" }, sonuc: { emoji: "🛏️", ad: "Yatak/Uyku", deger: "sonuc" }, karsit: [
        { emoji: "🌙", ad: "Gece", deger: "sebep" },
        { emoji: "☀️", ad: "Gündüz", deger: "diger" },
        { emoji: "🌅", ad: "Sabah", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🍽️", ad: "Açlık" }, sonuc: { emoji: "🍎", ad: "Yemek", deger: "sonuc" }, karsit: [
        { emoji: "🍽️", ad: "Açlık", deger: "sebep" },
        { emoji: "💧", ad: "Susuzluk", deger: "diger" },
        { emoji: "😴", ad: "Uykusuzluk", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "❄️", ad: "Üşüme" }, sonuc: { emoji: "🧥", ad: "Mont/Atkı", deger: "sonuc" }, karsit: [
        { emoji: "❄️", ad: "Üşüme", deger: "sebep" },
        { emoji: "🔥", ad: "Sıcak", deger: "diger" },
        { emoji: "🌡️", ad: "Sıcaklık", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🌑", ad: "Karanlık" }, sonuc: { emoji: "💡", ad: "Lamba/Fener", deger: "sonuc" }, karsit: [
        { emoji: "🌑", ad: "Karanlık", deger: "sebep" },
        { emoji: "☀️", ad: "Aydınlık", deger: "diger" },
        { emoji: "🌙", ad: "Ay", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🤒", ad: "Hasta Olma" }, sonuc: { emoji: "💊", ad: "İlaç/Doktor", deger: "sonuc" }, karsit: [
        { emoji: "🤒", ad: "Hasta Olma", deger: "sebep" },
        { emoji: "😊", ad: "Sağlıklı", deger: "diger" },
        { emoji: "🏃", ad: "Spor", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🤲", ad: "Kirli Eller" }, sonuc: { emoji: "🧼", ad: "Sabun/Su", deger: "sonuc" }, karsit: [
        { emoji: "🤲", ad: "Kirli Eller", deger: "sebep" },
        { emoji: "✨", ad: "Temiz Eller", deger: "diger" },
        { emoji: "👐", ad: "Eller", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "📚", ad: "Okul Zamanı" }, sonuc: { emoji: "🎒", ad: "Çanta/Defter", deger: "sonuc" }, karsit: [
        { emoji: "📚", ad: "Okul Zamanı", deger: "sebep" },
        { emoji: "🏖️", ad: "Tatil", deger: "diger" },
        { emoji: "🎮", ad: "Oyun", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "☀️", ad: "Güneşli Hava" }, sonuc: { emoji: "🕶️", ad: "Güneş Gözlüğü/Şapka", deger: "sonuc" }, karsit: [
        { emoji: "☀️", ad: "Güneşli Hava", deger: "sebep" },
        { emoji: "🌧️", ad: "Yağmurlu Hava", deger: "diger" },
        { emoji: "❄️", ad: "Karlı Hava", deger: "diger" }
      ]},
      { hedef: "sonuc", sebep: { emoji: "🦷", ad: "Diş Ağrısı" }, sonuc: { emoji: "👨‍⚕️", ad: "Diş Doktoru/Diş Fırçası", deger: "sonuc" }, karsit: [
        { emoji: "🦷", ad: "Diş Ağrısı", deger: "sebep" },
        { emoji: "😊", ad: "Sağlıklı Diş", deger: "diger" },
        { emoji: "🦷", ad: "Diş", deger: "diger" }
      ]}
    ]
  }
};

// Doku/Materyal Ayırt Etme
const DOKU_MATERYAL = {
  yumusak_sert: {
    sahneler: [
      { hedef: "yumusak", emoji: "🛏️", ad: "Yastık", karsit: { emoji: "🪨", ad: "Taş", deger: "sert" } },
      { hedef: "yumusak", emoji: "🧸", ad: "Peluş Oyuncak", karsit: { emoji: "⚽", ad: "Metal Top", deger: "sert" } },
      { hedef: "yumusak", emoji: "🛋️", ad: "Yumuşak Koltuk", karsit: { emoji: "🪑", ad: "Tahta Sandalye", deger: "sert" } },
      { hedef: "yumusak", emoji: "☁️", ad: "Pamuk", karsit: { emoji: "🍶", ad: "Cam Şişe", deger: "sert" } },
      { hedef: "yumusak", emoji: "🪣", ad: "Halı", karsit: { emoji: "🧱", ad: "Karo Taş", deger: "sert" } },
      { hedef: "yumusak", emoji: "🛏️", ad: "Battaniye", karsit: { emoji: "🪑", ad: "Masa", deger: "sert" } },
      { hedef: "yumusak", emoji: "🧽", ad: "Sünger", karsit: { emoji: "🧱", ad: "Tuğla", deger: "sert" } },
      { hedef: "yumusak", emoji: "⚽", ad: "Yumuşak Oyuncak Top", karsit: { emoji: "🏀", ad: "Sert Basketbol Topu", deger: "sert" } },
      { hedef: "yumusak", emoji: "🧸", ad: "Peluş Ayı", karsit: { emoji: "🤖", ad: "Plastik Robot", deger: "sert" } },
      { hedef: "yumusak", emoji: "🧵", ad: "Yumuşak Kumaş", karsit: { emoji: "🥄", ad: "Metal Kaşık", deger: "sert" } }
    ],
    varsayilan: [
      { ad: "Yumuşak", emoji: "🛏️", deger: "yumusak" },
      { ad: "Sert", emoji: "🪨", deger: "sert" }
    ]
  },
  purlu_dusuk: {
    sahneler: [
      { hedef: "dusuk", emoji: "🪟", ad: "Cam", karsit: { emoji: "📄", ad: "Zımpara Kağıdı", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🪑", ad: "Cilalı Masa", karsit: { emoji: "🌳", ad: "Kabuklu Ağaç Gövdesi", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🧱", ad: "Düz Beyaz Duvar", karsit: { emoji: "🧱", ad: "Taş Duvar", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🧱", ad: "Düz Fayans", karsit: { emoji: "🪣", ad: "Tüylü Halı", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🍎", ad: "Düz Elma Kabuğu", karsit: { emoji: "🍊", ad: "Pütürlü Portakal Kabuğu", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🪨", ad: "Pürüzsüz Mermer", karsit: { emoji: "🪨", ad: "Pürüzlü Kaya", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🧱", ad: "Düz Plastik", karsit: { emoji: "🧱", ad: "Tırtıklı Plastik", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🛣️", ad: "Asfalt Yol", karsit: { emoji: "🛣️", ad: "Çakıl Dolu Yol", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🧱", ad: "Düz Plastik Levha", karsit: { emoji: "🧽", ad: "Pütürlü Sünger", deger: "purulu" } },
      { hedef: "dusuk", emoji: "🧵", ad: "Saten Kumaş", karsit: { emoji: "🧵", ad: "Pürüzlü Kumaş", deger: "purulu" } }
    ],
    varsayilan: [
      { ad: "Pürüzlü", emoji: "📄", deger: "purulu" },
      { ad: "Düz", emoji: "🪟", deger: "dusuk" }
    ]
  }
};

// Sıra/Dizilim Ayırt Etme
const SIRA_DIZILIM = {
  sira_sayisi: {
    sahneler: [
      { hedef: "ilk", dizilim: [
        { emoji: "🔴", ad: "Kırmızı Araba", sira: 1 },
        { emoji: "🔵", ad: "Mavi Araba", sira: 2 },
        { emoji: "🟢", ad: "Yeşil Araba", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "👶", ad: "Çocuk 1", sira: 1 },
        { emoji: "👶", ad: "Çocuk 2", sira: 2 },
        { emoji: "👶", ad: "Çocuk 3", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "⚽", ad: "Küçük Top", sira: 1 },
        { emoji: "⚽", ad: "Orta Top", sira: 2 },
        { emoji: "⚽", ad: "Büyük Top", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "📚", ad: "Kitap 1", sira: 1 },
        { emoji: "📚", ad: "Kitap 2", sira: 2 },
        { emoji: "📚", ad: "Kitap 3", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "✏️", ad: "Kalem 1", sira: 1 },
        { emoji: "✏️", ad: "Kalem 2", sira: 2 },
        { emoji: "✏️", ad: "Kalem 3", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "🐱", ad: "Kedi", sira: 1 },
        { emoji: "🐶", ad: "Köpek", sira: 2 },
        { emoji: "🐦", ad: "Kuş", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "🎈", ad: "Sarı Balon", sira: 1 },
        { emoji: "🎈", ad: "Kırmızı Balon", sira: 2 },
        { emoji: "🎈", ad: "Mavi Balon", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "🚂", ad: "Tren", sira: 1 },
        { emoji: "⚽", ad: "Top", sira: 2 },
        { emoji: "🧸", ad: "Bebek", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "🍎", ad: "Elma", sira: 1 },
        { emoji: "🍌", ad: "Muz", sira: 2 },
        { emoji: "🍇", ad: "Üzüm", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "🔢", ad: "5", sira: 1 },
        { emoji: "🔢", ad: "7", sira: 2 },
        { emoji: "🔢", ad: "9", sira: 3 }
      ]}
    ]
  },
  once_sonra: {
    sahneler: [
      { hedef: "once", dizilim: [
        { emoji: "1️⃣", ad: "Önce", sira: 1 },
        { emoji: "2️⃣", ad: "Sonra", sira: 2 }
      ]},
      { hedef: "once", dizilim: [
        { emoji: "🌅", ad: "Sabah", sira: 1 },
        { emoji: "🌆", ad: "Akşam", sira: 2 }
      ]},
      { hedef: "once", dizilim: [
        { emoji: "🌱", ad: "Tohum", sira: 1 },
        { emoji: "🌳", ad: "Ağaç", sira: 2 }
      ]},
      { hedef: "once", dizilim: [
        { emoji: "🥚", ad: "Yumurta", sira: 1 },
        { emoji: "🐣", ad: "Civciv", sira: 2 }
      ]},
      { hedef: "once", dizilim: [
        { emoji: "📖", ad: "Başlangıç", sira: 1 },
        { emoji: "📚", ad: "Son", sira: 2 }
      ]}
    ]
  },
  ilk_son: {
    sahneler: [
      { hedef: "ilk", dizilim: [
        { emoji: "🔴", ad: "İlk", sira: 1 },
        { emoji: "🔵", ad: "Orta", sira: 2 },
        { emoji: "🟢", ad: "Son", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "1️⃣", ad: "İlk", sira: 1 },
        { emoji: "2️⃣", ad: "Orta", sira: 2 },
        { emoji: "3️⃣", ad: "Son", sira: 3 }
      ]}
    ]
  },
  ilk_orta_son: {
    sahneler: [
      { hedef: "ilk", dizilim: [
        { emoji: "🔴", ad: "Kırmızı Araba", sira: 1 },
        { emoji: "🔵", ad: "Mavi Araba", sira: 2 },
        { emoji: "🟢", ad: "Yeşil Araba", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "👶", ad: "Çocuk 1", sira: 1 },
        { emoji: "👶", ad: "Çocuk 2", sira: 2 },
        { emoji: "👶", ad: "Çocuk 3", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "⚽", ad: "Küçük Top", sira: 1 },
        { emoji: "⚽", ad: "Orta Top", sira: 2 },
        { emoji: "⚽", ad: "Büyük Top", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "📚", ad: "Kitap 1", sira: 1 },
        { emoji: "📚", ad: "Kitap 2", sira: 2 },
        { emoji: "📚", ad: "Kitap 3", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "✏️", ad: "Kalem 1", sira: 1 },
        { emoji: "✏️", ad: "Kalem 2", sira: 2 },
        { emoji: "✏️", ad: "Kalem 3", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "🐱", ad: "Kedi", sira: 1 },
        { emoji: "🐶", ad: "Köpek", sira: 2 },
        { emoji: "🐦", ad: "Kuş", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "🎈", ad: "Sarı Balon", sira: 1 },
        { emoji: "🎈", ad: "Kırmızı Balon", sira: 2 },
        { emoji: "🎈", ad: "Mavi Balon", sira: 3 }
      ]},
      { hedef: "orta", dizilim: [
        { emoji: "🚂", ad: "Tren", sira: 1 },
        { emoji: "⚽", ad: "Top", sira: 2 },
        { emoji: "🧸", ad: "Bebek", sira: 3 }
      ]},
      { hedef: "son", dizilim: [
        { emoji: "🍎", ad: "Elma", sira: 1 },
        { emoji: "🍌", ad: "Muz", sira: 2 },
        { emoji: "🍇", ad: "Üzüm", sira: 3 }
      ]},
      { hedef: "ilk", dizilim: [
        { emoji: "🔢", ad: "5", sira: 1 },
        { emoji: "🔢", ad: "7", sira: 2 },
        { emoji: "🔢", ad: "9", sira: 3 }
      ]}
    ]
  }
};

// ==========================================================
// 📝 YÖNERGE METİNLERİ
// ==========================================================
const YONERGELER = {
  renk_ayirt: "Zemin rengi ile aynı olan rengi seç.",
  buyuk_kucuk: "Üstteki resimden daha büyük olanı seç.",
  uzun_kisa: "Resimdekinden uzun olanı seç.",
  ince_kalin: "Resimdekinden kalın olanı seç.",
  sag_sol: "Sağda olanı seç.",
  yukari_asagi: "Yukarı bakan oku işaretle.",
  on_arka: "Önde olanı seç.",
  yon_ok: "Sağa bakan oku işaretle.",
  az_cok: "Miktarı fazla olanı seç.",
  bos_dolu: "Dolu olanı seç.",
  yarim_tam: "Tam olanı seç.",
  sayi_karsilastirma: "Sayısı fazla olanı seç.",
  tane_sayma: "Tane sayısı fazla olanı seç.",
  esit_fazla_az: "Sayısı fazla olanı seç.",
  hayvan_bitki: "Hayvan olanı seç.",
  yiyecek_icecek: "Yiyecek olanı seç.",
  tasit_esya: "Taşıt olanı seç.",
  renk_sekil: "Renk olanı seç.",
  mutlu_uzgun: "Mutlu yüzü işaretle.",
  kizgin_sakin: "Sakin yüzü işaretle.",
  korkulu_guvenli: "Güvenli yüzü işaretle.",
  yuksek_alcak: "Yüksek sesi seç.",
  hizli_yavas: "Hızlı sesi seç.",
  uzun_kisa_ses: "Uzun sesi seç.",
  benzer_farkli: "Farklı olanı seç.",
  ayni_farkli: "Aynı olanı seç.",
  sebep_sonuc: "Sonucu seç.",
  yumusak_sert: "Yumuşak olanı seç.",
  purlu_dusuk: "Düz olanı seç.",
  isikli_karanlik: "Işıklı olanı seç.",
  temiz_kirli: "Temiz olanı seç.",
  soguk_sicak: "Sıcak olanı seç.",
  ac_tok: "Tok olanı seç.",
  uykulu_uyanik: "Uyanık olanı seç.",
  sira_sayisi: "İlk sıradakini seç.",
  once_sonra: "Önce olanı seç.",
  ilk_son: "İlk olanı seç.",
  yaz_kis: "Kış olanı seç.",
  gunduz_gece: "Gündüz olanı seç."
};

// ==========================================================
// 🔊 SESLER
// ==========================================================
// Ses dosyalarının yolunu oyun klasörüne göre ayarla
const sesYolu = "../../sesler/";
const dogruSes = new Audio(sesYolu + "dogru.mp3");
const yanlisSes = new Audio(sesYolu + "yanlis.mp3");

// Ses yükleme hatalarını yakala
dogruSes.onerror = () => console.warn("⚠ Doğru ses dosyası yüklenemedi:", sesYolu + "dogru.mp3");
yanlisSes.onerror = () => console.warn("⚠ Yanlış ses dosyası yüklenemedi:", sesYolu + "yanlis.mp3");

// Ses yükleme için preload
dogruSes.preload = "auto";
yanlisSes.preload = "auto";

// ==========================================================
// 🎮 GAME ENGINE BAŞLAT
// ==========================================================
const gameMeta = GLOBAL.GAME_MAP?.[GLOBAL.OYUN_KODLARI.AYIRT_ETME] || null;

let engine = new GameEngine({
  gameName: GLOBAL.OYUN_KODLARI.AYIRT_ETME,
  timeLimit: 30,
  gameMeta: gameMeta
});

// ==========================================================
// 🎬 OYUN DEĞİŞKENLERİ
// ==========================================================
let secenekSayisi = 2;
let aktifKategori = null;
let aktifAltOyun = null;
let oyunBaslangicZamani = 0;
let soruStart = 0;

// ==========================================================
// 🚀 SAYFA YÜKLENİNCE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  // LocalStorage'dan oyun bilgilerini al
  aktifKategori = localStorage.getItem("ayirtEtmeKategori");
  aktifAltOyun = localStorage.getItem("ayirtEtmeAltOyun");
  const kayitliSecenekSayisi = localStorage.getItem("ayirtEtmeSecenekSayisi");
  if (kayitliSecenekSayisi) {
    secenekSayisi = Number(kayitliSecenekSayisi);
  }

  // Eğer kategori veya alt oyun yoksa ana menüye yönlendir
  if (!aktifKategori || !aktifAltOyun) {
    console.warn("⚠ Oyun bilgileri bulunamadı, ana menüye yönlendiriliyor...");
    window.location.href = "menu.html";
    return;
  }

  // Yönerge metnini oyun ekranında göster
  const yonergeMetni = YONERGELER[aktifAltOyun] || "Doğru olanı seç.";
  const yonergeEl = document.getElementById("yonergeMetni");
  if (yonergeEl) {
    yonergeEl.textContent = `📝 ${yonergeMetni}`;
  }

  // Başlığı güncelle
  const baslikEl = document.getElementById("oyunBaslik");
  if (baslikEl) {
    const altOyunAdlari = {
      renk_ayirt: "Renk Ayırt Etme",
      buyuk_kucuk: "Büyük – Küçük",
      uzun_kisa: "Uzun – Kısa",
      ince_kalin: "İnce – Kalın",
      sag_sol: "Sağ – Sol",
      yukari_asagi: "Yukarı – Aşağı",
      on_arka: "Ön – Arka",
      yon_ok: "Yön (Ok)",
      az_cok: "Az – Çok",
      bos_dolu: "Boş – Dolu",
      yarim_tam: "Yarım – Tam",
      sayi_karsilastirma: "Sayı Karşılaştırma",
      tane_sayma: "Tane Sayma",
      esit_fazla_az: "Eşit / Fazla / Az",
      hayvan_bitki: "Hayvan – Bitki",
      yiyecek_icecek: "Yiyecek – İçecek",
      tasit_esya: "Taşıt – Eşya",
      renk_sekil: "Renk – Şekil",
      mutlu_uzgun: "Mutlu – Üzgün",
      kizgin_sakin: "Kızgın – Sakin",
      korkulu_guvenli: "Korkulu – Güvenli",
      yuksek_alcak: "Yüksek – Alçak",
      hizli_yavas: "Hızlı – Yavaş",
      uzun_kisa_ses: "Uzun – Kısa Ses",
      benzer_farkli: "Benzer – Farklı",
      ayni_farkli: "Aynı – Farklı",
      mantik_ornegi: "Mantık Örneği",
      yumusak_sert: "Yumuşak – Sert",
      purlu_dusuk: "Pürüzlü – Düz",
      isikli_karanlik: "Işıklı – Karanlık",
      temiz_kirli: "Temiz – Kirli",
      soguk_sicak: "Soğuk – Sıcak",
      ac_tok: "Aç – Tok",
      uykulu_uyanik: "Uykulu – Uyanık",
      sira_sayisi: "Sıra Sayısı",
      once_sonra: "Önce – Sonra",
      ilk_son: "İlk – Son"
    };
    baslikEl.textContent = altOyunAdlari[aktifAltOyun] || "Ayırt Etme";
  }

  // Seviye popup
  const seviyePopup = document.getElementById("seviyePopup");
  const baslatPopup = document.getElementById("baslatPopup");
  const baslatBtn = document.getElementById("baslatBtn");

  // Sağ-Sol oyunu için seviye seçimi yok, direkt başlat
  if (aktifAltOyun === "sag_sol") {
    secenekSayisi = 2; // Sağ-Sol için her zaman 2 seçenek
    localStorage.setItem("ayirtEtmeSecenekSayisi", "2");
    
    // Tüm popup'ları kapat
    if (seviyePopup) {
      seviyePopup.classList.remove("show");
    }
    if (baslatPopup) {
      baslatPopup.classList.remove("show");
    }
    
    // Direkt oyunu başlat
    setTimeout(() => {
      oyunBaslat();
    }, 300);
  } else {
    // Diğer oyunlar için seviye seçimi
    if (seviyePopup) seviyePopup.classList.add("show");

    // Seviye seçimi
    document.querySelectorAll(".seviyeBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        secenekSayisi = Number(btn.dataset.seviye);
        localStorage.setItem("ayirtEtmeSecenekSayisi", secenekSayisi.toString());
        if (seviyePopup) seviyePopup.classList.remove("show");
        // Yönerge zaten oyun ekranında gösteriliyor, direkt başlat popup'ını göster
        if (baslatPopup) baslatPopup.classList.add("show");
      });
    });

    // Başlat düğmesi
    if (baslatBtn) {
      baslatBtn.addEventListener("click", () => {
        if (baslatPopup) baslatPopup.classList.remove("show");
        oyunBaslat();
      });
    }
  }

  // Bitir düğmesi
  const bitirBtn = document.getElementById("bitirBtn");
  if (bitirBtn) {
    bitirBtn.onclick = async () => {
      console.log("⛔ Bitir düğmesine tıklandı");
      if (engine && !engine.gameFinished) {
        bitirBtn.disabled = true;
        bitirBtn.textContent = "⏳ İşleniyor...";
        
        try {
          if (engine.timerInterval) {
            clearInterval(engine.timerInterval);
            engine.timerInterval = null;
          }
          engine.gameFinished = true;
          
          await engine.endGame();
          
          // Yönlendirme kontrolü
          setTimeout(() => {
            if (window.location.pathname.includes("ayirtetme.html")) {
              window.location.href = "sonuc_ayirtetme.html";
            }
          }, 1000);
        } catch (err) {
          console.error("❌ Oyun bitiş hatası:", err);
          window.location.href = "sonuc_ayirtetme.html";
        }
      }
    };
  }
  
  // Oyun bitiş callback
  engine.setOnEndCallback(() => {
    console.log("⏰ Süre bitti, oyun sonu analizi hazırlanıyor...");
  });
});

// ==========================================================
// ▶️ OYUN BAŞLAT
// ==========================================================
function oyunBaslat() {
  oyunBaslangicZamani = performance.now();
  console.log("🎮 Ayırt etme oyunu başlatıldı:", aktifAltOyun);
  
  engine.start(updateUI);
  yeniSoru();
}

// ==========================================================
// 🔄 UI Güncelleme
// ==========================================================
function updateUI(score, mistakes, timeLeft) {
  const skorEl = document.getElementById("skor");
  const yanlisEl = document.getElementById("yanlis");
  const sureEl = document.getElementById("sure");
  
  if (skorEl) skorEl.textContent = score;
  if (yanlisEl) yanlisEl.textContent = mistakes;
  if (sureEl) sureEl.textContent = timeLeft;
}

// ==========================================================
// 🎲 SORU ÜRETİCİLERİ
// ==========================================================

// Renk ayırt etme - Detaylı Sahne Verileri
const RENK_SAHNELERI = [
  { zemin: "Kırmızı", zeminKod: "#e53935", yazi: "Mavi", yaziKod: "#2962ff" },
  { zemin: "Mavi", zeminKod: "#2962ff", yazi: "Sarı", yaziKod: "#fdd835" },
  { zemin: "Yeşil", zeminKod: "#43a047", yazi: "Kırmızı", yaziKod: "#e53935" },
  { zemin: "Sarı", zeminKod: "#fdd835", yazi: "Mor", yaziKod: "#8e24aa" },
  { zemin: "Mor", zeminKod: "#8e24aa", yazi: "Turuncu", yaziKod: "#fb8c00" },
  { zemin: "Turuncu", zeminKod: "#fb8c00", yazi: "Kahverengi", yaziKod: "#6d4c41" },
  { zemin: "Kahverengi", zeminKod: "#6d4c41", yazi: "Pembe", yaziKod: "#f06292" },
  { zemin: "Pembe", zeminKod: "#f06292", yazi: "Yeşil", yaziKod: "#43a047" },
  { zemin: "Mavi", zeminKod: "#2962ff", yazi: "Sarı", yaziKod: "#fdd835" },
  { zemin: "Kırmızı", zeminKod: "#e53935", yazi: "Yeşil", yaziKod: "#43a047" }
];

// Renk ayırt etme
function renkSorusuUret() {
  const rastgeleSahne = RENK_SAHNELERI[Math.floor(Math.random() * RENK_SAHNELERI.length)];
  
  const zemin = {
    ad: rastgeleSahne.zemin,
    kod: rastgeleSahne.zeminKod
  };
  
  let secenekler = [...RENKLER]
    .sort(() => Math.random() - 0.5)
    .slice(0, secenekSayisi);
  
  // Zemin rengini mutlaka seçeneklere ekle
  if (!secenekler.find(x => x.ad === zemin.ad)) {
    secenekler[0] = zemin;
  }
  
  return {
    hedef: zemin,
    secenekler: secenekler.sort(() => Math.random() - 0.5),
    tip: "renk"
  };
}

// Boyut soruları
function boyutSorusuUret(altOyun) {
  const boyutData = BOYUTLAR[altOyun];
  if (!boyutData) return null;
  
  // Büyük-Küçük için özel mantık
  if (altOyun === "buyuk_kucuk" && boyutData.sahneler && boyutData.sahneler.length > 0) {
    const rastgeleSahne = boyutData.sahneler[Math.floor(Math.random() * boyutData.sahneler.length)];
    
    // Üstte gösterilecek küçük resim (hedef kutu)
    const ustResim = {
      ad: rastgeleSahne.ustResim.ad,
      emoji: rastgeleSahne.ustResim.emoji,
      boyut: rastgeleSahne.ustResim.boyut
    };
    
    // Doğru cevap: Büyük seçenek (üstteki resimden daha büyük)
    const hedef = {
      ad: rastgeleSahne.buyukSecenek.ad,
      emoji: rastgeleSahne.buyukSecenek.emoji,
      deger: rastgeleSahne.buyukSecenek.deger,
      boyut: rastgeleSahne.buyukSecenek.boyut
    };
    
    // Seçenekleri oluştur: Büyük seçenek + diğer seçenekler
    let secenekler = [hedef];
    
    // Diğer seçeneklerden seviyeye göre seç
    const digerSecenekler = [...rastgeleSahne.digerSecenekler]
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 1);
    
    digerSecenekler.forEach(secenek => {
      secenekler.push({
        ad: secenek.ad,
        emoji: secenek.emoji,
        deger: secenek.deger,
        boyut: secenek.boyut
      });
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "boyut",
      ustResim: ustResim // Üstte gösterilecek resim
    };
  }
  
  // Uzun-Kısa için özel mantık (Büyük-Küçük gibi)
  if (altOyun === "uzun_kisa" && boyutData.sahneler && boyutData.sahneler.length > 0) {
    const rastgeleSahne = boyutData.sahneler[Math.floor(Math.random() * boyutData.sahneler.length)];
    
    // Üstte gösterilecek kısa resim (hedef kutu)
    const ustResim = {
      ad: rastgeleSahne.ustResim.ad,
      emoji: rastgeleSahne.ustResim.emoji,
      uzunluk: rastgeleSahne.ustResim.uzunluk
    };
    
    // Doğru cevap: Uzun seçenek (üstteki resimden daha uzun)
    const hedef = {
      ad: rastgeleSahne.uzunSecenek.ad,
      emoji: rastgeleSahne.uzunSecenek.emoji,
      deger: rastgeleSahne.uzunSecenek.deger,
      uzunluk: rastgeleSahne.uzunSecenek.uzunluk
    };
    
    // Seçenekleri oluştur: Uzun seçenek + diğer seçenekler
    let secenekler = [hedef];
    
    // Diğer seçeneklerden seviyeye göre seç
    const digerSecenekler = [...rastgeleSahne.digerSecenekler]
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 1);
    
    digerSecenekler.forEach(secenek => {
      secenekler.push({
        ad: secenek.ad,
        emoji: secenek.emoji,
        deger: secenek.deger,
        uzunluk: secenek.uzunluk
      });
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "boyut",
      ustResim: ustResim // Üstte gösterilecek resim
    };
  }
  
  // İnce-Kalın için özel mantık (Büyük-Küçük gibi)
  if (altOyun === "ince_kalin" && boyutData.sahneler && boyutData.sahneler.length > 0) {
    const rastgeleSahne = boyutData.sahneler[Math.floor(Math.random() * boyutData.sahneler.length)];
    
    // Üstte gösterilecek ince resim (hedef kutu)
    const ustResim = {
      ad: rastgeleSahne.ustResim.ad,
      nesneTipi: rastgeleSahne.ustResim.nesneTipi,
      kalinlik: rastgeleSahne.ustResim.kalinlik
    };
    
    // Doğru cevap: Kalın seçenek (üstteki resimden daha kalın)
    const hedef = {
      ad: rastgeleSahne.kalinSecenek.ad,
      nesneTipi: rastgeleSahne.kalinSecenek.nesneTipi,
      deger: rastgeleSahne.kalinSecenek.deger,
      kalinlik: rastgeleSahne.kalinSecenek.kalinlik
    };
    
    // Seçenekleri oluştur: Kalın seçenek + diğer seçenekler
    let secenekler = [hedef];
    
    // Diğer seçeneklerden seviyeye göre seç
    const digerSecenekler = [...rastgeleSahne.digerSecenekler]
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 1);
    
    digerSecenekler.forEach(secenek => {
      secenekler.push({
        ad: secenek.ad,
        nesneTipi: secenek.nesneTipi,
        deger: secenek.deger,
        kalinlik: secenek.kalinlik
      });
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "boyut",
      ustResim: ustResim // Üstte gösterilecek resim
    };
  }
  
  // Diğer boyut oyunları için eski mantık (ince_kalin)
  if (boyutData.sahneler && boyutData.sahneler.length > 0) {
    const rastgeleSahne = boyutData.sahneler[Math.floor(Math.random() * boyutData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    const karsit = {
      ad: rastgeleSahne.karsit.ad,
      emoji: rastgeleSahne.karsit.emoji,
      deger: rastgeleSahne.karsit.deger
    };
    
    let secenekler = [hedef, karsit];
    
    if (secenekSayisi > 2) {
      const digerSahneler = boyutData.sahneler
        .filter(s => s.hedef !== hedefDeger)
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 2);
      
      digerSahneler.forEach(sahne => {
        secenekler.push({
          ad: sahne.ad,
          emoji: sahne.emoji,
          deger: sahne.hedef
        });
      });
    }
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "boyut"
    };
  }
  
  // Varsayılan veriler kullan
  const secenekler = boyutData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > 2) {
    const digerBoyutlar = Object.values(BOYUTLAR)
      .map(b => b.varsayilan || [])
      .flat();
    const ekSecenekler = digerBoyutlar
      .filter(b => b.deger !== hedef.deger && !secenekler.find(s => s.deger === b.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 2);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "boyut"
  };
}

// Yön soruları
function yonSorusuUret(altOyun) {
  const yonData = YONLER[altOyun];
  if (!yonData) return null;
  
  // Özel ok yönü soruları
  if (altOyun === "yon_ok") {
    if (yonData.sahneler && yonData.sahneler.length > 0) {
      const rastgeleSahne = yonData.sahneler[Math.floor(Math.random() * yonData.sahneler.length)];
      const hedefDeger = rastgeleSahne.hedef;
      
      const hedef = {
        ad: rastgeleSahne.ad,
        emoji: rastgeleSahne.emoji,
        deger: hedefDeger
      };
      
      let secenekler = [hedef];
      
      // Karşıt seçeneklerden rastgele seç
      const karsitSecenekler = rastgeleSahne.karsit
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 1);
      
      karsitSecenekler.forEach(k => {
        secenekler.push({
          ad: k.ad,
          emoji: k.emoji,
          deger: k.deger
        });
      });
      
      return {
        hedef: hedef,
        secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
        tip: "yon"
      };
    }
  }
  
  // Diğer yön soruları (sag_sol, yukari_asagi, on_arka)
  if (yonData.sahneler && yonData.sahneler.length > 0) {
    const rastgeleSahne = yonData.sahneler[Math.floor(Math.random() * yonData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    const karsit = {
      ad: rastgeleSahne.karsit.ad,
      emoji: rastgeleSahne.karsit.emoji,
      deger: rastgeleSahne.karsit.deger
    };
    
    // Sağ-Sol oyunu için sadece hedef ve karşıt seçenekler (2 seçenek)
    if (altOyun === "sag_sol") {
      return {
        hedef: hedef,
        secenekler: [hedef, karsit].sort(() => Math.random() - 0.5),
        tip: "yon",
        yonergesiz: rastgeleSahne.yonergesiz || false
      };
    }
    
    let secenekler = [hedef, karsit];
    
    if (secenekSayisi > 2) {
      const digerSahneler = yonData.sahneler
        .filter(s => s.hedef !== hedefDeger)
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 2);
      
      digerSahneler.forEach(sahne => {
        secenekler.push({
          ad: sahne.ad,
          emoji: sahne.emoji,
          deger: sahne.hedef
        });
      });
    }
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "yon",
      yonergesiz: rastgeleSahne.yonergesiz || false // Yönerge resmi gösterilmeyecek mi?
    };
  }
  
  // Varsayılan veriler
  const secenekler = yonData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerYonler = Object.values(YONLER)
      .map(y => y.varsayilan || [])
      .flat();
    const ekSecenekler = digerYonler
      .filter(y => y.deger !== hedef.deger && !secenekler.find(s => s.deger === y.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "yon"
  };
}

// Miktar soruları
function miktarSorusuUret(altOyun) {
  const miktarData = MIKTARLAR[altOyun];
  if (!miktarData) return null;
  
  if (miktarData.sahneler && miktarData.sahneler.length > 0) {
    const rastgeleSahne = miktarData.sahneler[Math.floor(Math.random() * miktarData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger,
      miktar: rastgeleSahne.miktar
    };
    
    const karsit = {
      ad: rastgeleSahne.karsit.ad,
      emoji: rastgeleSahne.karsit.emoji,
      deger: rastgeleSahne.karsit.deger,
      miktar: rastgeleSahne.karsit.miktar
    };
    
    let secenekler = [hedef, karsit];
    
    if (secenekSayisi > 2) {
      const digerSahneler = miktarData.sahneler
        .filter(s => s.hedef !== hedefDeger)
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 2);
      
      digerSahneler.forEach(sahne => {
        secenekler.push({
          ad: sahne.ad,
          emoji: sahne.emoji,
          deger: sahne.hedef,
          miktar: sahne.miktar
        });
      });
    }
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "miktar"
    };
  }
  
  const secenekler = miktarData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerMiktarlar = Object.values(MIKTARLAR)
      .map(m => m.varsayilan || [])
      .flat();
    const ekSecenekler = digerMiktarlar
      .filter(m => m.deger !== hedef.deger && !secenekler.find(s => s.deger === m.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "miktar"
  };
}

// Sayı soruları
function sayiSorusuUret(altOyun) {
  // Sayı karşılaştırma
  if (altOyun === "sayi_karsilastirma") {
    const sayiCiftleri = [
      [3, 7], [5, 9], [2, 8, 1], [10, 4], [6, 3, 9],
      [1, 5, 2], [12, 7], [15, 11, 3], [4, 14], [18, 9, 2]
    ];
    const rastgeleCift = sayiCiftleri[Math.floor(Math.random() * sayiCiftleri.length)];
    const hedefSayi = Math.max(...rastgeleCift);
    
    let secenekler = [...rastgeleCift];
    while (secenekler.length < secenekSayisi) {
      const yeniSayi = Math.floor(Math.random() * 20) + 1;
      if (!secenekler.includes(yeniSayi)) {
        secenekler.push(yeniSayi);
      }
    }
    
    return {
      hedef: { ad: hedefSayi.toString(), emoji: "🔢", deger: hedefSayi },
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi).map(s => ({
        ad: s.toString(),
        emoji: "🔢",
        deger: s
      })),
      tip: "sayi"
    };
  }
  
  // Tane sayma (1-20)
  if (altOyun === "tane_sayma") {
    const taneSahneler = [
      { sayi: 3, emoji: "🍎", ad: "3 Elma" },
      { sayi: 7, emoji: "⭐", ad: "7 Yıldız" },
      { sayi: 1, emoji: "⚽", ad: "1 Top" },
      { sayi: 10, emoji: "✏️", ad: "10 Kalem" },
      { sayi: 5, emoji: "🎈", ad: "5 Balon" },
      { sayi: 2, emoji: "🐱", ad: "2 Kedi" },
      { sayi: 9, emoji: "📚", ad: "9 Kitap" },
      { sayi: 4, emoji: "🚗", ad: "4 Araba" },
      { sayi: 12, emoji: "🌺", ad: "12 Çiçek" },
      { sayi: 20, emoji: "🍃", ad: "20 Yaprak" }
    ];
    
    const rastgeleSahne = taneSahneler[Math.floor(Math.random() * taneSahneler.length)];
    const hedefSayi = rastgeleSahne.sayi;
    
    let secenekler = [hedefSayi];
    while (secenekler.length < secenekSayisi) {
      const yeniSayi = taneSahneler[Math.floor(Math.random() * taneSahneler.length)].sayi;
      if (!secenekler.includes(yeniSayi)) {
        secenekler.push(yeniSayi);
      }
    }
    
    return {
      hedef: { 
        ad: `${hedefSayi} - ${rastgeleSahne.ad}`, 
        emoji: rastgeleSahne.emoji, 
        deger: hedefSayi 
      },
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi).map(s => {
        const sahne = taneSahneler.find(t => t.sayi === s) || taneSahneler[0];
        return {
          ad: s.toString(),
          emoji: sahne.emoji,
          deger: s
        };
      }),
      tip: "sayi"
    };
  }
  
  // Çift-Tek
  if (altOyun === "esit_fazla_az" || altOyun.includes("cift") || altOyun.includes("tek")) {
    const ciftTekSahneler = [
      { hedef: "cift", sayilar: [2, 3, 4, 5], dogru: [2, 4] },
      { hedef: "tek", sayilar: [1, 4, 7, 8], dogru: [1, 7] },
      { hedef: "cift", sayilar: [6, 9, 10], dogru: [6, 10] },
      { hedef: "cift", sayilar: [11, 12, 13], dogru: [12] },
      { hedef: "tek", sayilar: [14, 15, 16], dogru: [15] },
      { hedef: "cift", sayilar: [17, 18, 19], dogru: [18] },
      { hedef: "tek", sayilar: [3, 5, 8, 10], dogru: [3, 5] },
      { hedef: "cift", sayilar: [2, 7, 9], dogru: [2] },
      { hedef: "cift", sayilar: [1, 6, 11, 20], dogru: [6, 20] },
      { hedef: "tek", sayilar: [4, 13, 15], dogru: [13, 15] }
    ];
    
    const rastgeleSahne = ciftTekSahneler[Math.floor(Math.random() * ciftTekSahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    const hedefSayi = rastgeleSahne.dogru[0];
    
    let secenekler = [...rastgeleSahne.sayilar];
    while (secenekler.length < secenekSayisi) {
      const yeniSayi = Math.floor(Math.random() * 20) + 1;
      if (!secenekler.includes(yeniSayi)) {
        secenekler.push(yeniSayi);
      }
    }
    
    return {
      hedef: { 
        ad: hedefSayi.toString(), 
        emoji: "🔢", 
        deger: hedefSayi,
        tip: hedefDeger
      },
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi).map(s => ({
        ad: s.toString(),
        emoji: "🔢",
        deger: s,
        tip: s % 2 === 0 ? "cift" : "tek"
      })),
      tip: "sayi"
    };
  }
  
  // Varsayılan
  const sayi1 = Math.floor(Math.random() * 10) + 1;
  const sayi2 = Math.floor(Math.random() * 10) + 1;
  const hedefSayi = Math.max(sayi1, sayi2);
  
  let secenekler = [sayi1, sayi2];
  while (secenekler.length < secenekSayisi) {
    const yeniSayi = Math.floor(Math.random() * 10) + 1;
    if (!secenekler.includes(yeniSayi)) {
      secenekler.push(yeniSayi);
    }
  }
  
  return {
    hedef: { ad: hedefSayi.toString(), emoji: "🔢", deger: hedefSayi },
    secenekler: secenekler.sort(() => Math.random() - 0.5).map(s => ({
      ad: s.toString(),
      emoji: "🔢",
      deger: s
    })),
    tip: "sayi"
  };
}

// Kategori soruları
function kategoriSorusuUret(altOyun) {
  const kategoriData = KATEGORILER[altOyun];
  if (!kategoriData) return null;
  
  if (kategoriData.sahneler && kategoriData.sahneler.length > 0) {
    const rastgeleSahne = kategoriData.sahneler[Math.floor(Math.random() * kategoriData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    let secenekler = [hedef];
    
    // Karşıt seçeneklerden rastgele seç
    const karsitSecenekler = rastgeleSahne.karsit
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 1);
    
    karsitSecenekler.forEach(k => {
      secenekler.push({
        ad: k.ad,
        emoji: k.emoji,
        deger: k.deger
      });
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "kategori"
    };
  }
  
  const secenekler = kategoriData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerKategoriler = Object.values(KATEGORILER)
      .map(k => k.varsayilan || [])
      .flat();
    const ekSecenekler = digerKategoriler
      .filter(k => k.deger !== hedef.deger && !secenekler.find(s => s.deger === k.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "kategori"
  };
}

// Duygu soruları
function duyguSorusuUret(altOyun) {
  const duyguData = DUYGULAR[altOyun];
  if (!duyguData) return null;
  
  if (duyguData.sahneler && duyguData.sahneler.length > 0) {
    const rastgeleSahne = duyguData.sahneler[Math.floor(Math.random() * duyguData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    let secenekler = [hedef];
    
    const karsitSecenekler = rastgeleSahne.karsit
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - 1);
    
    karsitSecenekler.forEach(k => {
      secenekler.push({
        ad: k.ad,
        emoji: k.emoji,
        deger: k.deger
      });
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "duygu"
    };
  }
  
  const secenekler = duyguData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerDuygular = Object.values(DUYGULAR)
      .map(d => d.varsayilan || [])
      .flat();
    const ekSecenekler = digerDuygular
      .filter(d => d.deger !== hedef.deger && !secenekler.find(s => s.deger === d.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "duygu"
  };
}

// Günlük yaşam soruları
function gunlukYasamSorusuUret(altOyun) {
  const gunlukYasamData = GUNLUK_YASAM[altOyun];
  if (!gunlukYasamData) return null;
  
  if (gunlukYasamData.sahneler && gunlukYasamData.sahneler.length > 0) {
    const rastgeleSahne = gunlukYasamData.sahneler[Math.floor(Math.random() * gunlukYasamData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    const karsit = {
      ad: rastgeleSahne.karsit.ad,
      emoji: rastgeleSahne.karsit.emoji,
      deger: rastgeleSahne.karsit.deger
    };
    
    let secenekler = [hedef, karsit];
    
    if (secenekSayisi > 2) {
      const digerSahneler = gunlukYasamData.sahneler
        .filter(s => s.hedef !== hedefDeger)
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 2);
      
      digerSahneler.forEach(sahne => {
        secenekler.push({
          ad: sahne.ad,
          emoji: sahne.emoji,
          deger: sahne.hedef
        });
      });
    }
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "gunluk_yasam"
    };
  }
  
  const secenekler = gunlukYasamData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerGunlukYasam = Object.values(GUNLUK_YASAM)
      .map(g => g.varsayilan || [])
      .flat();
    const ekSecenekler = digerGunlukYasam
      .filter(g => g.deger !== hedef.deger && !secenekler.find(s => s.deger === g.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "gunluk_yasam"
  };
}

// Mantıksal soruları
function mantiksalSorusuUret(altOyun) {
  const mantiksalData = MANTIKSAL[altOyun];
  if (!mantiksalData) return null;
  
  if (altOyun === "ayni_farkli") {
    if (mantiksalData.sahneler && mantiksalData.sahneler.length > 0) {
      const rastgeleSahne = mantiksalData.sahneler[Math.floor(Math.random() * mantiksalData.sahneler.length)];
      const hedefDeger = rastgeleSahne.hedef; // "ayni" veya "farkli"
      
      // Aynı olanları bul
      if (hedefDeger === "ayni") {
        const kategoriler = rastgeleSahne.secenekler.map(s => s.kategori);
        const kategoriSayilari = {};
        kategoriler.forEach(k => {
          kategoriSayilari[k] = (kategoriSayilari[k] || 0) + 1;
        });
        const ayniKategori = Object.keys(kategoriSayilari).find(k => kategoriSayilari[k] > 1);
        const ayniSecenek = rastgeleSahne.secenekler.find(s => s.kategori === ayniKategori);
        
        const hedef = {
          ad: ayniSecenek.ad,
          emoji: ayniSecenek.emoji,
          deger: "ayni"
        };
        
        let secenekler = rastgeleSahne.secenekler.map(s => ({
          ad: s.ad,
          emoji: s.emoji,
          deger: s.kategori === ayniKategori ? "ayni" : "farkli"
        }));
        
        return {
          hedef: hedef,
          secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
          tip: "mantiksal"
        };
      } else {
        // Farklı olanı bul
        const kategoriler = rastgeleSahne.secenekler.map(s => s.kategori);
        const kategoriSayilari = {};
        kategoriler.forEach(k => {
          kategoriSayilari[k] = (kategoriSayilari[k] || 0) + 1;
        });
        const farkliKategori = Object.keys(kategoriSayilari).find(k => kategoriSayilari[k] === 1);
        const farkliSecenek = rastgeleSahne.secenekler.find(s => s.kategori === farkliKategori);
        
        const hedef = {
          ad: farkliSecenek.ad,
          emoji: farkliSecenek.emoji,
          deger: "farkli"
        };
        
        let secenekler = rastgeleSahne.secenekler.map(s => ({
          ad: s.ad,
          emoji: s.emoji,
          deger: s.kategori === farkliKategori ? "farkli" : "ayni"
        }));
        
        return {
          hedef: hedef,
          secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
          tip: "mantiksal"
        };
      }
    }
  }
  
  if (altOyun === "benzer_farkli") {
    if (mantiksalData.sahneler && mantiksalData.sahneler.length > 0) {
      const rastgeleSahne = mantiksalData.sahneler[Math.floor(Math.random() * mantiksalData.sahneler.length)];
      
      // Farklı olanı bul
      const kategoriler = rastgeleSahne.secenekler.map(s => s.kategori);
      const kategoriSayilari = {};
      kategoriler.forEach(k => {
        kategoriSayilari[k] = (kategoriSayilari[k] || 0) + 1;
      });
      
      const farkliKategori = Object.keys(kategoriSayilari).find(k => kategoriSayilari[k] === 1);
      const farkliSecenek = rastgeleSahne.secenekler.find(s => s.kategori === farkliKategori);
      
      const hedef = {
        ad: farkliSecenek.ad,
        emoji: farkliSecenek.emoji,
        deger: "farkli"
      };
      
      let secenekler = rastgeleSahne.secenekler.map(s => ({
        ad: s.ad,
        emoji: s.emoji,
        deger: s.kategori === farkliKategori ? "farkli" : "benzer"
      }));
      
      return {
        hedef: hedef,
        secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
        tip: "mantiksal"
      };
    }
  }
  
  if (altOyun === "sebep_sonuc") {
    if (mantiksalData.sahneler && mantiksalData.sahneler.length > 0) {
      const rastgeleSahne = mantiksalData.sahneler[Math.floor(Math.random() * mantiksalData.sahneler.length)];
      
      const hedef = {
        ad: rastgeleSahne.sonuc.ad,
        emoji: rastgeleSahne.sonuc.emoji,
        deger: "sonuc"
      };
      
      let secenekler = [hedef];
      
      const karsitSecenekler = rastgeleSahne.karsit
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 1);
      
      karsitSecenekler.forEach(k => {
        secenekler.push({
          ad: k.ad,
          emoji: k.emoji,
          deger: k.deger
        });
      });
      
      return {
        hedef: hedef,
        secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
        tip: "mantiksal"
      };
    }
  }
  
  return null;
}

// Doku/Materyal soruları
function dokuMateryalSorusuUret(altOyun) {
  const dokuData = DOKU_MATERYAL[altOyun];
  if (!dokuData) return null;
  
  if (dokuData.sahneler && dokuData.sahneler.length > 0) {
    const rastgeleSahne = dokuData.sahneler[Math.floor(Math.random() * dokuData.sahneler.length)];
    const hedefDeger = rastgeleSahne.hedef;
    
    const hedef = {
      ad: rastgeleSahne.ad,
      emoji: rastgeleSahne.emoji,
      deger: hedefDeger
    };
    
    const karsit = {
      ad: rastgeleSahne.karsit.ad,
      emoji: rastgeleSahne.karsit.emoji,
      deger: rastgeleSahne.karsit.deger
    };
    
    let secenekler = [hedef, karsit];
    
    if (secenekSayisi > 2) {
      const digerSahneler = dokuData.sahneler
        .filter(s => s.hedef !== hedefDeger)
        .sort(() => Math.random() - 0.5)
        .slice(0, secenekSayisi - 2);
      
      digerSahneler.forEach(sahne => {
        secenekler.push({
          ad: sahne.ad,
          emoji: sahne.emoji,
          deger: sahne.hedef
        });
      });
    }
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "doku_materyal"
    };
  }
  
  const secenekler = dokuData.varsayilan || [];
  if (secenekler.length === 0) return null;
  
  const hedef = secenekler[Math.floor(Math.random() * secenekler.length)];
  let tumSecenekler = [...secenekler];
  
  if (secenekSayisi > secenekler.length) {
    const digerDokular = Object.values(DOKU_MATERYAL)
      .map(d => d.varsayilan || [])
      .flat();
    const ekSecenekler = digerDokular
      .filter(d => d.deger !== hedef.deger && !secenekler.find(s => s.deger === d.deger))
      .sort(() => Math.random() - 0.5)
      .slice(0, secenekSayisi - secenekler.length);
    tumSecenekler = [...secenekler, ...ekSecenekler];
  }
  
  return {
    hedef: hedef,
    secenekler: tumSecenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
    tip: "doku_materyal"
  };
}

// Sıra/Dizilim soruları
function siraDizilimSorusuUret(altOyun) {
  const siraData = SIRA_DIZILIM[altOyun];
  if (!siraData) return null;
  
  if (siraData.sahneler && siraData.sahneler.length > 0) {
    const rastgeleSahne = siraData.sahneler[Math.floor(Math.random() * siraData.sahneler.length)];
    const hedefSira = rastgeleSahne.hedef; // "ilk", "orta", "son", "once", "sonra"
    
    let hedefIndex = 0;
    if (hedefSira === "orta") hedefIndex = Math.floor(rastgeleSahne.dizilim.length / 2);
    else if (hedefSira === "son" || hedefSira === "sonra") hedefIndex = rastgeleSahne.dizilim.length - 1;
    
    const hedef = {
      ad: rastgeleSahne.dizilim[hedefIndex].ad,
      emoji: rastgeleSahne.dizilim[hedefIndex].emoji,
      deger: hedefSira,
      sira: rastgeleSahne.dizilim[hedefIndex].sira
    };
    
    let secenekler = rastgeleSahne.dizilim.map((item, index) => {
      let deger = "ilk";
      if (rastgeleSahne.dizilim.length === 2) {
        deger = index === 0 ? "once" : "sonra";
      } else {
        if (index === 0) deger = "ilk";
        else if (index === rastgeleSahne.dizilim.length - 1) deger = "son";
        else deger = "orta";
      }
      return {
        ad: item.ad,
        emoji: item.emoji,
        deger: deger,
        sira: item.sira
      };
    });
    
    return {
      hedef: hedef,
      secenekler: secenekler.sort(() => Math.random() - 0.5).slice(0, secenekSayisi),
      tip: "sira_dizilim"
    };
  }
  
  return null;
}

// ==========================================================
// 🟦 YENİ SORU OLUŞTUR
// ==========================================================
function yeniSoru() {
  let soru = null;
  
  // Alt oyuna göre soru üret
  if (aktifAltOyun === "renk_ayirt") {
    soru = renkSorusuUret();
  } else if (BOYUTLAR[aktifAltOyun]) {
    soru = boyutSorusuUret(aktifAltOyun);
  } else if (YONLER[aktifAltOyun]) {
    soru = yonSorusuUret(aktifAltOyun);
  } else if (MIKTARLAR[aktifAltOyun]) {
    soru = miktarSorusuUret(aktifAltOyun);
  } else if (aktifAltOyun.startsWith("sayi_") || aktifAltOyun.startsWith("tane_") || aktifAltOyun.startsWith("esit_")) {
    soru = sayiSorusuUret(aktifAltOyun);
  } else if (KATEGORILER[aktifAltOyun]) {
    soru = kategoriSorusuUret(aktifAltOyun);
  } else if (DUYGULAR[aktifAltOyun]) {
    soru = duyguSorusuUret(aktifAltOyun);
  } else if (GUNLUK_YASAM[aktifAltOyun]) {
    soru = gunlukYasamSorusuUret(aktifAltOyun);
  } else if (MANTIKSAL[aktifAltOyun]) {
    soru = mantiksalSorusuUret(aktifAltOyun);
  } else if (DOKU_MATERYAL[aktifAltOyun]) {
    soru = dokuMateryalSorusuUret(aktifAltOyun);
  } else if (SIRA_DIZILIM[aktifAltOyun]) {
    soru = siraDizilimSorusuUret(aktifAltOyun);
  }
  
  if (!soru) {
    console.error("❌ Soru üretilemedi:", aktifAltOyun);
    return;
  }
  
  soruStart = performance.now();
  
  // Hedef alanı göster
  const hedef = document.getElementById("hedefKutu");
  const hedefIcerik = document.getElementById("hedefIcerik");
  
  console.log("🔍 Soru tipi kontrolü:", {
    tip: soru.tip,
    ustResim: soru.ustResim,
    kalinlik: soru.ustResim?.kalinlik,
    uzunluk: soru.ustResim?.uzunluk,
    boyut: soru.ustResim?.boyut
  });
  
  if (hedef && hedefIcerik) {
    if (soru.tip === "renk") {
      // Zemin rengi ve yazı rengi göster
      const rastgeleSahne = RENK_SAHNELERI[Math.floor(Math.random() * RENK_SAHNELERI.length)];
      hedef.style.backgroundColor = soru.hedef.kod;
      hedefIcerik.textContent = rastgeleSahne.yazi;
      hedefIcerik.style.color = rastgeleSahne.yaziKod;
      hedefIcerik.style.fontSize = "32px";
      hedefIcerik.style.fontWeight = "bold";
      // Yazı rengini soru objesine kaydet (cevap kontrolü için)
      soru.yaziRenk = rastgeleSahne.yazi;
    } else if (soru.tip === "yon" && soru.yonergesiz) {
      // Sağ-Sol için: Üstte ok resmi göster
      console.log("🎯 Sağ-Sol üst resim oluşturuluyor...");
      console.log("🔍 Soru hedef:", soru.hedef);
      
      hedef.style.backgroundColor = "#f4f6fb";
      hedef.style.display = "flex";
      hedef.style.alignItems = "center";
      hedef.style.justifyContent = "center";
      hedef.style.minHeight = "120px";
      hedef.style.padding = "15px";
      
      // Ok emojisini göster
      hedefIcerik.innerHTML = "";
      hedefIcerik.textContent = soru.hedef.emoji || "➡️";
      hedefIcerik.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
        font-size: 80px !important;
        color: #1b2d4a !important;
        text-shadow: none !important;
        transform: none !important;
      `;
      console.log("✅ Sağ-Sol ok resmi gösterildi:", soru.hedef.emoji);
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.kalinlik) {
      // İnce-Kalın için: Üstte ince resim göster - SVG ile gerçekçi
      // ÖNCE KALINLIK KONTROLÜ YAPILMALI (diğer boyut kontrollerinden önce)
      console.log("🎯 İnce-Kalın üst resim oluşturuluyor...");
      console.log("🔍 Soru tipi:", soru.tip);
      console.log("🔍 Soru ustResim:", soru.ustResim);
      console.log("🔍 Soru ustResim.kalinlik:", soru.ustResim?.kalinlik);
      console.log("🔍 Soru ustResim.nesneTipi:", soru.ustResim?.nesneTipi);
      
      // Hedef kutu stilleri - GÖRÜNÜR OLMALI
      hedef.style.cssText = `
        background-color: #f4f6fb !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: visible !important;
        min-height: 120px !important;
        padding: 15px !important;
        border: 3px solid #4a90e2 !important;
        border-radius: 12px !important;
        width: 260px !important;
        height: 120px !important;
        margin: 30px auto 20px !important;
      `;
      
      // SVG ile gerçekçi görsel
      const nesneTipi = soru.ustResim.nesneTipi;
      const kalinlik = soru.ustResim.kalinlik;
      
      console.log("🔍 Üst resim bilgileri:", { nesneTipi, kalinlik, ustResim: soru.ustResim });
      
      // Önce mevcut içeriği ve class'ları tamamen temizle
      hedefIcerik.innerHTML = "";
      hedefIcerik.textContent = "";
      hedefIcerik.className = ""; // renkYazi class'ını kaldır
      
      // Tüm stilleri sıfırla ve yeni stiller uygula
      hedefIcerik.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        color: transparent !important;
        text-shadow: none !important;
        position: relative !important;
        font-size: 0 !important;
      `;
      
      // ÖNCE TEST SVG'SİNİ GÖSTER - GARANTİLİ GÖRÜNSÜN
      let svgContent = testSVG();
      console.log("🔍 Test SVG kullanılıyor (garantili görünürlük için)");
      
      // Sonra gerçek SVG'yi oluştur
      const gercekSVG = nesneSVG(nesneTipi, kalinlik);
      if (gercekSVG && gercekSVG.trim() !== "") {
        svgContent = gercekSVG;
        console.log("✅ Gerçek SVG oluşturuldu");
      } else {
        console.warn("⚠️ Gerçek SVG oluşturulamadı, test SVG kullanılıyor");
      }
      
      console.log("🔍 SVG içeriği uzunluğu:", svgContent ? svgContent.length : 0);
      
      // SVG'yi direkt ekle
      hedefIcerik.innerHTML = svgContent.trim();
      console.log("✅ SVG içerik eklendi");
      
      // Hemen SVG elementini bul ve stillendir
      const svgElement = hedefIcerik.querySelector("svg");
      if (svgElement) {
        console.log("✅ SVG elementi bulundu, stillendiriliyor...");
        // SVG'yi container'a sığdır ve ince göster
        svgElement.style.cssText = `
          width: 120px !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: 100% !important;
          transform: scaleY(0.4) !important;
          transform-origin: center center !important;
          display: block !important;
          margin: 0 auto !important;
          overflow: visible !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 1 !important;
        `;
        console.log("✅ SVG elementi stillendirildi");
      } else {
        console.error("❌ SVG elementi bulunamadı!");
        console.error("hedefIcerik.innerHTML uzunluğu:", hedefIcerik.innerHTML.length);
        console.error("hedefIcerik.innerHTML:", hedefIcerik.innerHTML);
        // Fallback: Text göster
        hedefIcerik.textContent = "SVG YOK";
        hedefIcerik.style.color = "#ff0000";
        hedefIcerik.style.fontSize = "24px";
      }
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.uzunluk) {
      // Uzun-Kısa için: Üstte kısa resim göster
      hedef.style.backgroundColor = "#f4f6fb";
      hedefIcerik.textContent = soru.ustResim.emoji;
      hedefIcerik.style.color = "#1b2d4a";
      hedefIcerik.style.fontSize = "48px";
      // Kısa görünmesi için CSS ekle (scaleX ile daralt)
      hedefIcerik.style.transform = "scaleX(0.6) scaleY(1)";
      hedefIcerik.style.display = "inline-block";
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.boyut) {
      // Büyük-Küçük için: Üstte küçük resim göster
      hedef.style.backgroundColor = "#f4f6fb";
      hedefIcerik.textContent = soru.ustResim.emoji;
      hedefIcerik.style.color = "#1b2d4a";
      hedefIcerik.style.fontSize = "48px";
      // Küçük görünmesi için CSS ekle
      hedefIcerik.style.transform = "scale(0.6)";
      hedefIcerik.style.display = "inline-block";
    } else if (soru.tip === "sira_dizilim") {
      // Sıra/dizilim için tüm dizilimi göster
      hedef.style.backgroundColor = "#f4f6fb";
      hedefIcerik.innerHTML = soru.dizilimGosterim || (soru.hedef.emoji + " " + soru.hedef.ad);
      hedefIcerik.style.color = "#1b2d4a";
      hedefIcerik.style.fontSize = "24px";
    } else {
      hedef.style.backgroundColor = "#f4f6fb";
      hedefIcerik.textContent = soru.hedef.emoji || soru.hedef.ad;
      hedefIcerik.style.color = "#1b2d4a";
      hedefIcerik.style.fontSize = "48px";
      // Transform'u sıfırla
      hedefIcerik.style.transform = "none";
      hedefIcerik.style.display = "block";
    }
  }
  
  // Seçenekleri göster
  const alan = document.getElementById("secenekAlani");
  if (!alan) return;
  
  alan.innerHTML = "";
  
  // Seçenek sayısına göre container'a class ekle (responsive için)
  alan.className = "secenek-container";
  if (soru.secenekler.length === 2) {
    alan.classList.add("secenek-2");
  } else if (soru.secenekler.length === 3) {
    alan.classList.add("secenek-3");
  } else if (soru.secenekler.length === 4) {
    alan.classList.add("secenek-4");
  }
  
  soru.secenekler.forEach(secenek => {
    const btn = document.createElement("button");
    btn.className = "renk-btn";
    
    if (soru.tip === "renk") {
      btn.style.backgroundColor = secenek.kod;
      btn.textContent = secenek.ad;
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.boyut) {
      // Büyük-Küçük için: Seçenekleri emoji olarak göster, boyutlarına göre ölçekle
      btn.style.backgroundColor = "#4a90e2";
      let emojiBoyut = "48px";
      let transform = "scale(1)";
      
      if (secenek.boyut === "buyuk") {
        emojiBoyut = "64px";
        transform = "scale(1.2)";
      } else if (secenek.boyut === "orta") {
        emojiBoyut = "40px";
        transform = "scale(0.8)";
      } else if (secenek.boyut === "kucuk" || secenek.boyut === "cok_kucuk") {
        emojiBoyut = "32px";
        transform = "scale(0.6)";
      }
      
      btn.innerHTML = `<div style="font-size:${emojiBoyut}; transform:${transform}; display:inline-block;">${secenek.emoji || ""}</div>`;
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.uzunluk && secenek.uzunluk) {
      // Uzun-Kısa için: Seçenekleri emoji olarak göster, uzunluklarına göre ölçekle
      btn.style.backgroundColor = "#4a90e2";
      let emojiBoyut = "48px";
      let transform = "scale(1)";
      let width = "auto";
      let height = "auto";
      
      if (secenek.uzunluk === "uzun") {
        // Uzun görünmesi için: genişlik artır, yükseklik normal
        emojiBoyut = "48px";
        transform = "scaleX(2.5) scaleY(1)";
        width = "150px";
        height = "60px";
      } else if (secenek.uzunluk === "kisa") {
        // Kısa görünmesi için: genişlik azalt, yükseklik normal
        emojiBoyut = "48px";
        transform = "scaleX(0.6) scaleY(1)";
        width = "50px";
        height = "60px";
      } else if (secenek.uzunluk === "orta") {
        // Orta görünmesi için
        emojiBoyut = "48px";
        transform = "scaleX(1.2) scaleY(1)";
        width = "80px";
        height = "60px";
      } else if (secenek.uzunluk === "cok_kisa") {
        // Çok kısa görünmesi için
        emojiBoyut = "48px";
        transform = "scaleX(0.4) scaleY(1)";
        width = "40px";
        height = "60px";
      }
      
      // Sadece emoji göster, yazı yok
      btn.innerHTML = `<div style="font-size:${emojiBoyut}; transform:${transform}; display:inline-block; width:${width}; height:${height}; line-height:${height}; overflow:hidden;">${secenek.emoji || ""}</div>`;
    } else if (soru.tip === "boyut" && soru.ustResim && soru.ustResim.kalinlik && secenek.kalinlik) {
      // İnce-Kalın için: Seçenekleri emoji olarak göster, kalınlıklarına göre ölçekle
      // Responsive boyutlandırma - ekran boyutuna göre ayarla
      const ekranGenisligi = window.innerWidth;
      const ekranYuksekligi = window.innerHeight;
      const isMobile = ekranGenisligi <= 480;
      const isTablet = ekranGenisligi > 480 && ekranGenisligi <= 1024;
      const isLarge = ekranGenisligi > 1920;
      const isLandscape = ekranYuksekligi < 600 && ekranGenisligi > ekranYuksekligi;
      
      // Base boyutları ekran boyutuna göre ayarla - daha geniş
      let baseEmojiSize = isMobile ? "52px" : isTablet ? "60px" : isLarge ? "80px" : "72px";
      let baseWidth = isMobile ? "70px" : isTablet ? "85px" : isLarge ? "110px" : "100px";
      let scaleFactor = isMobile ? 0.9 : isTablet ? 1.0 : isLarge ? 1.2 : 1.1;
      
      if (isLandscape) {
        baseEmojiSize = "44px";
        baseWidth = "60px";
        scaleFactor = 0.75;
      }
      
      btn.style.backgroundColor = "#4a90e2";
      btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      btn.style.overflow = "hidden"; // Buton overflow hidden, içerik taşmasın
      
      let emojiBoyut = baseEmojiSize;
      let transform = "scale(1)";
      let width = "auto";
      let height = "auto";
      let borderStyle = "";
      let borderRadius = "";
      let butonMinHeight = "80px";
      let butonPadding = 10; // Sayı olarak tut
      
      if (secenek.kalinlik === "kalin") {
        // Kalın görünmesi için: yükseklik artır, genişlik normal - responsive ve genişletilmiş
        emojiBoyut = baseEmojiSize;
        transform = `scaleX(1) scaleY(${3.5 * scaleFactor})`;
        width = baseWidth;
        height = isMobile ? "180px" : isTablet ? "200px" : isLarge ? "260px" : isLandscape ? "140px" : "220px";
        borderStyle = isMobile ? "2px solid #2e7d32" : "3px solid #2e7d32";
        borderRadius = isMobile ? "10px" : "12px";
        butonMinHeight = isMobile ? "200px" : isTablet ? "220px" : isLarge ? "280px" : isLandscape ? "160px" : "240px";
        butonPadding = isMobile ? 12 : 18;
      } else if (secenek.kalinlik === "ince") {
        // İnce görünmesi için: yükseklik azalt, genişlik normal - responsive
        emojiBoyut = baseEmojiSize;
        transform = `scaleX(1) scaleY(${0.35 * scaleFactor})`;
        width = baseWidth;
        height = isMobile ? "28px" : isTablet ? "32px" : isLarge ? "42px" : isLandscape ? "24px" : "35px";
        borderStyle = isMobile ? "1.5px solid #ff6b6b" : "2px solid #ff6b6b";
        borderRadius = isMobile ? "6px" : "8px";
        butonMinHeight = "80px";
        butonPadding = 10;
      } else if (secenek.kalinlik === "orta") {
        // Orta görünmesi için - responsive
        emojiBoyut = baseEmojiSize;
        transform = `scaleX(1) scaleY(${1.5 * scaleFactor})`;
        width = baseWidth;
        height = isMobile ? "80px" : isTablet ? "90px" : isLarge ? "120px" : isLandscape ? "60px" : "100px";
        borderStyle = isMobile ? "1.5px solid #ffa726" : "2px solid #ffa726";
        borderRadius = isMobile ? "8px" : "10px";
        butonMinHeight = isMobile ? "100px" : isTablet ? "110px" : isLarge ? "140px" : isLandscape ? "80px" : "120px";
        butonPadding = 10;
      } else if (secenek.kalinlik === "cok_ince") {
        // Çok ince görünmesi için - responsive
        emojiBoyut = baseEmojiSize;
        transform = `scaleX(1) scaleY(${0.25 * scaleFactor})`;
        width = baseWidth;
        height = isMobile ? "20px" : isTablet ? "22px" : isLarge ? "30px" : isLandscape ? "18px" : "25px";
        borderStyle = isMobile ? "1px solid #e57373" : "2px solid #e57373";
        borderRadius = isMobile ? "4px" : "6px";
        butonMinHeight = "80px";
        butonPadding = 10;
      }
      
      // Buton yüksekliğini içeriğe göre ayarla
      btn.style.minHeight = butonMinHeight;
      btn.style.height = "auto";
      btn.style.padding = `${butonPadding}px`;
      
      // SVG ile gerçekçi görsel - border ve overflow kontrolü, buton içinde kalması için
      const svgContent = nesneSVG(secenek.nesneTipi, secenek.kalinlik);
      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = `transform:${transform}; display:flex; align-items:center; justify-content:center; width:${width}; height:${height}; overflow:hidden; border:${borderStyle}; border-radius:${borderRadius}; background:rgba(255,255,255,0.1); box-shadow:0 2px 6px rgba(0,0,0,0.15); box-sizing:border-box; max-width:calc(100% - ${butonPadding * 2}px); max-height:calc(100% - ${butonPadding * 2}px);`;
      contentDiv.innerHTML = svgContent;
      btn.innerHTML = "";
      btn.appendChild(contentDiv);
    } else {
      btn.style.backgroundColor = "#4a90e2";
      btn.innerHTML = `<div style="font-size:32px;">${secenek.emoji || ""}</div><div style="font-size:14px;margin-top:5px;">${secenek.ad}</div>`;
    }
    
    btn.onclick = () => cevapVer(secenek, soru.hedef, soru.tip);
    alan.appendChild(btn);
  });
}

// ==========================================================
// 🟩 CEVAP VER
// ==========================================================
function cevapVer(secim, hedef, tip) {
  const tepki = Math.round(performance.now() - soruStart);
  
  let dogruMu = false;
  
  if (tip === "renk") {
    dogruMu = secim.ad === hedef.ad;
  } else if (tip === "boyut" && hedef.uzunluk && secim.uzunluk) {
    // Uzun-Kısa için: Üstteki resimden daha uzun olan doğru cevap
    // hedef her zaman "uzun" olacak (üstteki resimden daha uzun)
    // Seçilen seçeneğin uzunluk değeri "uzun" olmalı
    dogruMu = secim.uzunluk === "uzun";
    
    // Debug: Koltuk sırası için özel kontrol
    if (secim.ad && (secim.ad.includes("Koltuk") || secim.ad.includes("Kanepe"))) {
      console.log("🔍 Koltuk Sırası Kontrolü:", {
        secimAd: secim.ad,
        secimUzunluk: secim.uzunluk,
        hedefAd: hedef.ad,
        hedefUzunluk: hedef.uzunluk,
        dogruMu: dogruMu
      });
    }
  } else if (tip === "boyut" && hedef.kalinlik && secim.kalinlik) {
    // İnce-Kalın için: Üstteki resimden daha kalın olan doğru cevap
    // hedef her zaman "kalin" olacak (üstteki resimden daha kalın)
    // Seçilen seçeneğin kalınlık değeri "kalin" olmalı
    dogruMu = secim.kalinlik === "kalin";
  } else if (tip === "sayi" && hedef.tip) {
    // Çift-Tek kontrolü
    if (hedef.tip === "cift") {
      dogruMu = secim.deger % 2 === 0 && secim.deger === hedef.deger;
    } else if (hedef.tip === "tek") {
      dogruMu = secim.deger % 2 === 1 && secim.deger === hedef.deger;
    } else {
      dogruMu = secim.deger === hedef.deger;
    }
  } else if (tip === "mantiksal") {
    // Mantıksal ayırt etme için özel kontrol
    dogruMu = secim.deger === hedef.deger;
  } else if (tip === "sira_dizilim") {
    // Sıra/dizilim için özel kontrol
    dogruMu = secim.deger === hedef.deger;
  } else {
    dogruMu = secim.deger === hedef.deger;
  }
  
  if (dogruMu) {
    dogruSes.currentTime = 0;
    dogruSes.play();
  } else {
    yanlisSes.currentTime = 0;
    yanlisSes.play();
  }
  
  // Hata türü analizi
  let hataTuru = null;
  if (!dogruMu) {
    if (tepki < 300) {
      hataTuru = "impulsivite";
    } else if (tepki >= 800) {
      hataTuru = "dikkatsizlik";
    } else {
      hataTuru = "karistirma";
    }
  }
  
  const zorlukSeviyesi = secenekSayisi === 2 ? "Kolay" : 
                         secenekSayisi === 3 ? "Orta" : "Zor";
  
  // GAME ENGINE Trial Kaydı
  engine.recordTrial({
    correct: dogruMu,
    reaction_ms: tepki,
    hedef: tip === "renk" ? hedef.ad : hedef.deger,
    secim: tip === "renk" ? secim.ad : secim.deger,
    soruTipi: tip,
    altOyun: aktifAltOyun,
    kategori: aktifKategori,
    soruBaslamaZamani: soruStart,
    cevapZamani: performance.now(),
    zorlukSeviyesi: zorlukSeviyesi,
    secenekSayisi: secenekSayisi,
    hataTuru: hataTuru,
    oyunBaslangicZamani: oyunBaslangicZamani
  });
  
  yeniSoru();
}

// ==========================================================
// Dışarıya endGame aç
// ==========================================================
window.endGame = () => engine.endGame();
