"use client";

import { useMemo, useState } from "react";

const MATERIALS = [
  { id: "pet", name: "Botol PET bening", price: 4000 },
  { id: "petw", name: "Botol PET warna", price: 2500 },
  { id: "cup", name: "Gelas plastik", price: 4500 },
  { id: "kardus", name: "Kardus", price: 2000 },
  { id: "hvs", name: "Kertas HVS", price: 2500 },
  { id: "kaleng", name: "Kaleng aluminium", price: 12000 },
  { id: "tembaga", name: "Tembaga", price: 54000 },
];

const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const rp = (n: number) => `Rp ${nf.format(Math.round(n))}`;

export default function Calculator() {
  const [kg, setKg] = useState<Record<string, number>>({});
  const [sedekah, setSedekah] = useState(false);

  const { total, weight } = useMemo(() => {
    let t = 0;
    let w = 0;
    for (const m of MATERIALS) {
      const v = kg[m.id] ?? 0;
      t += v * m.price;
      w += v;
    }
    return { total: t, weight: w };
  }, [kg]);

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
        {MATERIALS.map((m) => {
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
