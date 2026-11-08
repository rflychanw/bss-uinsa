"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang } from "../../../lib/auth";
import {
  DAFTAR_NASABAH_MASTER,
  hitungRingkasanSaldoNasabah,
  kg,
  MINIMAL_PENARIKAN_RP,
  NASABAH_DEMO,
  rp,
} from "../../../lib/bss";
import LembarBukuTabungan from "../../../components/app/LembarBukuTabungan";

export default function ProfilNasabah() {
  const [nama, setNama] = useState(NASABAH_DEMO.nama);
  const [nomor, setNomor] = useState(NASABAH_DEMO.nomor);
  const [email, setEmail] = useState(NASABAH_DEMO.email);
  const [prodiFakultas, setProdiFakultas] = useState(NASABAH_DEMO.prodiFakultas);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi && sesi.role === "nasabah") {
      setNama(sesi.nama);
      setNomor(sesi.nomor);
      setEmail(sesi.email);
      if (sesi.fakultas) {
        setProdiFakultas(
          sesi.kategori === "umum"
            ? "Masyarakat Umum"
            : `${sesi.fakultas}${sesi.prodi ? ` (${sesi.prodi})` : ""}`
        );
      }
    }
    const master =
      DAFTAR_NASABAH_MASTER.find((n) => n.nomor === (sesi?.nomor || nomor)) ||
      DAFTAR_NASABAH_MASTER[0];
    if (master && (!sesi || !sesi.fakultas)) {
      setProdiFakultas(master.fakultas);
    }
    setMounted(true);
  }, [nomor]);

  const ringkasan = mounted
    ? hitungRingkasanSaldoNasabah(nomor)
    : {
        totalBeratTerverifikasiKg: 48.9,
        totalSaldoTerverifikasi: 203300,
        totalMenungguVerifikasiRp: 18000,
        totalMenungguVerifikasiKg: 3.0,
        totalDitarikSelesai: 125000,
        saldoTersedia: 78300,
      };

  return (
    <div className="dsh__page">
      {/* HEADER HALAMAN BUKU TABUNGAN */}
      <header className="dsh__head dsh__head--split no-print">
        <div>
          <h1 className="dsh__h1">Buku Tabungan Nasabah</h1>
          <p className="dsh__sub">
            Lembar Catatan Tabungan Wadiah Bank Sampah Syariah UIN Sunan Ampel Surabaya.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => window.print()}
          >
            🖨️ Cetak Buku
          </button>
          <Link href="/nasabah/riwayat?tab=penarikan" className="dsh__btn">
            Tarik Saldo →
          </Link>
        </div>
      </header>

      {/* STRIP RINGKASAN SALDO & AKUN */}
      <section className="dsh__wallet no-print" aria-label="Rekening Tabungan Wadiah">
        <div className="dsh__wallethead">
          <div className="dsh__walletid">
            <span>Buku Tabungan Wadiah</span>
            <span>·</span>
            <strong>{nomor}</strong>
            <span>·</span>
            <span>{nama}</span>
          </div>
          <span className="dsh__chip dsh__chip--green">Aktif &amp; Terverifikasi</span>
        </div>

        <div className="dsh__walletmain">
          <div>
            <div className="dsh__walletlabel">Saldo Aktif Tercatat di Buku</div>
            <div className="dsh__walletamount">{rp(ringkasan.saldoTersedia)}</div>
            <div className="dsh__walletmeta">
              <span>{nama}</span>
              <span>·</span>
              <span>{prodiFakultas}</span>
              <span>·</span>
              <span>Min. Tarik {rp(MINIMAL_PENARIKAN_RP)}</span>
            </div>
          </div>

          <div className="dsh__walletactions">
            <Link
              href="/nasabah/riwayat?tab=penarikan"
              className="dsh__walletbtn dsh__walletbtn--primary"
            >
              Cairkan Saldo
            </Link>
            <Link
              href="/nasabah/riwayat"
              className="dsh__walletbtn dsh__walletbtn--ghost"
            >
              Lihat Riwayat Lengkap
            </Link>
          </div>
        </div>

        <div className="dsh__walletstrip">
          <div className="dsh__walletstat">
            <span>Total Kredit (Setor Valid)</span>
            <strong>
              {rp(ringkasan.totalSaldoTerverifikasi)} ({kg(ringkasan.totalBeratTerverifikasiKg)})
            </strong>
          </div>
          <div className="dsh__walletstat">
            <span>Total Debet (Ditarik)</span>
            <strong>{rp(ringkasan.totalDitarikSelesai)}</strong>
          </div>
          <div className="dsh__walletstat">
            <span>Menunggu Verifikasi Meja</span>
            <strong>{rp(ringkasan.totalMenungguVerifikasiRp)}</strong>
          </div>
        </div>
      </section>

      {/* ==============================================================
          LEMBAR TABUNGAN NASABAH
         ============================================================== */}
      <section aria-label="Lembar Tabungan Nasabah">
        <LembarBukuTabungan
          nomorNasabahProp={nomor}
          namaNasabahProp={nama}
          prodiFakultasProp={prodiFakultas}
          showToolbar={true}
        />
      </section>

      {/* INFORMASI REKENING / IDENTITAS */}
      <section className="dsh__card no-print" aria-label="Identitas Rekening" style={{ marginTop: "12px" }}>
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Identitas Pemilik Buku Tabungan</h2>
            <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
              Data pendaftaran civitas akademika pemegang rekening tabungan syariah.
            </p>
          </div>
          <span className="dsh__meta">Terdaftar Sejak {NASABAH_DEMO.terdaftarSejak}</span>
        </div>

        <dl className="dsh__ledger">
          <div className="dsh__ledgeritem">
            <dt>Nomor Buku / Rekening</dt>
            <dd>{nomor}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Nama Lengkap Nasabah</dt>
            <dd>{nama}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Email Civitas</dt>
            <dd>{email}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Unit / Fakultas</dt>
            <dd>{prodiFakultas}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Skema Akad</dt>
            <dd>Wadiah Yad Dhamanah (Titipan Bergaransi Amanah)</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Ketentuan Pencairan</dt>
            <dd>Bebas biaya admin · Minimal penarikan {rp(MINIMAL_PENARIKAN_RP)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
