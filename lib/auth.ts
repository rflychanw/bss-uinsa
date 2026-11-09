/**
 * Autentikasi & Manajemen Akun (CRUD) BSS UINSA.
 *
 * Mengakomodasi 4 Peran Pengguna:
 * 1. nasabah   - Mengakses /nasabah (informasi saldo, kalkulator, riwayat transaksi)
 * 2. petugas   - Mengakses /admin (pencatatan setoran & kalkulator pintar) -> email: usernamegmail@petugas.com
 * 3. bendahara - Mengakses /admin (rekapitulasi keuangan, alur penjualan pengepul, ekspor) -> email: usernamegmail@bendahara.com
 * 4. admin     - Mengakses /admin (monitoring sistem, manajemen akun CRUD, master pricelist)
 */

export type Role = "nasabah" | "petugas" | "bendahara" | "admin";
export type KategoriNasabah = "umum" | "internal";

export type Akun = {
  email: string;
  sandi: string;
  role: Role;
  nama: string;
  nomor: string;
  kategori?: KategoriNasabah;
  fakultas?: string;
  prodi?: string;
  jabatan?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  buktiFollowBss?: string;
  namaFileBuktiBss?: string;
  buktiFollowLab?: string;
  namaFileBuktiLab?: string;
  tanggalUploadBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
  tanggalDaftar?: string;
  /** Tanggal terakhir menyetor sampah (khusus nasabah, untuk penentuan Aktif / Tidak Aktif > 1 bulan) */
  terakhirSetor?: string;
  totalSetorKg?: number;
  estimasiBelumTerjual?: number;
  akumulasiTersalurkan?: number;
};

export type Sesi = {
  email: string;
  nama: string;
  nomor: string;
  role: Role;
  kategori?: KategoriNasabah;
  fakultas?: string;
  prodi?: string;
  jabatan?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  buktiFollowBss?: string;
  namaFileBuktiBss?: string;
  buktiFollowLab?: string;
  namaFileBuktiLab?: string;
  tanggalUploadBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
  tanggalDaftar?: string;
};

