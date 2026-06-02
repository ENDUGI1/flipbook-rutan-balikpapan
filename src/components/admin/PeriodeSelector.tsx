import Link from "next/link";

export const OPSI_PERIODE = [
  { key: "7", label: "7 hari" },
  { key: "30", label: "30 hari" },
  { key: "90", label: "90 hari" },
  { key: "365", label: "1 tahun" },
  { key: "all", label: "Semua" },
] as const;

export type PeriodeKey = (typeof OPSI_PERIODE)[number]["key"];

/** Tombol pemilih periode. Mengubah ?periode=... pada URL (server re-render). */
export default function PeriodeSelector({ aktif }: { aktif: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-navy-100/60 p-1">
      {OPSI_PERIODE.map((o) => {
        const isAktif = o.key === aktif;
        return (
          <Link
            key={o.key}
            href={`/admin?periode=${o.key}`}
            scroll={false}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isAktif
                ? "bg-navy text-white shadow-sm"
                : "text-navy-700 hover:bg-white/70"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
