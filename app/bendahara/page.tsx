"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  admin,
  BATCH_PENGEPUL_AWAL,
  getDaftarPenarikan,
  getDaftarSetoran,
  hitungStatistikMonitoring,
  kg,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../lib/bss";

export default function BendaharaDashboardPage() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [riwayat, setRiwayat] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [penarikan, setPenarikan] = useState<PenarikanUang[]>([]);
  const [statistik, setStatistik] = useState(() => hitungStatistikMonitoring());

  useEffect(() => {
    setSesi(sesiSekarang());
    setRiwayat(getDaftarSetoran());
    setPenarikan(getDaftarPenarikan());
    setStatistik(hitungStatistikMonitoring());
  }, []);

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

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <div className="dsh__headrole">
          <span className="dsh__tagbadge">Bendahara Keuangan BSS</span>
          <span className="dsh__dot" aria-hidden="true">
            •
          </span>
          <span className="dsh__meta">Keuangan, Wadiah &amp; Alur Pengepul</span>
        </div>
        <h1 className="dsh__h1">Ringkasan Keuangan Bendahara</h1>
        <p className="dsh__sub">
          Monitor saldo wadiah nasabah, stok gudang belum terjual, bagi hasil penjualan pengepul, dan rekapitulasi kas operasional syariah.
        </p>
      </header>

      {/* METRIK KEUANGAN & GUDANG */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Akad Wadiah</span>
          <p className="dsh__statlabel">Kewajiban Tabungan Nasabah</p>
          <p className="dsh__big dsh__big--green">{rp(admin.saldoTerutang)}</p>
          <p className="dsh__statsmall">
            Akumulasi saldo tabungan seluruh nasabah terdaftar ({statistik.totalNasabah} akun)
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Stok Gudang (Belum Terjual)</p>
          <p className="dsh__big">{kg(totalGudang)}</p>
          <p className="dsh__statsmall">
            Estimasi nilai acuan: {rp(estimasiGudangRp)}
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Kas Operasional</span>
          <p className="dsh__statlabel">Kas BSS Terkumpul</p>
          <p className="dsh__big dsh__big--amber">{rp(kasOperasionalBss)}</p>
          <p className="dsh__statsmall">Hasil selisih penjualan pengepul</p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Berat Terkelola</p>
          <p className="dsh__big">{kg(admin.beratBulan)}</p>
          <p className="dsh__statsmall">Sejak program BSS FEBI diluncurkan</p>
        </div>
      </div>

      {/* Grid Menu Cepat & Alur Pengepul */}
      <div className="dsh__grid2">
        <section className="dsh__card" aria-label="Alur Pengepul Terakhir">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Alur Penjualan Pengepul Terakhir</h2>
              <p className="dsh__carddesc">
                Realisasi bagi hasil wadiah dan kas operasional BSS.
              </p>
            </div>
            <Link className="dsh__link" href="/bendahara/pengepul">
              Buka Alur →
            </Link>
          </div>
          <div className="dsh__list">
            {BATCH_PENGEPUL_AWAL.map((b) => (
              <div key={b.id} className="dsh__item">
                <div>
                  <strong>{b.id}</strong> — {b.tanggalJual}
                  <span className="dsh__subtext">
                    {b.namaPengepul} • {kg(b.totalBeratKg)} • Diterima{" "}
                    {rp(b.uangDiterima ?? 0)}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="dsh__chip dsh__chip--green">
                    Nasabah: +{rp(b.totalDisalurkan ?? 0)}
                  </span>
                  <span className="dsh__subtext">
                    Kas: +{rp(b.selisihKasBss ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dsh__card" aria-label="Menu Pintas Bendahara">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Akses Cepat Pengelolaan</h2>
              <p className="dsh__carddesc">
                Navigasi langsung ke modul keuangan, alur pengepul, rekap laporan, dan tarik tunai.
              </p>
            </div>
          </div>
          <div className="dsh__quicklinks">
            <Link className="dsh__quickcard" href="/bendahara/pengepul">
              <strong>Alur Penjualan Pengepul</strong>
              <span>
                Catat penerimaan uang pengepul &amp; salurkan bagi hasil wadiah nasabah.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/bendahara/rekap">
              <strong>Rekap &amp; Ekspor Laporan</strong>
              <span>
                Unduh rekapitulasi bulanan, triwulan, dan laporan akuntansi keuangan syariah.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/bendahara/tarik">
              <strong>Riwayat Tarik Tunai</strong>
              <span>
                Pencairan saldo tabungan nasabah di loket kasir / bendahara.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/bendahara/nasabah">
              <strong>Tabungan &amp; Saldo Nasabah</strong>
              <span>
                Lihat daftar buku tabungan dan saldo aktif seluruh civitas kampus.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/bendahara/pricelist">
              <strong>Master Pricelist</strong>
              <span>
                Pantau acuan harga beli/jual sampah terpilah (Kertas, Plastik, Logam).
              </span>
            </Link>
          </div>
        </section>
      </div>

      {/* Rangkuman Tarik Tunai Terakhir */}
      <section className="dsh__card" style={{ marginTop: "24px" }} aria-label="Penarikan Terakhir">
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Riwayat Pencairan &amp; Tarik Tunai Terakhir</h2>
            <p className="dsh__carddesc">
              Daftar transaksi penarikan saldo wadiah yang telah dilayani di loket bendahara.
            </p>
          </div>
          <Link className="dsh__link" href="/bendahara/tarik">
            Kelola Tarik Tunai →
          </Link>
        </div>
        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th scope="col">ID &amp; Tanggal</th>
                <th scope="col">Nasabah</th>
                <th scope="col">Nominal</th>
                <th scope="col">Metode</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {penarikan.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.id}</strong>
                    <span className="dsh__subtext">{p.tanggal}</span>
                  </td>
                  <td>
                    <strong>{p.namaNasabah}</strong>
                    <span className="dsh__subtext">{p.nomorNasabah}</span>
                  </td>
                  <td>
                    <strong style={{ color: "#b91c1c" }}>-{rp(p.nominal)}</strong>
                  </td>
                  <td>
                    <span className="dsh__chip">{p.metode.toUpperCase()}</span>
                  </td>
                  <td>
                    <span
                      className={`dsh__chip ${
                        p.status === "selesai" ? "dsh__chip--green" : "dsh__chip--amber"
                      }`}
                    >
                      {p.status === "selesai" ? "Selesai Dicairkan" : "Menunggu"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

