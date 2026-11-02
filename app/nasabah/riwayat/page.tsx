"use client";

import { useMemo, useState } from "react";
import {
  kg,
  NASABAH_DEMO,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type SetoranNasabah,
} from "../../../lib/bss";

export default function RiwayatNasabah() {
  const [filter, setFilter] = useState<"semua" | "belum_terjual" | "disalurkan">(
    "semua"
  );

  const daftar = useMemo(() => {
    const semua = RIWAYAT_SETORAN_AWAL.filter(
      (s) => s.nomorNasabah === "BSS-0142"
    );
    if (filter === "semua") return semua;
    return semua.filter((s) => s.status === filter);
  }, [filter]);

  const totalBerat = daftar.reduce((s, r) => s + r.beratKg, 0);
  const totalNilai = daftar.reduce(
    (s, r) =>
      s +
      (r.status === "disalurkan" ? r.nilaiRealisasi ?? r.estimasiNilai : r.estimasiNilai),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head dsh__head--split">
        <div>
          <h1 className="dsh__h1">Riwayat Transaksi Setoran</h1>
          <p className="dsh__sub">
            Buku catatan tabungan nasabah <strong>{NASABAH_DEMO.nama}</strong> ({NASABAH_DEMO.nomor})
          </p>
        </div>
        <button
          type="button"
          className="dsh__btnprint no-print"
          onClick={handlePrint}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            width={16}
            height={16}
            aria-hidden="true"
          >
            <path
              d="M5 7V3h10v4M5 14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 12h10v5H5v-5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          Cetak Riwayat Transaksi (FR-014)
        </button>
      </header>

      {/* Filter tab status */}
      <div className="dsh__filtertabs no-print" role="tablist">
        <button
          type="button"
          className="dsh__filtertab"
          data-active={filter === "semua"}
          onClick={() => setFilter("semua")}
        >
          Semua ({RIWAYAT_SETORAN_AWAL.filter((s) => s.nomorNasabah === "BSS-0142").length})
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={filter === "belum_terjual"}
          onClick={() => setFilter("belum_terjual")}
        >
          Belum Terjual ({RIWAYAT_SETORAN_AWAL.filter((s) => s.nomorNasabah === "BSS-0142" && s.status === "belum_terjual").length})
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={filter === "disalurkan"}
          onClick={() => setFilter("disalurkan")}
        >
          Uang Disalurkan ({RIWAYAT_SETORAN_AWAL.filter((s) => s.nomorNasabah === "BSS-0142" && s.status === "disalurkan").length})
        </button>
      </div>

      <section className="dsh__card" aria-label="Tabel Riwayat Setoran">
        <div className="dsh__cardhead">
          <span className="dsh__cardcount">
            Menampilkan <strong>{daftar.length}</strong> transaksi terdaftar
          </span>
          <span className="dsh__cardtotal">
            Total Berat: <strong>{kg(totalBerat)}</strong> · Nilai: <strong>{rp(totalNilai)}</strong>
          </span>
        </div>

        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th>No. ID</th>
                <th>Tanggal</th>
                <th>Jenis Sampah</th>
                <th>Berat</th>
                <th>Estimasi Nilai</th>
                <th>Realisasi Nilai</th>
                <th>Status Transaksi (SRS)</th>
                <th>Pencatat</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((r) => (
                <tr key={r.id}>
                  <td>
                    <code className="dsh__code">{r.id}</code>
                  </td>
                  <td>{r.tanggal}</td>
                  <td>
                    <strong>{r.jenisSampahNama}</strong>
                  </td>
                  <td>{kg(r.beratKg)}</td>
                  <td>{rp(r.estimasiNilai)}</td>
                  <td>
                    {r.status === "disalurkan" ? (
                      <strong className="dsh__green">
                        {rp(r.nilaiRealisasi ?? r.estimasiNilai)}
                      </strong>
                    ) : (
                      <span className="dsh__muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`dsh__chip ${
                        r.status === "disalurkan"
                          ? "dsh__chip--green"
                          : "dsh__chip--amber"
                      }`}
                    >
                      {r.status === "disalurkan"
                        ? "Uang Disalurkan"
                        : "Belum Terjual"}
                    </span>
                  </td>
                  <td className="dsh__small">{r.dicatatOleh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dsh__note dsh__noteprint">
        <strong>Ketentuan Syariah & Transparansi Timbangan:</strong>
        <p>
          Sesuai SRS BSS UINSA FR-010 & FR-011, sampah yang baru disetor berstatus
          <strong> Belum Terjual</strong> dengan nilai estimasi berdasar pricelist.
          Setelah sampah terkumpul dan terjual ke pengepul, bendahara mencatat
          penerimaan pembayaran dan status transaksi berganti menjadi
          <strong> Uang Disalurkan</strong> dengan perhitungan proporsional hak nasabah.
        </p>
      </div>
    </div>
  );
}
