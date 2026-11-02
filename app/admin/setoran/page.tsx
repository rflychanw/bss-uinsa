import { kg, rp, setoranMasuk } from "../../../lib/bss";

export default function SetoranAdmin() {
  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Setoran masuk.</h1>
        <p className="dsh__sub">
          {setoranMasuk.length} catatan terakhir, yang terbaru di atas.
        </p>
      </header>

      <section className="dsh__card" aria-label="Daftar setoran masuk">
        <div className="dsh__rows">
          {setoranMasuk.map((s) => (
            <div className="dsh__row" key={s.id}>
              <div className="dsh__rowmain">
                <strong>{s.nama}</strong>
                <span className="dsh__meta">
                  {s.nomor} · {s.tanggal} · {s.jenis} · {kg(s.berat)}
                </span>
              </div>
              <div className="dsh__rowval">
                <b>{rp(s.nilai)}</b>
                <span className="dsh__chip" data-status={s.status}>
                  {s.status === "selesai" ? "Selesai" : "Menunggu"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
