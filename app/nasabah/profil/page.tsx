import { kg, nasabah, rp } from "../../../lib/bss";

export default function ProfilNasabah() {
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Profil.</h1>
        <p className="dsh__sub">
          Data yang dipakai untuk buku tabungan dan pencairan saldo.
        </p>
      </header>

      <section className="dsh__card" aria-label="Data nasabah">
        <dl className="dsh__kv">
          <div>
            <dt>Nama</dt>
            <dd>{nasabah.nama}</dd>
          </div>
          <div>
            <dt>Nomor nasabah</dt>
            <dd>{nasabah.nomor}</dd>
          </div>
          <div>
            <dt>Kontak</dt>
            <dd>{nasabah.kontak}</dd>
          </div>
          <div>
            <dt>Alamat</dt>
            <dd>{nasabah.alamat}</dd>
          </div>
          <div>
            <dt>Nasabah sejak</dt>
            <dd>{nasabah.sejak}</dd>
          </div>
          <div>
            <dt>Total sampah tercatat</dt>
            <dd>{kg(nasabah.berat)}</dd>
          </div>
          <div>
            <dt>Saldo</dt>
            <dd>{rp(nasabah.saldo)}</dd>
          </div>
        </dl>
      </section>

      <p className="dsh__note">
        Perubahan nama, kontak, atau alamat dilayani langsung di sekretariat
        Lab FEBI — supaya buku tabungan dan data bank tetap sama.
      </p>
    </div>
  );
}
