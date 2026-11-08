/**
 * Model Data dan Helper Bank Sampah Syariah (BSS) UINSA
 * Disusun mengacu pada Software Requirements Specification (SRS) v1.1:
 * - RBAC 4 Peran: Admin, Petugas Jaga, Bendahara, Nasabah
 * - FR-006 & FR-007: Master Jenis Sampah & Pricelist Dinamis
 * - FR-008 & FR-010: Pencatatan Setoran Sampah berstatus "Belum Terjual"
 * - FR-009 & FR-013: Kalkulator Pintar dengan konversi satuan (kg / gram)
 * - FR-011: Dashboard Nasabah (Estimasi Belum Terjual, Akumulasi Tersalurkan, Total Berat)
 * - FR-012 & FR-015: Rekapitulasi & Ekspor Laporan Keuangan
 * - FR-026 s.d FR-033: Alur Penjualan ke Pengepul 4 Tahap & Pembagian Proporsional
 */

export type StatusSetoran = "belum_terjual" | "disalurkan";
export type StatusVerifikasiSetoran = "menunggu_verifikasi" | "terverifikasi";
export type Status = "selesai" | "menunggu";
export type MetodePenarikan = "tunai" | "bank" | "ewallet" | "transfer";

export const MINIMAL_PENARIKAN_RP = 2000;

export type PenarikanUang = {
  id: string;
  nomorNasabah: string;
  namaNasabah: string;
  tanggal: string;
  nominal: number;
  metode: MetodePenarikan;
  tujuan?: string;
  catatan?: string;
  status: "selesai" | "menunggu";
  petugas: string;
};

export type Setoran = {
  id: string;
  tanggal: string;
  jenis: string;
  berat: number;
  nilai: number;
  status: Status;
  statusSrs?: StatusSetoran;
};

export type JenisSampah = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  hargaPerKg: number;
  satuan: string;
  deskripsi: string;
  updateTerakhir?: string;
};

export type NasabahMaster = {
  nomor: string;
  nama: string;
  email: string;
  fakultas: string;
  totalSetorKg?: number;
  totalBeratKg?: number;
  totalDisalurkan?: number;
  estimasiGudang?: number;
  estimasiBelumTerjual?: number;
  akumulasiTersalurkan?: number;
  terakhir?: string;
  status: string;
  terdaftar?: string;
};

export type SetoranNasabah = {
  id: string;
  nomorNasabah: string;
  namaNasabah: string;
  tanggal: string;
  jenisSampahId: string;
  jenisSampahNama: string;
  beratKg: number;
  jumlahSatuan?: string;
  estimasiNilai: number;
  nilaiRealisasi?: number;
  status: StatusSetoran;
  statusVerifikasi?: StatusVerifikasiSetoran;
  batchPengepulId?: string;
  dicatatOleh: string;
};

export type NasabahProfil = {
  nomor: string;
  nama: string;
  email: string;
  prodiFakultas: string;
  terdaftarSejak: string;
  totalBeratKg: number;
  estimasiBelumTerjual: number;
  akumulasiTersalurkan: number;
  totalSedekah: number;
};

export type TahapAlur =
  | "terkumpul"
  | "dijual_ke_pengepul"
  | "uang_diterima"
  | "disalurkan_ke_nasabah";

export type PenyaluranPerNasabah = {
  nomorNasabah: string;
  namaNasabah: string;
  beratKg: number;
  proporsiPersen: number;
  hakUang: number;
};

export type BatchPenjualanPengepul = {
  id: string;
  nomorBatch: string;
  namaPengepul: string;
  tahap: TahapAlur;
  totalBeratKg: number;
  estimasiAwal: number;
  nilaiJualPengepul: number;
  uangDiterima: number;
  totalDisalurkan?: number;
  selisihKasBss: number;
  tanggalTerkumpul: string;
  tanggalJual?: string;
  tanggalUangDiterima?: string;
  tanggalDisalurkan?: string;
  dicatatOleh: string;
  daftarSetoranId: string[];
  penyaluran: PenyaluranPerNasabah[];
};

/* ----------------------------------------------------------- format helper */

export const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export const jt = (n: number) =>
  `Rp ${(n / 1_000_000).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })} jt`;

