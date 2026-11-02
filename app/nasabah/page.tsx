"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  DAFTAR_NASABAH_MASTER,
  kg,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type SetoranNasabah,
} from "../../lib/bss";
import KalkulatorPintar from "../../components/app/KalkulatorPintar";

export default function DashboardNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  const nasabahData =
    DAFTAR_NASABAH_MASTER.find((n) => n.nomor === sesi?.nomor) ||
    DAFTAR_NASABAH_MASTER[0];

  const namaDepan = (sesi?.nama || nasabahData.nama).split(" ")[0];
  const nomorNasabah = sesi?.nomor || nasabahData.nomor;

  const setoranNasabah = RIWAYAT_SETORAN_AWAL.filter(
    (s) => s.nomorNasabah === nomorNasabah
  );

  const saldoDisalurkan = setoranNasabah
    .filter((s) => s.status === "disalurkan")
    .reduce((sum, item) => sum + (item.nilaiRealisasi ?? item.estimasiNilai), 0);

  const estimasiBelumTerjual = setoranNasabah
    .filter((s) => s.status === "belum_terjual")
    .reduce((sum, item) => sum + item.estimasiNilai, 0);

  const beratBelumTerjual = setoranNasabah
    .filter((s) => s.status === "belum_terjual")
    .reduce((sum, item) => sum + item.beratKg, 0);

  const totalBeratDisetor = setoranNasabah.reduce(
    (sum, item) => sum + item.beratKg,
    0
  );

  const sedekahTersalurkan = 12000;

  const tigaSetoranTerakhir = setoranNasabah.slice(0, 3);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Halo, {namaDepan}.</h1>
        <p className="dsh__sub">
          Buku Tabungan Digital Bank Sampah Syariah UINSA — Nomor Nasabah:{" "}
          <strong>{nomorNasabah}</strong>
        </p>
      </header>

      {/* Grid 4 Kartu Statistik */}
      <div className="dsh__statsgrid" aria-label="Ringkasan Tabungan">
        <div className="dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Uang Diterima / Tersalurkan</p>
          <p className="dsh__big dsh__big--green">{rp(saldoDisalurkan)}</p>
          <p className="dsh__statsmall">
            Akumulasi hasil penjualan sampah yang telah disalurkan tunai/transfer
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Menunggu Dijual</span>
          <p className="dsh__statlabel">Estimasi Nilai Belum Terjual</p>
          <p className="dsh__big dsh__big--amber">{rp(estimasiBelumTerjual)}</p>
          <p className="dsh__statsmall">
            Dari {kg(beratBelumTerjual)} sampah di gudang BSS (dihitung proporsional saat laku)
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Sampah Disetor</p>
          <p className="dsh__big">{kg(totalBeratDisetor)}</p>
          <p className="dsh__statsmall">
            Timbangan terverifikasi oleh petugas jaga di meja timbang
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Sedekah Tersalurkan</p>
          <p className="dsh__big">{rp(sedekahTersalurkan)}</p>
          <p className="dsh__statsmall">
            Dana kebajikan dialihkan untuk program sosial & kebersihan kampus
          </p>
        </div>
      </div>

      {/* Grid Bawah: Setoran Terakhir & Kalkulator Pintar */}
      <div className="dsh__split">
        {/* Panel Kiri: Setoran Terakhir */}
        <section className="dsh__card" aria-label="Setoran Terakhir">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Setoran Terakhir</h2>
            <Link href="/nasabah/riwayat" className="dsh__more">
              Lihat Semua Riwayat
            </Link>
          </div>

          <div className="dsh__rows">
            {tigaSetoranTerakhir.map((s: SetoranNasabah) => (
              <div key={s.id} className="dsh__row">
                <div className="dsh__rowmain">
                  <strong>{s.jenisSampahNama}</strong>
                  <span className="dsh__subtext">
                    {s.tanggal} · {kg(s.beratKg)} · Dicatat oleh: {s.dicatatOleh}
                  </span>
                  <div style={{ marginTop: "4px" }}>
                    {s.status === "disalurkan" ? (
                      <span className="dsh__chip dsh__chip--green">
                        Uang Disalurkan
                      </span>
                    ) : (
                      <span className="dsh__chip dsh__chip--amber">
                        Belum Terjual
                      </span>
                    )}
                  </div>
                </div>

                <div className="dsh__rowval">
                  <b className={s.status === "disalurkan" ? "dsh__green" : "dsh__amber"}>
                    {rp(s.status === "disalurkan" ? (s.nilaiRealisasi ?? s.estimasiNilai) : s.estimasiNilai)}
                  </b>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Panel Kanan: Kalkulator Pintar */}
        <section className="dsh__card" aria-label="Kalkulator Pintar">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Kalkulator Pintar</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
                Hitung perkiraan nilai rupiah sampahmu sebelum dibawa ke pos penimbangan BSS.
              </p>
            </div>
            <span className="dsh__tagbadge">Simulasi Cepat</span>
          </div>

          <KalkulatorPintar mode="nasabah" />
        </section>
      </div>
    </div>
  );
}
