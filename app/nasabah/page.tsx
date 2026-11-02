import { kg, nasabah, riwayat, rp } from "../../lib/bss";

export default function RingkasanNasabah() {
  const terakhir = riwayat.slice(0, 3);
  const namaDepan = nasabah.nama.split(" ")[0];

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Halo, {namaDepan}.</h1>
        <p className="dsh__sub">
          Ruang nasabah Bank Sampah Syariah UINSA — nomor {nasabah.nomor},
          menabung sejak {nasabah.sejak}.
        </p>
      </header>

      <section className="dsh__card dsh__saldo" aria-label="Saldo tabungan">
        <div>
          <p className="dsh__big">{rp(nasabah.saldo)}</p>
          <p className="dsh__label">Saldo tabungan</p>
        </div>
        <dl className="dsh__facts">
          <div>
            <dt className="dsh__cap">Sampah tercatat</dt>
            <dd>{kg(nasabah.berat)}</dd>
          </div>
          <div>
            <dt className="dsh__cap">Sudah disedekahkan</dt>
            <dd>{rp(nasabah.sedekah)}</dd>
          </div>
        </dl>
      </section>

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Setoran terakhir">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Setoran terakhir</h2>
            <a className="dsh__more" href="/nasabah/riwayat">
              Semua riwayat
            </a>
          </div>
          <div className="dsh__rows">
            {terakhir.map((r) => (
              <div className="dsh__row" key={r.id}>
                <div className="dsh__rowmain">
                  <strong>{r.jenis}</strong>
                  <span className="dsh__meta">
                    {r.tanggal} · {kg(r.berat)}
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

        <section className="dsh__card" aria-label="Cara mengambil saldo">
          <h2 className="dsh__h2">Ambil saldo</h2>
          <p className="dsh__note">
            Pencairan dilayani di sekretariat pada hari layanan, bukan lewat
            halaman ini.
          </p>
          <ol className="dsh__steps">
            <li>Bawa buku tabungan, sebutkan jumlah yang mau diambil.</li>
            <li>Petugas mencatat di buku, lalu saldo dibayar tunai.</li>
            <li>Sebagian atau seluruhnya boleh dialihkan jadi sedekah.</li>
          </ol>
          <p className="dsh__note">
            <a href="/#tanya">Baca tanya jawab</a>
          </p>
        </section>
      </div>
    </div>
  );
}
