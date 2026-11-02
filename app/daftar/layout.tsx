import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Daftar nasabah — Bank Sampah Syariah UINSA",
  description:
    "Daftar jadi nasabah Bank Sampah Syariah UINSA, dapat nomor nasabah sendiri.",
};

export default function DaftarLayout({ children }: { children: ReactNode }) {
  return children;
}