/** Akun bawaan awal yang mencakup Admin, Petugas, Bendahara, dan Nasabah. */
export const AKUN_AWAL_MASTER: Akun[] = [
  // --- ADMIN ---
  {
    email: "admin@bss.test",
    sandi: "admin123",
    role: "admin",
    nama: "Petugas Sekretariat",
    nomor: "ADMIN-01",
    jabatan: "Administrator Sistem BSS",
    statusVerifikasi: "aktif",
    tanggalDaftar: "01 Jan 2026",
  },
  // --- PETUGAS (@petugas.com) ---
  {
    email: "ahmadfauzigmail@petugas.com",
    sandi: "petugas123",
    role: "petugas",
    nama: "Ahmad Fauzi",
    nomor: "PETUGAS-01",
    jabatan: "Petugas Jaga Piket BSS",
    statusVerifikasi: "aktif",
    tanggalDaftar: "10 Jan 2026",
  },
  {
    email: "budisantosogmail@petugas.com",
    sandi: "petugas123",
    role: "petugas",
    nama: "Budi Santoso",
    nomor: "PETUGAS-02",
    jabatan: "Petugas Jaga Pos Timbang",
    statusVerifikasi: "aktif",
    tanggalDaftar: "15 Feb 2026",
  },
  // --- BENDAHARA (@bendahara.com) ---
  {
    email: "sitinurhalizagmail@bendahara.com",
    sandi: "bendahara123",
    role: "bendahara",
    nama: "Siti Nurhaliza",
    nomor: "BENDAHARA-01",
    jabatan: "Bendahara Pengelola BSS",
    statusVerifikasi: "aktif",
    tanggalDaftar: "10 Jan 2026",
  },
  // --- NASABAH (4 Aktif <= 1 bulan, 2 Tidak Aktif > 1 bulan) ---
  {
    email: "nasabah@bss.test",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Aisyah Rahmawati",
    nomor: "BSS-0142",
    kategori: "internal",
    fakultas: "FEBI",
    prodi: "Sistem Informasi",
    jabatan: "Civitas UINSA (FEBI - Sistem Informasi)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "12 Mar 2025",
    terakhirSetor: "29 Okt 2026",
    totalSetorKg: 78.5,
    estimasiBelumTerjual: 16800,
    akumulasiTersalurkan: 186500,
  },
  {
    email: "bagus@uinsa.ac.id",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Bagus Prakoso",
    nomor: "BSS-0087",
    kategori: "internal",
    fakultas: "FST",
    prodi: "Teknik Lingkungan",
    jabatan: "Civitas UINSA (FST - Teknik Lingkungan)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "05 Apr 2025",
    terakhirSetor: "28 Okt 2026",
    totalSetorKg: 164.2,
    estimasiBelumTerjual: 19000,
    akumulasiTersalurkan: 412000,
  },
  {
    email: "nadia@uinsa.ac.id",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Nadia Salma",
    nomor: "BSS-0210",
    kategori: "internal",
    fakultas: "FDK",
    prodi: "Ilmu Komunikasi",
    jabatan: "Civitas UINSA (FDK - Ilmu Komunikasi)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "19 Mei 2025",
    terakhirSetor: "27 Okt 2026",
    totalSetorKg: 41.8,
    estimasiBelumTerjual: 25200,
    akumulasiTersalurkan: 97500,
  },
  {
    email: "rizal@uinsa.ac.id",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Rizal Hamdani",
    nomor: "BSS-0033",
    kategori: "internal",
    fakultas: "FEBI",
    prodi: "Ekonomi Syariah",
    jabatan: "Civitas UINSA (FEBI - Ekonomi Syariah)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "02 Jun 2025",
    terakhirSetor: "21 Okt 2026",
    totalSetorKg: 102.6,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 254000,
  },
  {
    email: "siti.f@uinsa.ac.id",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Siti Fauziah",
    nomor: "BSS-0176",
    kategori: "internal",
    fakultas: "FTK",
    prodi: "Pendidikan Agama Islam",
    jabatan: "Civitas UINSA (FTK - Pendidikan Agama Islam)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "14 Jul 2025",
    terakhirSetor: "20 Sep 2026", // > 1 bulan tidak menyetor -> Tidak Aktif
    totalSetorKg: 27.4,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 63000,
  },
  {
    email: "yusuf.m@uinsa.ac.id",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Yusuf Maulana",
    nomor: "BSS-0198",
    kategori: "internal",
    fakultas: "FSH",
    prodi: "Ilmu Hukum",
    jabatan: "Civitas UINSA (FSH - Ilmu Hukum)",
    statusVerifikasi: "aktif",
    tanggalDaftar: "22 Agu 2025",
    terakhirSetor: "05 Sep 2026", // > 1 bulan tidak menyetor -> Tidak Aktif
    totalSetorKg: 54.9,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 129000,
  },
];

/** Akun demo utama untuk halaman /masuk. */
export const AKUN_DEMO: Akun[] = [
  AKUN_AWAL_MASTER.find((a) => a.nomor === "BSS-0142")!,
  AKUN_AWAL_MASTER.find((a) => a.nomor === "PETUGAS-01")!,
  AKUN_AWAL_MASTER.find((a) => a.nomor === "BENDAHARA-01")!,
  AKUN_AWAL_MASTER.find((a) => a.nomor === "ADMIN-01")!,
];

const SESI_KEY = "bss:sesi";
const AKUN_KEY = "bss:akun";
const AKUN_MASTER_KEY = "bss:akun_master:v4";

const ada = () => typeof window !== "undefined";

