import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "../../components/app/AppShell";
import AuthGuard from "../../components/app/AuthGuard";
import "../dashboard.css";

export const metadata: Metadata = {
  title: "Ruang nasabah — Bank Sampah Syariah UINSA",
  description:
    "Saldo, riwayat setoran, dan data keanggotaan nasabah Bank Sampah Syariah UINSA.",
};

export default function NasabahLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="nasabah">
      <AppShell role="nasabah">{children}</AppShell>
    </AuthGuard>
  );
}
