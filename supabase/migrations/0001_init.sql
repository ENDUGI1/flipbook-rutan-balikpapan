-- =====================================================================
-- Media Flip Book Informasi Layanan — Rutan Kelas IIA Balikpapan
-- Migration awal: tabel, Row Level Security (RLS), Storage bucket + policy.
--
-- Urutan penting: TABEL dibuat lebih dulu, baru FUNGSI, baru POLICY,
-- karena fungsi is_admin() merujuk ke tabel profiles.
--
-- Cara pakai:
--   - Supabase Dashboard: buka SQL Editor, tempel seluruh isi file, Run.
--   - Atau Supabase CLI: `supabase db push`.
-- =====================================================================

-- Ekstensi untuk uuid (umumnya sudah aktif di Supabase).
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) TABEL
-- =====================================================================

-- profiles: satu baris per user auth. role = 'admin' artinya petugas.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user',
  created_at timestamptz not null default now()
);

-- panduan
create table if not exists public.panduan (
  id          uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  judul       text not null,
  jenis       text,
  deskripsi   text,
  file_url    text,
  cover_url   text,
  urutan      int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists panduan_aktif_idx on public.panduan (is_active, urutan);

-- akses_log: mencatat tiap kali sebuah panduan dibuka pengunjung.
-- session_id = uuid acak anonim dari localStorage (bukan data pribadi).
create table if not exists public.akses_log (
  id          uuid primary key default gen_random_uuid(),
  panduan_id  uuid references public.panduan (id) on delete cascade,
  session_id  text,
  device      text,
  dibuka_pada timestamptz not null default now()
);

create index if not exists akses_log_panduan_idx on public.akses_log (panduan_id);
create index if not exists akses_log_waktu_idx on public.akses_log (dibuka_pada);

-- =====================================================================
-- 2) FUNGSI BANTU  (tabel sudah ada di atas, jadi aman dibuat di sini)
-- =====================================================================

-- Cek apakah user adalah admin. SECURITY DEFINER agar bisa membaca
-- tabel profiles tanpa memicu rekursi RLS saat dipakai di policy.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Set kolom updated_at otomatis saat row di-update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Otomatis buat profile saat user baru mendaftar di Supabase Auth.
-- Default role = 'user'. Promosikan ke 'admin' secara manual (lihat README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =====================================================================
-- 3) TRIGGER  (fungsi sudah ada di atas)
-- =====================================================================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists panduan_set_updated_at on public.panduan;
create trigger panduan_set_updated_at
  before update on public.panduan
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4) ROW LEVEL SECURITY — nyalakan di SEMUA tabel
-- =====================================================================
alter table public.profiles  enable row level security;
alter table public.panduan   enable row level security;
alter table public.akses_log enable row level security;

-- ---------- profiles ----------
-- User boleh melihat profilnya sendiri; admin boleh melihat semua.
-- Tidak ada akses untuk anonim.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

-- ---------- panduan ----------
-- Pengunjung (anon) & user: hanya panduan aktif. Admin: semua.
drop policy if exists panduan_select on public.panduan;
create policy panduan_select on public.panduan
  for select to anon, authenticated
  using (is_active = true or public.is_admin(auth.uid()));

-- Admin: tambah / ubah / hapus panduan.
drop policy if exists panduan_insert on public.panduan;
create policy panduan_insert on public.panduan
  for insert to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists panduan_update on public.panduan;
create policy panduan_update on public.panduan
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists panduan_delete on public.panduan;
create policy panduan_delete on public.panduan
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- ---------- akses_log ----------
-- Siapa pun (termasuk anonim) boleh MENCATAT akses (INSERT saja).
drop policy if exists akses_log_insert on public.akses_log;
create policy akses_log_insert on public.akses_log
  for insert to anon, authenticated
  with check (true);

-- Hanya admin yang boleh membaca log untuk statistik.
drop policy if exists akses_log_select on public.akses_log;
create policy akses_log_select on public.akses_log
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================================
-- 5) STORAGE — bucket "panduan-pdf"
--   Publik boleh BACA, hanya admin boleh UPLOAD/UBAH/HAPUS.
--   Menyimpan file PDF panduan + gambar cover (prefix covers/).
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('panduan-pdf', 'panduan-pdf', true)
on conflict (id) do update set public = true;

-- Publik boleh membaca isi bucket.
drop policy if exists "panduan_pdf_public_read" on storage.objects;
create policy "panduan_pdf_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'panduan-pdf');

-- Hanya admin boleh upload.
drop policy if exists "panduan_pdf_admin_insert" on storage.objects;
create policy "panduan_pdf_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'panduan-pdf' and public.is_admin(auth.uid()));

-- Hanya admin boleh ubah / hapus file.
drop policy if exists "panduan_pdf_admin_update" on storage.objects;
create policy "panduan_pdf_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'panduan-pdf' and public.is_admin(auth.uid()))
  with check (bucket_id = 'panduan-pdf' and public.is_admin(auth.uid()));

drop policy if exists "panduan_pdf_admin_delete" on storage.objects;
create policy "panduan_pdf_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'panduan-pdf' and public.is_admin(auth.uid()));
