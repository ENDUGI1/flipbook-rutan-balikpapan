import type { Metadata, Viewport } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";

// Titillium Web dipakai untuk judul & teks isi (font sans bersih, berkesan resmi).
// Variabel --font-display di-alias ke --font-body di globals.css.
const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Informasi Layanan — Rutan Kelas IIA Balikpapan",
  description:
    "Panduan layanan kunjungan dan titipan barang Rumah Tahanan Negara Kelas IIA Balikpapan dalam bentuk flip book.",
};

export const viewport: Viewport = {
  themeColor: "#1F3864",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={titillium.variable}>
      <body>{children}</body>
    </html>
  );
}