export const kg = (n: number) =>
  `${n.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} kg`;

export const kg0 = (n: number) => `${Math.round(n).toLocaleString("id-ID")} kg`;

/* ------------------------------------------- Master Jenis Sampah & Pricelist Resmi BSS */

export const PRICELIST_AWAL: JenisSampah[] = [
  // [A] KERTAS
  { id: "A1", kode: "A1", nama: "Kardus", kategori: "Kertas", hargaPerKg: 2000, satuan: "kg", deskripsi: "Kardus kering & bersih" },
  { id: "A2", kode: "A2", nama: "Kertas HVS", kategori: "Kertas", hargaPerKg: 2500, satuan: "kg", deskripsi: "Kertas arsip / cetak putih" },
  { id: "A3", kode: "A3", nama: "Koran & Buram", kategori: "Kertas", hargaPerKg: 1800, satuan: "kg", deskripsi: "Koran, buram, atau duplek" },

  // [B] PLASTIK
  { id: "B1", kode: "B1", nama: "Botol PET Bening", kategori: "Plastik", hargaPerKg: 4000, satuan: "kg", deskripsi: "Botol air mineral bening bersih" },
  { id: "B2", kode: "B2", nama: "Botol PET Warna", kategori: "Plastik", hargaPerKg: 2500, satuan: "kg", deskripsi: "Botol plastik warna / campur" },
  { id: "B3", kode: "B3", nama: "Gelas Plastik", kategori: "Plastik", hargaPerKg: 2500, satuan: "kg", deskripsi: "Cup minuman plastik bersih" },
  { id: "B4", kode: "B4", nama: "Galon Utuh", kategori: "Plastik", hargaPerKg: 6000, satuan: "pcs", deskripsi: "Galon air mineral utuh" },

  // [C] LOGAM & BESI
  { id: "C1", kode: "C1", nama: "Besi Tebal", kategori: "Logam", hargaPerKg: 4500, satuan: "kg", deskripsi: "Besi padat, rangka, atau plat" },
  { id: "C2", kode: "C2", nama: "Aluminium & Kaleng", kategori: "Logam", hargaPerKg: 12000, satuan: "kg", deskripsi: "Kaleng minuman & panci aluminium" },
  { id: "C3", kode: "C3", nama: "Tembaga", kategori: "Logam", hargaPerKg: 55000, satuan: "kg", deskripsi: "Kawat / kabel tembaga kupas" },

  // [D] KACA & LAINNYA
  { id: "D1", kode: "D1", nama: "Botol Kaca", kategori: "Kaca", hargaPerKg: 1500, satuan: "kg", deskripsi: "Botol kaca sirup / kecap utuh" },
  { id: "E1", kode: "E1", nama: "Minyak Jelantah", kategori: "Lain-lain", hargaPerKg: 5500, satuan: "kg", deskripsi: "Minyak goreng bekas saring" },
];

/* ------------------------------------------------------------- Profil Nasabah */

export const NASABAH_DEMO: NasabahProfil = {
  nomor: "BSS-0142",
  nama: "Aisyah Rahmawati",
  email: "nasabah@bss.test",
  prodiFakultas: "Sistem Informasi — FEBI UINSA",
  terdaftarSejak: "Maret 2025",
  totalBeratKg: 78.5,
  estimasiBelumTerjual: 16800,
  akumulasiTersalurkan: 186500,
  totalSedekah: 12000,
};

/* ----------------------------------------------------------- Riwayat Setoran */

