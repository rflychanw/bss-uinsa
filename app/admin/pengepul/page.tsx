"use client";

import { useId, useState } from "react";
import {
  BATCH_PENGEPUL_AWAL,
  kg,
  rp,
  type BatchPenjualanPengepul,
  type TahapAlur,
} from "../../../lib/bss";

export default function PengepulAdmin() {
  const [batches, setBatches] =
    useState<BatchPenjualanPengepul[]>(BATCH_PENGEPUL_AWAL);
  const [filterTahap, setFilterTahap] = useState<string>("semua");
  const [batchAktif, setBatchAktif] = useState<BatchPenjualanPengepul>(
    BATCH_PENGEPUL_AWAL[1]
  );
  const [notif, setNotif] = useState<string>("");

  const idTahapSelect = useId();

  const handleUpdateTahap = (
    batchId: string,
    tahapBaru: TahapAlur
  ) => {
    const updated = batches.map((b) => {
      if (b.id !== batchId) return b;
      let disalurkan = b.totalDisalurkan;
      let selisih = b.selisihKasBss;
      if (tahapBaru === "disalurkan_ke_nasabah") {
        disalurkan = b.penyaluran.reduce((acc, p) => acc + p.hakUang, 0);
        selisih = b.uangDiterima - disalurkan;
      }
      return {
        ...b,
        tahap: tahapBaru,
        totalDisalurkan: disalurkan,
        selisihKasBss: selisih,
        tanggalDisalurkan:
          tahapBaru === "disalurkan_ke_nasabah" ? "28 Okt 2026" : b.tanggalDisalurkan,
      };
    });

    setBatches(updated);
    const target = updated.find((b) => b.id === batchId);
    if (target) setBatchAktif(target);

    setNotif(`Status Batch ${batchId} berhasil diperbarui.`);
    setTimeout(() => setNotif(""), 4000);
  };

  const batchesTampil =
    filterTahap === "semua"
      ? batches
      : batches.filter((b) => b.tahap === filterTahap);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Alur Penjualan Pengepul & Penyaluran Dana</h1>
        <p className="dsh__sub">
          Manajemen 4 tahapan alur penjualan sampah ke mitra pengepul dan kalkulasi otomatis pembagian proporsional hak bagi hasil nasabah (FR-026 s.d FR-033).
        </p>
      </header>

      {notif && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          {notif}
        </div>
      )}

      {/* Visualisasi 4 Tahap SRS */}
      <section className="dsh__card" aria-label="Visualisasi 4 Tahapan">
        <h2 className="dsh__h2">4 Tahapan Alur Penyaluran (FR-029)</h2>
        <div className="dsh__pipeline">
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">Tahap 1</span>
            <strong>Sampah Terkumpul</strong>
            <p>Sampah nasabah ditimbang dan disimpan di gudang BSS.</p>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">Tahap 2</span>
            <strong>Dijual ke Pengepul</strong>
            <p>Sampah diangkut oleh mitra daur ulang & dicatat nilai jualnya.</p>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep">
            <span className="dsh__stepbadge">Tahap 3</span>
            <strong>Uang Diterima</strong>
            <p>Bendahara menerima transfer dan sistem membagi proporsi nasabah.</p>
          </div>
          <div className="dsh__pipelinearrow">→</div>
          <div className="dsh__pipelinestep dsh__pipelinestep--active">
            <span className="dsh__stepbadge">Tahap 4</span>
            <strong>Disalurkan ke Nasabah</strong>
            <p>Uang disalurkan tunai/transfer, status setoran tuntas (disalurkan).</p>
          </div>
        </div>
      </section>

      {/* Rincian Batch & Kalkulasi Proporsional FR-033 */}
      <div className="dsh__split">
        <section className="dsh__card" aria-label="Rincian Pembagian Proporsional">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Kalkulasi Proporsi Hak Nasabah</h2>
              <span className="dsh__meta">Batch: {batchAktif.nomorBatch} ({batchAktif.namaPengepul})</span>
            </div>
            <span
              className={`dsh__chip ${
                batchAktif.tahap === "disalurkan_ke_nasabah"
                  ? "dsh__chip--green"
                  : "dsh__chip--amber"
              }`}
            >
              {batchAktif.tahap.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          <p className="dsh__carddesc">
            Sistem secara otomatis menghitung persentase kontribusi timbangan tiap nasabah terhadap total berat batch (FR-033).
          </p>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Nasabah</th>
                  <th>Berat Setor</th>
                  <th>Proporsi (%)</th>
                  <th>Hak Uang Nasabah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {batchAktif.penyaluran.map((p) => (
                  <tr key={p.nomorNasabah}>
                    <td>
                      <strong>{p.namaNasabah}</strong>
                      <span className="dsh__subtext">{p.nomorNasabah}</span>
                    </td>
                    <td>{kg(p.beratKg)}</td>
                    <td>
                      <span className="dsh__badgepct">{p.proporsiPersen}%</span>
                    </td>
                    <td>
                      <strong className="dsh__green">{rp(p.hakUang)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dsh__batchcalcsummary">
            <div className="dsh__calcrow">
              <span>Total Penerimaan dari Pengepul:</span>
              <strong>{rp(batchAktif.uangDiterima)}</strong>
            </div>
            <div className="dsh__calcrow">
              <span>Total Disalurkan ke Nasabah:</span>
              <strong className="dsh__green">
                {rp(
                  batchAktif.penyaluran.reduce((a, b) => a + b.hakUang, 0)
                )}
              </strong>
            </div>
            <div className="dsh__calcrow dsh__calcrow--highlight">
              <span>Selisih Margin Operasional Kas BSS (FR-032):</span>
              <strong>
                {rp(
                  batchAktif.uangDiterima -
                    batchAktif.penyaluran.reduce((a, b) => a + b.hakUang, 0)
                )}
              </strong>
            </div>
          </div>

          <div className="dsh__actiongroup">
            {batchAktif.tahap !== "disalurkan_ke_nasabah" ? (
              <button
                type="button"
                className="dsh__btn"
                onClick={() =>
                  handleUpdateTahap(
                    batchAktif.id,
                    "disalurkan_ke_nasabah"
                  )
                }
              >
                Tandai Uang Telah Disalurkan ke Nasabah (FR-028)
              </button>
            ) : (
              <span className="dsh__successlabel">
                ✓ Batch ini telah selesai disalurkan ke seluruh nasabah terkait.
              </span>
            )}
          </div>
        </section>

        {/* Daftar Seluruh Batch Penjualan */}
        <section className="dsh__card" aria-label="Daftar Batch Penjualan">
          <div className="dsh__cardhead">
            <h2 className="dsh__h2">Daftar Batch Penjualan</h2>
            <div className="dsh__filterwrap">
              <label htmlFor={idTahapSelect} className="sr-only">Filter Tahap</label>
              <select
                id={idTahapSelect}
                className="dsh__select dsh__select--sm"
                value={filterTahap}
                onChange={(e) => setFilterTahap(e.target.value)}
              >
                <option value="semua">Semua Tahap</option>
                <option value="terkumpul">Tahap 1: Terkumpul</option>
                <option value="dijual_ke_pengepul">Tahap 2: Dijual</option>
                <option value="uang_diterima">Tahap 3: Uang Diterima</option>
                <option value="disalurkan_ke_nasabah">Tahap 4: Disalurkan</option>
              </select>
            </div>
          </div>

          <div className="dsh__rows">
            {batchesTampil.map((b) => (
              <div
                key={b.id}
                className={`dsh__row dsh__row--clickable ${
                  batchAktif.id === b.id ? "dsh__row--active" : ""
                }`}
                onClick={() => setBatchAktif(b)}
              >
                <div className="dsh__rowmain">
                  <strong>{b.nomorBatch}</strong>
                  <span className="dsh__meta">
                    {b.namaPengepul} · {kg(b.totalBeratKg)}
                  </span>
                </div>
                <div className="dsh__rowval">
                  <b>{rp(b.nilaiJualPengepul)}</b>
                  <span
                    className={`dsh__chip ${
                      b.tahap === "disalurkan_ke_nasabah"
                        ? "dsh__chip--green"
                        : "dsh__chip--amber"
                    }`}
                  >
                    {b.tahap === "disalurkan_ke_nasabah"
                      ? "Disalurkan"
                      : "Proses Alur"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