function baca<T>(key: string): T | null {
  if (!ada()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function tulis(key: string, value: unknown) {
  if (!ada()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* mode privat / kuota penuh — abaikan */
  }
}

/**
 * Format otomatis email untuk Petugas (usernamegmail@petugas.com)
 * dan Bendahara (usernamegmail@bendahara.com).
 */
export function formatEmailSesuaiRole(rawInput: string, role: Role): string {
  const clean = rawInput.trim().toLowerCase().replace(/\s+/g, "");
  if (!clean) return "";

  if (role === "petugas") {
    if (clean.endsWith("@petugas.com")) return clean;
    if (clean.endsWith("@gmail.com")) {
      const prefix = clean.slice(0, -"@gmail.com".length);
      return `${prefix}gmail@petugas.com`;
    }
    const base = clean.includes("@") ? clean.split("@")[0] : clean;
    return `${base}@petugas.com`;
  }

  if (role === "bendahara") {
    if (clean.endsWith("@bendahara.com")) return clean;
    if (clean.endsWith("@gmail.com")) {
      const prefix = clean.slice(0, -"@gmail.com".length);
      return `${prefix}gmail@bendahara.com`;
    }
    const base = clean.includes("@") ? clean.split("@")[0] : clean;
    return `${base}@bendahara.com`;
  }

  if (!clean.includes("@")) {
    return `${clean}@${role === "admin" ? "admin.com" : "gmail.com"}`;
  }
  return clean;
}

/** Mengambil seluruh daftar akun dari penyimpanan master (Nasabah, Petugas, Bendahara, Admin). */
export function semuaAkun(): Akun[] {
  if (!ada()) return AKUN_AWAL_MASTER;
  const master = baca<Akun[]>(AKUN_MASTER_KEY);
  if (Array.isArray(master) && master.length > 0) {
    return master;
  }
  // Inisialisasi pertama kali dan gabungkan bila ada akun pendaftaran lokal lama
  const lokalLama = baca<Akun[]>(AKUN_KEY) || [];
  const emailSudahAda = new Set(AKUN_AWAL_MASTER.map((a) => a.email.toLowerCase()));
  const tambahan = lokalLama
    .filter((a) => !emailSudahAda.has(a.email.toLowerCase()))
    .map((a) => ({
      ...a,
      statusVerifikasi: "aktif" as const,
      terakhirSetor: a.terakhirSetor || a.tanggalDaftar || "09 Nov 2026",
    }));
  const gabungan = [...AKUN_AWAL_MASTER, ...tambahan];
  tulis(AKUN_MASTER_KEY, gabungan);
  return gabungan;
}

export function simpanSemuaAkun(daftar: Akun[]) {
  tulis(AKUN_MASTER_KEY, daftar);
}

/** Kompatibilitas fungsi lama */
export function akunLokal(): Akun[] {
  return semuaAkun().filter((a) => a.role === "nasabah");
}

export function nomorAkunBaru(role: Role): string {
  const list = semuaAkun().filter((a) => a.role === role);
  const prefix =
    role === "nasabah"
      ? "BSS-"
      : role === "petugas"
      ? "PETUGAS-"
      : role === "bendahara"
      ? "BENDAHARA-"
      : "ADMIN-";

  let maxNum = role === "nasabah" ? 210 : list.length;
  for (const a of list) {
    const match = a.nomor.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const next = maxNum + 1;
  return role === "nasabah"
    ? `${prefix}${String(next).padStart(4, "0")}`
    : `${prefix}${String(next).padStart(2, "0")}`;
}

export function nomorNasabahBaru(): string {
  return nomorAkunBaru("nasabah");
}

export function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * CRUD - CREATE: Tambah akun baru (Nasabah, Petugas, Bendahara, Admin)
 */
export function tambahAkunCRUD(input: {
  nama: string;
  email: string;
  sandi: string;
  role: Role;
  nomor?: string;
  kategori?: KategoriNasabah;
  fakultas?: string;
  prodi?: string;
  jabatan?: string;
  terakhirSetor?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  buktiFollowBss?: string;
  namaFileBuktiBss?: string;
  buktiFollowLab?: string;
  namaFileBuktiLab?: string;
  tanggalUploadBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
}): { ok: true; akun: Akun } | { ok: false; pesan: string } {
  const nama = input.nama.trim();
  if (nama.length < 2) {
    return { ok: false, pesan: "Nama lengkap minimal 2 karakter." };
  }
  if (!input.sandi || input.sandi.length < 4) {
    return { ok: false, pesan: "Kata sandi minimal 4 karakter." };
  }

  const emailFormatted = formatEmailSesuaiRole(input.email, input.role);
  if (!emailValid(emailFormatted)) {
    return { ok: false, pesan: "Format email tidak valid." };
  }

  if (input.role === "petugas" && !emailFormatted.endsWith("@petugas.com")) {
    return {
      ok: false,
      pesan: "Email akun petugas wajib berakhiran @petugas.com (contoh: usernamegmail@petugas.com).",
    };
  }
  if (input.role === "bendahara" && !emailFormatted.endsWith("@bendahara.com")) {
    return {
      ok: false,
      pesan: "Email akun bendahara wajib berakhiran @bendahara.com (contoh: usernamegmail@bendahara.com).",
    };
  }

  const list = semuaAkun();
  if (list.some((a) => a.email.toLowerCase() === emailFormatted.toLowerCase())) {
    return { ok: false, pesan: `Email ${emailFormatted} sudah digunakan oleh akun lain.` };
  }

  const nomor = input.nomor?.trim() || nomorAkunBaru(input.role);
  if (list.some((a) => a.nomor.toLowerCase() === nomor.toLowerCase())) {
    return { ok: false, pesan: `Nomor ID ${nomor} sudah terdaftar.` };
  }

  const sekarang = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const kategori: KategoriNasabah = input.kategori || "internal";
  const fakultas = input.fakultas?.trim() || "FEBI";
  const prodi = input.prodi?.trim() || "Sistem Informasi";

  const jabatanDefault =
    input.jabatan?.trim() ||
    (input.role === "petugas"
      ? "Petugas Jaga Piket BSS"
      : input.role === "bendahara"
      ? "Bendahara Pengelola BSS"
      : input.role === "admin"
      ? "Administrator Sistem BSS"
      : kategori === "internal"
      ? `Civitas UINSA (${fakultas}${prodi ? ` - ${prodi}` : ""})`
      : "Nasabah Umum");

  const akunBaru: Akun = {
    nama,
    email: emailFormatted,
    sandi: input.sandi,
    role: input.role,
    nomor,
    kategori: input.role === "nasabah" ? kategori : undefined,
    fakultas: input.role === "nasabah" ? (kategori === "internal" ? fakultas : "Umum") : undefined,
    prodi: input.role === "nasabah" && kategori === "internal" ? prodi : undefined,
    jabatan: jabatanDefault,
    statusVerifikasi: input.statusVerifikasi || (input.role === "nasabah" ? "menunggu" : "aktif"),
    tanggalDaftar: sekarang,
    terakhirSetor: input.role === "nasabah" ? input.terakhirSetor || sekarang : undefined,
    totalSetorKg: 0,
    estimasiBelumTerjual: 0,
    akumulasiTersalurkan: 0,
    buktiBayar: input.buktiBayar || input.buktiFollowBss,
    namaFileBukti: input.namaFileBukti || input.namaFileBuktiBss,
    buktiFollowBss: input.buktiFollowBss,
    namaFileBuktiBss: input.namaFileBuktiBss,
    buktiFollowLab: input.buktiFollowLab,
    namaFileBuktiLab: input.namaFileBuktiLab,
    tanggalUploadBukti: input.tanggalUploadBukti,
    metodeBayar: input.metodeBayar || "qris",
  };

  const updated = [akunBaru, ...list];
  simpanSemuaAkun(updated);
  return { ok: true, akun: akunBaru };
}

/**
 * CRUD - UPDATE: Perbarui data akun berdasarkan nomor atau email asal
 */
export function updateAkunCRUD(
  identitasLama: string,
  perubahan: {
    nama?: string;
    email?: string;
    sandi?: string;
    role?: Role;
    nomor?: string;
    kategori?: KategoriNasabah;
    fakultas?: string;
    prodi?: string;
    jabatan?: string;
    terakhirSetor?: string;
    statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
    buktiBayar?: string;
    namaFileBukti?: string;
    buktiFollowBss?: string;
    namaFileBuktiBss?: string;
    buktiFollowLab?: string;
    namaFileBuktiLab?: string;
    tanggalUploadBukti?: string;
    metodeBayar?: string;
  }
): { ok: true; akun: Akun } | { ok: false; pesan: string } {
  const list = semuaAkun();
  const q = identitasLama.trim().toLowerCase();
  const idx = list.findIndex(
    (a) => a.nomor.toLowerCase() === q || a.email.toLowerCase() === q
  );
  if (idx === -1) {
    return { ok: false, pesan: "Akun tidak ditemukan." };
  }

  const target = list[idx];
  const roleBaru = perubahan.role || target.role;
  const namaBaru = perubahan.nama !== undefined ? perubahan.nama.trim() : target.nama;
  if (namaBaru.length < 2) {
    return { ok: false, pesan: "Nama lengkap minimal 2 karakter." };
  }

  const emailMentah = perubahan.email !== undefined ? perubahan.email : target.email;
  const emailBaru = formatEmailSesuaiRole(emailMentah, roleBaru);
  if (!emailValid(emailBaru)) {
    return { ok: false, pesan: "Format email tidak valid." };
  }

  if (roleBaru === "petugas" && !emailBaru.endsWith("@petugas.com")) {
    return {
      ok: false,
      pesan: "Email petugas wajib menggunakan domain @petugas.com.",
    };
  }
  if (roleBaru === "bendahara" && !emailBaru.endsWith("@bendahara.com")) {
    return {
      ok: false,
      pesan: "Email bendahara wajib menggunakan domain @bendahara.com.",
    };
  }

  // Cek duplikasi email dengan akun lain
  const duplikatEmail = list.some(
    (a, i) => i !== idx && a.email.toLowerCase() === emailBaru.toLowerCase()
  );
  if (duplikatEmail) {
    return { ok: false, pesan: `Email ${emailBaru} sudah dipakai oleh akun lain.` };
  }

  const nomorBaru = perubahan.nomor?.trim() || target.nomor;
  const duplikatNomor = list.some(
    (a, i) => i !== idx && a.nomor.toLowerCase() === nomorBaru.toLowerCase()
  );
  if (duplikatNomor) {
    return { ok: false, pesan: `Nomor ID ${nomorBaru} sudah dipakai oleh akun lain.` };
  }

  const sandiBaru = perubahan.sandi !== undefined && perubahan.sandi.trim() !== ""
    ? perubahan.sandi
    : target.sandi;

  const kategoriBaru = perubahan.kategori || target.kategori || "internal";
  const fakultasBaru =
    perubahan.fakultas !== undefined ? perubahan.fakultas : target.fakultas;
  const prodiBaru =
    perubahan.prodi !== undefined ? perubahan.prodi : target.prodi;

  const jabatanBaru =
    perubahan.jabatan !== undefined
      ? perubahan.jabatan
      : roleBaru === "nasabah"
      ? kategoriBaru === "internal"
        ? `Civitas UINSA (${fakultasBaru || "Kampus"}${prodiBaru ? ` - ${prodiBaru}` : ""})`
        : "Nasabah Umum"
      : target.jabatan;

  const akunUpdated: Akun = {
    ...target,
    nama: namaBaru,
    email: emailBaru,
    sandi: sandiBaru,
    role: roleBaru,
    nomor: nomorBaru,
    kategori: roleBaru === "nasabah" ? kategoriBaru : undefined,
    fakultas: roleBaru === "nasabah" ? fakultasBaru : undefined,
    prodi: roleBaru === "nasabah" ? prodiBaru : undefined,
    jabatan: jabatanBaru,
    terakhirSetor:
      perubahan.terakhirSetor !== undefined
        ? perubahan.terakhirSetor
        : target.terakhirSetor,
    statusVerifikasi:
      perubahan.statusVerifikasi !== undefined
        ? perubahan.statusVerifikasi
        : target.statusVerifikasi,
    buktiBayar:
      perubahan.buktiBayar !== undefined
        ? perubahan.buktiBayar
        : target.buktiBayar,
    namaFileBukti:
      perubahan.namaFileBukti !== undefined
        ? perubahan.namaFileBukti
        : target.namaFileBukti,
    buktiFollowBss:
      perubahan.buktiFollowBss !== undefined
        ? perubahan.buktiFollowBss
        : target.buktiFollowBss,
    namaFileBuktiBss:
      perubahan.namaFileBuktiBss !== undefined
        ? perubahan.namaFileBuktiBss
        : target.namaFileBuktiBss,
    buktiFollowLab:
      perubahan.buktiFollowLab !== undefined
        ? perubahan.buktiFollowLab
        : target.buktiFollowLab,
    namaFileBuktiLab:
      perubahan.namaFileBuktiLab !== undefined
        ? perubahan.namaFileBuktiLab
        : target.namaFileBuktiLab,
    tanggalUploadBukti:
      perubahan.tanggalUploadBukti !== undefined
        ? perubahan.tanggalUploadBukti
        : target.tanggalUploadBukti,
    metodeBayar:
      perubahan.metodeBayar !== undefined
        ? perubahan.metodeBayar
        : target.metodeBayar,
  };

  const listBaru = [...list];
  listBaru[idx] = akunUpdated;
  simpanSemuaAkun(listBaru);

  // Sinkronkan sesi jika akun yang sedang login diedit
  const sesi = sesiSekarang();
  if (
    sesi &&
    (sesi.nomor.toLowerCase() === q || sesi.email.toLowerCase() === q)
  ) {
    tulis(SESI_KEY, {
      ...sesi,
      email: akunUpdated.email,
      nama: akunUpdated.nama,
      nomor: akunUpdated.nomor,
      role: akunUpdated.role,
      jabatan: akunUpdated.jabatan,
      fakultas: akunUpdated.fakultas,
      prodi: akunUpdated.prodi,
    });
  }

  return { ok: true, akun: akunUpdated };
}

/**
 * CRUD - DELETE: Hapus akun berdasarkan nomor atau email
 */
export function hapusAkunCRUD(
  identitas: string
): { ok: true; terhapus: Akun } | { ok: false; pesan: string } {
  const list = semuaAkun();
  const q = identitas.trim().toLowerCase();
  const target = list.find(
    (a) => a.nomor.toLowerCase() === q || a.email.toLowerCase() === q
  );
  if (!target) {
    return { ok: false, pesan: "Akun tidak ditemukan." };
  }

  const sisa = list.filter(
    (a) => a.nomor.toLowerCase() !== q && a.email.toLowerCase() !== q
  );
  simpanSemuaAkun(sisa);
  return { ok: true, terhapus: target };
}

/**
 * Dipanggil otomatis ketika nasabah menyetor sampah agar status keaktifannya
 * langsung diperbarui menjadi Aktif kembali.
 */
export function catatSetoranTerakhirAkun(nomorNasabah: string, tanggal: string) {
  const list = semuaAkun();
  const q = nomorNasabah.trim().toLowerCase();
  let berubah = false;
  const updated = list.map((a) => {
    if (a.nomor.toLowerCase() === q) {
      berubah = true;
      return {
        ...a,
        terakhirSetor: tanggal,
      };
    }
    return a;
  });
  if (berubah) {
    simpanSemuaAkun(updated);
  }
}

export function masuk(
  email: string,
  sandi: string
): { ok: true; sesi: Sesi } | { ok: false; pesan: string } {
  const cari = email.trim().toLowerCase();
  if (!cari) return { ok: false, pesan: "Email belum diisi." };
  if (!sandi) return { ok: false, pesan: "Kata sandi belum diisi." };

  const daftar = semuaAkun();
  let akun = daftar.find((a) => a.email.toLowerCase() === cari);

  // Dukungan alias email demo lama agar tidak gagal login
  if (!akun) {
    if (cari === "petugas@bss.test") {
      akun = daftar.find((a) => a.role === "petugas");
    } else if (cari === "bendahara@bss.test") {
      akun = daftar.find((a) => a.role === "bendahara");
    }
  }

  if (!akun) {
    return {
      ok: false,
      pesan: "Email belum terdaftar di sistem. Gunakan akun yang tersedia atau buat akun terlebih dahulu.",
    };
  }
  if (akun.sandi !== sandi) {
    return { ok: false, pesan: "Kata sandi salah. Coba lagi." };
  }

  const sesi: Sesi = {
    email: akun.email,
    nama: akun.nama,
    nomor: akun.nomor,
    role: akun.role,
    kategori: akun.kategori,
    fakultas: akun.fakultas,
    prodi: akun.prodi,
    jabatan: akun.jabatan,
    buktiBayar: akun.buktiBayar,
    namaFileBukti: akun.namaFileBukti,
    buktiFollowBss: akun.buktiFollowBss,
    namaFileBuktiBss: akun.namaFileBuktiBss,
    buktiFollowLab: akun.buktiFollowLab,
    namaFileBuktiLab: akun.namaFileBuktiLab,
    tanggalUploadBukti: akun.tanggalUploadBukti,
    metodeBayar: akun.metodeBayar,
    statusVerifikasi: akun.statusVerifikasi || "aktif",
    tanggalDaftar: akun.tanggalDaftar,
  };
  tulis(SESI_KEY, sesi);
  return { ok: true, sesi };
}

export function daftar(input: {
  nama: string;
  email: string;
  sandi: string;
  kategori?: KategoriNasabah;
  fakultas?: string;
  prodi?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  buktiFollowBss?: string;
  namaFileBuktiBss?: string;
  buktiFollowLab?: string;
  namaFileBuktiLab?: string;
  tanggalUploadBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
}): { ok: true; nomor: string; email: string; nama: string } | { ok: false; pesan: string } {
  const hasil = tambahAkunCRUD({
    nama: input.nama,
    email: input.email,
    sandi: input.sandi,
    role: "nasabah",
    kategori: input.kategori,
    fakultas: input.fakultas,
    prodi: input.prodi,
    buktiBayar: input.buktiBayar,
    namaFileBukti: input.namaFileBukti,
    buktiFollowBss: input.buktiFollowBss,
    namaFileBuktiBss: input.namaFileBuktiBss,
    buktiFollowLab: input.buktiFollowLab,
    namaFileBuktiLab: input.namaFileBuktiLab,
    tanggalUploadBukti: input.tanggalUploadBukti,
    metodeBayar: input.metodeBayar,
    statusVerifikasi: input.statusVerifikasi || "menunggu",
  });
  if (!hasil.ok) return hasil;
  return {
    ok: true,
    nomor: hasil.akun.nomor,
    email: hasil.akun.email,
    nama: hasil.akun.nama,
  };
}

export function verifikasiAkun(emailOrNomor: string): boolean {
  const res = updateAkunCRUD(emailOrNomor, { statusVerifikasi: "aktif" });
  return res.ok;
}

export function tolakAkun(emailOrNomor: string): boolean {
  const res = updateAkunCRUD(emailOrNomor, { statusVerifikasi: "ditolak" });
  return res.ok;
}

export function daftarAkunMenunggu(): Akun[] {
  return [];
}

export function sesiSekarang(): Sesi | null {
  const sesi = baca<Sesi>(SESI_KEY);
  if (!sesi || typeof sesi !== "object") return null;
  const roles: Role[] = ["nasabah", "petugas", "bendahara", "admin"];
  if (!roles.includes(sesi.role)) return null;
  if (!sesi.nama) return null;
  return sesi;
}

export function keluar() {
  if (!ada()) return;
  try {
    window.localStorage.removeItem(SESI_KEY);
  } catch {
    /* abaikan */
  }
}

/** Halaman tujuan bawaan untuk sebuah peran. */
export const beranda = (role: Role) => (role === "nasabah" ? "/nasabah" : "/admin");
