"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  getDaftarSetoran,
  hitungStatistikMonitoring,
  kg,
  RIWAYAT_SETORAN_AWAL,
  rp,
  verifikasiSetoran,
  type SetoranNasabah,
} from "../../lib/bss";

export default function PetugasDashboardPage() {
  const [sesi, setSesi] = useState<Sesi | null>(null);

  // State untuk filter & pencatatan petugas
  const [cari, setCari] = useState<string>("");
  const [filterHari, setFilterHari] = useState<string>("semua");
  const [filterBulan, setFilterBulan] = useState<string>("semua");
  const [filterTahun, setFilterTahun] = useState<string>("semua");
  const [riwayat, setRiwayat] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [suksesMsg, setSuksesMsg] = useState<string | null>(null);
  const [tampilSemuaPetugas, setTampilSemuaPetugas] = useState(false);
  const [statistik, setStatistik] = useState(() => hitungStatistikMonitoring());

  const muatUlangData = () => {
    setSesi(sesiSekarang());
    setRiwayat(getDaftarSetoran());
    setStatistik(hitungStatistikMonitoring());
  };

  useEffect(() => {
    muatUlangData();
  }, []);

  const handleVerifikasiItem = (item: SetoranNasabah) => {
    const namaPetugas = sesi?.nama || "Ahmad Fauzi (Petugas Piket)";
    const updated = verifikasiSetoran(item.id, namaPetugas);
    setRiwayat(updated);
    setSuksesMsg(
      `Setoran ${item.id} (${rp(item.estimasiNilai)}) atas nama ${item.namaNasabah} berhasil DIVERIFIKASI oleh Petugas Jaga dan langsung masuk ke Saldo Valid Nasabah.`
    );
    setTimeout(() => setSuksesMsg(null), 6000);
  };

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
    if (cari.trim()) {
      const q = cari.toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.namaNasabah.toLowerCase().includes(q) ||
        item.nomorNasabah.toLowerCase().includes(q) ||
        item.jenisSampahNama.toLowerCase().includes(q) ||
        (item.dicatatOleh && item.dicatatOleh.toLowerCase().includes(q));
      if (!match) return false;
    }
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
        if (!item.tanggal.includes("09 Nov") && !item.tanggal.includes("9 Nov")) {
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
  const totalBelumDiverifikasi = filteredRiwayatPetugas.filter(
    (s) => s.statusVerifikasi === "menunggu_verifikasi"
  ).length;

  return (
    <div className="dsh__page">
      <header
        className="dsh__head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Petugas Jaga Piket</span>
            <span className="dsh__dot" aria-hidden="true">
              •
            </span>
            <span className="dsh__meta">Pos Timbangan BSS FEBI UINSA</span>
          </div>
          <h1 className="dsh__h1" style={{ wordBreak: "break-word" }}>
            Riwayat Pencatatan Setoran
          </h1>
          <p className="dsh__sub">
            Catat dan pantau setoran sampah satuan/kiloan nasabah agar masuk ke Saldo Valid Nasabah dan memperbarui keaktifan nasabah.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "100%" }}>
          <Link
            href="/petugas/setoran"
            className="dsh__btn"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              fontSize: "13px",
              padding: "8px 14px",
            }}
          >
            + Tambah Pencatatan
          </Link>
        </div>
      </header>

      {suksesMsg && (
        <div
          className="dsh__alert dsh__alert--success"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          <strong>Berhasil:</strong> {suksesMsg}
        </div>
      )}

      {/* KARTU RINGKASAN DATA LAPANGAN */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Total Setoran Terfilter</p>
          <p className="dsh__big dsh__big--green">{totalFilterTransaksi} Transaksi</p>
          <p className="dsh__statsmall">
            Pencatatan sesuai filter pencarian, hari, bulan &amp; tahun
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Berat Timbangan</p>
          <p className="dsh__big">{kg(totalFilterKg)}</p>
          <p className="dsh__statsmall">
            Bobot fisik sampah satuan &amp; kiloan civitas kampus
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <p className="dsh__statlabel">Nilai Saldo Setoran</p>
          <p className="dsh__big dsh__big--amber">{rp(totalFilterRp)}</p>
          <p className="dsh__statsmall">
            {totalBelumDiverifikasi > 0
              ? `${totalBelumDiverifikasi} setoran menunggu konfirmasi`
              : "Seluruh setoran sudah valid & masuk saldo nasabah"}
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Status Keaktifan Nasabah</p>
          <p className="dsh__big dsh__big--green">{statistik.nasabahAktif} Aktif</p>
          <p className="dsh__statsmall">
            {statistik.nasabahTidakAktif} tidak aktif (&gt; 1 bulan belum menyetor)
          </p>
        </div>
      </div>

      {/* PANEL RIWAYAT PENCATATAN DENGAN FILTER HARI, BULAN, TAHUN */}
      <section className="dsh__card" aria-label="Tabel Riwayat Pencatatan Petugas">
        <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 className="dsh__h2">Riwayat Pencatatan Setoran</h2>
            <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
              Filter hari, bulan, dan tahun untuk memantau data penimbangan pos jaga secara presisi.
            </p>
          </div>
        </div>

        {/* Bilah Filter & Pencarian Interaktif */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            padding: "14px 16px",
            background: "#faf9f5",
            borderTop: "1px solid #ebe8df",
            borderBottom: "1px solid #ebe8df",
            alignItems: "flex-end",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              flex: "1 1 220px",
              minWidth: "180px",
            }}
          >
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Cari Riwayat Pencatatan
            </label>
            <input
              type="search"
              className="dsh__input"
              style={{ padding: "7px 12px", fontSize: "13px" }}
              placeholder="Ketik ID setoran, nama nasabah, nomor BSS, jenis sampah..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Filter Hari / Tanggal
            </label>
            <select
              className="dsh__select"
              style={{ padding: "6px 12px", fontSize: "13px", minWidth: "160px" }}
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
            >
              <option value="semua">Semua Hari / Tanggal</option>
              <option value="hari-ini">Hari Ini (09 Nov 2026)</option>
              {listHariUnik.map((tgl) => (
                <option key={tgl} value={tgl}>
                  {tgl}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Filter Bulan
            </label>
            <select
              className="dsh__select"
              style={{ padding: "6px 12px", fontSize: "13px", minWidth: "140px" }}
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
            >
              <option value="semua">Semua Bulan</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#666",
                textTransform: "uppercase",
              }}
            >
              Filter Tahun
            </label>
            <select
              className="dsh__select"
              style={{ padding: "6px 12px", fontSize: "13px", minWidth: "110px" }}
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
            >
              <option value="semua">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {(filterHari !== "semua" ||
            filterBulan !== "semua" ||
            filterTahun !== "semua" ||
            cari.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setCari("");
                setFilterHari("semua");
                setFilterBulan("semua");
                setFilterTahun("semua");
              }}
              style={{
                padding: "7px 12px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #dcd7cc",
                background: "#fff",
                cursor: "pointer",
                color: "#a33",
                fontWeight: 600,
                height: "36px",
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
                <th scope="col">No. Setoran &amp; Tanggal</th>
                <th scope="col">Nasabah Penyetor</th>
                <th scope="col">Kode &amp; Jenis Sampah</th>
                <th scope="col">Jumlah / Berat</th>
                <th scope="col">Nilai Saldo (Rp)</th>
                <th scope="col">Status Saldo</th>
                <th scope="col">Petugas Jaga</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiwayatPetugas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: "32px", color: "#888" }}
                  >
                    Tidak ditemukan riwayat pencatatan untuk filter tanggal yang dipilih.
                  </td>
                </tr>
              ) : (
                (tampilSemuaPetugas
                  ? filteredRiwayatPetugas
                  : filteredRiwayatPetugas.slice(0, 4)
                ).map((item) => {
                  const perluVerifikasi =
                    item.statusVerifikasi === "menunggu_verifikasi";
                  const nilaiRp = item.nilaiRealisasi ?? item.estimasiNilai;
                  return (
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
                        <strong>{item.jumlahSatuan || kg(item.beratKg)}</strong>
                      </td>
                      <td>
                        <strong
                          className={perluVerifikasi ? "dsh__amber" : "dsh__green"}
                        >
                          {rp(nilaiRp)}
                        </strong>
                      </td>
                      <td>
                        {perluVerifikasi ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              alignItems: "flex-start",
                            }}
                          >
                            <span className="dsh__chip dsh__chip--amber">
                              Menunggu Konfirmasi
                            </span>
                            <button
                              type="button"
                              className="dsh__btn"
                              style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              onClick={() => handleVerifikasiItem(item)}
                            >
                              Sah &amp; Masukkan Saldo
                            </button>
                          </div>
                        ) : (
                          <span className="dsh__chip dsh__chip--green">
                            Tercatat di Saldo
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="dsh__subtext" style={{ color: "#444" }}>
                          {item.dicatatOleh || "Ahmad Fauzi"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRiwayatPetugas.length > 4 && (
          <button
            type="button"
            className="dsh__expandbtn"
            onClick={() => setTampilSemuaPetugas((prev) => !prev)}
          >
            {tampilSemuaPetugas
              ? "Ringkas Riwayat Pencatatan ↑"
              : `Lihat Lengkap (${filteredRiwayatPetugas.length} Setoran) ↓`}
          </button>
        )}
      </section>
    </div>
  );
}

