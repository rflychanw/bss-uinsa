import { daftarNasabah, kg, rp } from "../../../lib/bss";

export default function NasabahAdmin() {
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Nasabah.</h1>
        <p className="dsh__sub">
          Diurutkan dari setoran terakhir. Saldo diambil dari buku tabungan.
        </p>
      </header>

      <section className="dsh__card" aria-label="Daftar nasabah">
        <div className="dsh__rows">
          {daftarNasabah.map((n) => (
            <div className="dsh__row" key={n.nomor}>
              <div className="dsh__rowmain">
                <strong>{n.nama}</strong>
                <span className="dsh__meta">
                  {n.nomor} · {kg(n.berat)} · terakhir {n.terakhir}
                </span>
              </div>
              <div className="dsh__rowval">
                <b>{rp(n.saldo)}</b>
                <span className="dsh__chip">Aktif</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
