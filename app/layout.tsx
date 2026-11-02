import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Sampah Syariah UINSA",
  description:
    "Bank Sampah Syariah UIN Sunan Ampel Surabaya menimbang sampah anorganik mahasiswa dan warga kampus, mencatatnya di buku tabungan, lalu mengubahnya jadi rupiah.",
  icons: {
    icon: "/logo-96.png",
    shortcut: "/logo-96.png",
    apple: "/logo-192.png",
  },
  openGraph: {
    title: "Bank Sampah Syariah UINSA",
    description:
      "Sampah kampus, jadi saldo. Bank sampah laboratorium FEBI UIN Sunan Ampel Surabaya.",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/logo-96.png" sizes="any" />
        <link rel="shortcut icon" href="/logo-96.png" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=roundo@400,500,600,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
