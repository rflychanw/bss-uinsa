"use client";

import KalkulatorPintar from "../../../components/app/KalkulatorPintar";
import { PRICELIST_AWAL, rp } from "../../../lib/bss";

export default function KalkulatorNasabahPage() {
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Kalkulator Pintar & Daftar Harga</h1>
        <p className="dsh__sub">
          Hitung estimasi konversi sampah menjadi rupiah secara instan sebelum menyetor ke Pos Timbangan BSS FEBI UINSA.
        </p>
      </header>

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Kalkulator simulasi setoran">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Simulasi Nilai Sampah</h2>
            <span className="dsh__tagbadge">Respon &lt; 2 Detik (FR-013)</span>
          </div>
          <p className="dsh__carddesc">
            Pilih jenis sampah yang telah kamu pilah, masukkan berat timbangan, dan sistem akan langsung menghitung estimasi rupiahnya.
          </p>
          <KalkulatorPintar mode="nasabah" />
        </section>

        <section className="dsh__card" aria-label="Daftar Harga Acuan Sampah">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Daftar Harga Acuan (Pricelist)</h2>
            <span className="dsh__tagbadge">Berlaku Aktif</span>
          </div>
          <p className="dsh__carddesc">
            Standar harga per kilogram yang berlaku saat ini di Bank Sampah Syariah UINSA.
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
                {PRICELIST_AWAL.map((j) => (
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
        <strong>Ketentuan Penimbangan Bersih:</strong>
        <p>
          Pastikan sampah dalam kondisi kering dan telah dipisahkan dari residu/kotoran non-ekonomis.
          Timbangan dilakukan langsung secara terbuka di meja petugas jaga untuk memastikan transparansi timbangan syariah.
        </p>
      </div>
    </div>
  );
}
