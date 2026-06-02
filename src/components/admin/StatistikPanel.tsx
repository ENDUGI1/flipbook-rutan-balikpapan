"use client";

import { useMemo, useState } from "react";
import DailyTrendChart, { type TrendPoint } from "./DailyTrendChart";

const OPSI = [
  { key: "7", label: "7 hari" },
  { key: "30", label: "30 hari" },
  { key: "90", label: "90 hari" },
  { key: "365", label: "1 tahun" },
  { key: "all", label: "Semua" },
] as const;

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

type LogRow = { panduan_id: string | null; dibuka_pada: string };
type PanduanRingkas = { id: string; judul: string; is_active: boolean };

/**
 * Panel statistik dengan filter periode INSTAN.
 * Seluruh log diambil sekali dari server (props `logs`), lalu pemfilteran
 * periode dihitung di browser via useMemo — tidak ada request ulang saat
 * tombol periode diganti.
 */
export default function StatistikPanel({
  logs,
  panduan,
}: {
  logs: LogRow[];
  panduan: PanduanRingkas[];
}) {
  const [periode, setPeriode] = useState<string>("30");

  const labelPeriode = OPSI.find((o) => o.key === periode)?.label ?? "30 hari";
  const monthly = periode === "365" || periode === "all";

  const { logsPeriode, tabelView, trend } = useMemo(() => {
    // Filter berdasarkan periode.
    let start: Date | null = null;
    if (periode !== "all") {
      start = new Date();
      start.setDate(start.getDate() - Number(periode));
    }
    const lp = start
      ? logs.filter((r) => new Date(r.dibuka_pada) >= start!)
      : logs;

    // View per panduan.
    const per = new Map<string, number>();
    for (const r of lp) {
      if (!r.panduan_id) continue;
      per.set(r.panduan_id, (per.get(r.panduan_id) ?? 0) + 1);
    }
    const tabel = panduan
      .map((p) => ({ judul: p.judul, jumlah: per.get(p.id) ?? 0 }))
      .sort((a, b) => b.jumlah - a.jumlah);

    // Tren (harian / bulanan).
    const t: TrendPoint[] = [];
    if (!monthly) {
      const byDay = new Map<string, number>();
      for (const r of lp) {
        const k = r.dibuka_pada.slice(0, 10);
        byDay.set(k, (byDay.get(k) ?? 0) + 1);
      }
      const hari = Number(periode);
      for (let i = hari - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        t.push({
          tanggal: `${d.getDate()}/${d.getMonth() + 1}`,
          jumlah: byDay.get(d.toISOString().slice(0, 10)) ?? 0,
        });
      }
    } else {
      const byMonth = new Map<string, number>();
      let earliest: Date | null = null;
      for (const r of lp) {
        const k = r.dibuka_pada.slice(0, 7);
        byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
        const d = new Date(r.dibuka_pada);
        if (!earliest || d < earliest) earliest = d;
      }
      const now = new Date();
      let cursor =
        periode === "365"
          ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
          : new Date(
              (earliest ?? now).getFullYear(),
              (earliest ?? now).getMonth(),
              1,
            );
      while (cursor <= now) {
        const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        t.push({
          tanggal: `${BULAN[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
          jumlah: byMonth.get(k) ?? 0,
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    }

    return { logsPeriode: lp, tabelView: tabel, trend: t };
  }, [periode, monthly, logs, panduan]);

  const panduanAktif = panduan.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Pemilih periode */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-xl font-semibold text-navy">
          Statistik
        </h1>
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-navy-100/60 p-1">
          {OPSI.map((o) => (
            <button
              key={o.key}
              onClick={() => setPeriode(o.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                o.key === periode
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy-700 hover:bg-white/70"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kartu ringkasan */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label={`Dibuka (${labelPeriode})`}
          value={logsPeriode.length}
          accent
        />
        <StatCard label="Total Sepanjang Masa" value={logs.length} />
        <StatCard label="Panduan Aktif" value={panduanAktif} />
      </section>

      {/* Grafik tren */}
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          Tren Akses
        </h2>
        <p className="mb-4 text-xs text-navy-700/60">
          {monthly
            ? `Jumlah panduan dibuka per bulan (${labelPeriode}).`
            : `Jumlah panduan dibuka per hari (${labelPeriode} terakhir).`}
        </p>
        <DailyTrendChart data={trend} />
      </section>

      {/* Tabel view per panduan */}
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-semibold text-navy">
          View per Panduan
        </h2>
        <p className="mb-4 text-xs text-navy-700/60">Periode: {labelPeriode}.</p>
        {tabelView.length === 0 ? (
          <p className="py-6 text-center text-sm text-navy-700/60">
            Belum ada panduan.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-700/60">
                <th className="pb-2 font-medium">Panduan</th>
                <th className="pb-2 text-right font-medium">Dibuka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {tabelView.map((row, i) => (
                <tr key={i}>
                  <td className="py-2.5 pr-3 text-navy">{row.judul}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-navy">
                    {row.jumlah}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-card ${
        accent ? "bg-navy text-white" : "bg-white text-navy"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          accent ? "text-navy-100/80" : "text-navy-700/60"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
