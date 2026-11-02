"use client";

import { useState } from "react";
import Motif from "./Motif";

const STEPS = [
  {
    title: "Pilah",
    note: "di rumah atau di kos",
    body: "Pisahkan plastik, kertas, kaleng, dan kaca. Bilas wadah bekas makanan, lalu keringkan sebelum dibawa.",
  },
  {
    title: "Setor",
    note: "sekretariat BSS, FEBI",
    body: "Datang membawa sampah kering yang sudah dipilah. Bisa perorangan, bisa mewakili kelas atau organisasi.",
  },
  {
    title: "Timbang",
    note: "di depan nasabah",
    body: "Petugas menimbang per jenis, mencatat beratnya di buku tabungan, lalu mengalikannya dengan harga pekan itu.",
  },
  {
    title: "Saldo",
    note: "masuk buku tabungan",
    body: "Nilai setoran masuk ke saldo sampahmu. Bisa dicairkan pada hari layanan, bisa juga disedekahkan lewat kas BSS.",
  },
];

export default function Steps() {
  const [on, setOn] = useState(0);

  return (
    <div className="cara__grid">
      <div>
        <h2 className="cara__h" data-reveal>
          Empat langkah, satu putaran.
        </h2>
        <p className="cara__intro" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
          Setiap setoran mengikuti urutan yang sama. Sampah yang kamu bawa kembali ke
          orang lain sebagai barang terpilah — karena itu kami menggambarnya sebagai
          lingkaran, bukan garis.
        </p>
        <div className="cara__ring" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
          <Motif uid="cara" on={on} />
        </div>
      </div>

      <ol className="steps">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="step"
            data-on={i === on}
            data-reveal
            style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
            onMouseEnter={() => setOn(i)}
            onFocus={() => setOn(i)}
            onClick={() => setOn(i)}
            tabIndex={0}
          >
            <h3 className="step__t">
              {s.title} <em>{s.note}</em>
            </h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
