"use client";

import { useState } from "react";
import { antrean, kg, rp } from "../../lib/bss";

export default function Queue() {
  const [done, setDone] = useState<string[]>([]);
  const left = antrean.filter((a) => !done.includes(a.id));

  const undo = done.length > 0 && (
    <p className="dsh__undo">
      {done.length} setoran ditandai selesai ·{" "}
      <button type="button" onClick={() => setDone([])}>
        Urungkan
      </button>
    </p>
  );

  if (left.length === 0) {
    return (
      <>
        <p className="dsh__empty">
          Antrean bersih — semua setoran hari ini sudah diverifikasi.
        </p>
        {undo}
      </>
    );
  }

  return (
    <>
      <div className="dsh__rows">
        {left.map((a) => (
          <div className="dsh__row dsh__row--queue" key={a.id}>
            <div className="dsh__rowmain">
              <strong>{a.nama}</strong>
              <span className="dsh__meta">
                {a.nomor} · {a.tanggal} · {a.jenis} · {kg(a.berat)}
              </span>
            </div>
            <div className="dsh__rowval">
              <b>{rp(a.nilai)}</b>
            </div>
            <button
              type="button"
              className="btn btn--ink btn--sm"
              onClick={() => setDone((d) => [...d, a.id])}
            >
              Verifikasi
            </button>
          </div>
        ))}
      </div>
      {undo}
    </>
  );
}
