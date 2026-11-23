import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey.includes("your-service-role")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const daysAgoIso = (days) => {
  const d = new Date(Date.now() - days * 86400_000);
  return d.toISOString();
};

const SEED_USERS = [
  {
    email: "admin@bss.test",
    password: "admin123",
    role: "admin",
    nama_lengkap: "Petugas Sekretariat",
    nomor_induk_staf: "ADMIN-01",
    jabatan: "Administrator Sistem BSS",
  },
  {
    email: "ahmadfauzigmail@petugas.com",
    password: "petugas123",
    role: "petugas",
    nama_lengkap: "Ahmad Fauzi",
    nomor_induk_staf: "PETUGAS-01",
    jabatan: "Petugas Jaga Piket BSS",
  },
  {
    email: "budisantosogmail@petugas.com",
    password: "petugas123",
    role: "petugas",
    nama_lengkap: "Budi Santoso",
    nomor_induk_staf: "PETUGAS-02",
    jabatan: "Petugas Jaga Pos Timbang",
  },
  {
    email: "sitinurhalizagmail@bendahara.com",
    password: "bendahara123",
    role: "bendahara",
    nama_lengkap: "Siti Nurhaliza",
    nomor_induk_staf: "BENDAHARA-01",
    jabatan: "Bendahara Pengelola BSS",
  },
  {
    email: "nasabah@bss.test",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Aisyah Rahmawati",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0142",
      kategori: "umum",
      fakultas: "FEBI",
      prodi: "Sistem Informasi",
      no_hp: "081234567890",
      alamat: "Gresik, Jawa Timur",
      rekening_pencairan: "DANA — 0812-3456-7890",
      terakhir_setor_at: daysAgoIso(3),
    },
  },
  {
    email: "bagus@uinsa.ac.id",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Bagus Prakoso",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0087",
      kategori: "umum",
      fakultas: "FST",
      prodi: "Teknik Lingkungan",
      no_hp: "081355667788",
      terakhir_setor_at: daysAgoIso(5),
    },
  },
  {
    email: "nadia@uinsa.ac.id",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Nadia Salma",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0210",
      kategori: "umum",
      fakultas: "FDK",
      prodi: "Ilmu Komunikasi",
      terakhir_setor_at: daysAgoIso(7),
    },
  },
  {
    email: "rizal@uinsa.ac.id",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Rizal Hamdani",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0033",
      kategori: "umum",
      fakultas: "FEBI",
      prodi: "Ekonomi Syariah",
      rekening_pencairan: "Bank Mandiri — 14200981234",
      terakhir_setor_at: daysAgoIso(14),
    },
  },
  {
    email: "siti.f@uinsa.ac.id",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Siti Fauziah",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0176",
      kategori: "umum",
      fakultas: "FTK",
      prodi: "Pendidikan Agama Islam",
      terakhir_setor_at: daysAgoIso(52), // > 30 hari -> Tidak Aktif
    },
  },
  {
    email: "yusuf.m@uinsa.ac.id",
    password: "nasabah123",
    role: "nasabah",
    nama_lengkap: "Yusuf Maulana",
    jabatan: "Nasabah",
    nasabah: {
      no_buku_tabungan: "BSS-0198",
      kategori: "umum",
      fakultas: "FSH",
      prodi: "Ilmu Hukum",
      terakhir_setor_at: daysAgoIso(68), // > 30 hari -> Tidak Aktif
    },
  },
];

