"use client";

import { useId, useState } from "react";
import KalkulatorPintar from "../../../components/app/KalkulatorPintar";
import {
  DAFTAR_NASABAH_MASTER,
  kg,
  PRICELIST_AWAL,
  RIWAYAT_SETORAN_AWAL,
  rp,
  type JenisSampah,
  type SetoranNasabah,
} from "../../../lib/bss";
import { sesiSekarang } from "../../../lib/auth";

export default function SetoranAdmin() {
  const [daftarSetoran, setDaftarSetoran] =
    useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [nasabahTerpilih, setNasabahTerpilih] = useState(
    DAFTAR_NASABAH_MASTER[0].nomor
  );
  const [suksesMsg, setSuksesMsg] = useState<string>("");

  const idSelectNasabah = useId();

  const handleSimpanSetoran = (data: {
    items?: { jenis: JenisSampah; beratKg: number; estimasiRp: number }[];
    jenis: JenisSampah;
    beratKg: number;
    estimasiRp: number;
  }) => {
    const list = data.items && data.items.length > 0
      ? data.items
      : [{ jenis: data.jenis, beratKg: data.beratKg, estimasiRp: data.estimasiRp }];

    const validItems = list.filter((it) => it.beratKg > 0);
    if (validItems.length === 0) {
      alert("Berat timbangan harus lebih besar dari 0.");
      return;
    }

    const targetNasabah =
      DAFTAR_NASABAH_MASTER.find((n) => n.nomor === nasabahTerpilih) ||
      DAFTAR_NASABAH_MASTER[0];

    const sesi = sesiSekarang();
    const namaPencatat = sesi?.nama || "Ahmad Fauzi (Petugas Piket)";

    const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const newEntries: SetoranNasabah[] = validItems.map((it, idx) => ({
      id: `S-0${913 + daftarSetoran.length - 7 + idx}`,
      nomorNasabah: targetNasabah.nomor,
      namaNasabah: targetNasabah.nama,
      tanggal: tanggalHariIni,
      jenisSampahId: it.jenis.id,
      jenisSampahNama: `[${it.jenis.kode}] ${it.jenis.nama}`,
      beratKg: it.beratKg,
      estimasiNilai: it.estimasiRp,
      status: "belum_terjual",
      dicatatOleh: namaPencatat,
    }));

    setDaftarSetoran([...newEntries, ...daftarSetoran]);
    const totalEst = validItems.reduce((acc, c) => acc + c.estimasiRp, 0);
    const totalKgVal = validItems.reduce((acc, c) => acc + c.beratKg, 0);

    setSuksesMsg(
      `${validItems.length} jenis sampah (${kg(totalKgVal)} = ${rp(
        totalEst
      )}) berhasil dicatat untuk ${targetNasabah.nama} dengan status "Belum Terjual".`
    );

    setTimeout(() => {
      setSuksesMsg("");
    }, 6000);
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Pencatatan Setoran Sampah</h1>
        <p className="dsh__sub">
          Modul petugas meja timbang — input timbangan, kalkulasi otomatis via Kalkulator Pintar, dan penerbitan bukti setoran (FR-008 s.d FR-013).
        </p>
      </header>

      {suksesMsg && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          <strong>Berhasil Disimpan:</strong> {suksesMsg}
        </div>
      )}

      {/* Formulir Pencatatan & Kalkulator Pintar Petugas */}
      <section className="dsh__card" aria-label="Formulir Penimbangan Setoran">
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Input Timbangan & Kalkulator Pintar</h2>
            <p className="dsh__carddesc">
              Pilih nasabah yang sedang berada di meja timbang, lalu masukkan hasil timbangan.
            </p>
          </div>
          <span className="dsh__tagbadge">Petugas Jaga Piket</span>
        </div>

        <div className="dsh__formsection">
          <div className="dsh__field">
            <label className="dsh__label" htmlFor={idSelectNasabah}>
              Pilih Nasabah di Meja Timbang
            </label>
            <select
              id={idSelectNasabah}
              className="dsh__select"
              value={nasabahTerpilih}
              onChange={(e) => setNasabahTerpilih(e.target.value)}
            >
              {DAFTAR_NASABAH_MASTER.map((n) => (
                <option key={n.nomor} value={n.nomor}>
                  {n.nomor} — {n.nama} ({n.fakultas})
                </option>
              ))}
            </select>
          </div>

          <KalkulatorPintar
            mode="petugas"
            onPilih={(data) => handleSimpanSetoran(data)}
          />
        </div>
      </section>

      {/* Tabel Riwayat Seluruh Setoran Masuk */}
      <section className="dsh__card" aria-label="Daftar Setoran Sampah">
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Daftar Setoran Masuk</h2>
            <span className="dsh__meta">
              Total {daftarSetoran.length} transaksi tercatat di sistem
            </span>
          </div>
        </div>

        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th>No. ID</th>
                <th>Nasabah</th>
                <th>Tanggal</th>
                <th>Jenis Sampah</th>
                <th>Berat (kg)</th>
                <th>Estimasi Nilai</th>
                <th>Status (SRS)</th>
                <th>Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody>
              {daftarSetoran.map((s) => (
                <tr key={s.id}>
                  <td>
                    <code className="dsh__code">{s.id}</code>
                  </td>
                  <td>
                    <strong>{s.namaNasabah}</strong>
                    <span className="dsh__subtext">{s.nomorNasabah}</span>
                  </td>
                  <td>{s.tanggal}</td>
                  <td>{s.jenisSampahNama}</td>
                  <td>
                    <strong>{kg(s.beratKg)}</strong>
                  </td>
                  <td>{rp(s.estimasiNilai)}</td>
                  <td>
                    <span
                      className={`dsh__chip ${
                        s.status === "disalurkan"
                          ? "dsh__chip--green"
                          : "dsh__chip--amber"
                      }`}
                    >
                      {s.status === "disalurkan"
                        ? "Uang Disalurkan"
                        : "Belum Terjual"}
                    </span>
                  </td>
                  <td className="dsh__small">{s.dicatatOleh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
