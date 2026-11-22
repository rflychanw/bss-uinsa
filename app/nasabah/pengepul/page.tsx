"use client";

import { useEffect, useState } from "react";
import {
  BATCH_PENGEPUL_AWAL,
  kg,
  type BatchPenjualanPengepul,
} from "../../../lib/bss";
import { sesiSekarang, type Sesi } from "../../../lib/auth";

export default function PengepulNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [batches] = useState<BatchPenjualanPengepul[]>(BATCH_PENGEPUL_AWAL);

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Alur Penjualan Pengepul</h1>
        <p className="dsh__sub">
          Transparansi alur penjualan sampah ke mitra pengepul sebagai bagian dari ekosistem Bank Sampah Syariah.
        </p>
      </header>

      <section className="dsh__card" aria-label="Visualisasi 4 Tahapan">
        <h2 className="dsh__h2">Tahapan Alur Penyaluran</h2>
        <div className="dsh__pipeline">
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">1</span>
            <strong>Sampah Terkumpul</strong>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">2</span>
            <strong>Dijual ke Pengepul</strong>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">3</span>
            <strong>Uang Diterima</strong>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep dsh__pipelinestep--active">
            <span className="dsh__stepbadge">4</span>
            <strong>Disalurkan ke Nasabah</strong>
          </div>
        </div>
      </section>

      <section className="dsh__card" aria-label="Daftar Batch Penjualan">
        <h2 className="dsh__h2">Status Batch Penjualan</h2>
        <div className="dsh__rows">
          {batches.map((b) => (
            <div key={b.id} className="dsh__row">
              <div className="dsh__rowmain">
                <strong>{b.nomorBatch}</strong>
                <span className="dsh__meta">{b.namaPengepul} · {kg(b.totalBeratKg)}</span>
              </div>
              <div className="dsh__rowval">
                <span className={`dsh__chip ${b.tahap === "disalurkan_ke_nasabah" ? "dsh__chip--green" : "dsh__chip--amber"}`}>
                  {b.tahap === "disalurkan_ke_nasabah" ? "Disalurkan" : "Dalam Proses"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="dsh__subtext" style={{ marginTop: "16px" }}>
          *Data batch menunjukkan riwayat penjualan sampah kepada mitra pengepul terdaftar.
        </p>
      </section>
    </div>
  );
}
