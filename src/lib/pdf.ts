"use client";

import { pdfjs } from "react-pdf";

// Worker pdf.js dilayani dari /public (offline-friendly, tanpa CDN).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export { pdfjs };

/**
 * Membuat gambar cover (PNG) dari halaman pertama sebuah file PDF.
 * Dipakai saat admin mengunggah panduan agar grid publik tampil cepat
 * tanpa perlu merender PDF di setiap kartu.
 */
export async function generateCoverFromPdf(
  file: File,
  maxWidth = 600,
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context tidak tersedia.");

  await page.render({ canvasContext: context, viewport }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Gagal membuat cover.")),
      "image/png",
    );
  });
}
