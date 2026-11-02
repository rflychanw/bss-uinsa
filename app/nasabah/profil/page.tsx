"use client";

import { useEffect, useState } from "react";
import { sesiSekarang } from "../../../lib/auth";
import { kg, NASABAH_DEMO, rp } from "../../../lib/bss";

export default function ProfilNasabah() {
  const [nama, setNama] = useState(NASABAH_DEMO.nama);
  const [nomor, setNomor] = useState(NASABAH_DEMO.nomor);
  const [email, setEmail] = useState(NASABAH_DEMO.email);

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi && sesi.role === "nasabah") {
      setNama(sesi.nama);
      setNomor(sesi.nomor);
      setEmail(sesi.email);
    }
  }, []);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Buku Tabungan & Profil Nasabah</h1>
        <p className="dsh__sub">
          Informasi keanggotaan dan catatan resmi Bank Sampah Syariah UINSA.
        </p>
      </header>

      <section className="dsh__card" aria-label="Identitas Nasabah">
        <div className="dsh__cardhead">
          <h2 className="dsh__h2">Identitas Nasabah BSS</h2>
          <span className="dsh__chip dsh__chip--green">Status: Aktif</span>
        </div>
        <dl className="dsh__kv">
          <div>
            <dt>Nama Lengkap</dt>
            <dd><strong>{nama}</strong></dd>
          </div>
          <div>
            <dt>Nomor Induk Nasabah</dt>
            <dd><code className="dsh__code">{nomor}</code></dd>
          </div>
          <div>
            <dt>Email Civitas Kampus</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Prodi & Fakultas</dt>
            <dd>{NASABAH_DEMO.prodiFakultas}</dd>
          </div>
          <div>
            <dt>Terdaftar Sejak</dt>
            <dd>{NASABAH_DEMO.terdaftarSejak}</dd>
          </div>
          <div>
            <dt>Total Sampah Disetor</dt>
            <dd><strong>{kg(NASABAH_DEMO.totalBeratKg)}</strong></dd>
          </div>
          <div>
            <dt>Saldo Diterima / Tersalurkan</dt>
            <dd><strong className="dsh__green">{rp(NASABAH_DEMO.akumulasiTersalurkan)}</strong></dd>
          </div>
          <div>
            <dt>Estimasi Sampah Belum Terjual</dt>
            <dd><strong className="dsh__amber">{rp(NASABAH_DEMO.estimasiBelumTerjual)}</strong></dd>
          </div>
          <div>
            <dt>Sedekah Disalurkan</dt>
            <dd>{rp(NASABAH_DEMO.totalSedekah)}</dd>
          </div>
        </dl>
      </section>

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Akad Syariah Wadiah">
          <h2 className="dsh__h2">Akad Syariah: Wadiah Yad Dhamanah</h2>
          <p className="dsh__carddesc">
            Sampah yang dititipkan nasabah kepada pengelola BSS diperlakukan sebagai titipan yang dapat dikelola untuk daur ulang (Yad Dhamanah).
          </p>
          <ul className="dsh__list">
            <li>Nasabah berhak penuh atas hasil bersih penjualan sampah setelah dipotong biaya operasional yang disepakati.</li>
            <li>Tanpa bunga (riba), tanpa biaya administrasi bulanan, dan bebas potongan liar.</li>
            <li>Nasabah dapat mengikhlaskan sebagian atau seluruh saldonya untuk infaq/sedekah lingkungan.</li>
          </ul>
        </section>

        <section className="dsh__card" aria-label="Prosedur Pencairan Tunai">
          <h2 className="dsh__h2">Pencairan Dana Tabungan</h2>
          <p className="dsh__carddesc">
            Pencairan saldo dilakukan langsung di Kantor Sekretariat Lab FEBI UINSA Kampus Gunung Anyar.
          </p>
          <ol className="dsh__steps">
            <li>Tunjukkan nomor nasabah atau email saat berkunjung ke sekretariat.</li>
            <li>Sebutkan nominal saldo tersalurkan yang ingin dicairkan tunai atau dialihkan ke sedekah.</li>
            <li>Petugas memverifikasi dan menyerahkan uang tunai atau bukti transfer.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