async function run() {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existingMap = new Map(
    listData.users.map((u) => [u.email.toLowerCase(), u])
  );

  const userIdsByEmail = new Map();
  const nasabahIdsByNomor = new Map();

  for (const u of SEED_USERS) {
    let authUser = existingMap.get(u.email.toLowerCase());
    if (!authUser) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { nama_lengkap: u.nama_lengkap },
          app_metadata: {
            role: u.role,
            nomor_induk_staf: u.nomor_induk_staf || null,
            jabatan: u.jabatan || null,
          },
        });
      if (createErr) throw new Error(`Gagal buat user ${u.email}: ${createErr.message}`);
      authUser = created.user;
      console.log(`+ Auth user dibuat: ${u.email} (${u.role})`);
    } else {
      console.log(`= Auth user sudah ada: ${u.email}`);
    }

    userIdsByEmail.set(u.email.toLowerCase(), authUser.id);

    // Pastikan row public.users sinkron
    await admin.from("users").upsert(
      {
        id: authUser.id,
        email: u.email.toLowerCase(),
        username: u.email.split("@")[0].replace(/[^a-z0-9._-]/gi, ""),
        nama_lengkap: u.nama_lengkap,
        nomor_induk_staf: u.nomor_induk_staf || null,
        jabatan: u.jabatan || null,
        role: u.role,
        is_email_verified: true,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (u.nasabah) {
      const { data: existingNasabah } = await admin
        .from("nasabah")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!existingNasabah) {
        const { data: insN, error: errN } = await admin
          .from("nasabah")
          .insert({
            user_id: authUser.id,
            no_buku_tabungan: u.nasabah.no_buku_tabungan,
            no_hp: u.nasabah.no_hp || null,
            rekening_pencairan: u.nasabah.rekening_pencairan || null,
            metode_bayar_daftar: "qris",
            status_pendaftaran: "aktif",
            verified_by: userIdsByEmail.get("ahmadfauzigmail@petugas.com") || null,
            verified_at: daysAgoIso(30),
            terakhir_setor_at: u.nasabah.terakhir_setor_at,
          })
          .select("id")
          .single();
        if (errN) throw new Error(`Gagal buat nasabah ${u.email}: ${errN.message}`);
        nasabahIdsByNomor.set(u.nasabah.no_buku_tabungan, insN.id);
      } else {
        nasabahIdsByNomor.set(u.nasabah.no_buku_tabungan, existingNasabah.id);
      }
    }
  }

  // Ambil master jenis sampah & pricelist
  const { data: jenisRows } = await admin
    .from("v_pricelist_aktif")
    .select("jenis_sampah_id, pricelist_id, kode_sampah, harga_per_satuan");

  const jenisMap = new Map((jenisRows || []).map((j) => [j.kode_sampah, j]));
  const petugasId = userIdsByEmail.get("ahmadfauzigmail@petugas.com");
  const bendaharaId = userIdsByEmail.get("sitinurhalizagmail@bendahara.com");

  // Seed Batch Pengepul awal
  const batches = [
    {
      no_penjualan: "PL-2026/X/04",
      bendahara_id: bendaharaId,
      nama_pengepul: "UD Makmur Daur Ulang",
      tanggal_penjualan: daysAgoIso(14).slice(0, 10),
      total_berat_kg: 185.0,
      estimasi_nilai_awal: 580000,
      total_nilai_jual: 645000,
      nominal_uang_diterima: 645000,
      total_disalurkan: 610000,
      selisih_kas_bss: 35000,
      tanggal_uang_diterima: daysAgoIso(13),
      tanggal_disalurkan: daysAgoIso(12),
      status_tahapan: "disalurkan_ke_nasabah",
    },
    {
      no_penjualan: "PL-2026/X/05",
      bendahara_id: bendaharaId,
      nama_pengepul: "CV Berkah Jaya Abadi",
      tanggal_penjualan: daysAgoIso(8).slice(0, 10),
      total_berat_kg: 120.5,
      estimasi_nilai_awal: 395000,
      total_nilai_jual: 430000,
      nominal_uang_diterima: 430000,
      total_disalurkan: 0,
      selisih_kas_bss: 25000,
      tanggal_uang_diterima: daysAgoIso(7),
      tanggal_disalurkan: null,
      status_tahapan: "uang_diterima",
    },
  ];

  const batchIdsByNo = new Map();
  for (const b of batches) {
    const { data: ex } = await admin
      .from("penjualan_pengepul")
      .select("id")
      .eq("no_penjualan", b.no_penjualan)
      .maybeSingle();
    if (!ex) {
      const { data: insB, error: errB } = await admin
        .from("penjualan_pengepul")
        .insert(b)
        .select("id")
        .single();
      if (errB) throw errB;
      batchIdsByNo.set(b.no_penjualan, insB.id);
      await admin.from("riwayat_tahapan_penjualan").insert({
        penjualan_pengepul_id: insB.id,
        tahapan: b.status_tahapan,
        pencatat_id: bendaharaId,
        catatan: `Status batch ${b.no_penjualan} (${b.nama_pengepul})`,
      });
    } else {
      batchIdsByNo.set(b.no_penjualan, ex.id);
    }
  }

  // Seed Setoran awal
  const setoranSeed = [
    {
      no_transaksi: "S-0913",
      nomorNasabah: "BSS-0142",
      kode: "B4",
      berat_kg: 3.0,
      jumlah_satuan: "3 pcs",
      harga: 6000,
      estimasi: 18000,
      realisasi: null,
      verif: "menunggu_verifikasi",
      jual: "belum_terjual",
      batch: null,
      tanggal: daysAgoIso(3),
    },
    {
      no_transaksi: "S-0912",
      nomorNasabah: "BSS-0142",
      kode: "B1",
      berat_kg: 4.2,
      jumlah_satuan: "4,2 kg",
      harga: 4000,
      estimasi: 16800,
      realisasi: null,
      verif: "terverifikasi",
      jual: "belum_terjual",
      batch: null,
      tanggal: daysAgoIso(4),
    },
    {
      no_transaksi: "S-0911",
      nomorNasabah: "BSS-0087",
      kode: "A1",
      berat_kg: 9.5,
      jumlah_satuan: "9,5 kg",
      harga: 2000,
      estimasi: 19000,
      realisasi: null,
      verif: "menunggu_verifikasi",
      jual: "belum_terjual",
      batch: null,
      tanggal: daysAgoIso(5),
    },
    {
      no_transaksi: "S-0910",
      nomorNasabah: "BSS-0210",
      kode: "D2",
      berat_kg: 2.1,
      jumlah_satuan: "2,1 kg",
      harga: 12000,
      estimasi: 25200,
      realisasi: null,
      verif: "terverifikasi",
      jual: "belum_terjual",
      batch: null,
      tanggal: daysAgoIso(7),
    },
    {
      no_transaksi: "S-0901",
      nomorNasabah: "BSS-0142",
      kode: "A1",
      berat_kg: 6.8,
      jumlah_satuan: "6,8 kg",
      harga: 2000,
      estimasi: 13600,
      realisasi: 14200,
      verif: "terverifikasi",
      jual: "disalurkan",
      batch: "PL-2026/X/04",
      tanggal: daysAgoIso(14),
    },
    {
      no_transaksi: "S-0900",
      nomorNasabah: "BSS-0033",
      kode: "A4",
      berat_kg: 4.4,
      jumlah_satuan: "4,4 kg",
      harga: 2500,
      estimasi: 11000,
      realisasi: 11500,
      verif: "terverifikasi",
      jual: "disalurkan",
      batch: "PL-2026/X/04",
      tanggal: daysAgoIso(14),
    },
    {
      no_transaksi: "S-0887",
      nomorNasabah: "BSS-0142",
      kode: "D2",
      berat_kg: 4.5,
      jumlah_satuan: "4,5 kg",
      harga: 12000,
      estimasi: 54000,
      realisasi: 54000,
      verif: "terverifikasi",
      jual: "disalurkan",
      batch: "PL-2026/X/04",
      tanggal: daysAgoIso(21),
    },
    {
      no_transaksi: "S-0870",
      nomorNasabah: "BSS-0142",
      kode: "A4",
      berat_kg: 16.0,
      jumlah_satuan: "16 kg",
      harga: 2500,
      estimasi: 40000,
      realisasi: 40000,
      verif: "terverifikasi",
      jual: "disalurkan",
      batch: "PL-2026/X/04",
      tanggal: daysAgoIso(28),
    },
    {
      no_transaksi: "S-0852",
      nomorNasabah: "BSS-0142",
      kode: "D1",
      berat_kg: 17.4,
      jumlah_satuan: "17,4 kg",
      harga: 4500,
      estimasi: 78300,
      realisasi: 78300,
      verif: "terverifikasi",
      jual: "disalurkan",
      batch: "PL-2026/X/04",
      tanggal: daysAgoIso(36),
    },
  ];

  for (const s of setoranSeed) {
    const { data: ex } = await admin
      .from("setoran_nasabah")
      .select("id")
      .eq("no_transaksi", s.no_transaksi)
      .maybeSingle();
    if (!ex) {
      const j = jenisMap.get(s.kode) || jenisMap.get("A1");
      const nId = nasabahIdsByNomor.get(s.nomorNasabah);
      const bId = s.batch ? batchIdsByNo.get(s.batch) || null : null;
      const { error: errS } = await admin.from("setoran_nasabah").insert({
        no_transaksi: s.no_transaksi,
        nasabah_id: nId,
        petugas_id: petugasId,
        jenis_sampah_id: j.jenis_sampah_id,
        pricelist_id: j.pricelist_id,
        penjualan_pengepul_id: bId,
        berat_kg: s.berat_kg,
        jumlah_satuan: s.jumlah_satuan,
        harga_satuan_saat_setor: s.harga,
        estimasi_nilai_total: s.estimasi,
        nilai_realisasi: s.realisasi,
        status_verifikasi: s.verif,
        verified_by: s.verif === "terverifikasi" ? petugasId : null,
        verified_at: s.verif === "terverifikasi" ? s.tanggal : null,
        status_penjualan: s.jual,
        tanggal_setor: s.tanggal,
      });
      if (errS) throw new Error(`Gagal seed setoran ${s.no_transaksi}: ${errS.message}`);
    }
  }

  // Kembalikan terakhir_setor_at untuk Siti Fauziah & Yusuf Maulana sesuai status > 1 bulan
  for (const inactive of [
    { nomor: "BSS-0176", tgl: daysAgoIso(52) },
    { nomor: "BSS-0198", tgl: daysAgoIso(68) },
  ]) {
    const nId = nasabahIdsByNomor.get(inactive.nomor);
    if (nId) {
      await admin
        .from("nasabah")
        .update({ terakhir_setor_at: inactive.tgl })
        .eq("id", nId);
    }
  }

  // Seed Penarikan Saldo awal
  const penarikanSeed = [
    {
      no_penarikan: "TRK-0023",
      nomorNasabah: "BSS-0087",
      validator_id: null,
      nominal: 20000,
      metode: "tunai",
      tujuan_pencairan: "Tunai di Pos Meja Timbang",
      catatan: "Pengajuan penarikan tunai menunggu validasi petugas jaga",
      status: "menunggu",
      tanggal_pengajuan: daysAgoIso(2),
      tanggal_validasi: null,
    },
    {
      no_penarikan: "TRK-0022",
      nomorNasabah: "BSS-0142",
      validator_id: bendaharaId,
      nominal: 15000,
      metode: "ewallet",
      tujuan_pencairan: "DANA — 0812-3456-7890",
      catatan: "Pencairan saldo ke E-Wallet DANA",
      status: "selesai",
      tanggal_pengajuan: daysAgoIso(4),
      tanggal_validasi: daysAgoIso(4),
    },
    {
      no_penarikan: "TRK-0021",
      nomorNasabah: "BSS-0142",
      validator_id: petugasId,
      nominal: 50000,
      metode: "tunai",
      tujuan_pencairan: "Tunai di Pos Meja Timbang",
      catatan: "Penarikan tabungan wadiah tunai di pos meja timbang",
      status: "selesai",
      tanggal_pengajuan: daysAgoIso(10),
      tanggal_validasi: daysAgoIso(10),
    },
    {
      no_penarikan: "TRK-0019",
      nomorNasabah: "BSS-0087",
      validator_id: petugasId,
      nominal: 100000,
      metode: "tunai",
      tujuan_pencairan: "Tunai di Pos Meja Timbang",
      catatan: "Pencairan tabungan tunai di sekretariat BSS FEBI",
      status: "selesai",
      tanggal_pengajuan: daysAgoIso(12),
      tanggal_validasi: daysAgoIso(12),
    },
    {
      no_penarikan: "TRK-0015",
      nomorNasabah: "BSS-0142",
      validator_id: bendaharaId,
      nominal: 60000,
      metode: "bank",
      tujuan_pencairan: "Bank BSI — 7182930412",
      catatan: "Pencairan saldo tabungan via Transfer Bank BSI",
      status: "selesai",
      tanggal_pengajuan: daysAgoIso(24),
      tanggal_validasi: daysAgoIso(24),
    },
    {
      no_penarikan: "TRK-0012",
      nomorNasabah: "BSS-0033",
      validator_id: bendaharaId,
      nominal: 80000,
      metode: "bank",
      tujuan_pencairan: "Bank Mandiri — 14200981234",
      catatan: "Pencairan saldo via transfer rekening bank",
      status: "selesai",
      tanggal_pengajuan: daysAgoIso(18),
      tanggal_validasi: daysAgoIso(18),
    },
  ];

  for (const p of penarikanSeed) {
    const { data: ex } = await admin
      .from("penarikan_saldo")
      .select("id")
      .eq("no_penarikan", p.no_penarikan)
      .maybeSingle();
    if (!ex) {
      const nId = nasabahIdsByNomor.get(p.nomorNasabah);
      const { error: errP } = await admin.from("penarikan_saldo").insert({
        no_penarikan: p.no_penarikan,
        nasabah_id: nId,
        validator_id: p.validator_id,
        nominal: p.nominal,
        metode: p.metode,
        tujuan_pencairan: p.tujuan_pencairan,
        catatan: p.catatan,
        status: p.status,
        tanggal_pengajuan: p.tanggal_pengajuan,
        tanggal_validasi: p.tanggal_validasi,
      });
      if (errP) throw new Error(`Gagal seed penarikan ${p.no_penarikan}: ${errP.message}`);
    }
  }

  console.log("Selesai seeding akun & transaksi awal ke Supabase.");
}

run().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
