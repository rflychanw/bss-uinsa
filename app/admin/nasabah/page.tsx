"use client";

import { useId, useMemo, useState } from "react";
import {
  DAFTAR_NASABAH_MASTER,
  kg,
  rp,
  type NasabahMaster,
} from "../../../lib/bss";

export default function NasabahAdmin() {
  const [daftar, setDaftar] =
    useState<NasabahMaster[]>(DAFTAR_NASABAH_MASTER);
  const [cari, setCari] = useState<string>("");
  const [namaBaru, setNamaBaru] = useState<string>("");
  const [emailBaru, setEmailBaru] = useState<string>("");
  const [fakultasBaru, setFakultasBaru] = useState<string>(
    "Sains & Teknologi / Sistem Informasi"
  );
  const [sukses, setSukses] = useState<string>("");

  const idCari = useId();
  const idNama = useId();
  const idEmail = useId();
  const idFakultas = useId();

  const filtered = useMemo(() => {
    if (!cari.trim()) return daftar;
    const q = cari.toLowerCase();
    return daftar.filter(
      (n) =>
        n.nama.toLowerCase().includes(q) ||
        n.nomor.toLowerCase().includes(q) ||
        n.fakultas.toLowerCase().includes(q)
    );
  }, [daftar, cari]);

  const handleTambahNasabah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru.trim()) return;

    const nomorUrut = daftar.length + 1;
    const nomorFormat = `BSS-${nomorUrut.toString().padStart(4, "0")}`;

    const baru: NasabahMaster = {
      nomor: nomorFormat,
      nama: namaBaru.trim(),
      email: emailBaru.trim() || `${namaBaru.toLowerCase().replace(/\s+/g, "")}@uinsa.ac.id`,
      fakultas: fakultasBaru,
      totalBeratKg: 0,
      totalDisalurkan: 0,
      estimasiGudang: 0,
      status: "aktif",
      terdaftar: "28 Okt 2026",
    };

    setDaftar([baru, ...daftar]);
    setSukses(`Nasabah baru berhasil didaftarkan: ${baru.nama} (${baru.nomor})`);
    setNamaBaru("");
    setEmailBaru("");
    setTimeout(() => setSukses(""), 5000);
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Master Data Nasabah & Pengguna</h1>
        <p className="dsh__sub">
          Kelola direktori nasabah civitas akademika dan pembagian hak akses (RBAC) Bank Sampah Syariah UINSA (FR-006 & BR-005).
        </p>
      </header>

      {sukses && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          {sukses}
        </div>
      )}

      <div className="dsh__split">
        {/* Tabel Data Nasabah Terdaftar */}
        <section className="dsh__card" aria-label="Tabel Direktori Nasabah">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Direktori Nasabah Kampus</h2>
              <span className="dsh__meta">{filtered.length} nasabah ditemukan</span>
            </div>
            <div className="dsh__filterwrap">
              <label htmlFor={idCari} className="sr-only">Cari Nasabah</label>
              <input
                id={idCari}
                type="text"
                placeholder="Cari nama / nomor BSS..."
                className="dsh__input dsh__input--sm"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Nomor BSS</th>
                  <th>Nama Nasabah</th>
                  <th>Fakultas / Prodi</th>
                  <th>Total Setor</th>
                  <th>Uang Disalurkan</th>
                  <th>Estimasi Gudang</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.nomor}>
                    <td>
                      <code className="dsh__code">{n.nomor}</code>
                    </td>
                    <td>
                      <strong>{n.nama}</strong>
                      <span className="dsh__subtext">{n.email}</span>
                    </td>
                    <td>{n.fakultas}</td>
                    <td>{kg(n.totalSetorKg ?? n.totalBeratKg ?? 0)}</td>
                    <td>
                      <strong className="dsh__green">{rp(n.akumulasiTersalurkan ?? n.totalDisalurkan ?? 0)}</strong>
                    </td>
                    <td>
                      <span className="dsh__amber">{rp(n.estimasiBelumTerjual ?? n.estimasiGudang ?? 0)}</span>
                    </td>
                    <td>
                      <span className="dsh__chip dsh__chip--green">{n.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Form Tambah Nasabah Cepat */}
        <section className="dsh__card" aria-label="Pendaftaran Nasabah Baru">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Daftarkan Nasabah Baru</h2>
            <span className="dsh__tagbadge">Meja Registrasi</span>
          </div>
          <p className="dsh__carddesc">
            Registrasi kilat untuk mahasiswa, dosen, atau tenaga kependidikan yang baru pertama kali menyetor.
          </p>

          <form onSubmit={handleTambahNasabah} className="dsh__form">
            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idNama}>
                Nama Lengkap
              </label>
              <input
                id={idNama}
                type="text"
                className="dsh__input"
                placeholder="mis. Muhammad Raihan"
                required
                value={namaBaru}
                onChange={(e) => setNamaBaru(e.target.value)}
              />
            </div>

            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idEmail}>
                Email Civitas UINSA
              </label>
              <input
                id={idEmail}
                type="email"
                className="dsh__input"
                placeholder="mis. raihan@uinsa.ac.id"
                value={emailBaru}
                onChange={(e) => setEmailBaru(e.target.value)}
              />
            </div>

            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idFakultas}>
                Fakultas / Program Studi
              </label>
              <select
                id={idFakultas}
                className="dsh__select"
                value={fakultasBaru}
                onChange={(e) => setFakultasBaru(e.target.value)}
              >
                <option value="Sains & Teknologi / Sistem Informasi">
                  FST — Sistem Informasi
                </option>
                <option value="Ekonomi & Bisnis Islam / Perbankan Syariah">
                  FEBI — Perbankan Syariah
                </option>
                <option value="Tarbiyah & Keguruan / Manajemen Pendidikan">
                  FTK — Tarbiyah & Keguruan
                </option>
                <option value="Syariah & Hukum / Hukum Ekonomi Syariah">
                  FSH — Syariah & Hukum
                </option>
                <option value="Tenaga Kependidikan / Pengelola Kampus">
                  Tendik / Staf UINSA
                </option>
              </select>
            </div>

            <button type="submit" className="dsh__btn">
              Simpan & Terbitkan Nomor BSS
            </button>
          </form>

          {/* RBAC Info SRS */}
          <div className="dsh__note dsh__notebox">
            <strong>Hak Akses Berbasis Peran (RBAC):</strong>
            <p>
              Sistem BSS UINSA menerapkan 4 hierarki peran: <strong>Nasabah</strong> (lihat buku tabungan & kalkulator), <strong>Petugas Jaga</strong> (input timbangan), <strong>Bendahara</strong> (alur pengepul & rekap kas), dan <strong>Administrator</strong> (master data & user).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
