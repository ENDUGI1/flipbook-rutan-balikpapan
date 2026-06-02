import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PanduanGrid from "@/components/PanduanGrid";
import { createClient } from "@/lib/supabase/server";
import type { Panduan } from "@/lib/types";

// Selalu ambil data terbaru (panduan bisa berubah dari dashboard admin).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("panduan")
    .select("*")
    .eq("is_active", true)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: true });

  const panduan = (data ?? []) as Panduan[];

  return (
    <div className="min-h-screen bg-navy-50">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-navy">
          Daftar Panduan
        </h2>
        <PanduanGrid panduan={panduan} />
      </main>
      <PublicFooter />
    </div>
  );
}
