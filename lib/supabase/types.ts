export type AuthProviderType = "supabase" | "google" | "local";
export type RoleType = "nasabah" | "petugas" | "bendahara" | "admin";
export type MetodeBayarDaftarType = "qris" | "va" | "tunai";
export type StatusPendaftaranType = "menunggu" | "aktif" | "ditolak";
export type StatusVerifikasiSetoranType = "menunggu_verifikasi" | "terverifikasi" | "ditolak";
export type StatusPenjualanSetoranType = "belum_terjual" | "terjual" | "disalurkan";
export type JenisPencairanType = "tabungan_wadiah" | "tunai" | "bank" | "ewallet";
export type StatusTahapanType =
  | "terkumpul"
  | "dijual_ke_pengepul"
  | "uang_diterima"
  | "disalurkan_ke_nasabah";
export type StatusPenyaluranType = "terjadwal" | "disalurkan";
export type MetodePenarikanType = "tunai" | "bank" | "ewallet";
export type StatusPenarikanType = "menunggu" | "selesai" | "ditolak";

export interface UserRow {
  id: string;
  email: string;
  username: string;
  nama_lengkap: string;
  nomor_induk_staf: string | null;
  jabatan: string | null;
  auth_provider: AuthProviderType;
  is_email_verified: boolean;
  role: RoleType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NasabahRow {
  id: string;
  user_id: string;
  no_buku_tabungan: string;
  no_hp: string | null;
  rekening_pencairan: string | null;
  metode_bayar_daftar: MetodeBayarDaftarType;
  status_pendaftaran: StatusPendaftaranType;
  bukti_bayar_url: string | null;
  bukti_ig_bss_url: string | null;
  bukti_ig_lab_url: string | null;
  tanggal_upload_bukti: string | null;
  verified_by: string | null;
  verified_at: string | null;
  terakhir_setor_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JenisSampahRow {
  id: string;
  kode_sampah: string;
  nama_sampah: string;
  kategori: string;
  satuan: string;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricelistRow {
  id: string;
  jenis_sampah_id: string;
  harga_per_satuan: number;
  berlaku_mulai: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetoranNasabahRow {
  id: string;
  no_transaksi: string;
  nasabah_id: string;
  petugas_id: string;
  jenis_sampah_id: string;
  pricelist_id: string | null;
  penjualan_pengepul_id: string | null;
  berat_kg: number;
  jumlah_satuan: string | null;
  harga_satuan_saat_setor: number;
  estimasi_nilai_total: number;
  nilai_realisasi: number | null;
  status_verifikasi: StatusVerifikasiSetoranType;
  verified_by: string | null;
  verified_at: string | null;
  status_penjualan: StatusPenjualanSetoranType;
  jenis_pencairan: JenisPencairanType;
  is_lunas_di_depan: boolean;
  tanggal_setor: string;
  created_at: string;
  updated_at: string;
}

export interface PenarikanSaldoRow {
  id: string;
  no_penarikan: string;
  nasabah_id: string;
  validator_id: string | null;
  nominal: number;
  metode: MetodePenarikanType;
  tujuan_pencairan: string;
  catatan: string | null;
  status: StatusPenarikanType;
  tanggal_pengajuan: string;
  tanggal_validasi: string | null;
  created_at: string;
  updated_at: string;
}

export interface PenjualanPengepulRow {
  id: string;
  no_penjualan: string;
  bendahara_id: string;
  nama_pengepul: string;
  tanggal_penjualan: string;
  total_berat_kg: number;
  estimasi_nilai_awal: number;
  total_nilai_jual: number;
  nominal_uang_diterima: number;
  total_disalurkan: number;
  selisih_kas_bss: number;
  tanggal_uang_diterima: string | null;
  tanggal_disalurkan: string | null;
  status_tahapan: StatusTahapanType;
  created_at: string;
  updated_at: string;
}

export interface PenyaluranNasabahRow {
  id: string;
  penjualan_pengepul_id: string;
  setoran_nasabah_id: string;
  nasabah_id: string;
  pencatat_id: string;
  proporsi_persen: number;
  nominal_hak_nasabah: number;
  status_penyaluran: StatusPenyaluranType;
  tanggal_disalurkan: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiwayatTahapanRow {
  id: string;
  penjualan_pengepul_id: string;
  tahapan: StatusTahapanType;
  pencatat_id: string;
  catatan: string | null;
  created_at: string;
}

export interface VPricelistAktifRow {
  jenis_sampah_id: string;
  kode_sampah: string;
  nama_sampah: string;
  kategori: string;
  satuan: string;
  deskripsi: string | null;
  pricelist_id: string;
  harga_per_satuan: number;
  berlaku_mulai: string;
}

export interface VSaldoNasabahRow {
  nasabah_id: string;
  user_id: string;
  no_buku_tabungan: string;
  nama_lengkap: string;
  email: string;
  status_pendaftaran: StatusPendaftaranType;
  terakhir_setor_at: string | null;
  is_aktif_menyetor: boolean;
  total_berat_semua_kg: number;
  total_kredit_valid: number;
  total_menunggu_verifikasi_rp: number;
  total_debet_selesai: number;
  total_penarikan_menunggu: number;
  saldo_tersedia: number;
}

