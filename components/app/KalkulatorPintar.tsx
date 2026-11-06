"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { getPricelist, PRICELIST_AWAL, rp, type JenisSampah } from "../../lib/bss";

export interface ItemKalkulatorInput {
  uid: string;
  jenisId: string;
  nilaiInput: string;
  satuan: "kg" | "gram" | "pcs";
}

export interface ItemKalkulatorHasil {
  jenis: JenisSampah;
  beratKg: number;
  jumlahSatuan: string;
  estimasiRp: number;
}

export default function KalkulatorPintar({
  mode = "nasabah",
  onPilih,
}: {
  mode?: "nasabah" | "petugas";
  onPilih?: (data: {
    items: ItemKalkulatorHasil[];
    totalBeratKg: number;
    totalEstimasiRp: number;
    langsungVerifikasi?: boolean;
    // kompatibilitas single-item
    jenis: JenisSampah;
    beratKg: number;
    estimasiRp: number;
  }) => void;
}) {
  const [daftarPricelist, setDaftarPricelist] = useState<JenisSampah[]>(PRICELIST_AWAL);

  useEffect(() => {
    setDaftarPricelist(getPricelist());
  }, []);

  const [items, setItems] = useState<ItemKalkulatorInput[]>([
    {
      uid: "item-1",
      jenisId: PRICELIST_AWAL[0].id,
      nilaiInput: "5",
      satuan: "kg",
    },
  ]);

  const baseId = useId();

  // Tambah baris jenis sampah baru
  const handleTambahItem = () => {
    // Pilih jenis sampah berikutnya yang belum terpilih jika memungkinkan
    const jenisTerpakai = new Set(items.map((it) => it.jenisId));
    const jenisBaru =
      daftarPricelist.find((j) => !jenisTerpakai.has(j.id)) || daftarPricelist[0] || PRICELIST_AWAL[0];

    const newUid = `item-${Date.now()}-${items.length + 1}`;
    setItems((prev) => [
      ...prev,
      {
        uid: newUid,
        jenisId: jenisBaru.id,
        nilaiInput: "3",
        satuan: "kg",
      },
    ]);
  };

  // Hapus baris item
  const handleHapusItem = (uid: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  };

  // Update nilai item
  const handleUpdateItem = (
    uid: string,
    field: Partial<ItemKalkulatorInput>
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...field } : it))
    );
  };

  // Hitung hasil per item dan agregasi total
  const hasilItems: ItemKalkulatorHasil[] = useMemo(() => {
    return items.map((it) => {
      const jenis =
        daftarPricelist.find((j) => j.id === it.jenisId) || daftarPricelist[0] || PRICELIST_AWAL[0];
      const raw = parseFloat(it.nilaiInput.replace(",", "."));
      const val = isNaN(raw) || raw <= 0 ? 0 : raw;
      const berat =
        it.satuan === "gram"
          ? val / 1000
          : it.satuan === "pcs"
          ? val * 1
          : val;
      const jumlahSatuan =
        it.satuan === "pcs"
          ? `${val} pcs (Satuan)`
          : it.satuan === "gram"
          ? `${val} gram (${berat.toFixed(2)} kg)`
          : `${val} kg`;
      const estimasi = Math.round(berat * jenis.hargaPerKg);
      return {
        jenis,
        beratKg: berat,
        jumlahSatuan,
        estimasiRp: estimasi,
      };
    });
  }, [items, daftarPricelist]);

  const totalBeratKg = useMemo(() => {
    return hasilItems.reduce((acc, cur) => acc + cur.beratKg, 0);
  }, [hasilItems]);

  const totalEstimasiRp = useMemo(() => {
    return hasilItems.reduce((acc, cur) => acc + cur.estimasiRp, 0);
  }, [hasilItems]);

  return (
    <div className="dsh__calc">
      <div className="dsh__calcitems">
        {items.map((it, idx) => {
          const res = hasilItems[idx];
          const jenisObj = res?.jenis || PRICELIST_AWAL[0];
          const selectId = `${baseId}-sel-${it.uid}`;
          const inputId = `${baseId}-inp-${it.uid}`;

          return (
            <div key={it.uid} className="dsh__calcitemcard">
              <div className="dsh__calcitemtop">
                <div className="dsh__calcitemtag">
                  <span className="dsh__calcitemidx">Jenis Sampah #{idx + 1}</span>
                  {items.length > 1 && (
                    <span className="dsh__calcitemsubval">
                      Subtotal: <strong>{rp(res?.estimasiRp || 0)}</strong>
                    </span>
                  )}
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    className="dsh__calcitemdel"
                    onClick={() => handleHapusItem(it.uid)}
                    title="Hapus jenis sampah ini"
                    aria-label={`Hapus jenis sampah #${idx + 1}`}
                  >
                    × Hapus
                  </button>
                )}
              </div>

              <div className="dsh__calcgrid">
                <div className="dsh__calcfield">
                  <label className="dsh__calclabel" htmlFor={selectId}>
                    Kategori & Jenis Sampah
                  </label>
                  <select
                    id={selectId}
                    className="dsh__calcselect"
                    value={it.jenisId}
                    onChange={(e) =>
                      handleUpdateItem(it.uid, { jenisId: e.target.value })
                    }
                  >
                    {daftarPricelist.map((j) => (
                      <option key={j.id} value={j.id}>
                        [{j.kode}] {j.nama} — {rp(j.hargaPerKg)}/kg
                      </option>
                    ))}
                  </select>
                  <small className="dsh__calcsub">{jenisObj.deskripsi}</small>
                </div>

                <div className="dsh__calcfield">
                  <label className="dsh__calclabel" htmlFor={inputId}>
                    Berat / Jumlah (Kiloan / Satuan)
                  </label>
                  <div className="dsh__calcinputgroup">
                    <input
                      id={inputId}
                      type="text"
                      inputMode="decimal"
                      className="dsh__calcinput"
                      value={it.nilaiInput}
                      placeholder="Contoh: 5"
                      onChange={(e) =>
                        handleUpdateItem(it.uid, { nilaiInput: e.target.value })
                      }
                    />
                    <div
                      className="dsh__unitbtns"
                      role="group"
                      aria-label="Satuan berat atau jumlah"
                    >
                      <button
                        type="button"
                        className="dsh__unitbtn"
                        data-active={it.satuan === "kg"}
                        onClick={() =>
                          handleUpdateItem(it.uid, { satuan: "kg" })
                        }
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        className="dsh__unitbtn"
                        data-active={it.satuan === "gram"}
                        onClick={() =>
                          handleUpdateItem(it.uid, { satuan: "gram" })
                        }
                      >
                        gram
                      </button>
                      <button
                        type="button"
                        className="dsh__unitbtn"
                        data-active={it.satuan === "pcs"}
                        onClick={() =>
                          handleUpdateItem(it.uid, { satuan: "pcs" })
                        }
                      >
                        pcs (satuan)
                      </button>
                    </div>
                  </div>
                  <small className="dsh__calcsub">
                    {it.satuan === "gram"
                      ? `Setara dengan ${(res?.beratKg || 0).toFixed(3)} kg × ${rp(jenisObj.hargaPerKg)}/kg`
                      : it.satuan === "pcs"
                      ? `${it.nilaiInput || 0} pcs (satuan) × ${rp(jenisObj.hargaPerKg)}/satuan`
                      : `${(res?.beratKg || 0).toFixed(2)} kg × ${rp(
                          jenisObj.hargaPerKg
                        )}/kg`}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dsh__calcaddrow">
        <button
          type="button"
          className="dsh__calcaddbtn"
          onClick={handleTambahItem}
        >
          <span aria-hidden="true" style={{ fontSize: "16px", fontWeight: "bold" }}>
            +
          </span>
          Tambah Jenis Sampah Lainnya
        </button>
      </div>

      {/* Ringkasan Akumulasi Total */}
      <div className="dsh__calcresult">
        <div className="dsh__calcresinfo">
          <span className="dsh__calcrestitle">
            {items.length > 1
              ? `Nilai Total (${items.length} Jenis Sampah)`
              : "Nilai Setoran Sampah"}
          </span>
          <span className="dsh__calcresdetail">
            Total bobot/ekuivalen: <strong>{totalBeratKg.toFixed(2)} kg</strong>
            {items.length > 1 && (
              <span className="dsh__calcresbreakdown">
                {" "}
                ({hasilItems.map((h) => `${h.jenis.nama.split(" ")[0]} ${h.jumlahSatuan}`).join(" + ")})
              </span>
            )}
          </span>
        </div>
        <div className="dsh__calcresprice">{rp(totalEstimasiRp)}</div>
      </div>

      {mode === "petugas" && onPilih && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="dsh__calcapply"
            style={{ flex: "1 1 260px" }}
            onClick={() =>
              onPilih({
                items: hasilItems,
                totalBeratKg,
                totalEstimasiRp,
                langsungVerifikasi: true,
                jenis: hasilItems[0].jenis,
                beratKg: hasilItems[0].beratKg,
                estimasiRp: hasilItems[0].estimasiRp,
              })
            }
          >
            ✓ Verifikasi & Simpan (Langsung Masuk Saldo {rp(totalEstimasiRp)})
          </button>
          <button
            type="button"
            className="dsh__btnoutline"
            style={{
              flex: "0 1 auto",
              padding: "12px 16px",
              fontWeight: 600,
              cursor: "pointer",
              background: "#fffaf0",
              borderColor: "#d9b978",
              color: "#8a5a00",
            }}
            onClick={() =>
              onPilih({
                items: hasilItems,
                totalBeratKg,
                totalEstimasiRp,
                langsungVerifikasi: false,
                jenis: hasilItems[0].jenis,
                beratKg: hasilItems[0].beratKg,
                estimasiRp: hasilItems[0].estimasiRp,
              })
            }
          >
            ⏳ Catat Tanpa Verifikasi Dulu
          </button>
        </div>
      )}
    </div>
  );
}
