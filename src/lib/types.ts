/**
 * Tipe data ringkas yang dipakai di seluruh aplikasi.
 * (Bisa diganti dengan tipe hasil generate Supabase bila diperlukan.)
 */

export type Panduan = {
  id: string;
  uploaded_by: string | null;
  judul: string;
  jenis: string | null;
  deskripsi: string | null;
  file_url: string | null;
  cover_url: string | null;
  urutan: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AksesLog = {
  id: string;
  panduan_id: string | null;
  session_id: string | null;
  device: string | null;
  dibuka_pada: string;
};

export type Profile = {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
};
