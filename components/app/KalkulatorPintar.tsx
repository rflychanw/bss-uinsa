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

const KATEGORI_URUTAN = ["Kertas", "Plastik", "Logam", "Kaca", "Lain-lain"];

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

  const handleTambahItem = () => {
    const jenisTerpakai = new Set(items.map((it) => it.jenisId));
    const jenisBaru =
      daftarPricelist.find((j) => !jenisTerpakai.has(j.id)) ||
      daftarPricelist[0] ||
      PRICELIST_AWAL[0];

    const newUid = `item-${Date.now()}-${items.length + 1}`;
    setItems((prev) => [
      ...prev,
      {
        uid: newUid,
        jenisId: jenisBaru.id,
        nilaiInput: "2",
        satuan: "kg",
      },
    ]);
  };

  const handleHapusItem = (uid: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  };

  const handleUpdateItem = (
    uid: string,
    field: Partial<ItemKalkulatorInput>
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...field } : it))
    );
  };

  const hasilItems: ItemKalkulatorHasil[] = useMemo(() => {
    return items.map((it) => {
      const jenis =
        daftarPricelist.find((j) => j.id === it.jenisId) ||
        daftarPricelist[0] ||
        PRICELIST_AWAL[0];
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
          ? `${val} pcs`
          : it.satuan === "gram"
          ? `${val} g`
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

  const groupedPricelist = useMemo(() => {
    const map = new Map<string, JenisSampah[]>();
    for (const k of KATEGORI_URUTAN) map.set(k, []);
    for (const j of daftarPricelist) {
      const kat = map.has(j.kategori) ? j.kategori : "Lain-lain";
      map.get(kat)!.push(j);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [daftarPricelist]);

  return (
    <div className="dsh__calc">
      <div className="dsh__calcitems">
        {items.map((it, idx) => {
          const res = hasilItems[idx];
          const selectId = `${baseId}-sel-${it.uid}`;
          const inputId = `${baseId}-inp-${it.uid}`;

          return (
            <div
              key={it.uid}
              className="dsh__calcitemcard"
              style={{ padding: "12px 14px" }}
            >
              {items.length > 1 && (
                <div className="dsh__calcitemtop" style={{ marginBottom: "8px" }}>
                  <div className="dsh__calcitemtag">
                    <span className="dsh__calcitemidx">Barang #{idx + 1}</span>
                    <span className="dsh__calcitemsubval">
                      <strong>{rp(res?.estimasiRp || 0)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dsh__calcitemdel"
                    onClick={() => handleHapusItem(it.uid)}
                    aria-label={`Hapus barang #${idx + 1}`}
                  >
                    × Hapus
                  </button>
                </div>
              )}

              <div className="dsh__calcgrid">
                <div className="dsh__calcfield">
                  <label className="dsh__calclabel" htmlFor={selectId}>
                    Kode & Jenis Barang
                  </label>
                  <select
                    id={selectId}
                    className="dsh__calcselect"
                    value={it.jenisId}
                    onChange={(e) =>
                      handleUpdateItem(it.uid, { jenisId: e.target.value })
                    }
                  >
                    {groupedPricelist.map(([kat, list]) => (
                      <optgroup key={kat} label={kat}>
                        {list.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.kode} · {j.nama} ({rp(j.hargaPerKg)}/{j.satuan})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="dsh__calcfield">
                  <label className="dsh__calclabel" htmlFor={inputId}>
                    Jumlah / Berat
                  </label>
                  <div className="dsh__calcinputgroup">
                    <input
                      id={inputId}
                      type="text"
                      inputMode="decimal"
                      className="dsh__calcinput"
                      value={it.nilaiInput}
                      placeholder="0"
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
                        g
                      </button>
                      <button
                        type="button"
                        className="dsh__unitbtn"
                        data-active={it.satuan === "pcs"}
                        onClick={() =>
                          handleUpdateItem(it.uid, { satuan: "pcs" })
                        }
                      >
                        pcs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dsh__calcaddrow" style={{ marginTop: "8px" }}>
        <button
          type="button"
          className="dsh__calcaddbtn"
          style={{ padding: "8px 12px", fontSize: "12.5px" }}
          onClick={handleTambahItem}
        >
          + Tambah Barang Lainnya
        </button>
      </div>

      <div className="dsh__calcresult" style={{ padding: "12px 16px" }}>
        <div className="dsh__calcresinfo">
          <span className="dsh__calcrestitle">
            {items.length > 1
              ? `Total (${items.length} Barang)`
              : "Estimasi Nilai Setoran"}
          </span>
          <span className="dsh__calcresdetail">
            Total bobot: <strong>{totalBeratKg.toFixed(1)} kg</strong>
          </span>
        </div>
        <div className="dsh__calcresprice">{rp(totalEstimasiRp)}</div>
      </div>

      {mode === "petugas" && onPilih && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
          <button
            type="button"
            className="dsh__calcapply"
            style={{ flex: "1 1 220px" }}
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
            Verifikasi & Masuk Saldo ({rp(totalEstimasiRp)})
          </button>
          <button
            type="button"
            className="dsh__btnoutline"
            style={{
              flex: "0 1 auto",
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
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
            Catat Tanpa Verifikasi
          </button>
        </div>
      )}
    </div>
  );
}
