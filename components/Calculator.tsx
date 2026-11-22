"use client";

import { useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv } from "../lib/supabase/client";
import { muatPricelistPublik } from "../lib/supabase/sync";

const INITIAL_MATERIALS = [
  { id: "pet", kode: "B1", name: "Botol PET bening bersih", price: 2500 },
  { id: "petw", kode: "B3", name: "Botol PET warna bersih", price: 1100 },
  { id: "cup", kode: "C1", name: "Tutup botol minuman", price: 1200 },
  { id: "kardus", kode: "A1", name: "Kardus bagus", price: 1000 },
  { id: "hvs", kode: "A4", name: "Kertas HVS", price: 1600 },
  { id: "kaleng", kode: "D2", name: "Kaleng & aluminium", price: 12000 },
  { id: "tembaga", kode: "D3", name: "Tembaga kupas", price: 55000 },
];

const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const rp = (n: number) => `Rp ${nf.format(Math.round(n))}`;

export default function Calculator() {
  const [kg, setKg] = useState<Record<string, number>>({});
  const [sedekah, setSedekah] = useState(false);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    muatPricelistPublik().then((rows) => {
      if (!rows.length) return;
      const byKode = new Map(rows.map((r) => [r.kode, r]));
      setMaterials((prev) =>
        prev.map((m) => {
          const live = byKode.get(m.kode);
          return live ? { ...m, name: live.nama, price: live.hargaPerKg } : m;
        })
      );
    });
  }, []);

  const { total, weight } = useMemo(() => {
    let t = 0;
    let w = 0;
    for (const m of materials) {
      const v = kg[m.id] ?? 0;
      t += v * m.price;
      w += v;
    }
    return { total: t, weight: w };
  }, [kg, materials]);

  const step = (id: string, delta: number) =>
    setKg((prev) => {
      const next = Math.min(200, Math.max(0, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: Math.round(next * 10) / 10 };
    });

  const reset = () => setKg({});

  return (
    <div className="calc" data-reveal>
      <div className="calc__sum">
        <strong aria-live="polite">{rp(total)}</strong>
        <span>
          {weight > 0
            ? `nilai setoran dari ${nf.format(weight)} kg sampah terpilah`
            : "belum ada berat yang dimasukkan"}
        </span>
      </div>

      <div className="calc__rows">
        {materials.map((m) => {
          const v = kg[m.id] ?? 0;
          return (
            <div className="calc__row" key={m.id}>
              <span className="calc__name">{m.name}</span>
              <span className="calc__price">{rp(m.price)}/kg</span>
              <div className="stepper">
                <button
                  type="button"
                  aria-label={`Kurangi ${m.name}`}
                  onClick={() => step(m.id, -0.5)}
                  disabled={v === 0}
                  style={v === 0 ? { opacity: 0.35 } : undefined}
                >
                  −
                </button>
                <output aria-live="off">{nf.format(v)} kg</output>
                <button
                  type="button"
                  aria-label={`Tambah ${m.name}`}
                  onClick={() => step(m.id, 0.5)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="calc__foot">
      <div className="calc__split">
        <input
          id="sedekah"
          type="checkbox"
          checked={sedekah}
          onChange={(e) => setSedekah(e.target.checked)}
        />
        <label htmlFor="sedekah">
          Sisihkan 10% untuk sedekah lewat kas BSS.
          {sedekah && total > 0 && (
            <>
              {" "}
              Kamu bawa <b>{rp(total * 0.9)}</b>, disedekahkan <b>{rp(total * 0.1)}</b>.
            </>
          )}
        </label>
      </div>

      {total > 0 && (
        <button type="button" onClick={reset} className="link calc__reset">
          Kosongkan hitungan
        </button>
      )}
      </div>
    </div>
  );
}