export const RIWAYAT_SETORAN_AWAL: SetoranNasabah[] = [
  {
    id: "S-0913",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "29 Okt 2026",
    jenisSampahId: "B4",
    jenisSampahNama: "B4 · Galon Utuh",
    beratKg: 3.0,
    jumlahSatuan: "3 pcs",
    estimasiNilai: 18000,
    status: "belum_terjual",
    statusVerifikasi: "menunggu_verifikasi",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0912",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "28 Okt 2026",
    jenisSampahId: "B1",
    jenisSampahNama: "B1 · Botol PET Bening",
    beratKg: 4.2,
    jumlahSatuan: "4,2 kg",
    estimasiNilai: 16800,
    status: "belum_terjual",
    statusVerifikasi: "terverifikasi",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0911",
    nomorNasabah: "BSS-0087",
    namaNasabah: "Bagus Prakoso",
    tanggal: "28 Okt 2026",
    jenisSampahId: "A1",
    jenisSampahNama: "A1 · Kardus",
    beratKg: 9.5,
    jumlahSatuan: "9,5 kg",
    estimasiNilai: 19000,
    status: "belum_terjual",
    statusVerifikasi: "menunggu_verifikasi",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0910",
    nomorNasabah: "BSS-0210",
    namaNasabah: "Nadia Salma",
    tanggal: "27 Okt 2026",
    jenisSampahId: "C2",
    jenisSampahNama: "C2 · Aluminium & Kaleng",
    beratKg: 2.1,
    jumlahSatuan: "2,1 kg",
    estimasiNilai: 25200,
    status: "belum_terjual",
    statusVerifikasi: "terverifikasi",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0901",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "21 Okt 2026",
    jenisSampahId: "A1",
    jenisSampahNama: "A1 · Kardus",
    beratKg: 6.8,
    jumlahSatuan: "6,8 kg",
    estimasiNilai: 13600,
    nilaiRealisasi: 14200,
    status: "disalurkan",
    statusVerifikasi: "terverifikasi",
    batchPengepulId: "BATCH-2026-10A",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0900",
    nomorNasabah: "BSS-0033",
    namaNasabah: "Rizal Hamdani",
    tanggal: "21 Okt 2026",
    jenisSampahId: "A2",
    jenisSampahNama: "A2 · Kertas HVS",
    beratKg: 4.4,
    jumlahSatuan: "4,4 kg",
    estimasiNilai: 11000,
    nilaiRealisasi: 11500,
    status: "disalurkan",
    statusVerifikasi: "terverifikasi",
    batchPengepulId: "BATCH-2026-10A",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0887",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "14 Okt 2026",
    jenisSampahId: "C2",
    jenisSampahNama: "C2 · Aluminium & Kaleng",
    beratKg: 4.5,
    jumlahSatuan: "4,5 kg",
    estimasiNilai: 54000,
    nilaiRealisasi: 54000,
    status: "disalurkan",
    statusVerifikasi: "terverifikasi",
    batchPengepulId: "BATCH-2026-10A",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0870",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "7 Okt 2026",
    jenisSampahId: "A2",
    jenisSampahNama: "A2 · Kertas HVS",
    beratKg: 16.0,
    jumlahSatuan: "16 kg",
    estimasiNilai: 40000,
    nilaiRealisasi: 40000,
    status: "disalurkan",
    statusVerifikasi: "terverifikasi",
    batchPengepulId: "BATCH-2026-09C",
    dicatatOleh: "Ahmad Fauzi",
  },
  {
    id: "S-0852",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "25 Sep 2026",
    jenisSampahId: "C1",
    jenisSampahNama: "C1 · Besi Tebal",
    beratKg: 17.4,
    jumlahSatuan: "17,4 kg",
    estimasiNilai: 78300,
    nilaiRealisasi: 78300,
    status: "disalurkan",
    statusVerifikasi: "terverifikasi",
    batchPengepulId: "BATCH-2026-09B",
    dicatatOleh: "Ahmad Fauzi",
  },
];

/* ------------------------------------------------------------- Daftar Nasabah */

