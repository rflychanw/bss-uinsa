import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Masuk — Bank Sampah Syariah UINSA",
  description:
    "Masuk ke ruang nasabah atau ruang petugas Bank Sampah Syariah UINSA.",
};

export default function MasukLayout({ children }: { children: ReactNode }) {
  return children;
}
