"use client";

import { useMemo, useState } from "react";
import {
  DAFTAR_NASABAH_MASTER,
  kg,
  PRICELIST_AWAL,
  RIWAYAT_SETORAN_AWAL,
  rp,
} from "../../../lib/bss";

export default function RekapKeuanganAdmin() {
  const [periode, setPeriode] = useState<string>("bulan_ini");

  const dataRekap = useMemo(() => {
    const totalSetoran = RIWAYAT_SETORAN_AWAL.length;
    const totalBeratKg = RIWAYAT_SETORAN_AWAL.reduce((s, r) => s + r.beratKg, 0);

    // Kategori
    const beratPlastik = RIWAYAT_SETORAN_AWAL.filter((r) =>
      r.jenisSampahId.includes("plastik")
    ).reduce((s, r) => s + r.beratKg, 0);

    const beratKertas = RIWAYAT_SETORAN_AWAL.filter((r) =>
      r.jenisSampahId.includes("kertas")
    ).reduce((s, r) => s + r.beratKg, 0);

    const beratLogam = RIWAYAT_SETORAN_AWAL.filter((r) =>
      r.jenisSampahId.includes("logam")
    ).reduce((s, r) => s + r.beratKg, 0);

    const estimasiGudang = RIWAYAT_SETORAN_AWAL.filter(
      (r) => r.status === "belum_terjual"
    ).reduce((s, r) => s + r.estimasiNilai, 0);

    const totalDisalurkan = RIWAYAT_SETORAN_AWAL.filter(
      (r) => r.status === "disalurkan"
    ).reduce((s, r) => s + (r.nilaiRealisasi ?? r.estimasiNilai), 0);

    return {
      totalSetoran,
      totalBeratKg,
      beratPlastik,
      beratKertas,
      beratLogam,
      estimasiGudang,
      totalDisalurkan,
      totalKasBss: 33400, // Margin operasional BSS
    };
  }, [periode]);

  // Ekspor CSV FR-015
  const handleEksporCSV = () => {
    const headers = [
      "ID Setoran",
      "Nomor Nasabah",
      "Nama Nasabah",
      "Tanggal",
      "Jenis Sampah",
      "Berat (kg)",
      "Estimasi Nilai (Rp)",
      "Realisasi Nilai (Rp)",
      "Status",
      "Pencatat",
    ];

    const rows = RIWAYAT_SETORAN_AWAL.map((r) => [
      r.id,
      r.nomorNasabah,
      `"${r.namaNasabah}"`,
      r.tanggal,
      `"${r.jenisSampahNama}"`,
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
      `Laporan_Rekapitulasi_BSS_UINSA_${periode}_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head dsh__head--split">
        <div>
          <h1 className="dsh__h1">Rekapitulasi & Laporan Keuangan</h1>
          <p className="dsh__sub">
            Laporan tonase sampah, perputaran dana bagi hasil syariah, dan audit kas BSS UINSA (FR-012 & FR-015).
          </p>
        </div>
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
          Ekspor Laporan (.CSV)
        </button>
      </header>

      {/* Filter Periode FR-012 */}
      <div className="dsh__filtertabs">
        <button
          type="button"
          className="dsh__filtertab"
          data-active={periode === "bulan_ini"}
          onClick={() => setPeriode("bulan_ini")}
        >
          Bulan Ini (Oktober 2026)
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={periode === "triwulan"}
          onClick={() => setPeriode("triwulan")}
        >
          Triwulan III (Jul - Okt 2026)
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

      {/* Grid Metrik Ringkasan Keuangan */}
      <div className="dsh__statsgrid" aria-label="Statistik Rekapitulasi">
        <div className="dsh__card dsh__statcard">
          <p className="dsh__statlabel">Total Sampah Terkelola</p>
          <p className="dsh__big">{kg(dataRekap.totalBeratKg)}</p>
          <p className="dsh__statsmall">Dari {dataRekap.totalSetoran} transaksi penyetoran</p>
        </div>

        <div className="dsh__card dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Dana Disalurkan ke Nasabah</p>
          <p className="dsh__big">{rp(dataRekap.totalDisalurkan)}</p>
          <p className="dsh__statsmall">Status tuntas dibagikan ke rekening nasabah</p>
        </div>

        <div className="dsh__card dsh__statcard dsh__statcard--accent">
          <p className="dsh__statlabel">Nilai Sampah di Gudang</p>
          <p className="dsh__big dsh__big--amber">{rp(dataRekap.estimasiGudang)}</p>
          <p className="dsh__statsmall">Menunggu jadwal timbang batch pengepul berikutnya</p>
        </div>

        <div className="dsh__card dsh__statcard">
          <p className="dsh__statlabel">Kas Operasional BSS (FR-032)</p>
          <p className="dsh__big">{rp(dataRekap.totalKasBss)}</p>
          <p className="dsh__statsmall">Selisih harga jual pengepul untuk pemeliharaan timbangan</p>
        </div>
      </div>

      {/* Rincian Komposisi Sampah Berdasarkan Kategori */}
      <div className="dsh__split">
        <section className="dsh__card" aria-label="Komposisi Kategori Sampah">
          <h2 className="dsh__h2">Komposisi Sampah Kampus</h2>
          <p className="dsh__carddesc">
            Rincian jenis sampah daur ulang civitas akademika UINSA.
          </p>

          <div className="dsh__rows">
            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Plastik (PET, HDPE, Tutup Botol)</strong>
                <span className="dsh__meta">Penyumbang volume terbesar di kantin dan gedung kuliah</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratPlastik)}</b>
              </div>
            </div>

            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Kertas (Kardus, Kertas HVS/Ujian, Arsip)</strong>
                <span className="dsh__meta">Dihasilkan dari tugas perkuliahan & kantor administrasi</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratKertas)}</b>
              </div>
            </div>

            <div className="dsh__row">
              <div className="dsh__rowmain">
                <strong>Kategori Logam & Kaleng Minuman</strong>
                <span className="dsh__meta">Kaleng aluminium dan besi perabot bekas</span>
              </div>
              <div className="dsh__rowval">
                <b>{kg(dataRekap.beratLogam)}</b>
              </div>
            </div>
          </div>
        </section>

        <section className="dsh__card" aria-label="Format Laporan CSV">
          <h2 className="dsh__h2">Ketentuan Laporan Format CSV</h2>
          <p className="dsh__carddesc">
            Sesuai NFR-011 & FR-015, ekspor data mendukung kompatibilitas format standar spreadsheet:
          </p>
          <ul className="dsh__list">
            <li>Memuat identitas transaksi lengkap, nomor nasabah, dan tanggal.</li>
            <li>Membedakan nilai estimasi awal dan realisasi bagi hasil penjualan pengepul.</li>
            <li>Dilengkapi kolom audit pencatat (petugas meja timbang / bendahara).</li>
            <li>Encoding UTF-8 dengan BOM agar terbaca akurat di Microsoft Excel.</li>
          </ul>
          <div className="dsh__cardfooter">
            <button
              type="button"
              className="dsh__btnoutline"
              onClick={handleEksporCSV}
            >
              Unduh CSV Sekarang
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