export const DAFTAR_NASABAH_MASTER = [
  {
    nomor: "BSS-0142",
    nama: "Aisyah Rahmawati",
    email: "nasabah@bss.test",
    fakultas: "FEBI (Sistem Informasi)",
    totalSetorKg: 78.5,
    estimasiBelumTerjual: 16800,
    akumulasiTersalurkan: 186500,
    status: "Aktif",
    terakhir: "28 Okt 2026",
  },
  {
    nomor: "BSS-0087",
    nama: "Bagus Prakoso",
    email: "bagus@uinsa.ac.id",
    fakultas: "FST (Teknik Lingkungan)",
    totalSetorKg: 164.2,
    estimasiBelumTerjual: 19000,
    akumulasiTersalurkan: 412000,
    status: "Aktif",
    terakhir: "28 Okt 2026",
  },
  {
    nomor: "BSS-0210",
    nama: "Nadia Salma",
    email: "nadia@uinsa.ac.id",
    fakultas: "FDK (Komunikasi)",
    totalSetorKg: 41.8,
    estimasiBelumTerjual: 25200,
    akumulasiTersalurkan: 97500,
    status: "Aktif",
    terakhir: "27 Okt 2026",
  },
  {
    nomor: "BSS-0033",
    nama: "Rizal Hamdani",
    email: "rizal@uinsa.ac.id",
    fakultas: "FEBI (Ekonomi Syariah)",
    totalSetorKg: 102.6,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 254000,
    status: "Aktif",
    terakhir: "21 Okt 2026",
  },
  {
    nomor: "BSS-0176",
    nama: "Siti Fauziah",
    email: "siti.f@uinsa.ac.id",
    fakultas: "FTK (Pendidikan)",
    totalSetorKg: 27.4,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 63000,
    status: "Aktif",
    terakhir: "18 Okt 2026",
  },
  {
    nomor: "BSS-0198",
    nama: "Yusuf Maulana",
    email: "yusuf.m@uinsa.ac.id",
    fakultas: "FSH (Hukum)",
    totalSetorKg: 54.9,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 129000,
    status: "Aktif",
    terakhir: "15 Okt 2026",
  },
];

/* --------------------------------- Alur Setoran ke Pengepul (FR-026 s.d 033) */

export const BATCH_PENGEPUL_AWAL: BatchPenjualanPengepul[] = [
  {
    id: "BATCH-2026-10A",
    nomorBatch: "PL-2026/X/04",
    namaPengepul: "UD Makmur Daur Ulang",
    tahap: "disalurkan_ke_nasabah",
    totalBeratKg: 185.0,
    estimasiAwal: 580000,
    nilaiJualPengepul: 645000,
    uangDiterima: 645000,
    totalDisalurkan: 610000,
    selisihKasBss: 35000, // Selisih margin operasional BSS (FR-032)
    tanggalTerkumpul: "18 Okt 2026",
    tanggalJual: "21 Okt 2026",
    tanggalUangDiterima: "22 Okt 2026",
    tanggalDisalurkan: "23 Okt 2026",
    dicatatOleh: "Siti Nurhaliza (Bendahara)",
    daftarSetoranId: ["S-0901", "S-0900", "S-0887"],
    penyaluran: [
      {
        nomorNasabah: "BSS-0142",
        namaNasabah: "Aisyah Rahmawati",
        beratKg: 82.5,
        proporsiPersen: 44.59,
        hakUang: 272000,
      },
      {
        nomorNasabah: "BSS-0033",
        namaNasabah: "Rizal Hamdani",
        beratKg: 58.0,
        proporsiPersen: 31.35,
        hakUang: 191000,
      },
      {
        nomorNasabah: "BSS-0087",
        namaNasabah: "Bagus Prakoso",
        beratKg: 44.5,
        proporsiPersen: 24.06,
        hakUang: 147000,
      },
    ],
  },
  {
    id: "BATCH-2026-10B",
    nomorBatch: "PL-2026/X/05",
    namaPengepul: "CV Berkah Jaya Abadi",
    tahap: "uang_diterima",
    totalBeratKg: 120.5,
    estimasiAwal: 395000,
    nilaiJualPengepul: 430000,
    uangDiterima: 430000,
    totalDisalurkan: 0,
    selisihKasBss: 25000,
    tanggalTerkumpul: "24 Okt 2026",
    tanggalJual: "26 Okt 2026",
    tanggalUangDiterima: "27 Okt 2026",
    dicatatOleh: "Siti Nurhaliza (Bendahara)",
    daftarSetoranId: ["S-0910", "S-0911"],
    penyaluran: [
      {
        nomorNasabah: "BSS-0087",
        namaNasabah: "Bagus Prakoso",
        beratKg: 98.5,
        proporsiPersen: 81.74,
        hakUang: 331000,
      },
      {
        nomorNasabah: "BSS-0210",
        namaNasabah: "Nadia Salma",
        beratKg: 22.0,
        proporsiPersen: 18.26,
        hakUang: 74000,
      },
    ],
  },
];

/* --------------------------------- Data Riwayat Penarikan Saldo (Tarik Tunai) */

