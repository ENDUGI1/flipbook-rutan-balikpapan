import AdminHeader from "@/components/admin/AdminHeader";
import PanduanManager from "@/components/admin/PanduanManager";
import StatistikPanel from "@/components/admin/StatistikPanel";
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

  // Seluruh log diambil SEKALI di sini. Pemfilteran periode dilakukan di
  // browser (StatistikPanel) agar pergantian periode instan tanpa request ulang.
  const { data: logs } = await supabase
    .from("akses_log")
    .select("panduan_id, dibuka_pada")
    .order("dibuka_pada", { ascending: true });

  return (
    <div className="min-h-screen bg-navy-50 pb-12">
      <AdminHeader email={user?.email} />

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        <StatistikPanel
          logs={logs ?? []}
          panduan={panduan.map((p) => ({
            id: p.id,
            judul: p.judul,
            is_active: p.is_active,
          }))}
        />

        {/* Kelola panduan */}
        <PanduanManager items={panduan} />
      </main>
    </div>
  );
}
