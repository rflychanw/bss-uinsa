import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Masuk Nasabah — Bank Sampah Syariah UINSA",
  description:
    "Masuk ke buku tabungan digital dan layanan nasabah Bank Sampah Syariah UINSA.",
};

export default function MasukLayout({ children }: { children: ReactNode }) {
  return children;
}
