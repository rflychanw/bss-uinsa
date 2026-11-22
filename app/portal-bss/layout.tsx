import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portal Pengelola — Bank Sampah Syariah UINSA",
  description:
    "Konsol autentikasi internal khusus Admin, Bendahara, dan Petugas Bank Sampah Syariah UINSA.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalBssLayout({ children }: { children: ReactNode }) {
  return children;
}
