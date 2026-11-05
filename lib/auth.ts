/**
 * Autentikasi demo BSS UINSA.
 *
 * Mengakomodasi 4 Peran Pengguna sesuai SRS v1.1:
 * 1. nasabah   - Mengakses /nasabah (informasi saldo, kalkulator, riwayat transaksi)
 * 2. petugas   - Mengakses /admin (pencatatan setoran & kalkulator pintar)
 * 3. bendahara - Mengakses /admin (rekapitulasi keuangan, alur penjualan pengepul, ekspor)
 * 4. admin     - Mengakses /admin (pemantauan menyeluruh, data master, audit trail)
 *
 * Akun di-hardcode di berkas ini (lihat AKUN_DEMO).
 * Sesi disimpan di localStorage perangkat browser.
 */

export type Role = "nasabah" | "petugas" | "bendahara" | "admin";

export type Akun = {
  email: string;
  sandi: string;
  role: Role;
  nama: string;
  nomor: string;
  jabatan?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
  tanggalDaftar?: string;
};

export type Sesi = {
  email: string;
  nama: string;
  nomor: string;
  role: Role;
  jabatan?: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  metodeBayar?: string;
  statusVerifikasi?: "aktif" | "menunggu" | "ditolak";
  tanggalDaftar?: string;
};

/** Akun demo yang selalu tersedia mengacu pada SRS v1.1. */
export const AKUN_DEMO: Akun[] = [
  {
    email: "nasabah@bss.test",
    sandi: "nasabah123",
    role: "nasabah",
    nama: "Aisyah Rahmawati",
    nomor: "BSS-0142",
    jabatan: "Nasabah (Mahasiswa FEBI)",
    statusVerifikasi: "aktif",
  },
  {
    email: "petugas@bss.test",
    sandi: "petugas123",
    role: "petugas",
    nama: "Ahmad Fauzi",
    nomor: "PETUGAS-01",
    jabatan: "Petugas Jaga Piket BSS",
    statusVerifikasi: "aktif",
  },
  {
    email: "bendahara@bss.test",
    sandi: "bendahara123",
    role: "bendahara",
    nama: "Siti Nurhaliza",
    nomor: "BENDAHARA-01",
    jabatan: "Bendahara Pengelola BSS",
    statusVerifikasi: "aktif",
  },
  {
    email: "admin@bss.test",
    sandi: "admin123",
    role: "admin",
    nama: "Petugas Sekretariat",
    nomor: "ADMIN-BSS",
    jabatan: "Administrator Sistem BSS",
    statusVerifikasi: "aktif",
  },
];

const SESI_KEY = "bss:sesi";
const AKUN_KEY = "bss:akun";

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

/** Akun hasil halaman /daftar (hanya di perangkat ini). */
export function akunLokal(): Akun[] {
  const daftar = baca<Akun[]>(AKUN_KEY);
  return Array.isArray(daftar) ? daftar : [];
}

export function semuaAkun(): Akun[] {
  return [...AKUN_DEMO, ...akunLokal()];
}

export function nomorNasabahBaru(): string {
  const n = 300 + akunLokal().length * 7;
  return `BSS-0${n}`;
}

export function emailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function masuk(
  email: string,
  sandi: string
): { ok: true; sesi: Sesi } | { ok: false; pesan: string } {
  const cari = email.trim().toLowerCase();
  if (!cari) return { ok: false, pesan: "Email belum diisi." };
  if (!sandi) return { ok: false, pesan: "Kata sandi belum diisi." };

  const akun = semuaAkun().find((a) => a.email.toLowerCase() === cari);
  if (!akun) {
    return {
      ok: false,
      pesan: "Email itu belum terdaftar di perangkat ini. Pakai akun demo di bawah, atau daftar dulu.",
    };
  }
  if (akun.sandi !== sandi) {
    return { ok: false, pesan: "Kata sandi salah. Coba lagi." };
  }
  if (akun.statusVerifikasi === "menunggu") {
    return {
      ok: false,
      pesan: `Akun Anda (${akun.nomor}) sedang menunggu proses verifikasi oleh Admin BSS. Silakan tunggu hingga berkas bukti pembayaran diverifikasi.`,
    };
  }

  const sesi: Sesi = {
    email: akun.email,
    nama: akun.nama,
    nomor: akun.nomor,
    role: akun.role,
    jabatan: akun.jabatan,
    buktiBayar: akun.buktiBayar,
    namaFileBukti: akun.namaFileBukti,
    metodeBayar: akun.metodeBayar,
    statusVerifikasi: akun.statusVerifikasi,
    tanggalDaftar: akun.tanggalDaftar,
  };
  tulis(SESI_KEY, sesi);
  return { ok: true, sesi };
}

export function daftar(input: {
  nama: string;
  email: string;
  sandi: string;
  buktiBayar?: string;
  namaFileBukti?: string;
  metodeBayar?: string;
}): { ok: true; nomor: string; email: string; nama: string } | { ok: false; pesan: string } {
  const nama = input.nama.trim();
  const email = input.email.trim().toLowerCase();

  if (nama.length < 2) return { ok: false, pesan: "Nama lengkap minimal 2 karakter." };
  if (!emailValid(email)) return { ok: false, pesan: "Format email belum benar." };
  if (input.sandi.length < 8) {
    return { ok: false, pesan: "Kata sandi minimal 8 karakter." };
  }
  if (semuaAkun().some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, pesan: "Email itu sudah terdaftar. Langsung masuk saja." };
  }

  const nomor = nomorNasabahBaru();
  const sekarang = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const akun: Akun = {
    email,
    sandi: input.sandi,
    role: "nasabah",
    nama,
    nomor,
    jabatan: "Nasabah Baru (Menunggu Verifikasi)",
    buktiBayar: input.buktiBayar,
    namaFileBukti: input.namaFileBukti,
    metodeBayar: input.metodeBayar,
    statusVerifikasi: "menunggu",
    tanggalDaftar: sekarang,
  };
  tulis(AKUN_KEY, [...akunLokal(), akun]);

  // Tidak menyimpan ke SESI_KEY agar akun harus diverifikasi admin terlebih dahulu
  return { ok: true, nomor, email, nama };
}

export function verifikasiAkun(emailOrNomor: string): boolean {
  const list = akunLokal();
  const q = emailOrNomor.trim().toLowerCase();
  let found = false;
  const updated = list.map((a) => {
    if (a.email.toLowerCase() === q || a.nomor.toLowerCase() === q) {
      found = true;
      return {
        ...a,
        statusVerifikasi: "aktif" as const,
        jabatan: "Nasabah Aktif (Wadiah)",
      };
    }
    return a;
  });
  if (found) {
    tulis(AKUN_KEY, updated);
  }
  return found;
}

export function tolakAkun(emailOrNomor: string): boolean {
  const list = akunLokal();
  const q = emailOrNomor.trim().toLowerCase();
  let found = false;
  const updated = list.map((a) => {
    if (a.email.toLowerCase() === q || a.nomor.toLowerCase() === q) {
      found = true;
      return {
        ...a,
        statusVerifikasi: "ditolak" as const,
        jabatan: "Pendaftaran Ditolak",
      };
    }
    return a;
  });
  if (found) {
    tulis(AKUN_KEY, updated);
  }
  return found;
}

export function daftarAkunMenunggu(): Akun[] {
  return akunLokal().filter((a) => a.statusVerifikasi === "menunggu");
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
