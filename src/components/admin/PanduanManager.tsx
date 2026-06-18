"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Panduan } from "@/lib/types";

const BUCKET = "panduan-pdf";

type FormState = {
  judul: string;
  jenis: string;
  deskripsi: string;
  urutan: number;
  download_url: string;
  file: File | null;
};

const emptyForm: FormState = {
  judul: "",
  jenis: "Kunjungan",
  deskripsi: "",
  urutan: 0,
  download_url: "",
  file: null,
};

export default function PanduanManager({ items }: { items: Panduan[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Panduan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Panduan) {
    setEditing(p);
    setShowForm(true);
  }

  async function toggleActive(p: Panduan) {
    setBusyId(p.id);
    const supabase = createClient();
    await supabase
      .from("panduan")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    setBusyId(null);
    router.refresh();
  }

  async function hapus(p: Panduan) {
    if (!confirm(`Hapus panduan "${p.judul}"? Tindakan ini tidak bisa dibatalkan.`))
      return;
    setBusyId(p.id);
    const supabase = createClient();
    await supabase.from("panduan").delete().eq("id", p.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy">
          Kelola Panduan
        </h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-900 transition hover:bg-gold-400"
        >
          + Panduan Baru
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-navy-700/60">
          Belum ada panduan. Klik “Panduan Baru” untuk mengunggah.
        </p>
      ) : (
        <ul className="divide-y divide-navy-100">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-navy-100">
                {p.cover_url && (
                  <Image
                    src={p.cover_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{p.judul}</p>
                <p className="text-xs text-navy-700/60">
                  {p.jenis ?? "—"} · urutan {p.urutan} ·{" "}
                  {p.is_active ? (
                    <span className="text-green-600">Aktif</span>
                  ) : (
                    <span className="text-navy-700/50">Disembunyikan</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-md border border-navy-100 px-2.5 py-1 text-xs font-medium text-navy transition hover:bg-navy-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  disabled={busyId === p.id}
                  className="rounded-md border border-navy-100 px-2.5 py-1 text-xs font-medium text-navy transition hover:bg-navy-50 disabled:opacity-50"
                >
                  {p.is_active ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button
                  onClick={() => hapus(p)}
                  disabled={busyId === p.id}
                  className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <PanduanForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function PanduanForm({
  editing,
  onClose,
  onSaved,
}: {
  editing: Panduan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          judul: editing.judul,
          jenis: editing.jenis ?? "",
          deskripsi: editing.deskripsi ?? "",
          urutan: editing.urutan,
          download_url: editing.download_url ?? "",
          file: null,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!editing && !form.file) {
      setError("File PDF wajib diunggah untuk panduan baru.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      let file_url = editing?.file_url ?? null;
      let cover_url = editing?.cover_url ?? null;

      if (form.file) {
        const id = crypto.randomUUID();

        setStatus("Membuat cover dari halaman pertama…");
        // Import di sini (browser saja) agar pdf.js tidak dimuat saat SSR.
        const { generateCoverFromPdf } = await import("@/lib/pdf");
        const coverBlob = await generateCoverFromPdf(form.file);

        setStatus("Mengunggah file PDF…");
        const pdfPath = `pdf/${id}.pdf`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(pdfPath, form.file, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) throw upErr;

        setStatus("Mengunggah cover…");
        const coverPath = `covers/${id}.png`;
        const { error: covErr } = await supabase.storage
          .from(BUCKET)
          .upload(coverPath, coverBlob, {
            contentType: "image/png",
            upsert: true,
          });
        if (covErr) throw covErr;

        file_url = supabase.storage.from(BUCKET).getPublicUrl(pdfPath)
          .data.publicUrl;
        cover_url = supabase.storage.from(BUCKET).getPublicUrl(coverPath)
          .data.publicUrl;
      }

      setStatus("Menyimpan data…");
      const payload = {
        judul: form.judul,
        jenis: form.jenis || null,
        deskripsi: form.deskripsi || null,
        urutan: form.urutan,
        download_url: form.download_url.trim() || null,
        file_url,
        cover_url,
      };

      if (editing) {
        const { error: dbErr } = await supabase
          .from("panduan")
          .update(payload)
          .eq("id", editing.id);
        if (dbErr) throw dbErr;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error: dbErr } = await supabase.from("panduan").insert({
          ...payload,
          uploaded_by: userData.user?.id ?? null,
        });
        if (dbErr) throw dbErr;
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.",
      );
    } finally {
      setSaving(false);
      setStatus(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-navy">
            {editing ? "Edit Panduan" : "Panduan Baru"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700 hover:bg-navy-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Judul">
            <input
              required
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis">
              <select
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                className="input"
              >
                <option>Kunjungan</option>
                <option>Titipan Barang</option>
                <option>Lainnya</option>
              </select>
            </Field>
            <Field label="Urutan tampil">
              <input
                type="number"
                value={form.urutan}
                onChange={(e) =>
                  setForm({ ...form, urutan: Number(e.target.value) })
                }
                className="input"
              />
            </Field>
          </div>

          <Field label="Deskripsi singkat">
            <textarea
              rows={2}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="input resize-none"
            />
          </Field>

          <Field label="Link Unduh — Google Drive (opsional)">
            <input
              type="url"
              value={form.download_url}
              onChange={(e) =>
                setForm({ ...form, download_url: e.target.value })
              }
              className="input"
              placeholder="https://drive.google.com/file/d/.../view"
            />
            <p className="mt-1 text-xs text-navy-700/60">
              Jika diisi, tombol “Unduh” memakai link ini (hemat kuota). Tempel
              link share biasa (“Anyone with the link”) — otomatis diubah jadi
              unduh langsung. Kosongkan untuk mengunduh dari file di atas.
            </p>
          </Field>

          <Field
            label={
              editing
                ? "Ganti file PDF (opsional)"
                : "File PDF panduan"
            }
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files?.[0] ?? null })
              }
              className="block w-full text-sm text-navy-700 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-navy-700"
            />
            {editing && (
              <p className="mt-1 text-xs text-navy-700/60">
                Kosongkan jika tidak ingin mengganti file. Cover dibuat ulang
                otomatis jika file diganti.
              </p>
            )}
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {status && (
            <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
              {status}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy">{label}</span>
      {children}
    </label>
  );
}
