import Image from "next/image";

/**
 * Header halaman publik: foto gedung sebagai latar, logo kementerian,
 * dan identitas instansi. Tanpa tombol/link login (sesuai ketentuan).
 */
export default function PublicHeader() {
  return (
    <header className="relative overflow-hidden">
      {/* Foto gedung Rutan sebagai latar */}
      <Image
        src="/rutan-balikpapan.jpg"
        alt="Gedung Rutan Kelas IIA Balikpapan"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Lapisan gelap navy agar teks terbaca */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-800/80 to-navy-900/95" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-10 pt-9 text-center">
        <Image
          src="/logo-kementerian.png"
          alt="Logo Kementerian Imigrasi dan Pemasyarakatan"
          width={72}
          height={72}
          className="drop-shadow-lg"
          priority
        />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-400">
          Kementerian Imigrasi dan Pemasyarakatan
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Informasi Layanan
        </h1>
        <p className="mt-1 text-sm font-medium text-navy-100 sm:text-base">
          Rumah Tahanan Negara Kelas IIA Balikpapan
        </p>

        <div className="mt-5 h-px w-16 bg-gold/70" />
        <p className="mt-4 max-w-md text-sm leading-relaxed text-navy-100/90">
          Panduan layanan kunjungan dan titipan barang. Pilih panduan di bawah,
          lalu baca seperti membuka buku.
        </p>
      </div>
    </header>
  );
}
