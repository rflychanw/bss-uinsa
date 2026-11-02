import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "../../components/app/AppShell";
import AuthGuard from "../../components/app/AuthGuard";
import "../dashboard.css";

export const metadata: Metadata = {
  title: "Ruang petugas — Bank Sampah Syariah UINSA",
  description:
    "Verifikasi setoran, daftar nasabah, dan saldo terutang Bank Sampah Syariah UINSA.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="admin">
      <AppShell role="admin">{children}</AppShell>
    </AuthGuard>
  );
}
