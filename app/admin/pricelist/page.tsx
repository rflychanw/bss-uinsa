"use client";

import { useEffect, useId, useState } from "react";
import {
  getPricelist,
  PRICELIST_AWAL,
  rp,
  simpanPricelist,
  type JenisSampah,
} from "../../../lib/bss";

export default function PricelistAdmin() {
  const [pricelist, setPricelist] = useState<JenisSampah[]>(PRICELIST_AWAL);
  const [selectedId, setSelectedId] = useState<string>(PRICELIST_AWAL[0].id);
  const [hargaEdit, setHargaEdit] = useState<number>(PRICELIST_AWAL[0].hargaPerKg);
  const [namaBaru, setNamaBaru] = useState<string>("");
  const [kategoriBaru, setKategoriBaru] = useState<"Plastik" | "Kertas" | "Logam">("Plastik");
  const [hargaBaru, setHargaBaru] = useState<number>(3000);
  const [pesan, setPesan] = useState<string>("");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);

  useEffect(() => {
    const list = getPricelist();
    setPricelist(list);
    if (list.length > 0) {
      setSelectedId(list[0].id);
      setHargaEdit(list[0].hargaPerKg);
    }
  }, []);

  const idSelectPricelist = useId();
  const idHargaEdit = useId();
  const idNamaBaru = useId();
  const idKategoriBaru = useId();
  const idHargaBaru = useId();

  const handlePilihEdit = (id: string) => {
    setSelectedId(id);
    const item = pricelist.find((p) => p.id === id);
    if (item) setHargaEdit(item.hargaPerKg);
  };

  const handleUpdateHarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (hargaEdit <= 0) {
      alert("Harga harus lebih besar dari Rp 0.");
      return;
    }

    const updated = pricelist.map((p) =>
      p.id === selectedId
        ? {
            ...p,
            hargaPerKg: hargaEdit,
            updateTerakhir: "Hari ini",
          }
        : p
    );
    setPricelist(updated);
    simpanPricelist(updated);
    setPesan(`Harga berhasil diperbarui menjadi ${rp(hargaEdit)}.`);
    setTimeout(() => setPesan(""), 4000);
  };

  const handleTambahJenis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru.trim() || hargaBaru <= 0) {
      alert("Nama barang dan harga acuan wajib diisi.");
      return;
    }

    const prefix = kategoriBaru === "Kertas" ? "A" : kategoriBaru === "Plastik" ? "B" : "C";
    const kodeBaru = `${prefix}${pricelist.filter((p) => p.kode.startsWith(prefix)).length + 1}`;

    const baru: JenisSampah = {
      id: kodeBaru,
      kode: kodeBaru,
      nama: namaBaru.trim(),
      kategori: kategoriBaru,
      satuan: "kg",
      hargaPerKg: hargaBaru,
      deskripsi: "Sampah terpilah",
      updateTerakhir: "Hari ini",
    };

    const updated = [...pricelist, baru];
    setPricelist(updated);
    simpanPricelist(updated);
    setPesan(`Barang baru "${baru.kode} · ${baru.nama}" berhasil ditambahkan.`);
    setNamaBaru("");
    setTimeout(() => setPesan(""), 4000);
  };

  const daftarTampil = tampilSemua ? pricelist : pricelist.slice(0, 5);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Daftar Harga Barang</h1>
        <p className="dsh__sub">
          Standar harga acuan per kg/pcs. Perubahan harga hanya berlaku untuk setoran baru (setoran lama terkunci).
        </p>
      </header>

      {pesan && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          {pesan}
        </div>
      )}

      <div className="dsh__split">
        <section className="dsh__card" aria-label="Tabel Pricelist Terdaftar">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Master Harga Acuan</h2>
            <span className="dsh__meta">
              {daftarTampil.length} / {pricelist.length} barang
            </span>
          </div>

          <div className="dsh__rows">
            {daftarTampil.map((p) => (
              <div
                key={p.id}
                className="dsh__row"
                style={{
                  padding: "10px 6px",
                  background: p.id === selectedId ? "#f2f8f3" : undefined,
                  borderRadius: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <code className="dsh__code">{p.kode}</code>
                  <strong>{p.nama}</strong>
                  <span className="dsh__meta">· {p.kategori}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong className="dsh__green">
                    {rp(p.hargaPerKg)}/{p.satuan}
                  </strong>
                  <button
                    type="button"
                    className="dsh__btnoutline dsh__btnoutline--sm"
                    onClick={() => handlePilihEdit(p.id)}
                  >
                    Ubah
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pricelist.length > 5 && (
            <button
              type="button"
              className="dsh__expandbtn"
              onClick={() => setTampilSemua((prev) => !prev)}
            >
              {tampilSemua
                ? "Ringkas Daftar Harga ↑"
                : `Lihat Lengkap (${pricelist.length - 5} Barang Lainnya) ↓`}
            </button>
          )}
        </section>

        <div className="dsh__stack">
          <section className="dsh__card" aria-label="Perbarui Harga Terpilih">
            <div className="dsh__cardhead">
              <h2 className="dsh__h2">Perbarui Harga</h2>
            </div>
            <form onSubmit={handleUpdateHarga} className="dsh__form">
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idSelectPricelist}>
                  Pilih Barang
                </label>
                <select
                  id={idSelectPricelist}
                  className="dsh__select"
                  value={selectedId}
                  onChange={(e) => handlePilihEdit(e.target.value)}
                >
                  {pricelist.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode} · {p.nama} ({rp(p.hargaPerKg)}/{p.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idHargaEdit}>
                  Harga Baru (Rp)
                </label>
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
                Simpan Harga
              </button>
            </form>
          </section>

          <section className="dsh__card" aria-label="Tambah Jenis Sampah Baru">
            <div className="dsh__cardhead">
              <h2 className="dsh__h2">Tambah Barang Baru</h2>
            </div>
            <form onSubmit={handleTambahJenis} className="dsh__form">
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idNamaBaru}>
                  Nama Barang
                </label>
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
                  <label className="dsh__label" htmlFor={idKategoriBaru}>
                    Kategori
                  </label>
                  <select
                    id={idKategoriBaru}
                    className="dsh__select"
                    value={kategoriBaru}
                    onChange={(e) =>
                      setKategoriBaru(
                        e.target.value as "Plastik" | "Kertas" | "Logam"
                      )
                    }
                  >
                    <option value="Plastik">Plastik</option>
                    <option value="Kertas">Kertas</option>
                    <option value="Logam">Logam</option>
                  </select>
                </div>
                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idHargaBaru}>
                    Harga (Rp/kg)
                  </label>
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

              <button type="submit" className="dsh__btnoutline">
                + Tambah ke Daftar Harga
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
