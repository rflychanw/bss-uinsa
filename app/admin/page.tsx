"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  admin,
  BATCH_PENGEPUL_AWAL,
  DAFTAR_NASABAH_MASTER,
  kg,
  PRICELIST_AWAL,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type JenisSampah,
  type SetoranNasabah,
} from "../../lib/bss";
import KalkulatorPintar, { type ItemKalkulatorHasil } from "../../components/app/KalkulatorPintar";

export default function RingkasanPengelolaPage() {
  const [sesi, setSesi] = useState<Sesi | null>(null);

  // State untuk filter & pencatatan petugas
  const [filterHari, setFilterHari] = useState<string>("semua");
  const [filterBulan, setFilterBulan] = useState<string>("semua");
  const [filterTahun, setFilterTahun] = useState<string>("semua");
  const [nasabahNomor, setNasabahNomor] = useState(DAFTAR_NASABAH_MASTER[0].nomor);
  const [bukaFormCatat, setBukaFormCatat] = useState(true);
  const [riwayat, setRiwayat] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [suksesMsg, setSuksesMsg] = useState<string | null>(null);

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  const roleAktif = sesi?.role || "bendahara";
  const isPetugas = roleAktif === "petugas";

  // Simpan setoran baru dari meja timbang petugas jaga
  const handleSimpanSetoranPetugas = (dataCalc: {
    items: ItemKalkulatorHasil[];
    totalBeratKg: number;
    totalEstimasiRp: number;
    jenis: JenisSampah;
    beratKg: number;
    estimasiRp: number;
  }) => {
    const list =
      dataCalc.items && dataCalc.items.length > 0
        ? dataCalc.items
        : [
            {
              jenis: dataCalc.jenis,
              beratKg: dataCalc.beratKg,
              estimasiRp: dataCalc.estimasiRp,
            },
          ];

    const validItems = list.filter((it) => it.beratKg > 0);
    if (validItems.length === 0) {
      alert("Masukkan berat timbangan valid terlebih dahulu.");
      return;
    }

    const nasabahPilihan =
      DAFTAR_NASABAH_MASTER.find((n) => n.nomor === nasabahNomor) ||
      DAFTAR_NASABAH_MASTER[0];

    const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const newEntries: SetoranNasabah[] = validItems.map((it, idx) => ({
      id: `S-0${913 + riwayat.length - 7 + idx}`,
      nomorNasabah: nasabahNomor,
      namaNasabah: nasabahPilihan.nama,
      tanggal: tanggalHariIni,
      jenisSampahId: it.jenis.id,
      jenisSampahNama: `[${it.jenis.kode}] ${it.jenis.nama}`,
      beratKg: it.beratKg,
      estimasiNilai: it.estimasiRp,
      status: "belum_terjual",
      dicatatOleh: sesi?.nama || "Ahmad Fauzi (Petugas Piket)",
    }));

    setRiwayat([...newEntries, ...riwayat]);
    const totalEst = validItems.reduce((acc, c) => acc + c.estimasiRp, 0);
    const totalKgVal = validItems.reduce((acc, c) => acc + c.beratKg, 0);

    setSuksesMsg(
      `${validItems.length} jenis sampah (${kg(totalKgVal)} = ${rp(
        totalEst
      )}) berhasil dicatat untuk ${nasabahPilihan.nama} dan otomatis masuk ke Riwayat Pencatatan.`
    );
    setTimeout(() => setSuksesMsg(null), 6000);
  };

  // Data perhitungan untuk Bendahara
  const totalGudang = riwayat
    .filter((s) => s.status === "belum_terjual")
    .reduce((s, r) => s + r.beratKg, 0);

  const estimasiGudangRp = riwayat
    .filter((s) => s.status === "belum_terjual")
    .reduce((s, r) => s + r.estimasiNilai, 0);

  const kasOperasionalBss = BATCH_PENGEPUL_AWAL.reduce(
    (sum, b) => sum + (b.selisihKasBss ?? 0),
    0
  );

  /* ==============================================================
     TAMPILAN 1: DASHBOARD PETUGAS JAGA
     - Tambah Pencatatan (Meja Timbang) Aktif
     - Riwayat Pencatatan dengan Filter Hari, Bulan, Tahun
     ============================================================== */
  if (isPetugas) {
    const bulanKeywords: Record<string, string[]> = {
      "1": ["Jan", "Januari", "-01-"],
      "2": ["Feb", "Februari", "-02-"],
      "3": ["Mar", "Maret", "-03-"],
      "4": ["Apr", "April", "-04-"],
      "5": ["Mei", "-05-"],
      "6": ["Jun", "Juni", "-06-"],
      "7": ["Jul", "Juli", "-07-"],
      "8": ["Agu", "Agustus", "-08-"],
      "9": ["Sep", "September", "-09-"],
      "10": ["Okt", "Oktober", "-10-"],
      "11": ["Nov", "November", "-11-"],
      "12": ["Des", "Desember", "-12-"],
    };

    const listHariUnik = Array.from(new Set(riwayat.map((r) => r.tanggal)));

    const filteredRiwayatPetugas = riwayat.filter((item) => {
      if (filterTahun !== "semua" && !item.tanggal.includes(filterTahun)) {
        return false;
      }
      if (filterBulan !== "semua") {
        const keys = bulanKeywords[filterBulan] || [];
        const match = keys.some((k) =>
          item.tanggal.toLowerCase().includes(k.toLowerCase())
        );
        if (!match) return false;
      }
      if (filterHari !== "semua") {
        if (filterHari === "hari-ini") {
          if (!item.tanggal.includes("02 Nov") && !item.tanggal.includes("2 Nov")) {
            return false;
          }
        } else if (!item.tanggal.includes(filterHari)) {
          return false;
        }
      }
      return true;
    });

    const totalFilterTransaksi = filteredRiwayatPetugas.length;
    const totalFilterKg = filteredRiwayatPetugas.reduce(
      (sum, s) => sum + s.beratKg,
      0
    );
    const totalFilterRp = filteredRiwayatPetugas.reduce(
      (sum, s) => sum + s.estimasiNilai,
      0
    );
    const totalBelumTerjual = filteredRiwayatPetugas.filter(
      (s) => s.status === "belum_terjual"
    ).length;

    return (
      <div className="dsh__page">
        <header className="dsh__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="dsh__headrole">
              <span className="dsh__tagbadge">Petugas Jaga Piket</span>
              <span className="dsh__dot" aria-hidden="true">•</span>
              <span className="dsh__meta">Pos Timbangan BSS FEBI UINSA</span>
            </div>
            <h1 className="dsh__h1">Dasbor Pencatatan Petugas Jaga</h1>
            <p className="dsh__sub">
              Input penimbangan sampah di meja timbang serta pantau riwayat pencatatan lengkap dengan filter waktu.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setBukaFormCatat(!bukaFormCatat)}
              className="dsh__filterbtn"
              style={{
                background: bukaFormCatat ? "#2e7d32" : "#ffffff",
                color: bukaFormCatat ? "#ffffff" : "#17140f",
                borderColor: bukaFormCatat ? "#2e7d32" : "#ccc",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>{bukaFormCatat ? "− Sembunyikan Form Catat" : "+ Tambah Pencatatan"}</span>
            </button>
            <Link
              href="/admin/setoran"
              className="dsh__filterbtn"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                color: "#158ab7",
                borderColor: "#158ab7",
              }}
            >
              Layar Penuh Meja Timbang →
            </Link>
          </div>
        </header>

        {suksesMsg && (
          <div className="dsh__alert dsh__alert--success" role="alert" style={{ marginBottom: "20px" }}>
            <strong>Berhasil Tersimpan:</strong> {suksesMsg}
          </div>
        )}

        {/* 1. SEKSI TAMBAH PENCATATAN (MEJA TIMBANG) */}
        {bukaFormCatat && (
          <section className="dsh__card" aria-label="Tambah Pencatatan Setoran" style={{ marginBottom: "24px" }}>
            <div className="dsh__cardhead">
              <div>
                <h2 className="dsh__h2">Tambah Pencatatan (Meja Timbang)</h2>
                <p className="dsh__carddesc">
                  Pilih nasabah yang menyetor sampah di meja timbang, tentukan jenis sampah & berat timbangannya.
                </p>
              </div>
              <span className="dsh__tagbadge" style={{ background: "#edf7ee", color: "#27632e", borderColor: "#c2e2c5" }}>
                Meja Timbang Aktif
              </span>
            </div>

            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="pilih-nasabah-dsh"
                  className="dsh__label"
                  style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}
                >
                  Pilih Nasabah Penyetor:
                </label>
                <select
                  id="pilih-nasabah-dsh"
                  className="dsh__select"
                  style={{ maxWidth: "480px", width: "100%" }}
                  value={nasabahNomor}
                  onChange={(e) => setNasabahNomor(e.target.value)}
                >
                  {DAFTAR_NASABAH_MASTER.map((n) => (
                    <option key={n.nomor} value={n.nomor}>
                      {n.nama} ({n.nomor}) — {n.fakultas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kalkulator Multi-Item BSS */}
              <KalkulatorPintar
                mode="petugas"
                onPilih={handleSimpanSetoranPetugas}
              />
            </div>
          </section>
        )}

        {/* 2. KARTU RINGKASAN DATA LAPANGAN */}
        <div className="dsh__statsgrid">
          <div className="dsh__statcard dsh__statcard--primary">
            <p className="dsh__statlabel">Total Setoran Terfilter</p>
            <p className="dsh__big dsh__big--green">{totalFilterTransaksi} Transaksi</p>
            <p className="dsh__statsmall">Pencatatan sesuai filter hari, bulan, dan tahun</p>
          </div>

          <div className="dsh__statcard">
            <p className="dsh__statlabel">Total Berat Timbangan</p>
            <p className="dsh__big">{kg(totalFilterKg)}</p>
            <p className="dsh__statsmall">Bobot fisik sampah terpilah civitas kampus</p>
          </div>

          <div className="dsh__statcard dsh__statcard--accent">
            <span className="dsh__statbadge">Akumulasi Nilai</span>
            <p className="dsh__statlabel">Estimasi Nilai Setoran</p>
            <p className="dsh__big dsh__big--amber">{rp(totalFilterRp)}</p>
            <p className="dsh__statsmall">{totalBelumTerjual} setoran siap disalurkan ke pengepul</p>
          </div>
        </div>

        {/* 3. PANEL RIWAYAT PENCATATAN DENGAN FILTER HARI, BULAN, TAHUN */}
        <section className="dsh__card" aria-label="Tabel Riwayat Pencatatan Petugas">
          <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 className="dsh__h2">Riwayat Pencatatan Setoran</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
                Filter hari, bulan, dan tahun untuk memantau data penimbangan pos jaga secara presisi.
              </p>
            </div>
          </div>

          {/* Bilah Filter Interaktif */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              padding: "16px 20px",
              background: "#faf9f5",
              borderTop: "1px solid #ebe8df",
              borderBottom: "1px solid #ebe8df",
              alignItems: "center",
            }}
          >
            {/* Filter Hari / Tanggal */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>
                Filter Hari / Tanggal
              </label>
              <select
                className="dsh__select"
                style={{ padding: "6px 12px", fontSize: "13px", minWidth: "160px" }}
                value={filterHari}
                onChange={(e) => setFilterHari(e.target.value)}
              >
                <option value="semua">Semua Hari / Tanggal</option>
                <option value="hari-ini">Hari Ini (02 Nov 2026)</option>
                {listHariUnik.map((tgl) => (
                  <option key={tgl} value={tgl}>
                    {tgl}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Bulan */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>
                Filter Bulan
              </label>
              <select
                className="dsh__select"
                style={{ padding: "6px 12px", fontSize: "13px", minWidth: "150px" }}
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
              >
                <option value="semua">Semua Bulan</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
                <option value="9">September</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>
                Filter Tahun
              </label>
              <select
                className="dsh__select"
                style={{ padding: "6px 12px", fontSize: "13px", minWidth: "120px" }}
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
              >
                <option value="semua">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(filterHari !== "semua" || filterBulan !== "semua" || filterTahun !== "semua") && (
              <button
                type="button"
                onClick={() => {
                  setFilterHari("semua");
                  setFilterBulan("semua");
                  setFilterTahun("semua");
                }}
                style={{
                  alignSelf: "flex-end",
                  padding: "7px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #dcd7cc",
                  background: "#fff",
                  cursor: "pointer",
                  color: "#a33",
                  fontWeight: 600,
                }}
              >
                Reset Filter ✕
              </button>
            )}
          </div>

          {/* Tabel Riwayat */}
          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th scope="col">No. Setoran & Tanggal</th>
                  <th scope="col">Nasabah Penyetor</th>
                  <th scope="col">Kode & Jenis Sampah</th>
                  <th scope="col">Berat Bersih</th>
                  <th scope="col">Estimasi (Rp)</th>
                  <th scope="col">Status Penyaluran</th>
                  <th scope="col">Petugas Pencatat</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiwayatPetugas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                      Tidak ditemukan riwayat pencatatan untuk filter tanggal yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredRiwayatPetugas.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.id}</strong>
                        <span className="dsh__subtext">{item.tanggal}</span>
                      </td>
                      <td>
                        <strong>{item.namaNasabah}</strong>
                        <span className="dsh__subtext">{item.nomorNasabah}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#2f5c35" }}>
                          {item.jenisSampahNama}
                        </span>
                      </td>
                      <td>
                        <strong>{kg(item.beratKg)}</strong>
                      </td>
                      <td>{rp(item.estimasiNilai)}</td>
                      <td>
                        {item.status === "disalurkan" ? (
                          <span className="dsh__chip dsh__chip--green">Disalurkan</span>
                        ) : (
                          <span className="dsh__chip dsh__chip--amber">Belum Terjual</span>
                        )}
                      </td>
                      <td>
                        <span className="dsh__subtext" style={{ color: "#444" }}>
                          {item.dicatatOleh || "Ahmad Fauzi (Petugas Piket)"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  /* ==============================================================
     TAMPILAN 2: DASHBOARD BENDAHARA (Ringkasan Keuangan Wadiah)
     ============================================================== */
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <div className="dsh__headrole">
          <span className="dsh__tagbadge">Bendahara & Pengelola</span>
          <span className="dsh__dot" aria-hidden="true">•</span>
          <span className="dsh__meta">Keuangan & Alur Pengepul</span>
        </div>
        <h1 className="dsh__h1">Ringkasan Pengelola BSS</h1>
        <p className="dsh__sub">
          Monitor saldo wadiah nasabah, stok gudang belum terjual, dan bagi hasil penjualan pengepul.
        </p>
      </header>

      {/* 4 Kartu Metrik Utama Bendahara */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Akad Wadiah</span>
          <p className="dsh__statlabel">Kewajiban Tabungan Nasabah</p>
          <p className="dsh__big dsh__big--green">{rp(admin.saldoTerutang)}</p>
          <p className="dsh__statsmall">Saldo hak {admin.nasabahAktif} nasabah civitas akademika</p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Stok Gudang (Belum Terjual)</p>
          <p className="dsh__big">{kg(totalGudang)}</p>
          <p className="dsh__statsmall">Estimasi nilai acuan: {rp(estimasiGudangRp)}</p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Akumulasi BSS</span>
          <p className="dsh__statlabel">Kas Operasional Terkumpul</p>
          <p className="dsh__big dsh__big--amber">{rp(kasOperasionalBss)}</p>
          <p className="dsh__statsmall">Hasil selisih penjualan pengepul</p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Berat Terkelola</p>
          <p className="dsh__big">{kg(admin.beratBulan)}</p>
          <p className="dsh__statsmall">Sejak program BSS FEBI diluncurkan</p>
        </div>
      </div>

      {/* Grid Menu Cepat Pengelola */}
      <div className="dsh__grid2">
        <section className="dsh__card" aria-label="Alur Pengepul Terakhir">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Alur Penjualan Pengepul Terakhir</h2>
              <p className="dsh__carddesc">Realisasi bagi hasil wadiah dan kas operasional BSS.</p>
            </div>
            <Link className="dsh__link" href="/admin/pengepul">
              Buka Alur →
            </Link>
          </div>
          <div className="dsh__list">
            {BATCH_PENGEPUL_AWAL.map((b) => (
              <div key={b.id} className="dsh__item">
                <div>
                  <strong>{b.id}</strong> — {b.tanggalJual}
                  <span className="dsh__subtext">
                    {b.namaPengepul} • {kg(b.totalBeratKg)} • Diterima {rp(b.uangDiterima ?? 0)}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="dsh__chip dsh__chip--green">
                    Nasabah: +{rp(b.totalDisalurkan ?? 0)}
                  </span>
                  <span className="dsh__subtext">Kas: +{rp(b.selisihKasBss ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dsh__card" aria-label="Menu Pintas Bendahara">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Akses Cepat Pengelolaan</h2>
              <p className="dsh__carddesc">Navigasi langsung ke modul keuangan dan data acuan.</p>
            </div>
          </div>
          <div className="dsh__quicklinks">
            <Link className="dsh__quickcard" href="/admin/pengepul">
              <strong>Kelola Penjualan Pengepul</strong>
              <span>Hitung bagi hasil otomatis antara hak nasabah & kas BSS.</span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/rekap">
              <strong>Rekap & Ekspor CSV</strong>
              <span>Unduh laporan berkala untuk pimpinan fakultas & audit.</span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/nasabah">
              <strong>Buku Tabungan Nasabah</strong>
              <span>Pantau saldo per nasabah dan riwayat tabungan wadiah.</span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/pricelist">
              <strong>Daftar Harga Acuan (Pricelist)</strong>
              <span>Atur nilai acuan per kg sampah terpilah (A1 s/d D7).</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