export const DAFTAR_PENARIKAN_AWAL: PenarikanUang[] = [
  {
    id: "TRK-0023",
    nomorNasabah: "BSS-0087",
    namaNasabah: "Bagus Prakoso",
    tanggal: "29 Okt 2026",
    nominal: 20000,
    metode: "tunai",
    tujuan: "Tunai di Pos Meja Timbang",
    catatan: "Pengajuan penarikan tunai menunggu validasi petugas jaga",
    status: "menunggu",
    petugas: "Menunggu Validasi Petugas Jaga",
  },
  {
    id: "TRK-0022",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "28 Okt 2026",
    nominal: 15000,
    metode: "ewallet",
    tujuan: "DANA — 0812-3456-7890",
    catatan: "Pencairan saldo otomatis ke E-Wallet DANA",
    status: "selesai",
    petugas: "Otomatis Sistem BSS (E-Wallet)",
  },
  {
    id: "TRK-0021",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "24 Okt 2026",
    nominal: 50000,
    metode: "tunai",
    tujuan: "Tunai di Pos Meja Timbang",
    catatan: "Penarikan tabungan wadiah tunai di pos meja timbang",
    status: "selesai",
    petugas: "Ahmad Fauzi (Petugas Piket)",
  },
  {
    id: "TRK-0019",
    nomorNasabah: "BSS-0087",
    namaNasabah: "Bagus Prakoso",
    tanggal: "22 Okt 2026",
    nominal: 100000,
    metode: "tunai",
    tujuan: "Tunai di Pos Meja Timbang",
    catatan: "Pencairan tabungan tunai di sekretariat BSS FEBI",
    status: "selesai",
    petugas: "Ahmad Fauzi (Petugas Piket)",
  },
  {
    id: "TRK-0015",
    nomorNasabah: "BSS-0142",
    namaNasabah: "Aisyah Rahmawati",
    tanggal: "10 Okt 2026",
    nominal: 60000,
    metode: "bank",
    tujuan: "Bank BSI — 7182930412",
    catatan: "Pencairan saldo tabungan via Transfer Bank BSI",
    status: "selesai",
    petugas: "Otomatis Sistem BSS (Transfer Bank)",
  },
  {
    id: "TRK-0012",
    nomorNasabah: "BSS-0033",
    namaNasabah: "Rizal Hamdani",
    tanggal: "15 Okt 2026",
    nominal: 80000,
    metode: "bank",
    tujuan: "Bank Mandiri — 14200981234",
    catatan: "Pencairan saldo via transfer rekening bank",
    status: "selesai",
    petugas: "Otomatis Sistem BSS (Transfer Bank)",
  },
];

/* --------------------------------- Storage Helpers untuk Sinkronisasi Dinamis & Persisten */

const PENARIKAN_KEY = "bss:penarikan:v3";
const PRICELIST_KEY = "bss:pricelist:v3";
const SETORAN_KEY = "bss:setoran:v3";

const adaJendela = () => typeof window !== "undefined";

export function formatMetodePenarikan(metode: MetodePenarikan): string {
  if (metode === "tunai") return "Tunai di Pos Jaga";
  if (metode === "ewallet") return "Saldo E-Wallet";
  return "Transfer Bank";
}

export function getDaftarPenarikan(): PenarikanUang[] {
  if (!adaJendela()) return DAFTAR_PENARIKAN_AWAL;
  try {
    const raw = window.localStorage.getItem(PENARIKAN_KEY);
    return raw ? JSON.parse(raw) : DAFTAR_PENARIKAN_AWAL;
  } catch {
    return DAFTAR_PENARIKAN_AWAL;
  }
}

export function simpanPenarikan(list: PenarikanUang[]) {
  if (!adaJendela()) return;
  try {
    window.localStorage.setItem(PENARIKAN_KEY, JSON.stringify(list));
  } catch {
    /* abaikan */
  }
}

export function tambahPenarikan(input: Omit<PenarikanUang, "id">): PenarikanUang {
  const list = getDaftarPenarikan();
  const idBaru = `TRK-00${list.length + 24}`;
  const baru: PenarikanUang = { ...input, id: idBaru };
  const updated = [baru, ...list];
  simpanPenarikan(updated);
  return baru;
}

