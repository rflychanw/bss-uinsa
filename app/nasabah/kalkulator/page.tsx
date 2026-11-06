"use client";

import { useEffect, useState } from "react";
import KalkulatorPintar from "../../../components/app/KalkulatorPintar";
import { getPricelist, PRICELIST_AWAL, rp, type JenisSampah } from "../../../lib/bss";

export default function KalkulatorNasabahPage() {
  const [pricelist, setPricelist] = useState<JenisSampah[]>(PRICELIST_AWAL);

  useEffect(() => {
    setPricelist(getPricelist());
  }, []);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Kalkulator Pintar & Daftar Harga</h1>
        <p className="dsh__sub">
          Hitung estimasi konversi sampah kiloan, gram, maupun satuan (pcs) menjadi saldo rupiah sebelum disetor ke Petugas Jaga BSS FEBI UINSA.
        </p>
      </header>

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Kalkulator simulasi setoran">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Simulasi Nilai Sampah (Kg / Gram / Satuan)</h2>
            <span className="dsh__tagbadge">Respon &lt; 2 Detik (FR-013)</span>
          </div>
          <p className="dsh__carddesc">
            Pilih jenis sampah yang telah kamu pilah, masukkan berat (kg/gram) atau jumlah satuan (pcs), dan sistem akan langsung menghitung nilai saldonya.
          </p>
          <KalkulatorPintar mode="nasabah" />
        </section>

        <section className="dsh__card" aria-label="Daftar Harga Acuan Sampah">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Daftar Harga Acuan (Pricelist)</h2>
            <span className="dsh__tagbadge">Berlaku Aktif</span>
          </div>
          <p className="dsh__carddesc">
            Standar harga resmi yang berlaku saat ini di Bank Sampah Syariah UINSA.
          </p>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Jenis Sampah</th>
                  <th>Kategori</th>
                  <th>Harga / Satuan</th>
                </tr>
              </thead>
              <tbody>
                {pricelist.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <strong>{j.nama}</strong>
                      <span className="dsh__subtext">{j.deskripsi}</span>
                    </td>
                    <td>
                      <span className="dsh__badgecategory">{j.kategori}</span>
                    </td>
                    <td>
                      <strong className="dsh__green">{rp(j.hargaPerKg)} / {j.satuan}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="dsh__note">
        <strong>Ketentuan Penimbangan & Verifikasi Petugas Jaga:</strong>
        <p>
          Pastikan sampah dalam kondisi kering dan telah dipisahkan sesuai kategori.
          Saat disetor ke meja timbang, Petugas Jaga akan menginput dan memverifikasi setoran Anda sehingga nilainya langsung masuk ke Saldo Aktif (minimal penarikan Rp 2.000 via Tunai, Bank, atau E-Wallet).
        </p>
      </div>
    </div>
  );
}
