import { kg, riwayat, rp } from "../../../lib/bss";

export default function RiwayatNasabah() {
  const totalBerat = riwayat.reduce((s, r) => s + r.berat, 0);
  const totalNilai = riwayat.reduce((s, r) => s + r.nilai, 0);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Riwayat setoran.</h1>
        <p className="dsh__sub">
          {riwayat.length} setoran ·{" "}
          <span className="dsh__nw">{kg(totalBerat)}</span> ·{" "}
          <span className="dsh__nw">{rp(totalNilai)}</span>
        </p>
      </header>

      <section className="dsh__card" aria-label="Daftar setoran">
        <div className="dsh__rows">
          {riwayat.map((r) => (
            <div className="dsh__row" key={r.id}>
              <div className="dsh__rowmain">
                <strong>{r.jenis}</strong>
                <span className="dsh__meta">
                  {r.tanggal} · {r.id} · {kg(r.berat)}
                </span>
              </div>
              <div className="dsh__rowval">
                <b>{rp(r.nilai)}</b>
                <span className="dsh__chip" data-status={r.status}>
                  {r.status === "selesai" ? "Selesai" : "Menunggu"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="dsh__note">
        Harga mengikuti daftar yang berlaku saat penimbangan. Selisih berat di
        atas 0,2 kg bisa ditanyakan di sekretariat — timbangan dibaca di depan
        nasabah.
      </p>
    </div>
  );
}
