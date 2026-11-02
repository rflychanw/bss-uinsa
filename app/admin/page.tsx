import Queue from "../../components/app/Queue";
import { admin, kg0, rp } from "../../lib/bss";

export default function RingkasanAdmin() {
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Ringkasan sekretariat.</h1>
        <p className="dsh__sub">
          Setoran, nasabah, dan saldo terutang Bank Sampah Syariah UINSA —
          dicatat petugas sekretariat.
        </p>
      </header>

      <div className="dsh__stats">
        <div className="dsh__stat">
          <p className="dsh__num">{admin.nasabahAktif}</p>
          <p className="dsh__label">Nasabah aktif</p>
        </div>
        <div className="dsh__stat">
          <p className="dsh__num">{kg0(admin.beratBulan)}</p>
          <p className="dsh__label">Sampah bulan ini</p>
        </div>
        <div className="dsh__stat">
          <p className="dsh__num">{rp(admin.saldoTerutang)}</p>
          <p className="dsh__label">Saldo terutang</p>
        </div>
      </div>

      <section className="dsh__card" aria-label="Antrean verifikasi">
        <div className="dsh__cardhead">
          <h2 className="dsh__h2">Menunggu verifikasi</h2>
          <span className="dsh__meta">{admin.menunggu} setoran</span>
        </div>
        <Queue />
      </section>

      <p className="dsh__note">
        Verifikasi menandai setoran sudah masuk buku tabungan nasabah. Berat dan
        harga di sini sama dengan yang dibaca di depan nasabah saat menimbang.
      </p>
    </div>
  );
}
