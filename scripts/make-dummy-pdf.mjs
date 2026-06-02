// Membuat PDF dummy multi-halaman untuk menguji flip book.
// Jalankan: node scripts/make-dummy-pdf.mjs
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFileSync } from "node:fs";

const navy = rgb(0.122, 0.22, 0.392); // #1F3864
const gold = rgb(0.957, 0.635, 0.118); // #F4A21E
const white = rgb(1, 1, 1);

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.HelveticaBold);
const body = await doc.embedFont(StandardFonts.Helvetica);

const W = 420;
const H = 594; // rasio ~A4

function page(title, lines, isCover = false) {
  const p = doc.addPage([W, H]);
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: isCover ? navy : white });
  if (isCover) {
    p.drawRectangle({ x: 40, y: H - 120, width: 80, height: 6, color: gold });
    p.drawText("RUTAN KELAS IIA", { x: 40, y: H - 170, size: 14, font, color: gold });
    p.drawText("BALIKPAPAN", { x: 40, y: H - 190, size: 14, font, color: gold });
    p.drawText(title, { x: 40, y: H - 260, size: 26, font, color: white, lineHeight: 30 });
    p.drawText("(Dokumen contoh untuk pengujian)", { x: 40, y: 60, size: 10, font: body, color: gold });
  } else {
    p.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: navy });
    p.drawText(title, { x: 40, y: H - 45, size: 16, font, color: white });
    let y = H - 110;
    for (const line of lines) {
      p.drawText(line, { x: 40, y, size: 11, font: body, color: navy, maxWidth: W - 80, lineHeight: 16 });
      y -= 26;
    }
    p.drawRectangle({ x: 40, y: 40, width: W - 80, height: 2, color: gold });
  }
  return p;
}

page("Panduan Layanan\nKunjungan", [], true);
page("Syarat Kunjungan", [
  "1. Membawa kartu identitas asli yang masih berlaku.",
  "2. Mengisi buku tamu di loket pendaftaran.",
  "3. Mematuhi jam layanan kunjungan yang berlaku.",
  "4. Tidak membawa barang terlarang ke dalam area.",
]);
page("Jam Layanan", [
  "Senin - Kamis : 09.00 - 12.00 WITA",
  "Jumat         : 09.00 - 11.00 WITA",
  "Sabtu - Minggu: Libur",
  "",
  "Mohon hadir 30 menit sebelum jam layanan.",
]);
page("Titipan Barang", [
  "1. Barang diperiksa petugas sebelum diterima.",
  "2. Makanan harus dalam kemasan tertutup.",
  "3. Dilarang menitipkan uang tunai melebihi batas.",
  "4. Petugas berhak menolak barang tidak sesuai aturan.",
]);
page("Terima Kasih", [
  "Terima kasih telah mematuhi panduan layanan",
  "Rutan Kelas IIA Balikpapan.",
  "",
  "Bangga Melayani Bangsa.",
]);

const bytes = await doc.save();
writeFileSync("public/dummy-panduan.pdf", bytes);
console.log("OK -> public/dummy-panduan.pdf", bytes.length, "bytes");
