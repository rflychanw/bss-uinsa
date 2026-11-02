/**
 * Data contoh untuk dashboard.
 * Semua angka di sini masih dummy — ganti dengan hasil query ke API/DB BSS
 * saat backend tersedia. Struktur tipe di bawah bisa dipakai apa adanya.
 */

export type Status = "selesai" | "menunggu";

export type Setoran = {
  id: string;
  tanggal: string;
  jenis: string;
  berat: number;
  nilai: number;
  status: Status;
};

export const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export const jt = (n: number) =>
  `Rp ${(n / 1_000_000).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })} jt`;

export const kg0 = (n: number) => `${n.toLocaleString("id-ID")} kg`;

export const kg = (n: number) =>
  `${n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`;

/* ---------------------------------------------------------------- nasabah */

export const nasabah = {
  nama: "Aisyah Rahmawati",
  nomor: "BSS-0142",
  sejak: "Maret 2025",
  kontak: "aisyah.r@example.com",
  alamat: "Gresik, Jawa Timur",
  saldo: 186500,
  berat: 78.5,
  sedekah: 12000,
};

export const riwayat: Setoran[] = [
  {
    id: "S-0912",
    tanggal: "28 Okt 2026",
    jenis: "PET bening",
    berat: 4.2,
    nilai: 16800,
    status: "menunggu",
  },
  {
    id: "S-0901",
    tanggal: "21 Okt 2026",
    jenis: "Kardus",
    berat: 6.8,
    nilai: 13600,
    status: "selesai",
  },
  {
    id: "S-0887",
    tanggal: "14 Okt 2026",
    jenis: "Kaleng aluminium",
    berat: 1.4,
    nilai: 16800,
    status: "selesai",
  },
  {
    id: "S-0870",
    tanggal: "7 Okt 2026",
    jenis: "HVS",
    berat: 3.5,
    nilai: 8750,
    status: "selesai",
  },
  {
    id: "S-0855",
    tanggal: "30 Sep 2026",
    jenis: "Gelas plastik",
    berat: 2.6,
    nilai: 11700,
    status: "selesai",
  },
  {
    id: "S-0842",
    tanggal: "23 Sep 2026",
    jenis: "PET warna",
    berat: 5.1,
    nilai: 12750,
    status: "selesai",
  },
];

/* ------------------------------------------------------------------ admin */

export const admin = {
  nasabahAktif: 128,
  beratBulan: 1240,
  saldoTerutang: 4820000,
  menunggu: 3,
};

export type Antrean = {
  id: string;
  nama: string;
  nomor: string;
  tanggal: string;
  jenis: string;
  berat: number;
  nilai: number;
};

export const antrean: Antrean[] = [
  {
    id: "S-0912",
    nama: "Aisyah Rahmawati",
    nomor: "BSS-0142",
    tanggal: "28 Okt 2026",
    jenis: "PET bening",
    berat: 4.2,
    nilai: 16800,
  },
  {
    id: "S-0911",
    nama: "Bagus Prakoso",
    nomor: "BSS-0087",
    tanggal: "28 Okt 2026",
    jenis: "Kardus",
    berat: 9.5,
    nilai: 19000,
  },
  {
    id: "S-0910",
    nama: "Nadia Salma",
    nomor: "BSS-0210",
    tanggal: "27 Okt 2026",
    jenis: "Kaleng aluminium",
    berat: 2.1,
    nilai: 25200,
  },
];

export const setoranMasuk = [
  ...antrean.map((a) => ({ ...a, status: "menunggu" as Status })),
  {
    id: "S-0901",
    nama: "Aisyah Rahmawati",
    nomor: "BSS-0142",
    tanggal: "21 Okt 2026",
    jenis: "Kardus",
    berat: 6.8,
    nilai: 13600,
    status: "selesai" as Status,
  },
  {
    id: "S-0900",
    nama: "Rizal Hamdani",
    nomor: "BSS-0033",
    tanggal: "21 Okt 2026",
    jenis: "HVS",
    berat: 4.4,
    nilai: 11000,
    status: "selesai" as Status,
  },
  {
    id: "S-0898",
    nama: "Nadia Salma",
    nomor: "BSS-0210",
    tanggal: "20 Okt 2026",
    jenis: "Gelas plastik",
    berat: 3.2,
    nilai: 14400,
    status: "selesai" as Status,
  },
  {
    id: "S-0895",
    nama: "Bagus Prakoso",
    nomor: "BSS-0087",
    tanggal: "19 Okt 2026",
    jenis: "Tembaga",
    berat: 0.4,
    nilai: 21600,
    status: "selesai" as Status,
  },
];

export const daftarNasabah = [
  { nama: "Aisyah Rahmawati", nomor: "BSS-0142", saldo: 186500, berat: 78.5, terakhir: "28 Okt 2026" },
  { nama: "Bagus Prakoso", nomor: "BSS-0087", saldo: 412000, berat: 164.2, terakhir: "28 Okt 2026" },
  { nama: "Nadia Salma", nomor: "BSS-0210", saldo: 97500, berat: 41.8, terakhir: "27 Okt 2026" },
  { nama: "Rizal Hamdani", nomor: "BSS-0033", saldo: 254000, berat: 102.6, terakhir: "21 Okt 2026" },
  { nama: "Siti Fauziah", nomor: "BSS-0176", saldo: 63000, berat: 27.4, terakhir: "18 Okt 2026" },
  { nama: "Yusuf Maulana", nomor: "BSS-0198", saldo: 129000, berat: 54.9, terakhir: "15 Okt 2026" },
];
