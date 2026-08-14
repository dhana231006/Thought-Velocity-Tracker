const QRCode = require('qrcode');

const url = 'exp://10.207.238.48:8081';
const outputPath = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\013b42dc-06d7-4671-9eb6-83133785e0ef\\expo-qr-2.png';

QRCode.toFile(outputPath, url, {
  color: {
    dark: '#000000',  // Blue dots
    light: '#0000' // Transparent background
  }
}, function (err) {
  if (err) throw err;
  console.log('QR code saved to ' + outputPath);
});
