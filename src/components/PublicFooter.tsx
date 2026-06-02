import Image from "next/image";

/** Footer publik: nilai BerAKHLAK + identitas instansi. */
export default function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-navy-100 bg-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-8 text-center">
        <Image
          src="/logo-berakhlak.png"
          alt="ASN BerAKHLAK — Bangga Melayani Bangsa"
          width={260}
          height={66}
          className="h-auto w-auto max-w-[240px]"
        />
        <p className="text-xs leading-relaxed text-navy-700/70">
          Rumah Tahanan Negara Kelas IIA Balikpapan
          <br />
          Kementerian Imigrasi dan Pemasyarakatan Republik Indonesia
        </p>
      </div>
    </footer>
  );
}
