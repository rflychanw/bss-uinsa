"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { beranda, sesiSekarang, type Role } from "../../lib/auth";

/**
 * Penjaga rute dashboard.
 * - Untuk halaman nasabah: hanya role nasabah yang diizinkan.
 * - Untuk halaman admin: hanya role admin yang diizinkan.
 * - Untuk halaman petugas: role petugas dan admin yang diizinkan.
 * - Untuk halaman bendahara: role bendahara dan admin yang diizinkan.
 */
export default function AuthGuard({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const sesi = sesiSekarang();

    if (!sesi) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/masuk${next}`);
      return;
    }

    let diizinkan = false;
    if (role === "nasabah") {
      diizinkan = sesi.role === "nasabah";
    } else if (role === "admin") {
      diizinkan = sesi.role === "admin";
    } else if (role === "petugas") {
      diizinkan = sesi.role === "petugas" || sesi.role === "admin";
    } else if (role === "bendahara") {
      diizinkan = sesi.role === "bendahara" || sesi.role === "admin";
    }

    if (!diizinkan) {
      router.replace(beranda(sesi.role));
      return;
    }

    setSiap(true);
  }, [role, pathname, router]);

  if (!siap) {
    return (
      <div className="authload" role="status" aria-live="polite">
        <span className="authload__dot" aria-hidden="true" />
        Memeriksa sesi…
      </div>
    );
  }

  return <>{children}</>;
}
