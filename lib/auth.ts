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
};

export type Sesi = {
  email: string;
  nama: string;
  nomor: string;
  role: Role;
  jabatan?: string;
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
  },
  {
    email: "petugas@bss.test",
    sandi: "petugas123",
    role: "petugas",
    nama: "Ahmad Fauzi",
    nomor: "PETUGAS-01",
    jabatan: "Petugas Jaga Piket BSS",
  },
  {
    email: "bendahara@bss.test",
    sandi: "bendahara123",
    role: "bendahara",
    nama: "Siti Nurhaliza",
    nomor: "BENDAHARA-01",
    jabatan: "Bendahara Pengelola BSS",
  },
  {
    email: "admin@bss.test",
    sandi: "admin123",
    role: "admin",
    nama: "Petugas Sekretariat",
    nomor: "ADMIN-BSS",
    jabatan: "Administrator Sistem BSS",
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

  const sesi: Sesi = {
    email: akun.email,
    nama: akun.nama,
    nomor: akun.nomor,
    role: akun.role,
    jabatan: akun.jabatan,
  };
  tulis(SESI_KEY, sesi);
  return { ok: true, sesi };
}

export function daftar(input: {
  nama: string;
  email: string;
  sandi: string;
}): { ok: true; sesi: Sesi; nomor: string } | { ok: false; pesan: string } {
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
  const akun: Akun = {
    email,
    sandi: input.sandi,
    role: "nasabah",
    nama,
    nomor,
    jabatan: "Nasabah Baru",
  };
  tulis(AKUN_KEY, [...akunLokal(), akun]);

  const sesi: Sesi = { email, nama, nomor, role: "nasabah", jabatan: "Nasabah Baru" };
  tulis(SESI_KEY, sesi);
  return { ok: true, sesi, nomor };
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
