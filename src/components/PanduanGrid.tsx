"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { Panduan } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getDevice, getSessionId } from "@/lib/session";

// Viewer dimuat hanya di browser (react-pageflip & pdf.js butuh API browser).
const FlipBookViewer = dynamic(() => import("./FlipBookViewer"), {
  ssr: false,
});

export default function PanduanGrid({ panduan }: { panduan: Panduan[] }) {
  const [selected, setSelected] = useState<Panduan | null>(null);

  async function buka(p: Panduan) {
    if (!p.file_url) return;
    setSelected(p);
    // Catat akses (anonim) — gagal-diam agar tidak mengganggu pengunjung.
    try {
      const supabase = createClient();
      await supabase.from("akses_log").insert({
        panduan_id: p.id,
        session_id: getSessionId(),
        device: getDevice(),
      });
    } catch {
      /* abaikan */
    }
  }

  if (panduan.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-navy-700/70 shadow-card">
        Belum ada panduan yang tersedia saat ini.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {panduan.map((p) => (
          <button
            key={p.id}
            onClick={() => buka(p)}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-card transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-100">
              {p.cover_url ? (
                <Image
                  src={p.cover_url}
                  alt={`Cover ${p.judul}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy-600 to-navy-800 p-3 text-center">
                  <span className="font-display text-sm text-white/90">
                    {p.judul}
                  </span>
                </div>
              )}
              {p.jenis && (
                <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-900">
                  {p.jenis}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="font-display text-sm font-semibold leading-snug text-navy line-clamp-2">
                {p.judul}
              </h3>
              {p.deskripsi && (
                <p className="mt-1 text-xs leading-relaxed text-navy-700/70 line-clamp-2">
                  {p.deskripsi}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold-600">
                Buka panduan ›
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected?.file_url && (
        <FlipBookViewer
          fileUrl={selected.file_url}
          judul={selected.judul}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
