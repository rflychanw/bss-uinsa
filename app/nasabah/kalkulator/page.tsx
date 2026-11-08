"use client";

import { useEffect, useMemo, useState } from "react";
import KalkulatorPintar from "../../../components/app/KalkulatorPintar";
import {
  getKategoriSampah,
  getPricelist,
  PRICELIST_AWAL,
  rp,
  type JenisSampah,
} from "../../../lib/bss";

const KATEGORI_FILTER = [
  { id: "Semua", label: "Semua" },
  { id: "Kertas", label: "Kertas" },
  { id: "Plastik", label: "Plastik" },
  { id: "Logam", label: "Logam" },
  { id: "Kaca", label: "Kaca & Lainnya" },
];

export default function KalkulatorNasabahPage() {
  const [pricelist, setPricelist] = useState<JenisSampah[]>(PRICELIST_AWAL);
  const [kategoriAktif, setKategoriAktif] = useState<string>("Semua");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);

  useEffect(() => {
    setPricelist(getPricelist());
  }, []);

  const daftarTerfilter = useMemo(() => {
    return pricelist.filter((j) => {
      if (kategoriAktif === "Semua") return true;
      const katUtama = getKategoriSampah(j.id, j.nama);
      if (kategoriAktif === "Kaca") {
        return katUtama === "Kaca" || katUtama === "Lain-lain";
      }
      return katUtama === kategoriAktif;
    });
  }, [pricelist, kategoriAktif]);

  const daftarTampil = tampilSemua
    ? daftarTerfilter
    : daftarTerfilter.slice(0, 4);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Kalkulator Pintar</h1>
        <p className="dsh__sub">
          Simulasi nilai setoran sampah kiloan maupun satuan.
        </p>
      </header>

      <div className="dsh__split">
        {/* Panel Kiri: Kalkulator */}
        <section className="dsh__card" aria-label="Kalkulator simulasi setoran">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Hitung Estimasi</h2>
            <span className="dsh__meta">kg · gram · pcs</span>
          </div>
          <KalkulatorPintar mode="nasabah" />
        </section>

        {/* Panel Kanan: Daftar Harga Acuan Ringkas (Default 4 Item) */}
        <section className="dsh__card" aria-label="Daftar Harga Acuan Sampah">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Harga Acuan Barang</h2>
            <span className="dsh__meta">
              {daftarTampil.length} / {daftarTerfilter.length} kode
            </span>
          </div>

          <div
            className="dsh__filtertabs"
            style={{ marginBottom: "6px" }}
            role="tablist"
          >
            {KATEGORI_FILTER.map((k) => (
              <button
                key={k.id}
                type="button"
                className="dsh__filtertab"
                style={{ padding: "5px 10px", fontSize: "12px" }}
                data-active={kategoriAktif === k.id}
                onClick={() => {
                  setKategoriAktif(k.id);
                  setTampilSemua(false);
                }}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="dsh__rows">
            {daftarTampil.map((j) => (
              <div
                key={j.id}
                className="dsh__row"
                style={{ padding: "9px 4px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <code className="dsh__code">{j.kode}</code>
                  <strong style={{ fontSize: "13.5px" }}>{j.nama}</strong>
                </div>
                <div className="dsh__rowval">
                  <b className="dsh__green" style={{ fontSize: "13.5px" }}>
                    {rp(j.hargaPerKg)}/{j.satuan}
                  </b>
                </div>
              </div>
            ))}
          </div>

          {daftarTerfilter.length > 4 && (
            <button
              type="button"
              className="dsh__expandbtn"
              onClick={() => setTampilSemua((prev) => !prev)}
            >
              {tampilSemua
                ? "Ringkas Daftar Harga ↑"
                : `Lihat Lengkap (${daftarTerfilter.length - 4} Barang Lainnya) ↓`}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
