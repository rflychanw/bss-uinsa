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
  verify: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 4 5v5.5c0 4.2 2.6 7.5 6 8.5 3.4-1 6-4.3 6-8.5V5l-6-2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="m7.5 10 2 2 3.5-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7.5h.01M14.5 12.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const NAV_NASABAH = [
  { href: "/nasabah", label: "Ringkasan", mobileLabel: "Ringkasan", icon: "home" },
  { href: "/nasabah/riwayat", label: "Riwayat Transaksi", mobileLabel: "Riwayat", icon: "list" },
  { href: "/nasabah/kalkulator", label: "Kalkulator Pintar", mobileLabel: "Kalkulator", icon: "calc" },
  { href: "/nasabah/profil", label: "Buku Tabungan", mobileLabel: "Tabungan", icon: "user" },
];

const NAV_PETUGAS = [
  { href: "/admin", label: "Riwayat Pencatatan", mobileLabel: "Riwayat", icon: "list" },
  { href: "/admin/setoran", label: "Tambah Pencatatan", mobileLabel: "Tambah", icon: "scale" },
  { href: "/admin/tarik", label: "Tarik Tunai Nasabah", mobileLabel: "Tarik Tunai", icon: "cash" },
  { href: "/admin/aktivasi", label: "Aktivasi Akun", mobileLabel: "Aktivasi", icon: "verify" },
];

const NAV_BENDAHARA = [
  { href: "/admin", label: "Ringkasan Keuangan", mobileLabel: "Ringkasan", icon: "home" },
  { href: "/admin/pengepul", label: "Alur Pengepul & Bagi Hasil", mobileLabel: "Pengepul", icon: "flow" },
  { href: "/admin/rekap", label: "Rekap & Ekspor CSV", mobileLabel: "Rekap", icon: "report" },
  { href: "/admin/tarik", label: "Riwayat Tarik Tunai", mobileLabel: "Tarik Tunai", icon: "cash" },
  { href: "/admin/nasabah", label: "Buku Tabungan Nasabah", mobileLabel: "Nasabah", icon: "user" },
  { href: "/admin/pricelist", label: "Daftar Harga (Pricelist)", mobileLabel: "Pricelist", icon: "price" },
];

const NAV_ADMIN = [
  { href: "/admin", label: "Monitoring Sistem", mobileLabel: "Monitor", icon: "home" },
  { href: "/admin/aktivasi", label: "Aktivasi & Verifikasi", mobileLabel: "Aktivasi", icon: "verify" },
  { href: "/admin/nasabah", label: "Master Data Nasabah", mobileLabel: "Nasabah", icon: "user" },
  { href: "/admin/pricelist", label: "Master Pricelist (FR-007)", mobileLabel: "Pricelist", icon: "price" },
  { href: "/admin/tarik", label: "Pencatatan Tarik Tunai", mobileLabel: "Tarik Tunai", icon: "cash" },
  { href: "/admin/pengepul", label: "Alur Penjualan Pengepul", mobileLabel: "Pengepul", icon: "flow" },
  { href: "/admin/rekap", label: "Laporan Keuangan", mobileLabel: "Laporan", icon: "report" },
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
      : roleAktif === "admin"
      ? NAV_ADMIN
      : NAV_BENDAHARA;

  const namaUser =
    sesi?.nama ||
    (roleAktif === "nasabah"
      ? "Aisyah Rahmawati"
      : roleAktif === "petugas"
      ? "Ahmad Fauzi"
      : roleAktif === "admin"
      ? "Petugas Sekretariat"
      : "Siti Nurhaliza");

  const subUser =
    sesi?.jabatan ||
    sesi?.nomor ||
    (roleAktif === "nasabah"
      ? "BSS-0142"
      : roleAktif === "petugas"
      ? "Petugas Jaga Pos"
      : roleAktif === "admin"
      ? "Administrator Sistem BSS"
      : "Bendahara Keuangan");

  const initial = namaUser.charAt(0);

  const roleLabel =
    roleAktif === "petugas"
      ? "Ruang Petugas Jaga"
      : roleAktif === "admin"
      ? "Ruang Administrator Sistem"
      : roleAktif === "bendahara"
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
      {/* Bar atas (ponsel / tablet < 940px) */}
      <header className="dsh__top">
        <Link className="dsh__topbrand" href="/">
          <img src="/logo-96.png" alt="" width={28} height={28} />
          <span>
            Bank Sampah Syariah <em>UINSA</em>
          </span>
        </Link>
        <div className="dsh__topwho">
          <span>{namaUser.split(" ")[0]}</span>
          <button
            type="button"
            onClick={onKeluar}
            style={{
              background: "#ffffff",
              border: "1px solid #d4cebe",
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "12px",
              cursor: "pointer",
              color: "#333",
              fontWeight: 600,
            }}
            aria-label="Keluar dari akun"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Sidebar (desktop >= 940px) */}
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

      {/* Isi konten halaman */}
      <main className="dsh__main">{children}</main>

      {/* Navigasi bawah ponsel (Bottom Navigation Bar < 940px) */}
      <nav className="dsh__bottom" aria-label="Menu navigasi bawah ponsel">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="dsh__bottomlink"
            data-active={isActive(it.href)}
            aria-current={isActive(it.href) ? "page" : undefined}
          >
            <span className="dsh__ico">{ICONS[it.icon]}</span>
            <span className="dsh__bottomlabel">{it.mobileLabel || it.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
