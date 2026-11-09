"use client";

import { useEffect, useState } from "react";
import { hitungStatistikMonitoring } from "../../../lib/bss";
import ManajemenAkunCrud from "../../../components/app/ManajemenAkunCrud";

export default function NasabahAdmin() {
  const [statistik, setStatistik] = useState(() => hitungStatistikMonitoring());

  const muatData = () => {
    setStatistik(hitungStatistikMonitoring());
  };

  useEffect(() => {
    muatData();
  }, []);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <div className="dsh__headrole">
          <span className="dsh__tagbadge">Master Data &amp; Manajemen Akun</span>
          <span className="dsh__dot" aria-hidden="true">
            •
          </span>
          <span className="dsh__meta">Bank Sampah Syariah UINSA</span>
        </div>
        <h1 className="dsh__h1">Master Data &amp; Kelola Akun</h1>
        <p className="dsh__sub">
          Kelola pembuatan akun serta CRUD untuk akun Petugas (<code>usernamegmail@petugas.com</code>) &amp; Bendahara (<code>usernamegmail@bendahara.com</code>), serta daftar akun Nasabah.
        </p>
      </header>

      {/* Ringkasan Statistik Staff & Keaktifan Nasabah */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Staff Operasional</span>
          <p className="dsh__statlabel">Jumlah Staff (Petugas &amp; Bendahara)</p>
          <p className="dsh__big dsh__big--green">{statistik.jumlahStaff} Staff</p>
          <p className="dsh__statsmall">
            <strong>{statistik.jumlahPetugas} Petugas</strong> &amp;{" "}
            <strong>{statistik.jumlahBendahara} Bendahara</strong>
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
          <p className="dsh__big dsh__big--green">{statistik.nasabahAktif} Nasabah</p>
          <p className="dsh__statsmall">
            Menyetor sampah dalam ≤ 1 bulan terakhir
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Tidak Setor &gt; 1 Bulan</span>
          <p className="dsh__statlabel">Nasabah Tidak Aktif</p>
          <p className="dsh__big dsh__big--amber">
            {statistik.nasabahTidakAktif} Nasabah
          </p>
          <p className="dsh__statsmall">
            Tidak menyetor &gt; 1 bulan • Aktif kembali jika menyetor sampah
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Akun Terkelola</p>
          <p className="dsh__big">
            {statistik.totalNasabah + statistik.jumlahStaff} Akun
          </p>
          <p className="dsh__statsmall">
            {statistik.totalNasabah} Nasabah • {statistik.jumlahStaff} Staff
          </p>
        </div>
      </div>

      {/* Komponen Utama Pembuatan Akun Staff & Tabel Akun */}
      <ManajemenAkunCrud onDataChange={muatData} />
    </div>
  );
}
