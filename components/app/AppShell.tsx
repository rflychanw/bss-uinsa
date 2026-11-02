"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { keluar, sesiSekarang, type Sesi } from "../../lib/auth";

type Role = "nasabah" | "admin";

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
};

const NAV: Record<Role, { href: string; label: string; icon: string }[]> = {
  nasabah: [
    { href: "/nasabah", label: "Ringkasan", icon: "home" },
    { href: "/nasabah/riwayat", label: "Riwayat", icon: "list" },
    { href: "/nasabah/profil", label: "Profil", icon: "user" },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", icon: "home" },
    { href: "/admin/setoran", label: "Setoran", icon: "scale" },
    { href: "/admin/nasabah", label: "Nasabah", icon: "user" },
  ],
};

const WHO: Record<Role, { name: string; meta: string }> = {
  nasabah: { name: "Aisyah Rahmawati", meta: "BSS-0142" },
  admin: { name: "Petugas sekretariat", meta: "FEBI UINSA" },
};

export default function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const items = NAV[role];
  const [sesi, setSesi] = useState<Sesi | null>(null);

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  const who =
    sesi && sesi.role === role
      ? { name: sesi.nama, meta: sesi.nomor }
      : WHO[role];
  const initial = who.name.charAt(0);

  const onKeluar = () => {
    keluar();
    router.replace("/masuk");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="dsh">
      <aside className="dsh__side">
        <Link className="dsh__brand" href="/">
          <img src="/logo-96.png" alt="" width={34} height={34} />
          <span>
            Bank Sampah Syariah <em>UINSA</em>
          </span>
        </Link>

        <p className="dsh__role">
          {role === "nasabah" ? "Ruang nasabah" : "Ruang petugas"}
        </p>

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
            <strong>{who.name}</strong>
            <em>{who.meta}</em>
          </span>
        </div>

        <div className="dsh__footact">
          <button
            type="button"
            className="dsh__logout"
            onClick={onKeluar}
            aria-label="Keluar dari akun ini"
          >
            Keluar
          </button>
          <span className="dsh__footsep" aria-hidden="true">
            ·
          </span>
          <Link className="dsh__exit" href="/">
            Situs
          </Link>
        </div>
      </aside>

      <div className="dsh__body">
        <header className="dsh__top">
          <Link className="dsh__topbrand" href="/">
            <img src="/logo-96.png" alt="" width={28} height={28} />
            <span>BSS UINSA</span>
          </Link>
          <span className="dsh__topwho">
            <span className="dsh__avatar dsh__avatar--sm" aria-hidden="true">
              {initial}
            </span>
            {who.meta}
            <button
              type="button"
              className="dsh__toplogout"
              onClick={onKeluar}
              aria-label="Keluar"
            >
              Keluar
            </button>
          </span>
        </header>

        <main className="dsh__main">{children}</main>
      </div>

      <nav className="dsh__bottom" aria-label="Menu utama">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="dsh__bottomlink"
            data-active={isActive(it.href)}
            aria-current={isActive(it.href) ? "page" : undefined}
          >
            <span className="dsh__ico">{ICONS[it.icon]}</span>
            {it.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
