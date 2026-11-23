"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  getPricelist,
  PRICELIST_AWAL,
  rp,
  simpanPricelist,
  type JenisSampah,
} from "../../../lib/bss";
import { hasSupabaseEnv } from "../../../lib/supabase/client";
import { subscribeBssDataUpdated } from "../../../lib/supabase/store";
import {
  tambahJenisSampahSupabase,
  updateHargaPricelistSupabase,
} from "../../../lib/supabase/sync";

export default function PricelistAdmin() {
  const [pricelist, setPricelist] = useState<JenisSampah[]>(() => getPricelist());
  const [selectedId, setSelectedId] = useState<string>(
    () => getPricelist()[0]?.id || PRICELIST_AWAL[0].id
  );
  const [hargaEdit, setHargaEdit] = useState<number>(
    () => getPricelist()[0]?.hargaPerKg || PRICELIST_AWAL[0].hargaPerKg
  );
  const [satuanEdit, setSatuanEdit] = useState<string>(
    () => getPricelist()[0]?.satuan || "kg"
  );

  // State Tambah Barang Baru
  const [namaBaru, setNamaBaru] = useState<string>("");
  const [jenisBaru, setJenisBaru] = useState<string>("[A] KERTAS");
  const [kodeBaru, setKodeBaru] = useState<string>("");
  const [hargaBaru, setHargaBaru] = useState<number>(1000);
  const [satuanBaru, setSatuanBaru] = useState<string>("kg");

  // State Filter & Tampilan
  const [cari, setCari] = useState<string>("");
  const [filterJenis, setFilterJenis] = useState<string>("semua");
  const [pesan, setPesan] = useState<string>("");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);

  const idSelectPricelist = useId();
  const idHargaEdit = useId();
  const idNamaBaru = useId();
  const idJenisBaru = useId();
  const idKodeBaru = useId();
  const idHargaBaru = useId();
  const idSatuanBaru = useId();

  useEffect(() => {
    const segarkan = () => {
      const list = getPricelist();
      setPricelist(list);
      if (list.length > 0) {
        setSelectedId((prev) => {
          const cur = list.find((p) => p.id === prev) || list[0];
          setHargaEdit(cur.hargaPerKg);
          setSatuanEdit(cur.satuan || "kg");
          return cur.id;
        });
      }
    };
    segarkan();
    return subscribeBssDataUpdated(segarkan);
  }, []);

  const handlePilihEdit = (id: string) => {
    setSelectedId(id);
    const item = pricelist.find((p) => p.id === id);
    if (item) {
      setHargaEdit(item.hargaPerKg);
      setSatuanEdit(item.satuan || "kg");
    }
  };

  const handleUpdateHarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hargaEdit <= 0) {
      alert("Harga harus lebih besar dari Rp 0.");
      return;
    }

    const itemTarget = pricelist.find((p) => p.id === selectedId);
    if (hasSupabaseEnv()) {
      const res = await updateHargaPricelistSupabase(
        itemTarget?.kode || selectedId,
        hargaEdit
      );
      if (!res.ok) {
        alert(res.pesan);
        return;
      }
      setPricelist(getPricelist());
    } else {
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
    }
    setPesan(`Harga acuan "${itemTarget?.kode} · ${itemTarget?.nama}" berhasil diperbarui menjadi ${rp(hargaEdit)}/${satuanEdit}.`);
    setTimeout(() => setPesan(""), 4000);
  };

  const handleTambahJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBaru.trim() || hargaBaru <= 0) {
      alert("Nama barang dan harga acuan wajib diisi.");
      return;
    }

    const prefix = jenisBaru.includes("KERTAS")
      ? "A"
      : jenisBaru.includes("PLASTIK")
      ? "B"
      : jenisBaru.includes("LOGAM")
      ? "D"
      : "E";

    const idKode =
      kodeBaru.trim().toUpperCase() ||
      `${prefix}${pricelist.filter((p) => p.kode.startsWith(prefix)).length + 1}`;

    const baru: JenisSampah = {
      id: idKode,
      kode: idKode,
      nama: namaBaru.trim(),
      kategori: namaBaru.trim(),
      jenis: jenisBaru,
      satuan: satuanBaru || "kg",
      hargaPerKg: hargaBaru,
      deskripsi: `Kategori ${namaBaru.trim()} (${jenisBaru})`,
      updateTerakhir: "Hari ini",
    };

    if (hasSupabaseEnv()) {
      const res = await tambahJenisSampahSupabase({
        kode: baru.kode,
        nama: baru.nama,
        jenis: baru.jenis || jenisBaru,
        satuan: baru.satuan,
        hargaPerKg: baru.hargaPerKg,
        deskripsi: baru.deskripsi,
      });
      if (!res.ok) {
        alert(res.pesan);
        return;
      }
      setPricelist(getPricelist());
    } else {
      const updated = [...pricelist, baru];
      setPricelist(updated);
      simpanPricelist(updated);
    }
    setPesan(`Barang baru "${baru.kode} · ${baru.nama}" (${baru.jenis}) berhasil ditambahkan.`);
    setNamaBaru("");
    setKodeBaru("");
    setTimeout(() => setPesan(""), 4000);
  };

  // Ekspor CSV
  const handleEksporCSV = () => {
    const headers = ["JENIS", "KATEGORI", "KODE", "HARGA PER"];
    const rows = pricelist.map((p) => [
      `"${p.jenis || p.kategori}"`,
      `"${p.nama || p.kategori}"`,
      `"${p.kode}"`,
      `"${p.hargaPerKg.toLocaleString("id-ID")}/${p.satuan || "kg"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Master_Price_List_BSS.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Data
  const listTerfilter = useMemo(() => {
    return pricelist.filter((p) => {
      const kelompok = p.jenis || `[${p.kode.charAt(0)}] ${p.kategori.toUpperCase()}`;
      if (filterJenis !== "semua" && kelompok !== filterJenis) {
        return false;
      }
      if (cari.trim()) {
        const q = cari.toLowerCase();
        const match =
          p.kode.toLowerCase().includes(q) ||
          p.nama.toLowerCase().includes(q) ||
          p.kategori.toLowerCase().includes(q) ||
          (p.jenis && p.jenis.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [pricelist, cari, filterJenis]);

  const daftarPilihanJenis = useMemo(() => {
    const setJenis = new Set<string>();
    pricelist.forEach((p) => {
      setJenis.add(p.jenis || `[${p.kode.charAt(0)}] ${p.kategori.toUpperCase()}`);
    });
    return Array.from(setJenis);
  }, [pricelist]);

  const daftarTampil = tampilSemua ? listTerfilter : listTerfilter.slice(0, 8);
  const selectedItem = pricelist.find((p) => p.id === selectedId) || pricelist[0];

  return (
    <div className="dsh__page">
      {/* HEADER HALAMAN */}
      <header className="dsh__head dsh__head--split">
        <div>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Master Data &amp; Pricelist</span>
            <span className="dsh__dot" aria-hidden="true">•</span>
            <span className="dsh__meta">Acuan Harga Beli &amp; Jual BSS</span>
          </div>
          <h1 className="dsh__h1">Daftar Harga Barang (Price List)</h1>
          <p className="dsh__sub">
            Standar harga acuan per kg/satuan sesuai dokumen resmi Price List BSIS. Perubahan harga hanya berlaku untuk setoran baru (setoran lama terkunci).
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} className="no-print">
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Cetak Pricelist
          </button>
          <button
            type="button"
            className="dsh__btn"
            onClick={handleEksporCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Ekspor CSV
          </button>
        </div>
      </header>

      {pesan && (
        <div className="dsh__alert dsh__alert--success" role="alert" style={{ marginBottom: "20px" }}>
          {pesan}
        </div>
      )}

      {/* TEMPLATE AWAL SPLIT: KIRI TABEL / DAFTAR BARANG, KANAN FORM KELOLA */}
      <div className="dsh__split">
        {/* KOLOM KIRI: TABEL MASTER HARGA ACUAN */}
        <section className="dsh__card" aria-label="Tabel Pricelist Terdaftar">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Master Harga Acuan</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "2px" }}>
                Memuat kolom Jenis, Kategori, Kode, dan Harga per Satuan dari dokumen resmi.
              </p>
            </div>
            <span className="dsh__chip dsh__chip--green">
              {listTerfilter.length} / {pricelist.length} Barang
            </span>
          </div>

          {/* BILAH PENCARIAN & FILTER KELOMPOK JENIS */}
          <div
            className="no-print"
            style={{
              padding: "10px 14px",
              background: "#faf9f5",
              borderBottom: "1px solid #ebe8df",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <input
              type="search"
              className="dsh__input"
              style={{ padding: "6px 12px", fontSize: "13px", flex: "1 1 180px" }}
              placeholder="Cari kategori, nama, kode (A1, B1)..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />

            <select
              className="dsh__select"
              style={{ padding: "6px 10px", fontSize: "13px", minWidth: "140px" }}
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
            >
              <option value="semua">Semua Kelompok</option>
              {daftarPilihanJenis.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* TABEL DENGAN KOLOM: JENIS, KATEGORI, KODE, HARGA PER, AKSI */}
          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Jenis</th>
                  <th style={{ width: "34%" }}>Kategori</th>
                  <th style={{ width: "14%", textAlign: "center" }}>Kode</th>
                  <th style={{ width: "18%", textAlign: "right" }}>Harga Per</th>
                  <th style={{ width: "12%", textAlign: "center" }} className="no-print">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {daftarTampil.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                      Tidak ditemukan data barang yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  daftarTampil.map((p) => {
                    const isSelected = p.id === selectedId;
                    return (
                      <tr
                        key={p.id}
                        style={{
                          background: isSelected ? "#f2f8f3" : undefined,
                        }}
                      >
                        {/* Jenis */}
                        <td>
                          <span style={{ fontWeight: 600, color: "#2f5c35", fontSize: "12px" }}>
                            {p.jenis || `[${p.kode.charAt(0)}] ${p.kategori}`}
                          </span>
                        </td>

                        {/* Kategori */}
                        <td>
                          <strong>{p.nama || p.kategori}</strong>
                        </td>

                        {/* Kode */}
                        <td style={{ textAlign: "center" }}>
                          <code className="dsh__code">{p.kode}</code>
                        </td>

                        {/* Harga Per (Contoh: "1.000/kg" atau "Rp 1.000/kg") */}
                        <td style={{ textAlign: "right" }}>
                          <strong className="dsh__green">
                            {p.hargaPerKg.toLocaleString("id-ID")}/{p.satuan || "kg"}
                          </strong>
                        </td>

                        {/* Aksi */}
                        <td style={{ textAlign: "center" }} className="no-print">
                          <button
                            type="button"
                            className="dsh__btnoutline dsh__btnoutline--sm"
                            onClick={() => handlePilihEdit(p.id)}
                            style={{
                              background: isSelected ? "#15803d" : undefined,
                              color: isSelected ? "#ffffff" : undefined,
                              borderColor: isSelected ? "#15803d" : undefined,
                            }}
                          >
                            {isSelected ? "Aktif" : "Ubah"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {listTerfilter.length > 8 && (
            <button
              type="button"
              className="dsh__expandbtn no-print"
              onClick={() => setTampilSemua((prev) => !prev)}
            >
              {tampilSemua
                ? "Ringkas Daftar Harga ↑"
                : `Lihat Lengkap (${listTerfilter.length} Barang) ↓`}
            </button>
          )}
        </section>

        {/* KOLOM KANAN: FORM PERBARUI HARGA & FORM TAMBAH BARU */}
        <div className="dsh__stack no-print">
          {/* CARD 1: FORM PERBARUI HARGA ACUAN */}
          <section className="dsh__card" aria-label="Perbarui Harga Terpilih">
            <div className="dsh__cardhead">
              <div>
                <h2 className="dsh__h2">Perbarui Harga</h2>
                <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "2px" }}>
                  Ubah harga acuan barang yang dipilih.
                </p>
              </div>
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
                      {p.kode} · {p.nama} ({p.hargaPerKg.toLocaleString("id-ID")}/{p.satuan || "kg"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div
                  style={{
                    background: "#f7f6f0",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    marginBottom: "12px",
                  }}
                >
                  <span>Kelompok: <strong>{selectedItem.jenis || selectedItem.kategori}</strong></span>
                  <span style={{ margin: "0 6px" }}>·</span>
                  <span>Kode: <strong>{selectedItem.kode}</strong></span>
                </div>
              )}

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idHargaEdit}>
                  Harga Baru (Rp per {satuanEdit})
                </label>
                <input
                  id={idHargaEdit}
                  type="number"
                  step="50"
                  min="1"
                  className="dsh__input"
                  value={hargaEdit}
                  onChange={(e) => setHargaEdit(Number(e.target.value))}
                  required
                />
              </div>

              <button type="submit" className="dsh__btn">
                Simpan Harga
              </button>
            </form>
          </section>

          {/* CARD 2: FORM TAMBAH BARANG BARU */}
          <section className="dsh__card" aria-label="Tambah Jenis Sampah Baru">
            <div className="dsh__cardhead">
              <div>
                <h2 className="dsh__h2">Tambah Barang Baru</h2>
                <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "2px" }}>
                  Tambahkan kategori sampah baru ke kelompok terkait.
                </p>
              </div>
            </div>

            <form onSubmit={handleTambahJenis} className="dsh__form">
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idNamaBaru}>
                  Nama Kategori Sampah
                </label>
                <input
                  id={idNamaBaru}
                  type="text"
                  placeholder="mis. Kardus Bagus / Tutup Galon"
                  className="dsh__input"
                  required
                  value={namaBaru}
                  onChange={(e) => setNamaBaru(e.target.value)}
                />
              </div>

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idJenisBaru}>
                  Kelompok Jenis
                </label>
                <select
                  id={idJenisBaru}
                  className="dsh__select"
                  value={jenisBaru}
                  onChange={(e) => setJenisBaru(e.target.value)}
                >
                  {daftarPilihanJenis.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                  <option value="[C] PLASTIK 2">[C] PLASTIK 2</option>
                  <option value="[C] PLASTIK 3">[C] PLASTIK 3</option>
                  <option value="[D] LOGAM & BESI">[D] LOGAM & BESI</option>
                  <option value="[E] KACA & LAINNYA">[E] KACA & LAINNYA</option>
                </select>
              </div>

              <div className="dsh__grid2">
                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idKodeBaru}>
                    Kode (Otomatis/Manual)
                  </label>
                  <input
                    id={idKodeBaru}
                    type="text"
                    placeholder="mis. A9 / B5"
                    className="dsh__input"
                    value={kodeBaru}
                    onChange={(e) => setKodeBaru(e.target.value)}
                  />
                </div>

                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idSatuanBaru}>
                    Satuan
                  </label>
                  <select
                    id={idSatuanBaru}
                    className="dsh__select"
                    value={satuanBaru}
                    onChange={(e) => setSatuanBaru(e.target.value)}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="pcs">pcs (Biji)</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              </div>

              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idHargaBaru}>
                  Harga (Rp/{satuanBaru})
                </label>
                <input
                  id={idHargaBaru}
                  type="number"
                  step="50"
                  min="1"
                  className="dsh__input"
                  value={hargaBaru}
                  onChange={(e) => setHargaBaru(Number(e.target.value))}
                  required
                />
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
