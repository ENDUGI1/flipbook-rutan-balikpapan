"use client";

/**
 * ID sesi anonim untuk mencatat akses panduan.
 * Bukan data pribadi — hanya uuid acak yang disimpan di localStorage browser
 * agar kunjungan berulang dari perangkat yang sama bisa dibedakan.
 */
const KEY = "rutan_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

/** Deteksi jenis perangkat secara sederhana (mobile / tablet / desktop). */
export function getDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}
