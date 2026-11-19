import gamingKeyboardImage from "./assets/gaming-keyboard.svg";

const productArt = {
  "Wireless Headphones": ["🎧", "#0f766e", "#164e63"],
  "Smart Watch": ["⌚", "#7c3aed", "#312e81"],
  "Running Shoes": ["👟", "#ea580c", "#9a3412"],
  "Travel Backpack": ["🎒", "#15803d", "#14532d"],
  "Gaming Keyboard": ["⌨️", "#7c3aed", "#1e1b4b"],
  "Gaming Mouse": ["🖱️", "#2563eb", "#1e3a8a"],
  "Gaming Headset": ["🎧", "#db2777", "#831843"],
  "Gaming Monitor": ["🖥️", "#0891b2", "#164e63"],
  "USB-C Hub": ["🔌", "#475569", "#0f172a"],
  "Bluetooth Speaker": ["🔊", "#ca8a04", "#713f12"],
  "Portable SSD": ["💾", "#4f46e5", "#312e81"],
  "Adjustable Laptop Stand": ["💻", "#64748b", "#1e293b"],
  "HD Webcam": ["📷", "#0f766e", "#134e4a"],
  "Power Bank": ["🔋", "#16a34a", "#14532d"],
  "Protective Phone Case": ["📱", "#db2777", "#831843"],
  "LED Desk Lamp": ["💡", "#d97706", "#78350f"],
  "Insulated Water Bottle": ["🧴", "#0284c7", "#1e3a8a"],
  "Non-Slip Yoga Mat": ["🧘", "#9333ea", "#581c87"],
  "Cotton T-Shirt": ["👕", "#2563eb", "#1e40af"],
  "Classic Denim Jeans": ["👖", "#1d4ed8", "#1e3a8a"],
  "Leather Wallet": ["👛", "#92400e", "#451a03"],
  "Classic Sunglasses": ["🕶️", "#475569", "#111827"],
  "Drip Coffee Maker": ["☕", "#b45309", "#451a03"],
  "Ceramic Coffee Mug": ["☕", "#be123c", "#881337"],
  "Fitness Tracker": ["🏃", "#059669", "#064e3b"]
};

function createProductImage(name, [icon, startColor, endColor]) {
  const image = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${startColor}"/>
          <stop offset="1" stop-color="${endColor}"/>
        </linearGradient>
        <radialGradient id="spotlight">
          <stop stop-color="#ffffff" stop-opacity=".24"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#background)"/>
      <circle cx="610" cy="145" r="245" fill="url(#spotlight)"/>
      <circle cx="140" cy="510" r="220" fill="url(#spotlight)"/>
      <path d="M0 470 Q200 390 400 470 T800 450 V600 H0Z" fill="#020617" fill-opacity=".16"/>
      <text x="400" y="350" text-anchor="middle" font-size="190" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${icon}</text>
      <text x="400" y="520" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="34" font-weight="700">${name}</text>
      <text x="400" y="558" text-anchor="middle" fill="#fff" fill-opacity=".72" font-family="Arial, sans-serif" font-size="16" letter-spacing="5">NOVASHOP • FEATURED PRODUCT</text>
    </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(image)}`;
}

export function getProductImageUrl(product) {
  if (product.name === "Gaming Keyboard") return gamingKeyboardImage;

  const art = productArt[product.name];
  return art ? createProductImage(product.name, art) : product.imageUrl;
}
