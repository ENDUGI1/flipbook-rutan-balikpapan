-- Tambah kolom opsional untuk link unduh (mis. Google Drive).
-- Jika diisi, tombol "Unduh" di flip book memakai link ini (hemat egress
-- Supabase). Jika kosong, tombol memakai file PDF dari Storage.
alter table public.panduan
  add column if not exists download_url text;
