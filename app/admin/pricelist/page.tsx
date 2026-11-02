"use client";

import { useId, useState } from "react";
import { PRICELIST_AWAL, rp, type JenisSampah } from "../../../lib/bss";

export default function PricelistAdmin() {
  const [pricelist, setPricelist] = useState<JenisSampah[]>(PRICELIST_AWAL);
  const [selectedId, setSelectedId] = useState<string>(PRICELIST_AWAL[0].id);
  const [hargaEdit, setHargaEdit] = useState<number>(PRICELIST_AWAL[0].hargaPerKg);
  const [namaBaru, setNamaBaru] = useState<string>("");
  const [kategoriBaru, setKategoriBaru] = useState<"Plastik" | "Kertas" | "Logam">("Plastik");
  const [hargaBaru, setHargaBaru] = useState<number>(3000);
  const [deskripsiBaru, setDeskripsiBaru] = useState<string>("");
  const [pesan, setPesan] = useState<string>("");

  const idSelectPricelist = useId();
  const idHargaEdit = useId();
  const idNamaBaru = useId();
  const idKategoriBaru = useId();
  const idHargaBaru = useId();
  const idDeskripsiBaru = useId();

  const handlePilihEdit = (id: string) => {
    setSelectedId(id);
    const item = pricelist.find((p) => p.id === id);
    if (item) setHargaEdit(item.hargaPerKg);
  };

  const handleUpdateHarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (hargaEdit <= 0) {
      alert("Harga per kilogram harus lebih besar dari Rp 0.");
      return;
    }

    const updated = pricelist.map((p) =>
      p.id === selectedId
        ? {
            ...p,
            hargaPerKg: hargaEdit,
            updateTerakhir: "Hari ini (Admin)",
          }
        : p
    );
    setPricelist(updated);
    setPesan(`Harga jenis sampah berhasil diperbarui menjadi ${rp(hargaEdit)} / kg.`);
    setTimeout(() => setPesan(""), 4000);
  };

  const handleTambahJenis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru.trim() || hargaBaru <= 0) {
      alert("Nama jenis dan harga acuan harus diisi dengan benar.");
      return;
    }

    const baru: JenisSampah = {
      id: `${kategoriBaru.toLowerCase()}_${Date.now()}`,
      kode: `X${pricelist.length + 1}`,
      nama: namaBaru.trim(),
      kategori: kategoriBaru,
      satuan: "kg",
      hargaPerKg: hargaBaru,
      deskripsi: deskripsiBaru.trim() || "Sampah daur ulang terpilah",
      updateTerakhir: "Hari ini (Admin)",
    };

    setPricelist([...pricelist, baru]);
    setPesan(`Jenis sampah baru "${baru.nama}" berhasil ditambahkan.`);
    setNamaBaru("");
    setDeskripsiBaru("");
    setTimeout(() => setPesan(""), 4000);
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Master Data Pricelist Sampah</h1>
        <p className="dsh__sub">
          Konfigurasi standar acuan harga jenis sampah per kilogram yang digunakan oleh Kalkulator Pintar dan Meja Timbang (FR-006, FR-007, BR-008).
        </p>
      </header>

      {pesan && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          {pesan}
        </div>
      )}

      <div className="dsh__split">
        {/* Tabel Master Data Pricelist */}
        <section className="dsh__card" aria-label="Tabel Pricelist Terdaftar">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Daftar Harga Acuan BSS</h2>
            <span className="dsh__meta">{pricelist.length} jenis sampah</span>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Jenis Sampah</th>
                  <th>Kategori</th>
                  <th>Harga / Satuan</th>
                  <th>Pembaruan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pricelist.map((p) => (
                  <tr key={p.id} className={p.id === selectedId ? "dsh__row--active" : ""}>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          background: "#eae7df",
                          color: "#2b261f",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {p.kode || p.id}
                      </span>
                    </td>
                    <td>
                      <strong>[{p.kode || p.id}] {p.nama}</strong>
                      <span className="dsh__subtext">{p.deskripsi}</span>
                    </td>
                    <td>
                      <span className="dsh__badgecategory">{p.kategori}</span>
                    </td>
                    <td>
                      <strong className="dsh__green">{rp(p.hargaPerKg)} / {p.satuan}</strong>
                    </td>
                    <td className="dsh__small">{p.updateTerakhir}</td>
                    <td>
                      <button
                        type="button"
                        className="dsh__btnoutline dsh__btnoutline--sm"
                        onClick={() => handlePilihEdit(p.id)}
                      >
                        Ubah Harga
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel Form Edit & Tambah */}
        <div className="dsh__stack">
          {/* Form Perbarui Harga */}
          <section className="dsh__card" aria-label="Perbarui Harga Terpilih">
            <div className="dsh__cardhead">
              <h2 className="dsh__h2">Perbarui Harga Acuan</h2>
              <span className="dsh__tagbadge">Edit Cepat</span>
            </div>
            <form onSubmit={handleUpdateHarga} className="dsh__form">
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idSelectPricelist}>Pilih Jenis Sampah</label>
                <select
                  id={idSelectPricelist}
                  className="dsh__select"
                  value={selectedId}
                  onChange={(e) => handlePilihEdit(e.target.value)}
                >
                  {pricelist.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({rp(p.hargaPerKg)}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idHargaEdit}>Harga Baru per Kg (Rp)</label>
                <input
                  id={idHargaEdit}
                  type="number"
                  step="100"
                  min="100"
                  className="dsh__input"
                  value={hargaEdit}
                  onChange={(e) => setHargaEdit(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="dsh__btn">
                Simpan Perubahan Harga
              </button>
            </form>
          </section>

          {/* Form Tambah Jenis Baru */}
          <section className="dsh__card" aria-label="Tambah Jenis Sampah Baru">
            <div className="dsh__cardhead">
              <h2 className="dsh__h2">Tambah Jenis Sampah Baru</h2>
              <span className="dsh__tagbadge">Admin Utama</span>
            </div>
            <form onSubmit={handleTambahJenis} className="dsh__form">
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idNamaBaru}>Nama Jenis Sampah</label>
                <input
                  id={idNamaBaru}
                  type="text"
                  placeholder="mis. Botol Kaca Bening"
                  className="dsh__input"
                  required
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                />
              </div>

              <div className="dsh__grid2">
                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idKategoriBaru}>Kategori</label>
                  <select
                    id={idKategoriBaru}
                    className="dsh__select"
                    value={kategoriBaru}
                    onChange={(e) => setKategoriBaru(e.target.value as "Plastik" | "Kertas" | "Logam")}
                  >
                    <option value="Plastik">Plastik</option>
                    <option value="Kertas">Kertas</option>
                    <option value="Logam">Logam</option>
                  </select>
                </div>
                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idHargaBaru}>Harga per Kg (Rp)</label>
                  <input
                    id={idHargaBaru}
                    type="number"
                    step="100"
                    min="100"
                    className="dsh__input"
                    value={hargaBaru}
                    onChange={(e) => setHargaBaru(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idDeskripsiBaru}>Kriteria & Deskripsi</label>
                <input
                  id={idDeskripsiBaru}
                  type="text"
                  placeholder="mis. Bersih, label dilepas, kering"
                  className="dsh__input"
                  value={deskripsiBaru}
                  onChange={(e) => setDeskripsiBaru(e.target.value)}
                />
              </div>

              <button type="submit" className="dsh__btnoutline">
                Tambah ke Master Pricelist
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
