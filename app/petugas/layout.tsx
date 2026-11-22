import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "../../components/app/AppShell";
import AuthGuard from "../../components/app/AuthGuard";
import "../dashboard.css";

export const metadata: Metadata = {
  title: "Ruang Petugas — Bank Sampah Syariah UINSA",
  description: "Area kerja petugas piket dan penginputan setoran sampah.",
};

export default function PetugasLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="petugas">
      <AppShell role="petugas">{children}</AppShell>
    </AuthGuard>
  );
}
