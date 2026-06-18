"use client";

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page } from "react-pdf";
import "@/lib/pdf"; // set worker pdf.js

type Props = {
  fileUrl: string;
  judul: string;
  gdriveUrl?: string | null;
  onClose: () => void;
};

/** Ubah link share Google Drive menjadi link unduh-langsung. */
function toDirectDownload(url: string): string {
  const m = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (m && url.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  }
  return url;
}

/**
 * Viewer flip book: merender setiap halaman PDF lalu menampilkannya dengan
 * efek buka halaman buku (react-pageflip). Dipakai di dalam modal layar penuh.
 */
export default function FlipBookViewer({
  fileUrl,
  judul,
  gdriveUrl,
  onClose,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageW, setPageW] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  // react-pageflip tidak menyertakan tipe untuk ref-nya.
  const bookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Hitung lebar halaman secara responsif (mobile-first: satu halaman penuh).
  useEffect(() => {
    function measure() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Sisakan ruang untuk tombol & padding.
      const byWidth = Math.min(vw - 32, 460);
      const byHeight = (vh - 180) / 1.414;
      setPageW(Math.max(240, Math.floor(Math.min(byWidth, byHeight))));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Tutup dengan tombol Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pageH = Math.floor(pageW * 1.414);
  const ready = numPages > 0 && pageW > 0;

  // URL unduh: untuk file di Supabase Storage, tambahkan ?download agar
  // berkas langsung terunduh dengan nama yang rapi (bukan dibuka di tab).
  const namaFile = `${judul.replace(/[^\w\s-]/g, "").trim() || "panduan"}.pdf`;
  // Prioritas: link Google Drive (jika diisi admin) → hemat egress Supabase.
  // Jika kosong, unduh dari Storage Supabase (pakai ?download agar rapi).
  const downloadUrl = gdriveUrl?.trim()
    ? toDirectDownload(gdriveUrl.trim())
    : fileUrl.startsWith("http")
      ? `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(namaFile)}`
      : fileUrl;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy-900/95 backdrop-blur-sm">
      {/* Bar atas */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="truncate font-display text-base font-medium sm:text-lg">
          {judul}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={downloadUrl}
            download={namaFile}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-sm font-semibold text-navy-900 transition hover:bg-gold-400"
            title="Unduh PDF"
          >
            <span className="text-base leading-none">⤓</span>
            <span className="hidden sm:inline">Unduh</span>
          </a>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Area buku */}
      <div
        ref={wrapRef}
        className="flex flex-1 items-center justify-center overflow-hidden px-2"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() =>
            setError("Gagal memuat file PDF. Periksa kembali file panduan.")
          }
          loading={<Spinner />}
          error={<Spinner />}
        >
          {error ? (
            <p className="max-w-xs text-center text-sm text-navy-100">{error}</p>
          ) : ready ? (
            // @ts-expect-error — react-pageflip menerima children sebagai halaman
            <HTMLFlipBook
              ref={bookRef}
              width={pageW}
              height={pageH}
              size="fixed"
              maxShadowOpacity={0.4}
              showCover={false}
              usePortrait
              mobileScrollSupport
              className="flipbook-shadow"
              onFlip={(e: { data: number }) => setCurrent(e.data)}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i}
                  className="overflow-hidden bg-white"
                  style={{ width: pageW, height: pageH }}
                >
                  <Page
                    pageNumber={i + 1}
                    width={pageW}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<Spinner />}
                  />
                </div>
              ))}
            </HTMLFlipBook>
          ) : (
            <Spinner />
          )}
        </Document>
      </div>

      {/* Navigasi bawah */}
      {ready && !error && (
        <div className="flex items-center justify-center gap-4 px-4 py-4 text-white">
          <button
            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            ‹ Sebelumnya
          </button>
          <span className="min-w-[64px] text-center text-sm tabular-nums text-navy-100">
            {current + 1} / {numPages}
          </span>
          <button
            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gold-400"
          >
            Selanjutnya ›
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3 text-navy-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-gold" />
      <p className="text-sm">Memuat panduan…</p>
    </div>
  );
}
