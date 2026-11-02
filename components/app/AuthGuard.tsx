"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { beranda, sesiSekarang, type Role } from "../../lib/auth";

/**
 * Penjaga halaman dashboard. Karena autentikasi demo berjalan di klien
 * (localStorage), pengecekan terjadi setelah mount — jadi jangan pernah
 * mengandalkan ini untuk melindungi data sungguhan.
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

    if (sesi.role !== role) {
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
