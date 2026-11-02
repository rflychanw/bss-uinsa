"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { beranda, sesiSekarang, type Role } from "../../lib/auth";

/**
 * Penjaga rute dashboard.
 * - Untuk halaman nasabah: hanya role nasabah yang diizinkan.
 * - Untuk halaman admin/pengelola: role admin, petugas, dan bendahara diizinkan.
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

    const diizinkan =
      role === "nasabah"
        ? sesi.role === "nasabah"
        : ["admin", "petugas", "bendahara"].includes(sesi.role);

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