export function validasiPenarikanTunai(id: string, namaPetugas: string): PenarikanUang[] {
  const list = getDaftarPenarikan();
  const updated = list.map((p) =>
    p.id === id
      ? {
          ...p,
          status: "selesai" as const,
          petugas: namaPetugas,
        }
      : p
  );
  simpanPenarikan(updated);
  return updated;
}

export function getPricelist(): JenisSampah[] {
  if (!adaJendela()) return PRICELIST_AWAL;
  try {
    const raw = window.localStorage.getItem(PRICELIST_KEY);
    return raw ? JSON.parse(raw) : PRICELIST_AWAL;
  } catch {
    return PRICELIST_AWAL;
  }
}

export function simpanPricelist(list: JenisSampah[]) {
  if (!adaJendela()) return;
  try {
    window.localStorage.setItem(PRICELIST_KEY, JSON.stringify(list));
  } catch {
    /* abaikan */
  }
}

export function getDaftarSetoran(): SetoranNasabah[] {
  if (!adaJendela()) return RIWAYAT_SETORAN_AWAL;
  try {
    const raw = window.localStorage.getItem(SETORAN_KEY);
    return raw ? JSON.parse(raw) : RIWAYAT_SETORAN_AWAL;
  } catch {
    return RIWAYAT_SETORAN_AWAL;
  }
}

export function simpanSetoran(list: SetoranNasabah[]) {
  if (!adaJendela()) return;
  try {
    window.localStorage.setItem(SETORAN_KEY, JSON.stringify(list));
  } catch {
    /* abaikan */
  }
}

export function tambahSetoranBaru(item: SetoranNasabah) {
  const current = getDaftarSetoran();
  const updated = [item, ...current];
  simpanSetoran(updated);
}

export function tambahBanyakSetoranBaru(items: SetoranNasabah[]) {
  const current = getDaftarSetoran();
  const updated = [...items, ...current];
  simpanSetoran(updated);
  return updated;
}

export function verifikasiSetoran(id: string, namaPetugas: string): SetoranNasabah[] {
  const current = getDaftarSetoran();
  const updated = current.map((s) =>
    s.id === id
      ? {
          ...s,
          statusVerifikasi: "terverifikasi" as const,
          dicatatOleh: namaPetugas,
        }
      : s
  );
  simpanSetoran(updated);
  return updated;
}

export function hitungRingkasanSaldoNasabah(nomorNasabah: string) {
  const semuaSetoran = getDaftarSetoran().filter((s) => s.nomorNasabah === nomorNasabah);
  const semuaPenarikan = getDaftarPenarikan().filter((p) => p.nomorNasabah === nomorNasabah);

  const setoranTerverifikasi = semuaSetoran.filter(
    (s) => s.statusVerifikasi !== "menunggu_verifikasi"
  );
  const setoranMenunggu = semuaSetoran.filter(
    (s) => s.statusVerifikasi === "menunggu_verifikasi"
  );

  const totalSaldoTerverifikasi = setoranTerverifikasi.reduce(
    (acc, s) => acc + (s.nilaiRealisasi ?? s.estimasiNilai),
    0
  );
  const totalMenungguVerifikasiRp = setoranMenunggu.reduce(
    (acc, s) => acc + s.estimasiNilai,
    0
  );
  const totalMenungguVerifikasiKg = setoranMenunggu.reduce(
    (acc, s) => acc + s.beratKg,
    0
  );
  const totalBeratTerverifikasiKg = setoranTerverifikasi.reduce(
    (acc, s) => acc + s.beratKg,
    0
  );
  const totalBeratSemuaKg = semuaSetoran.reduce((acc, s) => acc + s.beratKg, 0);

  const totalDitarikSelesai = semuaPenarikan
    .filter((p) => p.status === "selesai")
    .reduce((acc, p) => acc + p.nominal, 0);

  const totalDitarikMenunggu = semuaPenarikan
    .filter((p) => p.status === "menunggu")
    .reduce((acc, p) => acc + p.nominal, 0);

  const saldoTersedia = Math.max(
    0,
    totalSaldoTerverifikasi - totalDitarikSelesai - totalDitarikMenunggu
  );

  return {
    semuaSetoran,
    semuaPenarikan,
    setoranTerverifikasi,
    setoranMenunggu,
    totalSaldoTerverifikasi,
    totalMenungguVerifikasiRp,
    totalMenungguVerifikasiKg,
    totalBeratTerverifikasiKg,
    totalBeratSemuaKg,
    totalDitarikSelesai,
    totalDitarikMenunggu,
    saldoTersedia,
  };
}

