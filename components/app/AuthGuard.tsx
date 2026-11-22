"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { beranda, sesiSekarang, type Role } from "../../lib/auth";
import { hasSupabaseEnv } from "../../lib/supabase/client";
import { sinkronkanDataSupabase } from "../../lib/supabase/sync";

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
    let aktif = true;

    const cekSesi = async () => {
      const sesi = hasSupabaseEnv()
        ? await sinkronkanDataSupabase()
        : sesiSekarang();

      if (!aktif) return;

      if (!sesi) {
        const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
        const tujuanMasuk = role === "nasabah" ? "/masuk" : "/portal-bss";
        router.replace(`${tujuanMasuk}${next}`);
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
    };

    cekSesi();

    return () => {
      aktif = false;
    };
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
