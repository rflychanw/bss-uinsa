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
        totalDitarikSelesai: 125000,
        saldoTersedia: 78300,
      };

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
        <div>
          <h1 className="dsh__h1">Kartu Dompet & Buku Tabungan</h1>
          <p className="dsh__sub">
            Kartu identitas digital nasabah dan ringkasan dompet syariah BSS UINSA.
          </p>
        </div>
        <Link
          href="/nasabah/riwayat?tab=penarikan"
          className="dsh__btn"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 700,
            fontSize: "13px",
            padding: "9px 16px",
          }}
        >
          💵 Cairkan Saldo (Min. {rp(MINIMAL_PENARIKAN_RP)})
        </Link>
      </header>

      {/* KARTU MEMBER DIGITAL E-WALLET */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, #133b1d 0%, #1d592b 60%, #2a783c 100%)",
            color: "#fff",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "210px",
            boxShadow: "0 14px 32px rgba(19, 59, 29, 0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.16)",
                padding: "4px 10px",
                borderRadius: "999px",
              }}
            >
              BSS Pay • Wadiah Member Card
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#ffe082",
                fontWeight: 700,
              }}
            >
              ✓ Terverifikasi Aktif
            </span>
          </div>

          <div style={{ margin: "20px 0" }}>
            <div
              style={{
                fontSize: "12px",
                opacity: 0.8,
                marginBottom: "4px",
              }}
            >
              Saldo Dompet Tersedia
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              {rp(ringkasan.saldoTersedia)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(255,255,255,0.16)",
              paddingTop: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>{nama}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                {NASABAH_DEMO.prodiFakultas}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", opacity: 0.75 }}>ID NASABAH</div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  color: "#ffe082",
                }}
              >
                {nomor}
              </div>
            </div>
          </div>
        </div>

        <section className="dsh__card" aria-label="Identitas Nasabah">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Ringkasan Statistik Dompet</h2>
            <span className="dsh__chip dsh__chip--green">Akad Wadiah</span>
          </div>
          <dl className="dsh__kv">
            <div>
              <dt>Email Civitas Kampus</dt>
              <dd>{email}</dd>
            </div>
            <div>
              <dt>Total Sampah Terverifikasi Petugas</dt>
              <dd>
                <strong>{kg(ringkasan.totalBeratTerverifikasiKg)}</strong> (Total
                akumulasi masuk:{" "}
                <strong>{rp(ringkasan.totalSaldoTerverifikasi)}</strong>)
              </dd>
            </div>
            <div>
              <dt>Setoran Menunggu Verifikasi Petugas</dt>
              <dd>
                <strong className="dsh__amber">
                  {rp(ringkasan.totalMenungguVerifikasiRp)}
                </strong>
              </dd>
            </div>
            <div>
              <dt>Total Saldo Telah Dicairkan (Tunai / Bank / E-Wallet)</dt>
              <dd>
                <strong>{rp(ringkasan.totalDitarikSelesai)}</strong>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Alur Setoran & Verifikasi">
          <h2 className="dsh__h2">Top-Up Saldo dari Setor Sampah</h2>
          <p className="dsh__carddesc">
            Saldo dompet BSS Pay Anda bertambah setiap kali menyetor sampah terpilah ke Pos Meja Timbang.
          </p>
          <ul className="dsh__list">
            <li>
              Bawa sampah satuan (`pcs`) atau kiloan (`kg`/`gram`) ke meja pelayanan <strong>Petugas Jaga</strong>.
            </li>
            <li>
              Petugas Jaga menimbang dan menekan tombol <strong>Verifikasi Setoran</strong>.
            </li>
            <li>
              Begitu terverifikasi, nilai rupiah otomatis masuk menjadi <strong>Saldo Aktif</strong> di E-Wallet Anda.
            </li>
          </ul>
        </section>

        <section className="dsh__card" aria-label="Prosedur Pencairan Saldo">
          <h2 className="dsh__h2">
            Pencairan Bebas Pilih (Min. {rp(MINIMAL_PENARIKAN_RP)})
          </h2>
          <p className="dsh__carddesc">
            Cairkan saldo kapan saja mulai dari <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong> melalui:
          </p>
          <ol className="dsh__steps">
            <li>
              <strong>📱 Saldo E-Wallet (DANA, GoPay, OVO, ShopeePay, LinkAja)</strong> — instan otomatis berhasil.
            </li>
            <li>
              <strong>🏦 Transfer Rekening Bank (BSI, Mandiri, BRI, BCA, BNI)</strong> — instan otomatis berhasil.
            </li>
            <li>
              <strong>💵 Tarik Tunai di Pos Jaga</strong> — ajukan tiket penarikan dari aplikasi lalu divalidasi oleh Petugas Jaga saat serah terima uang tunai.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
