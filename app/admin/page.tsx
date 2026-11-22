"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  admin,
  BATCH_PENGEPUL_AWAL,
  getDaftarSetoran,
  hitungStatistikMonitoring,
  kg,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type SetoranNasabah,
} from "../../lib/bss";

export default function AdminMonitoringPage() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [riwayat, setRiwayat] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [statistik, setStatistik] = useState(() => hitungStatistikMonitoring());

  const muatUlangData = () => {
    setSesi(sesiSekarang());
    setRiwayat(getDaftarSetoran());
    setStatistik(hitungStatistikMonitoring());
  };

  useEffect(() => {
    muatUlangData();
  }, []);

  // Data perhitungan untuk gudang & kas operasional
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
          <span className="dsh__tagbadge">Administrator Sistem BSS</span>
          <span className="dsh__dot" aria-hidden="true">
            •
          </span>
          <span className="dsh__meta">
            Monitoring Sistem, Staff &amp; Keaktifan Nasabah
          </span>
        </div>
        <h1 className="dsh__h1">Monitoring Sistem BSS UINSA</h1>
        <p className="dsh__sub">
          Pemantauan terpadu jumlah staff (petugas &amp; bendahara), status keaktifan nasabah (aktif vs tidak aktif &gt; 1 bulan), serta alur penyaluran dan kas syariah.
        </p>
      </header>

      {/* =================================================================
          BARIS 1 MONITORING SISTEM: JUMLAH STAFF (PETUGAS & BENDAHARA)
          SERTA NASABAH AKTIF & TIDAK AKTIF (> 1 BULAN)
          ================================================================= */}
      <div className="dsh__statsgrid" style={{ marginBottom: "8px" }}>
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">SDM Operasional BSS</span>
          <p className="dsh__statlabel">Jumlah Staff (Petugas &amp; Bendahara)</p>
          <p className="dsh__big dsh__big--green">{statistik.jumlahStaff} Staff</p>
          <p className="dsh__statsmall">
            <strong>{statistik.jumlahPetugas} Petugas</strong> (@petugas.com) &amp;{" "}
            <strong>{statistik.jumlahBendahara} Bendahara</strong> (@bendahara.com)
          </p>
        </div>

        <div className="dsh__statcard">
          <span className="dsh__statbadge">Rincian Staff &amp; Pengelola</span>
          <p className="dsh__statlabel">Petugas vs Bendahara</p>
          <p className="dsh__big">
            {statistik.jumlahPetugas} / {statistik.jumlahBendahara}
          </p>
          <p className="dsh__statsmall">
            {statistik.jumlahPetugas} Petugas Jaga • {statistik.jumlahBendahara}{" "}
            Bendahara • {statistik.jumlahAdmin} Admin
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--primary">
          <span
            className="dsh__statbadge"
            style={{ background: "#eaf5eb", color: "#276b30", borderColor: "#c8e6c9" }}
          >
            Setor ≤ 1 Bulan
          </span>
          <p className="dsh__statlabel">Nasabah Aktif</p>
          <p className="dsh__big dsh__big--green">
            {statistik.nasabahAktif} Nasabah
          </p>
          <p className="dsh__statsmall">
            Rutin menyetor sampah dalam ≤ 1 bulan terakhir (dari {statistik.totalNasabah} nasabah)
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Tidak Setor &gt; 1 Bulan</span>
          <p className="dsh__statlabel">Nasabah Tidak Aktif</p>
          <p className="dsh__big dsh__big--amber">
            {statistik.nasabahTidakAktif} Nasabah
          </p>
          <p className="dsh__statsmall">
            Tidak menyetor &gt; 1 bulan • Otomatis aktif lagi saat menyetor sampah
          </p>
        </div>
      </div>

      {/* BARIS 2 METRIK KEUANGAN & GUDANG */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Akad Wadiah</span>
          <p className="dsh__statlabel">Kewajiban Tabungan Nasabah</p>
          <p className="dsh__big dsh__big--green">{rp(admin.saldoTerutang)}</p>
          <p className="dsh__statsmall">
            Akumulasi saldo tabungan seluruh nasabah terdaftar
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
              <p className="dsh__carddesc">
                Realisasi bagi hasil wadiah dan kas operasional BSS.
              </p>
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

        <section className="dsh__card" aria-label="Menu Pintas Pengelola">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Akses Cepat Pengelolaan</h2>
              <p className="dsh__carddesc">
                Navigasi langsung ke modul keuangan, master data akun, dan daftar harga.
              </p>
            </div>
          </div>
          <div className="dsh__quicklinks">
            <Link className="dsh__quickcard" href="/admin/nasabah">
              <strong>Master Data &amp; CRUD Akun</strong>
              <span>
                Kelola akun Nasabah, Petugas (@petugas.com), Bendahara (@bendahara.com), dan Admin.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/pricelist">
              <strong>Master Pricelist</strong>
              <span>
                Atur nilai acuan per kg sampah terpilah (Kertas, Plastik, Logam, Kaca).
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/pengepul">
              <strong>Kelola Penjualan Pengepul</strong>
              <span>
                Hitung bagi hasil otomatis antara hak nasabah &amp; kas BSS.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/rekap">
              <strong>Rekap &amp; Laporan Keuangan</strong>
              <span>
                Unduh laporan berkala untuk pimpinan fakultas &amp; audit.
              </span>
            </Link>
            <Link className="dsh__quickcard" href="/admin/aktivasi">
              <strong>Aktivasi Akun Nasabah</strong>
              <span>
                Verifikasi bukti pembayaran &amp; aktivasi pendaftaran nasabah baru.
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
