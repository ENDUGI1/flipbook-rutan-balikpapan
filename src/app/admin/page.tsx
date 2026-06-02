import AdminHeader from "@/components/admin/AdminHeader";
import PanduanManager from "@/components/admin/PanduanManager";
import DailyTrendChart, {
  type TrendPoint,
} from "@/components/admin/DailyTrendChart";
import PeriodeSelector, {
  OPSI_PERIODE,
} from "@/components/admin/PeriodeSelector";
import { createClient } from "@/lib/supabase/server";
import type { Panduan } from "@/lib/types";

export const dynamic = "force-dynamic";

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { periode?: string };
}) {
  const supabase = createClient();

  // Periode terpilih (default 30 hari).
  const periode = OPSI_PERIODE.some((o) => o.key === searchParams?.periode)
    ? (searchParams!.periode as string)
    : "30";
  const monthly = periode === "365" || periode === "all";
  const labelPeriode =
    OPSI_PERIODE.find((o) => o.key === periode)?.label ?? "30 hari";

  // Tanggal awal periode (null = semua waktu).
  let start: Date | null = null;
  if (periode !== "all") {
    start = new Date();
    start.setDate(start.getDate() - Number(periode));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Daftar panduan (semua, termasuk yang disembunyikan).
  const { data: panduanData } = await supabase
    .from("panduan")
    .select("*")
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });
  const panduan = (panduanData ?? []) as Panduan[];

  // Total akses SEPANJANG MASA (tidak ikut periode).
  const { count: totalSepanjangMasa } = await supabase
    .from("akses_log")
    .select("*", { count: "exact", head: true });

  // Log dalam periode terpilih (untuk grafik & tabel).
  let q = supabase.from("akses_log").select("panduan_id, dibuka_pada");
  if (start) q = q.gte("dibuka_pada", start.toISOString());
  const { data: logs } = await q;
  const logsPeriode = logs ?? [];

  // --- View per panduan (periode) ---
  const perPanduan = new Map<string, number>();
  for (const row of logsPeriode) {
    if (!row.panduan_id) continue;
    perPanduan.set(row.panduan_id, (perPanduan.get(row.panduan_id) ?? 0) + 1);
  }
  const tabelView = panduan
    .map((p) => ({ judul: p.judul, jumlah: perPanduan.get(p.id) ?? 0 }))
    .sort((a, b) => b.jumlah - a.jumlah);

  // --- Tren (granularitas menyesuaikan periode) ---
  const trend: TrendPoint[] = [];
  if (!monthly) {
    // Harian.
    const byDay = new Map<string, number>();
    for (const row of logsPeriode) {
      byDay.set(
        row.dibuka_pada.slice(0, 10),
        (byDay.get(row.dibuka_pada.slice(0, 10)) ?? 0) + 1,
      );
    }
    const hari = Number(periode);
    for (let i = hari - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend.push({
        tanggal: `${d.getDate()}/${d.getMonth() + 1}`,
        jumlah: byDay.get(d.toISOString().slice(0, 10)) ?? 0,
      });
    }
  } else {
    // Bulanan.
    const byMonth = new Map<string, number>();
    let earliest: Date | null = null;
    for (const row of logsPeriode) {
      const key = row.dibuka_pada.slice(0, 7); // YYYY-MM
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      const d = new Date(row.dibuka_pada);
      if (!earliest || d < earliest) earliest = d;
    }
    const now = new Date();
    // Mulai: 1 tahun = 12 bulan terakhir; semua = sejak log paling awal.
    let cursor =
      periode === "365"
        ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
        : new Date(
            (earliest ?? now).getFullYear(),
            (earliest ?? now).getMonth(),
            1,
          );
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      trend.push({
        tanggal: `${BULAN[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
        jumlah: byMonth.get(key) ?? 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  }

  const panduanAktif = panduan.filter((p) => p.is_active).length;

  return (
    <div className="min-h-screen bg-navy-50 pb-12">
      <AdminHeader email={user?.email} />

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        {/* Pemilih periode */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-xl font-semibold text-navy">
            Statistik
          </h1>
          <PeriodeSelector aktif={periode} />
        </div>

        {/* Kartu ringkasan */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label={`Dibuka (${labelPeriode})`}
            value={logsPeriode.length}
            accent
          />
          <StatCard
            label="Total Sepanjang Masa"
            value={totalSepanjangMasa ?? 0}
          />
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
          <p className="mb-4 text-xs text-navy-700/60">
            Periode: {labelPeriode}.
          </p>
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

        {/* Kelola panduan */}
        <PanduanManager items={panduan} />
      </main>
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
