"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk dipakai di komponen browser (Client Components).
 * Memakai anon key — aman karena seluruh akses dibatasi oleh RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
