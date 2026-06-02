import AdminHeader from "@/components/admin/AdminHeader";
import PanduanManager from "@/components/admin/PanduanManager";
import DailyTrendChart, {
  type TrendPoint,
} from "@/components/admin/DailyTrendChart";
import { createClient } from "@/lib/supabase/server";
import type { Panduan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();

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

  // Total akses keseluruhan.
  const { count: totalView } = await supabase
    .from("akses_log")
    .select("*", { count: "exact", head: true });

  // Ambil log untuk agregasi (per panduan & tren harian).
  const { data: logs } = await supabase
    .from("akses_log")
    .select("panduan_id, dibuka_pada");

  // --- View per panduan ---
  const perPanduan = new Map<string, number>();
  for (const row of logs ?? []) {
    if (!row.panduan_id) continue;
    perPanduan.set(row.panduan_id, (perPanduan.get(row.panduan_id) ?? 0) + 1);
  }
  const tabelView = panduan
    .map((p) => ({ judul: p.judul, jumlah: perPanduan.get(p.id) ?? 0 }))
    .sort((a, b) => b.jumlah - a.jumlah);

  // --- Tren 14 hari terakhir ---
  const hari = 14;
  const trend: TrendPoint[] = [];
  const byDay = new Map<string, number>();
  for (const row of logs ?? []) {
    const key = row.dibuka_pada.slice(0, 10); // YYYY-MM-DD
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  for (let i = hari - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({
      tanggal: `${d.getDate()}/${d.getMonth() + 1}`,
      jumlah: byDay.get(key) ?? 0,
    });
  }

  const panduanAktif = panduan.filter((p) => p.is_active).length;

  return (
    <div className="min-h-screen bg-navy-50 pb-12">
      <AdminHeader email={user?.email} />

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        {/* Kartu ringkasan */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total Panduan Dibuka" value={totalView ?? 0} accent />
          <StatCard label="Jumlah Panduan" value={panduan.length} />
          <StatCard label="Panduan Aktif" value={panduanAktif} />
        </section>

        {/* Grafik tren */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-1 font-display text-lg font-semibold text-navy">
            Tren Akses Harian
          </h2>
          <p className="mb-4 text-xs text-navy-700/60">
            Jumlah panduan dibuka per hari (14 hari terakhir).
          </p>
          <DailyTrendChart data={trend} />
        </section>

        {/* Tabel view per panduan */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy">
            View per Panduan
          </h2>
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
