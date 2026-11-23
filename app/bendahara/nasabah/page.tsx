"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  evaluasiKeaktifanNasabah,
  getDaftarNasabahMaster,
  hitungRingkasanSaldoNasabah,
  kg,
  rp,
} from "../../../lib/bss";
import LembarBukuTabungan from "../../../components/app/LembarBukuTabungan";
import { subscribeBssDataUpdated } from "../../../lib/supabase/store";

type NasabahRow = {
  nomor: string;
  nama: string;
  email: string;
  fakultas: string;
  totalSetorKg: number;
  saldo: number;
  statusLabel: "Aktif" | "Tidak Aktif";
  aktif: boolean;
  selisihHari: number;
  terakhir: string;
  terdaftar: string;
};

export default function NasabahBendaharaPage() {
  const [daftarNasabah, setDaftarNasabah] = useState<NasabahRow[]>([]);
  const [cari, setCari] = useState("");
  const [filterKeaktifan, setFilterKeaktifan] = useState<"semua" | "aktif" | "tidak_aktif">("semua");
  const [nasabahTerpilih, setNasabahTerpilih] = useState<NasabahRow | null>(null);

  const idCari = useId();

  const muatData = () => {
    const master = getDaftarNasabahMaster();
    const rows: NasabahRow[] = master.map((n) => {
      const ringkasan = hitungRingkasanSaldoNasabah(n.nomor);
      const evalStatus = evaluasiKeaktifanNasabah(n.terakhir);
      return {
        nomor: n.nomor,
        nama: n.nama,
        email: n.email,
        fakultas: n.fakultas || "Nasabah Umum",
        totalSetorKg: ringkasan.totalBeratSemuaKg || n.totalSetorKg || 0,
        saldo: ringkasan.saldoTersedia,
        statusLabel: evalStatus.statusLabel,
        aktif: evalStatus.aktif,
        selisihHari: evalStatus.selisihHari,
        terakhir: evalStatus.terakhir,
        terdaftar: n.terdaftar || "2026",
      };
    });
    setDaftarNasabah(rows);
  };

  useEffect(() => {
    muatData();
    return subscribeBssDataUpdated(muatData);
  }, []);

  // Filter Data
  const nasabahTerfilter = useMemo(() => {
    return daftarNasabah.filter((n) => {
      if (filterKeaktifan === "aktif" && !n.aktif) return false;
      if (filterKeaktifan === "tidak_aktif" && n.aktif) return false;

      if (cari.trim()) {
        const q = cari.toLowerCase();
        const match =
          n.nama.toLowerCase().includes(q) ||
          n.nomor.toLowerCase().includes(q) ||
          n.email.toLowerCase().includes(q) ||
          n.saldo.toString().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [daftarNasabah, filterKeaktifan, cari]);

  // Statistik Ringkasan Tabungan & Keaktifan
  const totalNasabah = daftarNasabah.length;
  const jumlahAktif = daftarNasabah.filter((n) => n.aktif).length;
  const jumlahTidakAktif = daftarNasabah.filter((n) => !n.aktif).length;
  const totalSaldoSemua = daftarNasabah.reduce((sum, n) => sum + n.saldo, 0);

  // Ekspor CSV Khusus Tabungan Nasabah untuk Bendahara
  const handleEksporCSV = () => {
    const headers = [
      "No",
      "No. Rekening",
      "Nama Nasabah",
      "Email Nasabah",
      "Kategori",
      "Total Sampah (Kg)",
      "Saldo Wadiah (Rp)",
      "Status Keaktifan",
      "Penyetoran Terakhir",
    ];

    const rows = nasabahTerfilter.map((n, idx) => [
      `"${idx + 1}"`,
      `"${n.nomor}"`,
      `"${n.nama}"`,
      `"${n.email}"`,
      `"${n.fakultas}"`,
      `"${n.totalSetorKg}"`,
      `"${n.saldo}"`,
      `"${n.statusLabel}"`,
      `"${n.terakhir}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Rekap_Tabungan_Nasabah_BSS.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dsh__page">
      {/* HEADER KHUSUS BENDAHARA */}
      <header className="dsh__head dsh__head--split">
        <div>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Bendahara Keuangan</span>
            <span className="dsh__dot" aria-hidden="true">•</span>
            <span className="dsh__meta">Bank Sampah Syariah UIN Sunan Ampel</span>
          </div>
          <h1 className="dsh__h1">Tabungan &amp; Keaktifan Nasabah</h1>
          <p className="dsh__sub">
            Monitoring saldo tabungan wadiah dan status keaktifan nasabah (Aktif menyetor ≤ 1 bulan, Tidak Aktif &gt; 1 bulan).
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} className="no-print">
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Cetak
          </button>
          <button
            type="button"
            className="dsh__btn dsh__btn--download"
            onClick={handleEksporCSV}
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16} aria-hidden="true">
              <path
                d="M10 3.5v9m0 0 3-3m-3 3-3-3M4 14.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ekspor CSV
          </button>
        </div>
      </header>

      {/* 4 STATS CARDS RINGKASAN SALDO & KEAKTIFAN */}
      <div className="dsh__statsgrid" style={{ marginBottom: "20px" }}>
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Kewajiban Tabungan</span>
          <p className="dsh__statlabel">Total Saldo Tabungan Wadiah</p>
          <p className="dsh__big dsh__big--green">{rp(totalSaldoSemua)}</p>
          <p className="dsh__statsmall">
            Total saldo aktif yang wajib dicadangkan untuk nasabah
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Nasabah Terdaftar</p>
          <p className="dsh__big">{totalNasabah} Nasabah</p>
          <p className="dsh__statsmall">Masyarakat umum terdaftar pada sistem BSS</p>
        </div>

        <div className="dsh__statcard">
          <span
            className="dsh__statbadge"
            style={{ background: "#eaf5eb", color: "#276b30", borderColor: "#c8e6c9" }}
          >
            Setor ≤ 1 Bulan
          </span>
          <p className="dsh__statlabel">Nasabah Aktif</p>
          <p className="dsh__big dsh__big--green">{jumlahAktif} Nasabah</p>
          <p className="dsh__statsmall">Rutin menyetor dalam 30 hari terakhir</p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Tidak Setor &gt; 1 Bulan</span>
          <p className="dsh__statlabel">Nasabah Tidak Aktif</p>
          <p className="dsh__big dsh__big--amber">{jumlahTidakAktif} Nasabah</p>
          <p className="dsh__statsmall">
            Tidak menyetor &gt; 30 hari • Aktif kembali jika menyetor
          </p>
        </div>
      </div>

      {/* TABEL DATA TABUNGAN NASABAH (READ-ONLY) */}
      <section className="dsh__card" aria-label="Tabel Tabungan Nasabah">
        <div
          className="dsh__cardhead"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 className="dsh__h2">Daftar Saldo &amp; Keaktifan Nasabah</h2>
            <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "2px" }}>
              Informasi saldo tabungan wadiah dan status keaktifan setor sampah nasabah.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }} className="no-print">
            <input
              id={idCari}
              type="search"
              className="dsh__input"
              style={{ padding: "6px 12px", fontSize: "13px", minWidth: "220px" }}
              placeholder="Cari nama, rekening (BSS-...), email..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />

            <span className="dsh__chip dsh__chip--green">
              {nasabahTerfilter.length} / {totalNasabah} Nasabah
            </span>
          </div>
        </div>

        {/* TAB FILTER KEAKTIFAN */}
        <div
          className="no-print"
          style={{
            padding: "10px 16px",
            background: "#faf9f5",
            borderBottom: "1px solid #ebe8df",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#665f50", marginRight: "4px" }}>
            Filter Keaktifan:
          </span>
          <button
            type="button"
            className={`dsh__chip ${filterKeaktifan === "semua" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: filterKeaktifan === "semua" ? 700 : 500 }}
            onClick={() => setFilterKeaktifan("semua")}
          >
            Semua ({totalNasabah})
          </button>
          <button
            type="button"
            className={`dsh__chip ${filterKeaktifan === "aktif" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: filterKeaktifan === "aktif" ? 700 : 500 }}
            onClick={() => setFilterKeaktifan("aktif")}
          >
            Aktif ({jumlahAktif})
          </button>
          <button
            type="button"
            className={`dsh__chip ${filterKeaktifan === "tidak_aktif" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: filterKeaktifan === "tidak_aktif" ? 700 : 500 }}
            onClick={() => setFilterKeaktifan("tidak_aktif")}
          >
            Tidak Aktif ({jumlahTidakAktif})
          </button>
        </div>

        {/* TABEL TABUNGAN NASABAH */}
        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th style={{ width: "45px", textAlign: "center" }}>No</th>
                <th style={{ width: "115px", textAlign: "center" }}>No. Rekening</th>
                <th>Nama Nasabah</th>
                <th style={{ width: "140px" }}>Kategori</th>
                <th style={{ width: "120px", textAlign: "right" }}>Total Sampah</th>
                <th style={{ width: "160px", textAlign: "right" }}>Saldo Tabungan</th>
                <th style={{ width: "130px", textAlign: "center" }}>Status Keaktifan</th>
                <th style={{ width: "130px", textAlign: "center" }}>Terakhir Setor</th>
                <th style={{ width: "140px", textAlign: "center" }} className="no-print">
                  Buku Tabungan
                </th>
              </tr>
            </thead>
            <tbody>
              {nasabahTerfilter.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Tidak ditemukan data nasabah yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                nasabahTerfilter.map((n, idx) => (
                  <tr key={n.nomor}>
                    {/* No */}
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#666" }}>
                      {idx + 1}
                    </td>

                    {/* No. Rekening */}
                    <td style={{ textAlign: "center" }}>
                      <code className="dsh__code">{n.nomor}</code>
                    </td>

                    {/* Nama Nasabah */}
                    <td>
                      <strong style={{ color: "#1f1b13", fontSize: "13.5px" }}>{n.nama}</strong>
                      <span className="dsh__subtext" style={{ fontSize: "11.5px", color: "#777" }}>
                        {n.email}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td>
                      <span className="dsh__subtext" style={{ color: "#444" }}>
                        {n.fakultas}
                      </span>
                    </td>

                    {/* Total Sampah */}
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {kg(n.totalSetorKg)}
                    </td>

                    {/* Saldo Tabungan */}
                    <td style={{ textAlign: "right" }}>
                      <strong style={{ color: "#1e5225", fontSize: "14px", fontWeight: 800 }}>
                        {rp(n.saldo)}
                      </strong>
                    </td>

                    {/* Status Keaktifan */}
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`dsh__chip ${
                          n.aktif ? "dsh__chip--green" : "dsh__chip--amber"
                        }`}
                        style={{ fontSize: "11.5px", fontWeight: 700 }}
                      >
                        {n.statusLabel}
                      </span>
                    </td>

                    {/* Terakhir Setor */}
                    <td style={{ textAlign: "center", fontSize: "12.5px", color: "#555" }}>
                      {n.terakhir}
                    </td>

                    {/* Tombol Lihat Buku Tabungan */}
                    <td style={{ textAlign: "center" }} className="no-print">
                      <button
                        type="button"
                        className="dsh__btnoutline"
                        style={{ padding: "4px 10px", fontSize: "12px", whiteSpace: "nowrap" }}
                        onClick={() => setNasabahTerpilih(n)}
                        title="Buka rincian buku tabungan nasabah"
                      >
                        Lembar Buku
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {nasabahTerfilter.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8f9fa", fontWeight: 800 }}>
                  <td colSpan={5} style={{ textAlign: "right", textTransform: "uppercase" }}>
                    Total Saldo Terhitung ({nasabahTerfilter.length} Nasabah):
                  </td>
                  <td style={{ textAlign: "right", color: "#1e5225", fontSize: "14px" }}>
                    {rp(nasabahTerfilter.reduce((sum, n) => sum + n.saldo, 0))}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* MODAL LIHAT BUKU TABUNGAN NASABAH (READ-ONLY) */}
      {nasabahTerpilih && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tabungan-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setNasabahTerpilih(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "960px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              <div>
                <h3 id="modal-tabungan-title" style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                  Inspeksi Buku Tabungan: {nasabahTerpilih.nama} ({nasabahTerpilih.nomor})
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#666" }}>
                  Mode Pengawasan Bendahara Keuangan (Hanya Lihat / Read-Only).
                </p>
              </div>
              <button
                type="button"
                className="dsh__btnoutline"
                style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                onClick={() => setNasabahTerpilih(null)}
              >
                ✕ Tutup
              </button>
            </div>

            {/* RENDER LEMBAR BUKU TABUNGAN */}
            <LembarBukuTabungan
              nomorNasabahProp={nasabahTerpilih.nomor}
              namaNasabahProp={nasabahTerpilih.nama}
              prodiFakultasProp={nasabahTerpilih.fakultas}
              showToolbar={true}
            />

            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button
                type="button"
                className="dsh__btn"
                style={{ padding: "6px 16px", fontSize: "13px" }}
                onClick={() => setNasabahTerpilih(null)}
              >
                Tutup Lembar Tabungan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
