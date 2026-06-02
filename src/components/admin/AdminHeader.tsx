"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminHeader({ email }: { email?: string | null }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-navy-100 bg-navy">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-kementerian.png"
            alt="Logo Kementerian"
            width={36}
            height={36}
          />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-white">
              Dashboard Admin
            </p>
            <p className="text-[11px] text-navy-100/80">
              Rutan Kelas IIA Balikpapan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-xs text-navy-100/80 sm:inline">
              {email}
            </span>
          )}
          <button
            onClick={logout}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
