/* eslint-disable @typescript-eslint/no-require-imports */
// Genera iconos PWA de Carwash desde un SVG (usa sharp, ya instalado)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#134e4a"/>
    </linearGradient>
    <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2dd4bf"/>
      <stop offset="1" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- burbujas -->
  <circle cx="120" cy="110" r="26" fill="#2dd4bf" opacity="0.25"/>
  <circle cx="400" cy="90" r="18" fill="#2dd4bf" opacity="0.3"/>
  <circle cx="420" cy="200" r="34" fill="#2dd4bf" opacity="0.15"/>
  <!-- carro -->
  <path d="M96 330 L130 250 Q140 226 168 226 L344 226 Q372 226 382 250 L416 330 L416 372 Q416 386 402 386 L110 386 Q96 386 96 372 Z" fill="url(#agua)"/>
  <path d="M150 252 L190 252 L190 300 L128 300 Z" fill="#0f172a" opacity="0.55"/>
  <path d="M216 252 L296 252 L296 300 L216 300 Z" fill="#0f172a" opacity="0.55"/>
  <path d="M322 252 L362 252 L384 300 L322 300 Z" fill="#0f172a" opacity="0.55"/>
  <circle cx="160" cy="386" r="34" fill="#0f172a"/>
  <circle cx="160" cy="386" r="16" fill="#94a3b8"/>
  <circle cx="352" cy="386" r="34" fill="#0f172a"/>
  <circle cx="352" cy="386" r="16" fill="#94a3b8"/>
  <!-- destellos de limpieza -->
  <path d="M256 60 l10 26 26 10 -26 10 -10 26 -10 -26 -26 -10 26 -10 Z" fill="#fbbf24"/>
  <path d="M120 400 l7 18 18 7 -18 7 -7 18 -7 -18 -18 -7 18 -7 Z" fill="#2dd4bf" opacity="0.8"/>
</svg>`;

(async () => {
  const dir = path.join(process.cwd(), 'public', 'icons');
  fs.mkdirSync(dir, { recursive: true });
  for (const size of [192, 512]) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(dir, `icon-${size}.png`));
    console.log(`icon-${size}.png generado`);
  }
  // favicon
  await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(path.join(dir, 'icon-64.png'));
  console.log('listo');
})();
