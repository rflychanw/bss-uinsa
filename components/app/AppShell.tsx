"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { keluar, sesiSekarang, type Sesi } from "../../lib/auth";

type Role = "nasabah" | "petugas" | "bendahara" | "admin";

const ICONS: Record<string, ReactNode> = {
  home: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.2 10 3l6.5 5.2V16a1 1 0 0 1-1 1h-3.2v-4.6H7.7V17H4.5a1 1 0 0 1-1-1V8.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6.5 5.5h10M6.5 10h10M6.5 14.5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="3.5" cy="5.5" r="1" fill="currentColor" />
      <circle cx="3.5" cy="10" r="1" fill="currentColor" />
      <circle cx="3.5" cy="14.5" r="1" fill="currentColor" />
    </svg>
  ),
  calc: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3.5" y="2.5" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 6.5h7M6.5 10.5h2M11.5 10.5h2M6.5 13.5h2M11.5 13.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4 17c0-2.8 2.7-4.6 6-4.6s6 1.8 6 4.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  scale: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 4v12M5 16h10M3 8h14M6.5 8 4 13h5L6.5 8Zm7 0L11 13h5l-2.5-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  flow: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 13.5h10.5a3.5 3.5 0 0 0 0-7H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 4 3 6.5l2.5 2.5M14.5 11l2.5 2.5-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 3.5h7l4 4V16a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 3 16V5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11.5 3.5V7.5H15.5M6.5 10.5h7M6.5 13.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  price: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.5V4.5h6l7 7-6 6-7-7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
    </svg>
  ),
};

const NAV_NASABAH = [
  { href: "/nasabah", label: "Ringkasan", icon: "home" },
  { href: "/nasabah/riwayat", label: "Riwayat Transaksi", icon: "list" },
  { href: "/nasabah/kalkulator", label: "Kalkulator Pintar", icon: "calc" },
  { href: "/nasabah/profil", label: "Buku Tabungan", icon: "user" },
];

const NAV_PETUGAS = [
  { href: "/admin", label: "Riwayat Pencatatan", icon: "list" },
  { href: "/admin/setoran", label: "Tambah Pencatatan", icon: "scale" },
];

const NAV_BENDAHARA = [
  { href: "/admin", label: "Ringkasan Keuangan", icon: "home" },
  { href: "/admin/pengepul", label: "Alur Pengepul & Bagi Hasil", icon: "flow" },
  { href: "/admin/rekap", label: "Rekap & Ekspor CSV", icon: "report" },
  { href: "/admin/nasabah", label: "Buku Tabungan Nasabah", icon: "user" },
  { href: "/admin/pricelist", label: "Daftar Harga (Pricelist)", icon: "price" },
];

export default function AppShell({
  role,
  children,
}: {
  role: "nasabah" | "admin";
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sesi, setSesi] = useState<Sesi | null>(null);

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  const roleAktif = sesi?.role || (role === "nasabah" ? "nasabah" : "bendahara");

  const items =
    roleAktif === "nasabah"
      ? NAV_NASABAH
      : roleAktif === "petugas"
      ? NAV_PETUGAS
      : NAV_BENDAHARA;

  const namaUser =
    sesi?.nama ||
    (roleAktif === "nasabah"
      ? "Aisyah Rahmawati"
      : roleAktif === "petugas"
      ? "Rizal Fauzi"
      : "Siti Fatimah, S.E.");

  const subUser =
    sesi?.jabatan ||
    sesi?.nomor ||
    (roleAktif === "nasabah"
      ? "BSS-0142"
      : roleAktif === "petugas"
      ? "Petugas Jaga Pos"
      : "Bendahara Keuangan");

  const initial = namaUser.charAt(0);

  const roleLabel =
    roleAktif === "petugas"
      ? "Ruang Petugas Jaga"
      : roleAktif === "bendahara" || roleAktif === "admin"
      ? "Ruang Bendahara Keuangan"
      : "Ruang Nasabah";

  const onKeluar = () => {
    keluar();
    router.replace("/masuk");
  };

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/nasabah") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="dsh">
      <aside className="dsh__side">
        <Link className="dsh__brand" href="/">
          <img src="/logo-96.png" alt="" width={34} height={34} />
          <span>
            Bank Sampah Syariah <em>UINSA</em>
          </span>
        </Link>

        <p className="dsh__role">{roleLabel}</p>

        <nav className="dsh__nav" aria-label="Menu utama">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="dsh__navlink"
              data-active={isActive(it.href)}
              aria-current={isActive(it.href) ? "page" : undefined}
            >
              <span className="dsh__ico">{ICONS[it.icon]}</span>
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="dsh__me">
          <span className="dsh__avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="dsh__mewho">
            <strong>{namaUser}</strong>
            <em>{subUser}</em>
          </span>
        </div>

        <button
          type="button"
          onClick={onKeluar}
          className="dsh__logoutbtn"
          aria-label="Keluar dari akun"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="dsh__logoutico"
            width={15}
            height={15}
          >
            <path
              d="M7.5 17.5h-3a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2h3M13.5 14.5l4-4.5-4-4.5M17.5 10H7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Keluar
        </button>
      </aside>

      <main className="dsh__main">{children}</main>
    </div>
  );
}
