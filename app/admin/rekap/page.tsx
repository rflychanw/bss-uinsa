"use client";

import { useMemo, useState } from "react";
import {
  BATCH_PENGEPUL_AWAL,
  getDaftarSetoran,
  getKategoriSampah,
  kg,
  rp,
  type SetoranNasabah,
} from "../../../lib/bss";

export default function RekapKeuanganAdmin() {
  const [periode, setPeriode] = useState<"bulan_ini" | "triwulan" | "semua">("bulan_ini");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);

  const semuaSetoran = useMemo(() => {
    return getDaftarSetoran();
  }, []);

  // Filter periode aktual sesuai FR-012
  const setoranTerfilter = useMemo(() => {
    return semuaSetoran.filter((item) => {
      if (periode === "bulan_ini") {
        return (
          item.tanggal.includes("Okt 2026") ||
          item.tanggal.includes("Nov 2026") ||
          item.tanggal.includes("10/") ||
          item.tanggal.includes("11/")
        );
      }
      if (periode === "triwulan") {
        return (
          item.tanggal.includes("Jul") ||
          item.tanggal.includes("Agu") ||
          item.tanggal.includes("Sep") ||
          item.tanggal.includes("Okt") ||
          item.tanggal.includes("Nov")
        );
      }
      return true;
    });
  }, [semuaSetoran, periode]);

  const dataRekap = useMemo(() => {
    const totalSetoran = setoranTerfilter.length;
    const totalBeratKg = setoranTerfilter.reduce((s, r) => s + r.beratKg, 0);

    // Kategori akurat menggunakan getKategoriSampah
    const beratPlastik = setoranTerfilter
      .filter((r) => getKategoriSampah(r.jenisSampahId, r.jenisSampahNama) === "Plastik")
      .reduce((s, r) => s + r.beratKg, 0);

    const beratKertas = setoranTerfilter
      .filter((r) => getKategoriSampah(r.jenisSampahId, r.jenisSampahNama) === "Kertas")
      .reduce((s, r) => s + r.beratKg, 0);

    const beratLogam = setoranTerfilter
      .filter((r) => getKategoriSampah(r.jenisSampahId, r.jenisSampahNama) === "Logam")
      .reduce((s, r) => s + r.beratKg, 0);

    const beratKaca = setoranTerfilter
      .filter((r) => getKategoriSampah(r.jenisSampahId, r.jenisSampahNama) === "Kaca")
      .reduce((s, r) => s + r.beratKg, 0);

    const estimasiGudang = setoranTerfilter
      .filter((r) => r.status === "belum_terjual")
      .reduce((s, r) => s + r.estimasiNilai, 0);

    const totalDisalurkan = setoranTerfilter
      .filter((r) => r.status === "disalurkan")
      .reduce((s, r) => s + (r.nilaiRealisasi ?? r.estimasiNilai), 0);

    const totalKasBss = BATCH_PENGEPUL_AWAL.reduce(
      (sum, b) => sum + (b.selisihKasBss || 0),
      0
    );

    return {
      totalSetoran,
      totalBeratKg,
      beratPlastik,
      beratKertas,
      beratLogam,
      beratKaca,
      estimasiGudang,
      totalDisalurkan,
      totalKasBss,
    };
  }, [setoranTerfilter]);

  // Ekspor CSV FR-015 yang sinkron dengan periode terpilih
  const handleEksporCSV = () => {
    const headers = [
      "ID Setoran",
      "Nomor Nasabah",
      "Nama Nasabah",
      "Tanggal",
      "Jenis Sampah",
      "Kategori",
      "Berat (kg)",
      "Estimasi Nilai (Rp)",
      "Realisasi Nilai (Rp)",
      "Status",
      "Pencatat",
    ];

    const rows = setoranTerfilter.map((r) => [
      r.id,
      r.nomorNasabah,
      `"${r.namaNasabah}"`,
      r.tanggal,
      `"${r.jenisSampahNama}"`,
      `"${getKategoriSampah(r.jenisSampahId, r.jenisSampahNama)}"`,
      r.beratKg,
      r.estimasiNilai,
      r.nilaiRealisasi ?? 0,
      r.status,
      `"${r.dicatatOleh}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Keuangan_BSS_UINSA_${periode}_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const labelPeriode =
    periode === "bulan_ini"
      ? "Bulan Ini (Oktober - November 2026)"
      : periode === "triwulan"
      ? "Triwulan III-IV (Juli - November 2026)"
      : "Sepanjang Waktu (Tahun 2026)";

  return (
    <div className="dsh__page">
      <header className="dsh__head dsh__head--split">
        <div>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Bendahara Keuangan</span>
            <span className="dsh__dot" aria-hidden="true">•</span>
            <span className="dsh__meta">Audit & Rekapitulasi (FR-012 & FR-015)</span>
          </div>
          <h1 className="dsh__h1">Rekapitulasi & Laporan Keuangan</h1>
          <p className="dsh__sub">
            Laporan tonase sampah kampus, perputaran dana bagi hasil syariah, dan kas operasional BSS FEBI UINSA.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} className="no-print">
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Cetak Laporan
          </button>
          <button
            type="button"
            className="dsh__btn dsh__btn--download"
            onClick={handleEksporCSV}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              width={16}
              height={16}
              aria-hidden="true"
            >
              <path
                d="M10 3v10m0 0 4-4m-4 4-4-4M4 17h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ekspor CSV ({setoranTerfilter.length} Baris)
          </button>
        </div>
      </header>

      {/* Filter Periode FR-012 */}
      <div className="dsh__filtertabs no-print" role="tablist">
        <button
          type="button"
          className="dsh__filtertab"
          data-active={periode === "bulan_ini"}
          onClick={() => setPeriode("bulan_ini")}
        >
          Bulan Ini (Okt - Nov 2026)
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={periode === "triwulan"}
          onClick={() => setPeriode("triwulan")}
        >
          Triwulan III-IV (Jul - Nov 2026)
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={periode === "semua"}
          onClick={() => setPeriode("semua")}
        >
          Sepanjang Waktu (Tahun 2026)
        </button>
      </div>

      {/* Grid Metrik Ringkasan Keuangan Periode Terpilih */}
      <div className="dsh__statsgrid" aria-label="Statistik Rekapitulasi">
        <div className="dsh__card dsh__statcard">
          <p className="dsh__statlabel">Total Sampah Terkelola</p>
          <p className="dsh__big">{kg(dataRekap.totalBeratKg)}</p>
          <p className="dsh__statsmall">Dari {dataRekap.totalSetoran} transaksi penyetoran ({labelPeriode})</p>
        </div>

        <div className="dsh__card dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Dana Disalurkan ke Nasabah</p>
          <p className="dsh__big dsh__big--green">{rp(dataRekap.totalDisalurkan)}</p>
          <p className="dsh__statsmall">Status tuntas disalurkan ke tabungan nasabah</p>
        </div>

        <div className="dsh__card dsh__statcard dsh__statcard--accent">
          <p className="dsh__statlabel">Nilai Sampah di Gudang</p>
          <p className="dsh__big dsh__big--amber">{rp(dataRekap.estimasiGudang)}</p>
          <p className="dsh__statsmall">Menunggu jadwal penjualan batch pengepul</p>
        </div>

        <div className="dsh__card dsh__statcard">
          <p className="dsh__statlabel">Kas Operasional BSS (FR-032)</p>
          <p className="dsh__big">{rp(dataRekap.totalKasBss)}</p>
          <p className="dsh__statsmall">Akumulasi selisih margin penjualan ke pengepul</p>
        </div>
      </div>

      {/* Rincian Komposisi Sampah Berdasarkan Kategori */}
      <div className="dsh__split">
        <section className="dsh__card" aria-label="Komposisi Kategori Sampah">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Komposisi Sampah Kampus</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
                Total tonase bersih berdasarkan klasifikasi material civitas akademika UINSA.
              </p>
            </div>
            <span className="dsh__tagbadge">{labelPeriode}</span>
          </div>

          <div className="dsh__rows">
            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Plastik (PET, HDPE, Emberan, Kresek)</strong>
                <span className="dsh__meta">Penyumbang botol minuman & kantin kampus</span>
              </div>
              <div className="dsh__rowval">
                <b className="dsh__green">{kg(dataRekap.beratPlastik)}</b>
              </div>
            </div>

            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Kertas (Kardus, Kertas HVS/Ujian, Arsip, Koran)</strong>
                <span className="dsh__meta">Limbah berkas perkuliahan & kantor administrasi</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratKertas)}</b>
              </div>
            </div>

            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Logam (Besi Tebal, Kaleng, Aluminium)</strong>
                <span className="dsh__meta">Kaleng minuman kemasan & perabot rusak</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratLogam)}</b>
              </div>
            </div>

            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Kaca & Beling</strong>
                <span className="dsh__meta">Botol sirup dan pecahan kaca transparan</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratKaca)}</b>
              </div>
            </div>
          </div>
        </section>

        <section className="dsh__card" aria-label="Format Laporan CSV">
          <h2 className="dsh__h2">Ketentuan Standar Audit Laporan</h2>
          <p className="dsh__carddesc">
            Sesuai NFR-011 & FR-015, ekspor data dan cetak laporan mematuhi prinsip transparansi perbankan syariah:
          </p>
          <ul className="dsh__list">
            <li>Menampilkan tanggal transaksi dan identitas nasabah secara jelas.</li>
            <li>Membedakan nilai estimasi acuan meja timbang vs realisasi bagi hasil penjualan pengepul.</li>
            <li>Memuat riwayat pencatat untuk audit trail pertanggungjawaban.</li>
            <li>Format CSV terenkode UTF-8 dengan BOM agar terbaca langsung di Microsoft Excel.</li>
          </ul>
        </section>
      </div>

      {/* Tabel Rincian Data Transaksi Laporan */}
      <section className="dsh__card" aria-label="Tabel Rincian Data Laporan Keuangan" style={{ marginTop: "24px" }}>
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Rincian Transaksi Setoran ({labelPeriode})</h2>
            <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
              Daftar seluruh transaksi yang masuk dalam perhitungan rekapitulasi periode ini.
            </p>
          </div>
          <span className="dsh__chip dsh__chip--green">{setoranTerfilter.length} Baris Transaksi</span>
        </div>

        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th>No. ID</th>
                <th>Tanggal</th>
                <th>Nasabah</th>
                <th>Jenis & Kategori</th>
                <th>Berat (kg)</th>
                <th>Estimasi Awal</th>
                <th>Realisasi Penjualan</th>
                <th>Status SRS</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {setoranTerfilter.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                (tampilSemua
                  ? setoranTerfilter
                  : setoranTerfilter.slice(0, 4)
                ).map((r) => {
                  const kat = getKategoriSampah(r.jenisSampahId, r.jenisSampahNama);
                  return (
                    <tr key={r.id}>
                      <td>
                        <code className="dsh__code">{r.id}</code>
                      </td>
                      <td>{r.tanggal}</td>
                      <td>
                        <strong>{r.namaNasabah}</strong>
                        <span className="dsh__subtext">{r.nomorNasabah}</span>
                      </td>
                      <td>
                        <strong>{r.jenisSampahNama}</strong>
                        <span className="dsh__subtext">{kat}</span>
                      </td>
                      <td>{kg(r.beratKg)}</td>
                      <td>{rp(r.estimasiNilai)}</td>
                      <td>
                        {r.status === "disalurkan" ? (
                          <strong className="dsh__green">{rp(r.nilaiRealisasi ?? r.estimasiNilai)}</strong>
                        ) : (
                          <span className="dsh__muted">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`dsh__chip ${
                            r.status === "disalurkan" ? "dsh__chip--green" : "dsh__chip--amber"
                          }`}
                        >
                          {r.status === "disalurkan" ? "Disalurkan" : "Belum Terjual"}
                        </span>
                      </td>
                      <td>
                        <span className="dsh__subtext" style={{ color: "#333" }}>
                          {r.dicatatOleh}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {setoranTerfilter.length > 4 && (
          <button
            type="button"
            className="dsh__expandbtn no-print"
            onClick={() => setTampilSemua((prev) => !prev)}
          >
            {tampilSemua
              ? "Ringkas Rincian Transaksi ↑"
              : `Lihat Lengkap (${setoranTerfilter.length} Transaksi) ↓`}
          </button>
        )}
      </section>
    </div>
  );
}
