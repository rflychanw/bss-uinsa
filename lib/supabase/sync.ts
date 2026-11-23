"use client";

import type { Akun, KategoriNasabah, Role, Sesi } from "../auth";
import type {
  BatchPenjualanPengepul,
  JenisSampah,
  MetodePenarikan,
  NasabahMaster,
  PenarikanUang,
  PenyaluranPerNasabah,
  SetoranNasabah,
  TahapAlur,
} from "../bss";
import { createSupabaseBrowserClient, hasSupabaseEnv } from "./client";
import {
  getSupabaseStore,
  notifyBssDataUpdated,
  resetAuthenticatedStore,
} from "./store";
import type {
  NasabahRow,
  PenarikanSaldoRow,
  PenjualanPengepulRow,
  PenyaluranNasabahRow,
  SetoranNasabahRow,
  UserRow,
  VPricelistAktifRow,
  VSaldoNasabahRow,
} from "./types";

const EMAIL_ALIASES: Record<string, string> = {
  "petugas@bss.test": "ahmadfauzigmail@petugas.com",
  "bendahara@bss.test": "sitinurhalizagmail@bendahara.com",
};

const BULAN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const BULAN_INDO_MAP: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  agu: 7,
  ags: 7,
  agustus: 7,
  aug: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
};

export function formatTanggalIndo(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = BULAN_SHORT[d.getMonth()] || "Jan";
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

export function formatTanggalJamIndo(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const tgl = formatTanggalIndo(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${tgl}, ${hh}:${mi}`;
}

function toYmdWib(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return y && m && day ? `${y}-${m}-${day}` : "";
}

function toIsoWibStartOfDay(ymd?: string): string {
  if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) {
    return new Date(`${ymd.trim()}T00:00:00+07:00`).toISOString();
  }
  return new Date().toISOString();
}

function parseDateSafe(tgl?: string | null): Date | null {
  if (!tgl) return null;
  const iso = new Date(tgl);
  if (!isNaN(iso.getTime())) return iso;
  const parts = tgl.trim().toLowerCase().replace(/,/g, "").split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mon = BULAN_INDO_MAP[parts[1].replace(/[^a-z]/g, "")];
    const yr = parseInt(parts[2], 10);
    if (!isNaN(day) && mon !== undefined && !isNaN(yr)) {
      return new Date(yr, mon, day);
    }
  }
  return null;
}

function clearLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  const keys = [
    "bss:sesi",
    "bss:akun",
    "bss:akun_master:v5",
    "bss:pricelist:v3",
    "bss:setoran:v2",
    "bss:penarikan:v2",
  ];
  for (const k of keys) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* abaikan */
    }
  }
}

function buildSesi(user: UserRow, nasabah?: NasabahRow | null): Sesi & {
  dbId: string;
  nasabahDbId?: string;
} {
  const role = user.role as Role;
  const nomor =
    role === "nasabah"
      ? nasabah?.no_buku_tabungan || "BSS-BARU"
      : user.nomor_induk_staf || user.username.toUpperCase();

  return {
    dbId: user.id,
    nasabahDbId: nasabah?.id,
    email: user.email,
    nama: user.nama_lengkap,
    nomor,
    role,
    jabatan: user.jabatan || undefined,
    buktiBayar: nasabah?.bukti_bayar_url || undefined,
    namaFileBukti: nasabah?.bukti_bayar_url ? "bukti-bayar.webp" : undefined,
    buktiFollowBss: nasabah?.bukti_ig_bss_url || undefined,
    namaFileBuktiBss: nasabah?.bukti_ig_bss_url
      ? "bukti-ig-bss.webp"
      : undefined,
    buktiFollowLab: nasabah?.bukti_ig_lab_url || undefined,
    namaFileBuktiLab: nasabah?.bukti_ig_lab_url
      ? "bukti-ig-lab.webp"
      : undefined,
    tanggalUploadBukti: nasabah?.tanggal_upload_bukti
      ? formatTanggalJamIndo(nasabah.tanggal_upload_bukti)
      : undefined,
    metodeBayar: nasabah?.metode_bayar_daftar,
    statusVerifikasi:
      role === "nasabah"
        ? nasabah?.status_pendaftaran || "menunggu"
        : "aktif",
    tanggalDaftar: formatTanggalIndo(user.created_at),
  };
}

let inFlightSync: Promise<Sesi | null> | null = null;
let inFlightPricelist: Promise<JenisSampah[]> | null = null;

export async function muatPricelistPublik(force = false): Promise<JenisSampah[]> {
  if (!hasSupabaseEnv()) return [];
  const store = getSupabaseStore();
  if (store.pricelistReady && !force) return store.pricelist;
  if (inFlightPricelist) return inFlightPricelist;

  inFlightPricelist = (async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("v_pricelist_aktif")
        .select("*")
        .order("kode_sampah", { ascending: true });

      if (error || !data) return store.pricelist;

      const rows = data as VPricelistAktifRow[];
      const mapped = rows.map((r) => ({
        dbId: r.jenis_sampah_id,
        pricelistDbId: r.pricelist_id,
        id: r.kode_sampah,
        kode: r.kode_sampah,
        nama: r.nama_sampah,
        kategori: r.nama_sampah,
        jenis: r.kategori,
        hargaPerKg: Number(r.harga_per_satuan),
        satuan: r.satuan || "kg",
        deskripsi: r.deskripsi || "",
        updateTerakhir: formatTanggalIndo(r.berlaku_mulai),
        berlakuMulaiYmd: toYmdWib(r.berlaku_mulai),
      }));

      const jenisByKode: Record<string, VPricelistAktifRow> = {};
      const jenisById: Record<string, VPricelistAktifRow> = {};
      for (const r of rows) {
        jenisByKode[r.kode_sampah] = r;
        jenisById[r.jenis_sampah_id] = r;
      }

      store.pricelist = mapped;
      store.jenisByKode = jenisByKode;
      store.jenisById = jenisById;
      store.pricelistReady = true;
      notifyBssDataUpdated();
      return mapped;
    } finally {
      inFlightPricelist = null;
    }
  })();

  return inFlightPricelist;
}

export async function sinkronkanDataSupabase(
  force = false
): Promise<Sesi | null> {
  if (!hasSupabaseEnv()) return null;
  const store = getSupabaseStore();
  if (store.ready && store.sesi && !force) return store.sesi;
  if (inFlightSync && !force) return inFlightSync;

  inFlightSync = (async () => {
    store.syncing = true;
    try {
      clearLegacyLocalStorage();
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        resetAuthenticatedStore();
        await muatPricelistPublik();
        store.ready = true;
        notifyBssDataUpdated();
        return null;
      }

      const { data: myUserRow } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!myUserRow || !myUserRow.is_active) {
        await supabase.auth.signOut();
        resetAuthenticatedStore();
        notifyBssDataUpdated();
        return null;
      }

      const currentUser = myUserRow as UserRow;
      const isStaff = ["admin", "petugas", "bendahara"].includes(
        currentUser.role
      );

      const [
        pricelistRes,
        usersRes,
        nasabahRes,
        saldoRes,
        setoranRes,
        penarikanRes,
        pengepulRes,
        penyaluranRes,
      ] = await Promise.all([
        supabase
          .from("v_pricelist_aktif")
          .select("*")
          .order("kode_sampah", { ascending: true }),
        isStaff
          ? supabase
              .from("users")
              .select("*")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [currentUser] as UserRow[], error: null }),
        isStaff
          ? supabase
              .from("nasabah")
              .select("*")
              .order("created_at", { ascending: false })
          : supabase
              .from("nasabah")
              .select("*")
              .eq("user_id", currentUser.id),
        isStaff
          ? supabase.from("v_saldo_dan_keaktifan_nasabah").select("*")
          : supabase
              .from("v_saldo_dan_keaktifan_nasabah")
              .select("*")
              .eq("user_id", currentUser.id),
        supabase
          .from("setoran_nasabah")
          .select("*")
          .order("tanggal_setor", { ascending: false }),
        supabase
          .from("penarikan_saldo")
          .select("*")
          .order("tanggal_pengajuan", { ascending: false }),
        supabase
          .from("penjualan_pengepul")
          .select("*")
          .order("tanggal_penjualan", { ascending: false }),
        supabase.from("penyaluran_nasabah").select("*"),
      ]);

      // Build maps
      const users = ((usersRes.data as UserRow[]) || [currentUser]).filter(Boolean);
      const nasabahRows = (nasabahRes.data as NasabahRow[]) || [];
      const saldoRows = (saldoRes.data as VSaldoNasabahRow[]) || [];
      const setoranRows = (setoranRes.data as SetoranNasabahRow[]) || [];
      const penarikanRows = (penarikanRes.data as PenarikanSaldoRow[]) || [];
      const pengepulRows = (pengepulRes.data as PenjualanPengepulRow[]) || [];
      const penyaluranRows =
        (penyaluranRes.data as PenyaluranNasabahRow[]) || [];
      const priceRows = (pricelistRes.data as VPricelistAktifRow[]) || [];

      const userById: Record<string, UserRow> = {};
      for (const u of users) userById[u.id] = u;

      const nasabahById: Record<string, NasabahRow> = {};
      const nasabahByUserId: Record<string, NasabahRow> = {};
      const nasabahByNomor: Record<string, NasabahRow> = {};
      for (const n of nasabahRows) {
        nasabahById[n.id] = n;
        nasabahByUserId[n.user_id] = n;
        nasabahByNomor[n.no_buku_tabungan] = n;
      }

      const saldoByNasabahId: Record<string, VSaldoNasabahRow> = {};
      for (const s of saldoRows) {
        saldoByNasabahId[s.nasabah_id] = s;
      }

      const jenisByKode: Record<string, VPricelistAktifRow> = {};
      const jenisById: Record<string, VPricelistAktifRow> = {};
      const mappedPricelist = priceRows.map((r) => {
        jenisByKode[r.kode_sampah] = r;
        jenisById[r.jenis_sampah_id] = r;
        return {
          dbId: r.jenis_sampah_id,
          pricelistDbId: r.pricelist_id,
          id: r.kode_sampah,
          kode: r.kode_sampah,
          nama: r.nama_sampah,
          kategori: r.nama_sampah,
          jenis: r.kategori,
          hargaPerKg: Number(r.harga_per_satuan),
          satuan: r.satuan || "kg",
          deskripsi: r.deskripsi || "",
          updateTerakhir: formatTanggalIndo(r.berlaku_mulai),
          berlakuMulaiYmd: toYmdWib(r.berlaku_mulai),
        };
      });

      const batchById: Record<string, PenjualanPengepulRow> = {};
      for (const b of pengepulRows) batchById[b.id] = b;

      // Map Akun list
      const akunList: (Akun & { dbId?: string; nasabahDbId?: string })[] =
        users.map((u) => {
          const n = nasabahByUserId[u.id];
          const saldo = n ? saldoByNasabahId[n.id] : undefined;
          const estimasiBelumTerjual = n
            ? setoranRows
                .filter(
                  (s) =>
                    s.nasabah_id === n.id && s.status_penjualan !== "disalurkan"
                )
                .reduce((acc, s) => acc + Number(s.estimasi_nilai_total), 0)
            : 0;
          const akumulasiTersalurkan = n
            ? setoranRows
                .filter(
                  (s) =>
                    s.nasabah_id === n.id &&
                    s.status_penjualan === "disalurkan" &&
                    s.status_verifikasi === "terverifikasi"
                )
                .reduce(
                  (acc, s) =>
                    acc + Number(s.nilai_realisasi ?? s.estimasi_nilai_total),
                  0
                )
            : 0;

          return {
            dbId: u.id,
            nasabahDbId: n?.id,
            email: u.email,
            sandi: "",
            role: u.role as Role,
            nama: u.nama_lengkap,
            nomor:
              u.role === "nasabah"
                ? n?.no_buku_tabungan || u.username.toUpperCase()
                : u.nomor_induk_staf || u.username.toUpperCase(),
            jabatan: u.jabatan || undefined,
            buktiBayar: n?.bukti_bayar_url || undefined,
            namaFileBukti: n?.bukti_bayar_url ? "bukti-bayar.webp" : undefined,
            buktiFollowBss: n?.bukti_ig_bss_url || undefined,
            namaFileBuktiBss: n?.bukti_ig_bss_url
              ? "bukti-ig-bss.webp"
              : undefined,
            buktiFollowLab: n?.bukti_ig_lab_url || undefined,
            namaFileBuktiLab: n?.bukti_ig_lab_url
              ? "bukti-ig-lab.webp"
              : undefined,
            tanggalUploadBukti: n?.tanggal_upload_bukti
              ? formatTanggalJamIndo(n.tanggal_upload_bukti)
              : undefined,
            metodeBayar: n?.metode_bayar_daftar,
            statusVerifikasi:
              u.role === "nasabah"
                ? n?.status_pendaftaran || "menunggu"
                : u.is_active
                ? "aktif"
                : "ditolak",
            tanggalDaftar: formatTanggalIndo(u.created_at),
            terakhirSetor: n?.terakhir_setor_at
              ? formatTanggalIndo(n.terakhir_setor_at)
              : u.role === "nasabah"
              ? "Belum pernah"
              : undefined,
            totalSetorKg: saldo
              ? Number(saldo.total_berat_semua_kg)
              : 0,
            estimasiBelumTerjual,
            akumulasiTersalurkan,
          };
        });

      // Map Nasabah Master list
      const refNow = Math.max(Date.now(), new Date(2026, 10, 9).getTime());
      const nasabahMasterList = nasabahRows.map((n) => {
        const u = userById[n.user_id];
        const saldo = saldoByNasabahId[n.id];
        const tglTerakhir = n.terakhir_setor_at
          ? parseDateSafe(n.terakhir_setor_at)
          : null;
        const selisihHari = tglTerakhir
          ? Math.max(
              0,
              Math.floor((refNow - tglTerakhir.getTime()) / 86400_000)
            )
          : 45;
        const aktif = saldo ? Boolean(saldo.is_aktif_menyetor) : selisihHari <= 30;
        const fakLabel = "Nasabah Umum";
        const estimasiBelumTerjual = setoranRows
          .filter(
            (s) => s.nasabah_id === n.id && s.status_penjualan !== "disalurkan"
          )
          .reduce((acc, s) => acc + Number(s.estimasi_nilai_total), 0);
        const akumulasiTersalurkan = setoranRows
          .filter(
            (s) =>
              s.nasabah_id === n.id &&
              s.status_penjualan === "disalurkan" &&
              s.status_verifikasi === "terverifikasi"
          )
          .reduce(
            (acc, s) =>
              acc + Number(s.nilai_realisasi ?? s.estimasi_nilai_total),
            0
          );

        return {
          nasabahDbId: n.id,
          userId: n.user_id,
          nomor: n.no_buku_tabungan,
          nama: u?.nama_lengkap || "Nasabah BSS",
          email: u?.email || "",
          fakultas: fakLabel,
          saldoAkhir:
            n.saldo_akhir != null && n.saldo_akhir !== ""
              ? Number(n.saldo_akhir)
              : undefined,
          totalSetorKg: saldo ? Number(saldo.total_berat_semua_kg) : 0,
          totalBeratKg: saldo ? Number(saldo.total_berat_semua_kg) : 0,
          estimasiBelumTerjual,
          akumulasiTersalurkan,
          terakhir: n.terakhir_setor_at
            ? formatTanggalIndo(n.terakhir_setor_at)
            : "Belum pernah",
          status: aktif ? "Aktif" : "Tidak Aktif",
          aktif,
          selisihHari,
          terdaftar: formatTanggalIndo(n.created_at),
        };
      });

      // Map Setoran Nasabah
      const setoranById: Record<string, SetoranNasabahRow> = {};
      for (const s of setoranRows) setoranById[s.id] = s;

      const setoranList: (SetoranNasabah & { dbId?: string })[] =
        setoranRows
          .filter((s) => s.status_verifikasi !== "ditolak")
          .map((s) => {
            const n = nasabahById[s.nasabah_id];
            const u = n ? userById[n.user_id] : undefined;
            const j = jenisById[s.jenis_sampah_id];
            const petugas = userById[s.petugas_id];
            const batch = s.penjualan_pengepul_id
              ? batchById[s.penjualan_pengepul_id]
              : undefined;

            return {
              dbId: s.id,
              id: s.no_transaksi,
              nomorNasabah: n?.no_buku_tabungan || "-",
              namaNasabah: u?.nama_lengkap || "Nasabah BSS",
              tanggal: formatTanggalIndo(s.tanggal_setor),
              jenisSampahId: j?.kode_sampah || "A1",
              jenisSampahNama: j
                ? `${j.kode_sampah} · ${j.nama_sampah}`
                : "Sampah Terpilah",
              beratKg: Number(s.berat_kg),
              jumlahSatuan:
                s.jumlah_satuan ||
                `${Number(s.berat_kg)} ${j?.satuan || "kg"}`,
              estimasiNilai: Number(s.estimasi_nilai_total),
              nilaiRealisasi:
                s.nilai_realisasi != null
                  ? Number(s.nilai_realisasi)
                  : undefined,
              status:
                s.status_penjualan === "disalurkan"
                  ? "disalurkan"
                  : "belum_terjual",
              statusVerifikasi:
                s.status_verifikasi === "menunggu_verifikasi"
                  ? "menunggu_verifikasi"
                  : "terverifikasi",
              batchPengepulId: batch?.no_penjualan,
              dicatatOleh: petugas?.nama_lengkap || "Petugas Piket BSS",
            };
          });

      // Map Penarikan Saldo
      const penarikanList: (PenarikanUang & { dbId?: string })[] =
        penarikanRows
          .filter((p) => p.status !== "ditolak")
          .map((p) => {
            const n = nasabahById[p.nasabah_id];
            const u = n ? userById[n.user_id] : undefined;
            const valUser = p.validator_id
              ? userById[p.validator_id]
              : undefined;
            return {
              dbId: p.id,
              id: p.no_penarikan,
              nomorNasabah: n?.no_buku_tabungan || "-",
              namaNasabah: u?.nama_lengkap || "Nasabah BSS",
              tanggal: formatTanggalIndo(p.tanggal_pengajuan),
              nominal: Number(p.nominal),
              metode: p.metode as MetodePenarikan,
              tujuan: p.tujuan_pencairan,
              catatan: p.catatan || undefined,
              status: p.status === "selesai" ? "selesai" : "menunggu",
              petugas:
                valUser?.nama_lengkap ||
                (p.status === "selesai"
                  ? "Bendahara BSS"
                  : "Menunggu Validasi Kasir BSS"),
            };
          });

      // Map Batch Penjualan Pengepul
      const batchList: (BatchPenjualanPengepul & { dbId?: string })[] =
        pengepulRows.map((b) => {
          const bendahara = userById[b.bendahara_id];
          const setoranTerkait = setoranRows.filter(
            (s) => s.penjualan_pengepul_id === b.id
          );
          const penyaluranBatch = penyaluranRows.filter(
            (pn) => pn.penjualan_pengepul_id === b.id
          );

          // Group proporsi per nasabah untuk ringkasan tabel
          const groupedByNasabah = new Map<string, PenyaluranPerNasabah>();
          for (const pn of penyaluranBatch) {
            const n = nasabahById[pn.nasabah_id];
            const u = n ? userById[n.user_id] : undefined;
            const sRow = setoranById[pn.setoran_nasabah_id];
            const nomorN = n?.no_buku_tabungan || pn.nasabah_id;
            const cur = groupedByNasabah.get(nomorN) || {
              nomorNasabah: nomorN,
              namaNasabah: u?.nama_lengkap || nomorN,
              beratKg: 0,
              proporsiPersen: 0,
              hakUang: 0,
            };
            cur.beratKg += sRow ? Number(sRow.berat_kg) : 0;
            cur.proporsiPersen = Number(
              (cur.proporsiPersen + Number(pn.proporsi_persen)).toFixed(2)
            );
            cur.hakUang += Number(pn.nominal_hak_nasabah);
            groupedByNasabah.set(nomorN, cur);
          }

          return {
            dbId: b.id,
            id: b.no_penjualan,
            nomorBatch: b.no_penjualan,
            namaPengepul: b.nama_pengepul,
            tahap: b.status_tahapan as TahapAlur,
            totalBeratKg: Number(b.total_berat_kg),
            estimasiAwal: Number(b.estimasi_nilai_awal),
            nilaiJualPengepul: Number(b.total_nilai_jual),
            uangDiterima: Number(b.nominal_uang_diterima),
            totalDisalurkan: Number(b.total_disalurkan),
            selisihKasBss: Number(b.selisih_kas_bss),
            tanggalTerkumpul: formatTanggalIndo(b.tanggal_penjualan),
            tanggalJual: formatTanggalIndo(b.tanggal_penjualan),
            tanggalUangDiterima: b.tanggal_uang_diterima
              ? formatTanggalIndo(b.tanggal_uang_diterima)
              : undefined,
            tanggalDisalurkan: b.tanggal_disalurkan
              ? formatTanggalIndo(b.tanggal_disalurkan)
              : undefined,
            dicatatOleh: bendahara?.nama_lengkap
              ? `${bendahara.nama_lengkap} (Bendahara)`
              : "Siti Nurhaliza (Bendahara)",
            daftarSetoranId: setoranTerkait.map((s) => s.no_transaksi),
            penyaluran: Array.from(groupedByNasabah.values()),
          };
        });

      const myNasabah = nasabahByUserId[currentUser.id] || null;
      const sesi = buildSesi(currentUser, myNasabah);

      store.sesi = sesi;
      store.akunList = akunList;
      store.pricelist = mappedPricelist;
      store.pricelistReady = true;
      store.setoranList = setoranList;
      store.penarikanList = penarikanList;
      store.batchList = batchList;
      store.nasabahMasterList = nasabahMasterList;
      store.userById = userById;
      store.nasabahById = nasabahById;
      store.nasabahByNomor = nasabahByNomor;
      store.saldoByNasabahId = saldoByNasabahId;
      store.jenisByKode = jenisByKode;
      store.jenisById = jenisById;
      store.ready = true;
      store.lastSyncAt = Date.now();

      notifyBssDataUpdated();
      return sesi;
    } finally {
      store.syncing = false;
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

export async function masukSupabase(
  emailRaw: string,
  sandi: string,
  opsi?: { izinkanRole?: Role[]; pesanTolakRole?: string }
): Promise<{ ok: true; sesi: Sesi } | { ok: false; pesan: string }> {
  const emailTrim = emailRaw.trim().toLowerCase();
  const email = EMAIL_ALIASES[emailTrim] || emailTrim;

  if (!email) return { ok: false, pesan: "Masukkan email terlebih dahulu." };
  if (!sandi) return { ok: false, pesan: "Masukkan kata sandi terlebih dahulu." };

  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email,
      password: sandi,
    });

  if (signInErr || !authData.user) {
    return {
      ok: false,
      pesan: "Email atau kata sandi tidak cocok atau belum terdaftar.",
    };
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userRow || !userRow.is_active) {
    await supabase.auth.signOut();
    return {
      ok: false,
      pesan: "Profil akun tidak aktif atau belum tersedia di database.",
    };
  }

  const role = userRow.role as Role;
  if (opsi?.izinkanRole && !opsi.izinkanRole.includes(role)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      pesan:
        opsi.pesanTolakRole ||
        "Anda tidak memiliki otorisasi untuk masuk melalui portal ini.",
    };
  }

  if (role === "nasabah") {
    const { data: nasabahRow } = await supabase
      .from("nasabah")
      .select("status_pendaftaran")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (nasabahRow?.status_pendaftaran === "menunggu") {
      await supabase.auth.signOut();
      return {
        ok: false,
        pesan:
          "Akun Anda masih menunggu verifikasi pembayaran biaya pendaftaran oleh Petugas BSS. Mohon cek kembali dalam 1×24 jam.",
      };
    }
    if (nasabahRow?.status_pendaftaran === "ditolak") {
      await supabase.auth.signOut();
      return {
        ok: false,
        pesan:
          "Pendaftaran Anda ditolak karena bukti pembayaran tidak valid. Hubungi petugas BSS untuk verifikasi ulang.",
      };
    }
  }

  const sesi = await sinkronkanDataSupabase(true);
  if (!sesi) {
    return { ok: false, pesan: "Gagal memuat data akun dari server." };
  }

  return { ok: true, sesi };
}

export async function keluarSupabase(): Promise<void> {
  if (hasSupabaseEnv()) {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  }
  resetAuthenticatedStore();
  clearLegacyLocalStorage();
  notifyBssDataUpdated();
}

export async function daftarSupabase(input: {
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
  metodeBayar?: string;
}): Promise<
  | { ok: true; nomor: string; email: string; nama: string }
  | { ok: false; pesan: string }
> {
  try {
    const res = await fetch("/api/daftar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return {
        ok: false,
        pesan: json.pesan || "Pendaftaran gagal diproses.",
      };
    }
    return {
      ok: true,
      nomor: json.nomor,
      email: json.email,
      nama: json.nama,
    };
  } catch (err) {
    return {
      ok: false,
      pesan:
        err instanceof Error
          ? err.message
          : "Tidak dapat terhubung ke server pendaftaran.",
    };
  }
}

export async function tambahAkunSupabase(input: {
  nama: string;
  email: string;
  sandi: string;
  role: Role;
  nomor?: string;
  jabatan?: string;
}): Promise<{ ok: true; akun: Akun } | { ok: false; pesan: string }> {
  try {
    const res = await fetch("/api/admin/akun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, pesan: json.pesan || "Gagal menambah akun." };
    }
    await sinkronkanDataSupabase(true);
    return { ok: true, akun: json.akun };
  } catch (err) {
    return {
      ok: false,
      pesan: err instanceof Error ? err.message : "Gagal menghubungi server.",
    };
  }
}

export async function updateAkunSupabase(
  userIdOrIdentitas: { userId?: string; identitasLama?: string },
  perubahan: {
    nama?: string;
    email?: string;
    sandi?: string;
    role?: Role;
    nomor?: string;
    jabatan?: string;
  }
): Promise<{ ok: true; akun: Akun } | { ok: false; pesan: string }> {
  try {
    const res = await fetch("/api/admin/akun", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...userIdOrIdentitas, ...perubahan }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, pesan: json.pesan || "Gagal memperbarui akun." };
    }
    await sinkronkanDataSupabase(true);
    return { ok: true, akun: json.akun };
  } catch (err) {
    return {
      ok: false,
      pesan: err instanceof Error ? err.message : "Gagal menghubungi server.",
    };
  }
}

export async function hapusAkunSupabase(target: {
  userId?: string;
  identitas?: string;
}): Promise<{ ok: true; pesan: string } | { ok: false; pesan: string }> {
  try {
    const res = await fetch("/api/admin/akun", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { ok: false, pesan: json.pesan || "Gagal menghapus akun." };
    }
    await sinkronkanDataSupabase(true);
    return { ok: true, pesan: json.pesan };
  } catch (err) {
    return {
      ok: false,
      pesan: err instanceof Error ? err.message : "Gagal menghubungi server.",
    };
  }
}

export async function ambilSignedUrlBukti(
  paths: (string | undefined)[]
): Promise<Record<string, string>> {
  const valid = paths.filter(
    (p): p is string => Boolean(p && !p.startsWith("data:") && !p.startsWith("http"))
  );
  if (valid.length === 0) return {};
  try {
    const res = await fetch("/api/storage/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: valid }),
    });
    const json = await res.json();
    return json.ok && json.urls ? json.urls : {};
  } catch {
    return {};
  }
}

export async function verifikasiNasabahSupabase(
  nomorNasabahOrEmail: string,
  statusBaru: "aktif" | "ditolak"
): Promise<boolean> {
  const store = getSupabaseStore();
  const q = nomorNasabahOrEmail.trim().toLowerCase();
  const target = store.akunList.find(
    (a) => a.nomor.toLowerCase() === q || a.email.toLowerCase() === q
  );
  if (!target?.nasabahDbId) return false;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("nasabah")
    .update({
      status_pendaftaran: statusBaru,
      verified_by: store.sesi?.dbId || null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", target.nasabahDbId);

  if (error) return false;
  await sinkronkanDataSupabase(true);
  return true;
}

export async function tambahBanyakSetoranSupabase(
  items: {
    jenisKode: string;
    beratKg: number;
    jumlahSatuan: string;
    estimasiNilai: number;
  }[],
  nomorNasabah: string,
  langsungVerifikasi = false
): Promise<{ ok: true; count: number } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const nasabahRow = store.nasabahByNomor[nomorNasabah];
  if (!nasabahRow || !store.sesi?.dbId) {
    return { ok: false, pesan: "Nasabah atau sesi petugas tidak valid." };
  }

  const nowIso = new Date().toISOString();
  const randSuffix = Date.now().toString().slice(-4);
  const rows = items.map((it, idx) => {
    const jenis = store.jenisByKode[it.jenisKode];
    if (!jenis) {
      throw new Error(`Kode sampah ${it.jenisKode} tidak ditemukan di server.`);
    }
    return {
      no_transaksi: `S-${randSuffix}${idx + 1}`,
      nasabah_id: nasabahRow.id,
      petugas_id: store.sesi!.dbId,
      jenis_sampah_id: jenis.jenis_sampah_id,
      pricelist_id: jenis.pricelist_id,
      berat_kg: it.beratKg,
      jumlah_satuan: it.jumlahSatuan,
      harga_satuan_saat_setor: Number(jenis.harga_per_satuan),
      estimasi_nilai_total: it.estimasiNilai,
      status_verifikasi: langsungVerifikasi
        ? "terverifikasi"
        : "menunggu_verifikasi",
      verified_by: langsungVerifikasi ? store.sesi!.dbId : null,
      verified_at: langsungVerifikasi ? nowIso : null,
      status_penjualan: "belum_terjual",
      jenis_pencairan: "tabungan_wadiah",
      is_lunas_di_depan: false,
      tanggal_setor: nowIso,
    };
  });

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("setoran_nasabah").insert(rows);
  if (error) {
    return { ok: false, pesan: error.message };
  }

  await sinkronkanDataSupabase(true);
  return { ok: true, count: rows.length };
}

export async function verifikasiSetoranSupabase(
  idSetoran: string
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const target = store.setoranList.find(
    (s) => s.id === idSetoran || s.dbId === idSetoran
  );
  if (!target?.dbId || !store.sesi?.dbId) {
    return { ok: false, pesan: "Setoran tidak ditemukan." };
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("setoran_nasabah")
    .update({
      status_verifikasi: "terverifikasi",
      verified_by: store.sesi.dbId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", target.dbId);

  if (error) return { ok: false, pesan: error.message };
  await sinkronkanDataSupabase(true);
  return { ok: true };
}

export async function tambahPenarikanSupabase(input: {
  nomorNasabah: string;
  nominal: number;
  metode: MetodePenarikan;
  tujuan: string;
  catatan?: string;
  status?: "selesai" | "menunggu";
  isSedekah?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const nasabahRow = store.nasabahByNomor[input.nomorNasabah];
  if (!nasabahRow) {
    return { ok: false, pesan: "Rekening nasabah tidak ditemukan." };
  }

  const noPenarikan = `TRK-${Date.now().toString().slice(-5)}`;
  const statusFinal = input.status === "selesai" ? "selesai" : "menunggu";
  const metodeDb = input.metode === "transfer" ? "bank" : input.metode;
  const nowIso = new Date().toISOString();

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("penarikan_saldo").insert({
    no_penarikan: noPenarikan,
    nasabah_id: nasabahRow.id,
    validator_id: statusFinal === "selesai" ? store.sesi?.dbId || null : null,
    nominal: input.nominal,
    metode: metodeDb,
    tujuan_pencairan: input.tujuan,
    catatan: input.catatan || null,
    status: statusFinal,
    tanggal_pengajuan: nowIso,
    tanggal_validasi: statusFinal === "selesai" ? nowIso : null,
  });

  if (error) return { ok: false, pesan: error.message };
  await sinkronkanDataSupabase(true);
  return { ok: true, id: noPenarikan };
}

export async function validasiPenarikanSupabase(
  noPenarikan: string
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const target = store.penarikanList.find(
    (p) => p.id === noPenarikan || p.dbId === noPenarikan
  );
  if (!target?.dbId || !store.sesi?.dbId) {
    return { ok: false, pesan: "Pengajuan penarikan tidak ditemukan." };
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("penarikan_saldo")
    .update({
      status: "selesai",
      validator_id: store.sesi.dbId,
      tanggal_validasi: new Date().toISOString(),
    })
    .eq("id", target.dbId);

  if (error) return { ok: false, pesan: error.message };
  await sinkronkanDataSupabase(true);
  return { ok: true };
}

export async function updateHargaPricelistSupabase(
  kodeSampah: string,
  hargaBaru: number,
  berlakuMulai?: string
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const jenis = store.jenisByKode[kodeSampah];
  if (!jenis || !store.sesi?.dbId) {
    return { ok: false, pesan: "Item pricelist tidak ditemukan." };
  }

  const supabase = createSupabaseBrowserClient();
  const { error: offErr } = await supabase
    .from("pricelist")
    .update({ is_active: false })
    .eq("jenis_sampah_id", jenis.jenis_sampah_id)
    .eq("is_active", true);

  if (offErr) return { ok: false, pesan: offErr.message };

  const { error: insErr } = await supabase.from("pricelist").insert({
    jenis_sampah_id: jenis.jenis_sampah_id,
    harga_per_satuan: hargaBaru,
    berlaku_mulai: toIsoWibStartOfDay(berlakuMulai),
    created_by: store.sesi.dbId,
    is_active: true,
  });

  if (insErr) return { ok: false, pesan: insErr.message };
  await sinkronkanDataSupabase(true);
  return { ok: true };
}

export async function tambahJenisSampahSupabase(input: {
  kode: string;
  nama: string;
  jenis: string;
  satuan: string;
  hargaPerKg: number;
  deskripsi: string;
  berlakuMulai?: string;
}): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  if (!store.sesi?.dbId) {
    return { ok: false, pesan: "Sesi pengelola diperlukan." };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: insertedJenis, error: jErr } = await supabase
    .from("jenis_sampah")
    .insert({
      kode_sampah: input.kode,
      nama_sampah: input.nama,
      kategori: input.jenis,
      satuan: input.satuan || "kg",
      deskripsi: input.deskripsi,
      is_active: true,
    })
    .select("id")
    .single();

  if (jErr || !insertedJenis) {
    return { ok: false, pesan: jErr?.message || "Gagal menambah jenis sampah." };
  }

  const { error: pErr } = await supabase.from("pricelist").insert({
    jenis_sampah_id: insertedJenis.id,
    harga_per_satuan: input.hargaPerKg,
    berlaku_mulai: toIsoWibStartOfDay(input.berlakuMulai),
    created_by: store.sesi.dbId,
    is_active: true,
  });

  if (pErr) return { ok: false, pesan: pErr.message };
  await sinkronkanDataSupabase(true);
  return { ok: true };
}

export async function updateTahapPengepulSupabase(
  nomorBatch: string,
  tahapBaru: TahapAlur
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const store = getSupabaseStore();
  const batch = store.batchList.find(
    (b) => b.id === nomorBatch || b.nomorBatch === nomorBatch
  );
  if (!batch?.dbId || !store.sesi?.dbId) {
    return { ok: false, pesan: "Batch penjualan tidak ditemukan." };
  }

  const totalDisalurkan =
    tahapBaru === "disalurkan_ke_nasabah"
      ? batch.penyaluran.reduce((acc, p) => acc + p.hakUang, 0) ||
        batch.uangDiterima
      : batch.totalDisalurkan || 0;
  const selisihKas = Math.max(0, batch.uangDiterima - totalDisalurkan);
  const nowIso = new Date().toISOString();

  const supabase = createSupabaseBrowserClient();
  const { error: updErr } = await supabase
    .from("penjualan_pengepul")
    .update({
      status_tahapan: tahapBaru,
      total_disalurkan: totalDisalurkan,
      selisih_kas_bss: selisihKas,
      tanggal_disalurkan:
        tahapBaru === "disalurkan_ke_nasabah" ? nowIso : undefined,
    })
    .eq("id", batch.dbId);

  if (updErr) return { ok: false, pesan: updErr.message };

  if (tahapBaru === "disalurkan_ke_nasabah") {
    await Promise.all([
      supabase
        .from("setoran_nasabah")
        .update({ status_penjualan: "disalurkan" })
        .eq("penjualan_pengepul_id", batch.dbId),
      supabase
        .from("penyaluran_nasabah")
        .update({ status_penyaluran: "disalurkan", tanggal_disalurkan: nowIso })
        .eq("penjualan_pengepul_id", batch.dbId),
    ]);
  }

  await supabase.from("riwayat_tahapan_penjualan").insert({
    penjualan_pengepul_id: batch.dbId,
    tahapan: tahapBaru,
    pencatat_id: store.sesi.dbId,
    catatan: `Status batch ${batch.nomorBatch} diperbarui menjadi ${tahapBaru}.`,
  });

  await sinkronkanDataSupabase(true);
  return { ok: true };
}
