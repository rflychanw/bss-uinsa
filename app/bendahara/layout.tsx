import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "../../components/app/AppShell";
import AuthGuard from "../../components/app/AuthGuard";
import "../dashboard.css";

export const metadata: Metadata = {
  title: "Ruang Bendahara — Bank Sampah Syariah UINSA",
  description: "Area kerja bendahara keuangan dan rekapitulasi.",
};

export default function BendaharaLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="bendahara">
      <AppShell role="bendahara">{children}</AppShell>
    </AuthGuard>
  );
}
