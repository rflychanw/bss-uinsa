"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang } from "../../../lib/auth";
import {
  hitungRingkasanSaldoNasabah,
  kg,
  MINIMAL_PENARIKAN_RP,
  NASABAH_DEMO,
  rp,
} from "../../../lib/bss";

export default function ProfilNasabah() {
  const [nama, setNama] = useState(NASABAH_DEMO.nama);
  const [nomor, setNomor] = useState(NASABAH_DEMO.nomor);
  const [email, setEmail] = useState(NASABAH_DEMO.email);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi && sesi.role === "nasabah") {
      setNama(sesi.nama);
      setNomor(sesi.nomor);
      setEmail(sesi.email);
    }
    setMounted(true);
  }, []);

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
      <header className="dsh__head dsh__head--split">
        <div>
          <h1 className="dsh__h1">Buku Tabungan</h1>
          <p className="dsh__sub">
            Rekening digital Wadiah Bank Sampah Syariah UINSA.
          </p>
        </div>
        <Link href="/nasabah/riwayat?tab=penarikan" className="dsh__btn">
          Tarik Saldo →
        </Link>
      </header>

      <section className="dsh__wallet" aria-label="Rekening Tabungan Wadiah">
        <div className="dsh__wallethead">
          <div className="dsh__walletid">
            <span>Buku Tabungan Wadiah</span>
            <span>·</span>
            <strong>{nomor}</strong>
          </div>
          <span className="dsh__chip dsh__chip--green">Aktif</span>
        </div>

        <div className="dsh__walletmain">
          <div>
            <div className="dsh__walletlabel">Saldo Aktif Tersedia</div>
            <div className="dsh__walletamount">{rp(ringkasan.saldoTersedia)}</div>
            <div className="dsh__walletmeta">
              <span>{nama}</span>
              <span>·</span>
              <span>{NASABAH_DEMO.prodiFakultas}</span>
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
              Mutasi Rekening
            </Link>
          </div>
        </div>

        <div className="dsh__walletstrip">
          <div className="dsh__walletstat">
            <span>Setoran Valid</span>
            <strong>
              {rp(ringkasan.totalSaldoTerverifikasi)} ({kg(ringkasan.totalBeratTerverifikasiKg)})
            </strong>
          </div>
          <div className="dsh__walletstat">
            <span>Menunggu Verifikasi</span>
            <strong>{rp(ringkasan.totalMenungguVerifikasiRp)}</strong>
          </div>
          <div className="dsh__walletstat">
            <span>Sudah Dicairkan</span>
            <strong>{rp(ringkasan.totalDitarikSelesai)}</strong>
          </div>
        </div>
      </section>

      <section className="dsh__card" aria-label="Identitas Rekening">
        <div className="dsh__cardhead">
          <h2 className="dsh__h2">Identitas Rekening</h2>
          <span className="dsh__meta">Sejak {NASABAH_DEMO.terdaftarSejak}</span>
        </div>

        <dl className="dsh__ledger">
          <div className="dsh__ledgeritem">
            <dt>Nomor Rekening</dt>
            <dd>{nomor}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Email Civitas</dt>
            <dd>{email}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Unit / Fakultas</dt>
            <dd>{NASABAH_DEMO.prodiFakultas}</dd>
          </div>
          <div className="dsh__ledgeritem">
            <dt>Akad & Pencairan</dt>
            <dd>Wadiah · Min. {rp(MINIMAL_PENARIKAN_RP)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
