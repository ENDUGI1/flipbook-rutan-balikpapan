// Membuat QR code + poster siap cetak (PDF A4) untuk ditempel di dinding.
//
// Pakai:
//   node scripts/make-qr.mjs                       -> pakai URL default
//   node scripts/make-qr.mjs https://domain-anda   -> pakai URL sendiri
//
// Hasil:
//   public/qr-rutan.png         (gambar QR saja)
//   public/poster-qr-rutan.pdf  (poster A4 siap cetak)

import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync, writeFileSync } from "node:fs";

const url = process.argv[2] || "https://flipbook-rutan-balikpapan.vercel.app";

const navy = rgb(0.122, 0.22, 0.392); // #1F3864
const gold = rgb(0.957, 0.635, 0.118); // #F4A21E

// --- 1) QR PNG (navy, error-correction tinggi agar tahan lecet) ---
const qrPng = await QRCode.toBuffer(url, {
  errorCorrectionLevel: "H",
  margin: 1,
  width: 900,
  color: { dark: "#1F3864", light: "#FFFFFF" },
});
writeFileSync("public/qr-rutan.png", qrPng);

// --- 2) Poster A4 ---
const A4 = { w: 595, h: 842 };
const doc = await PDFDocument.create();
const page = doc.addPage([A4.w, A4.h]);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const reg = await doc.embedFont(StandardFonts.Helvetica);

const center = (text, font, size, y, color = navy) => {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (A4.w - w) / 2, y, size, font, color });
};

// Bingkai navy tipis
page.drawRectangle({
  x: 24, y: 24, width: A4.w - 48, height: A4.h - 48,
  borderColor: navy, borderWidth: 2,
});
// Pita atas
page.drawRectangle({ x: 24, y: A4.h - 150, width: A4.w - 48, height: 126, color: navy });

// Logo kementerian di pita atas
const logo = await doc.embedPng(readFileSync("public/logo-kementerian.png"));
const ls = 88 / logo.height;
page.drawImage(logo, {
  x: (A4.w - logo.width * ls) / 2, y: A4.h - 138, width: logo.width * ls, height: 88,
});

// Judul
center("INFORMASI LAYANAN", bold, 24, A4.h - 200);
center("Rumah Tahanan Negara Kelas IIA Balikpapan", reg, 13, A4.h - 222);
page.drawRectangle({ x: (A4.w - 60) / 2, y: A4.h - 240, width: 60, height: 4, color: gold });

// QR di tengah
const qrImg = await doc.embedPng(qrPng);
const qrSize = 300;
page.drawImage(qrImg, {
  x: (A4.w - qrSize) / 2, y: A4.h - 240 - qrSize - 30, width: qrSize, height: qrSize,
});

// Ajakan
const y2 = A4.h - 240 - qrSize - 70;
center("PINDAI QR DI ATAS", bold, 18, y2, gold);
center("untuk membaca panduan layanan", reg, 13, y2 - 22);
center("kunjungan & titipan barang", reg, 13, y2 - 40);

// Footer
center("Bangga Melayani Bangsa", bold, 12, 70, navy);
center(url, reg, 9, 50, navy);

writeFileSync("public/poster-qr-rutan.pdf", await doc.save());

console.log("OK");
console.log("  URL      :", url);
console.log("  QR       : public/qr-rutan.png");
console.log("  Poster   : public/poster-qr-rutan.pdf");