export function getKategoriSampah(jenisSampahId: string, nama = ""): string {
  const id = (jenisSampahId || "").toUpperCase();
  const nm = (nama || "").toLowerCase();

  if (id.startsWith("A") || nm.includes("kardus") || nm.includes("kertas") || nm.includes("hvs") || nm.includes("koran")) {
    return "Kertas";
  }
  if (id.startsWith("B") || nm.includes("plastik") || nm.includes("pet") || nm.includes("galon") || nm.includes("gelas")) {
    return "Plastik";
  }
  if (
    id.startsWith("C") ||
    id.startsWith("K") ||
    id.startsWith("L") ||
    nm.includes("besi") ||
    nm.includes("logam") ||
    nm.includes("aluminium") ||
    nm.includes("tembaga") ||
    nm.includes("kaleng")
  ) {
    return "Logam";
  }
  if (id.startsWith("D") || id.startsWith("J") || nm.includes("kaca") || nm.includes("beling") || nm.includes("sirup")) {
    return "Kaca";
  }
  return "Lain-lain";
}

/* --------------------------------- Kompatibilitas backwards helper lama */
export const nasabah = {
  nama: NASABAH_DEMO.nama,
  nomor: NASABAH_DEMO.nomor,
  sejak: NASABAH_DEMO.terdaftarSejak,
  kontak: NASABAH_DEMO.email,
  alamat: "Gresik, Jawa Timur",
  saldo: NASABAH_DEMO.akumulasiTersalurkan,
  estimasiBelumTerjual: NASABAH_DEMO.estimasiBelumTerjual,
  berat: NASABAH_DEMO.totalBeratKg,
  sedekah: NASABAH_DEMO.totalSedekah,
};

export const riwayat: Setoran[] = RIWAYAT_SETORAN_AWAL.filter(
  (s) => s.nomorNasabah === "BSS-0142"
).map((s) => ({
  id: s.id,
  tanggal: s.tanggal,
  jenis: s.jenisSampahNama,
  berat: s.beratKg,
  nilai: s.status === "disalurkan" ? s.nilaiRealisasi ?? s.estimasiNilai : s.estimasiNilai,
  status: (s.status === "disalurkan" ? "selesai" : "menunggu") as Status,
  statusSrs: s.status,
}));

export const admin = {
  nasabahAktif: 128,
  beratBulan: 1240,
  saldoTerutang: 4820000,
  estimasiGudang: 61000,
  menunggu: 3,
};

export const antrean = RIWAYAT_SETORAN_AWAL.filter(
  (s) => s.status === "belum_terjual"
).map((s) => ({
  id: s.id,
  nama: s.namaNasabah,
  nomor: s.nomorNasabah,
  tanggal: s.tanggal,
  jenis: s.jenisSampahNama,
  berat: s.beratKg,
  nilai: s.estimasiNilai,
}));

export const setoranMasuk: (Setoran & { nama: string; nomor: string })[] =
  RIWAYAT_SETORAN_AWAL.map((s) => ({
    id: s.id,
    nama: s.namaNasabah,
    nomor: s.nomorNasabah,
    tanggal: s.tanggal,
    jenis: s.jenisSampahNama,
    berat: s.beratKg,
    nilai:
      s.status === "disalurkan"
        ? s.nilaiRealisasi ?? s.estimasiNilai
        : s.estimasiNilai,
    status: (s.status === "disalurkan" ? "selesai" : "menunggu") as Status,
    statusSrs: s.status,
  }));

export const daftarNasabah = DAFTAR_NASABAH_MASTER.map((n) => ({
  nama: n.nama,
  nomor: n.nomor,
  saldo: n.akumulasiTersalurkan,
  berat: n.totalSetorKg,
  terakhir: n.terakhir,
}));
