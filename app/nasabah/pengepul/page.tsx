"use client";

import { useEffect, useId, useState } from "react";
import {
  BATCH_PENGEPUL_AWAL,
  kg,
  rp,
  type BatchPenjualanPengepul,
} from "../../../lib/bss";
import { sesiSekarang, type Sesi } from "../../../lib/auth";

export default function PengepulNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [batches] =
    useState<BatchPenjualanPengepul[]>(BATCH_PENGEPUL_AWAL);
  const [filterTahap, setFilterTahap] = useState<string>("semua");
  const [batchAktif, setBatchAktif] = useState<BatchPenjualanPengepul>(
    BATCH_PENGEPUL_AWAL[1]
  );

  useEffect(() => {
    setSesi(sesiSekarang());
  }, []);

  const idTahapSelect = useId();
  const noNasabah = sesi?.nomor || "BSS-0142";

  const batchesTampil =
    filterTahap === "semua"
      ? batches
      : batches.filter((b) => b.tahap === filterTahap);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Alur Penjualan Pengepul & Penyaluran Dana</h1>
        <p className="dsh__sub">
          Transparansi 4 tahapan alur penjualan sampah ke mitra pengepul dan kalkulasi otomatis pembagian proporsional hak bagi hasil nasabah (FR-026 s.d FR-033).
        </p>
      </header>

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
            <p>Sampah diangkut oleh mitra daur ulang &amp; dicatat nilai jualnya.</p>
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

          <div
            style={{
              background: "#fdf8ee",
              border: "1px solid #ebd9b5",
              borderRadius: "6px",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#774a06",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            <strong>Transparansi Rumus Bagi Hasil Proporsional (FR-033 &amp; BR-017):</strong>
            <p style={{ margin: "4px 0 0 0" }}>
              Pendapatan nasabah tidak dipatok di awal, melainkan dihitung otomatis saat uang penjualan dari pengepul diterima:
              <br />
              <code style={{ background: "#f3e7cf", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginTop: "4px" }}>
                Hak Nasabah = (Berat Setoran Nasabah / Total Berat Batch) × Total Dana Alokasi Nasabah
              </code>
            </p>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Nasabah Penyetor</th>
                  <th>Berat Setor</th>
                  <th>Proporsi Kontribusi</th>
                  <th>Formula Perhitungan</th>
                  <th>Hak Uang Nasabah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {batchAktif.penyaluran.map((p) => {
                  const totalDana =
                    batchAktif.totalDisalurkan && batchAktif.totalDisalurkan > 0
                      ? batchAktif.totalDisalurkan
                      : batchAktif.penyaluran.reduce((a, b) => a + b.hakUang, 0);

                  const isCurrentUser =
                    p.nomorNasabah === noNasabah ||
                    p.namaNasabah.toLowerCase() === (sesi?.nama || "").toLowerCase();

                  return (
                    <tr
                      key={p.nomorNasabah}
                      style={
                        isCurrentUser
                          ? { background: "#f2f9f3", outline: "1px solid #b7dfbc" }
                          : undefined
                      }
                    >
                      <td>
                        <strong>{p.namaNasabah}</strong>
                        {isCurrentUser && (
                          <span
                            className="dsh__chip dsh__chip--green"
                            style={{ marginLeft: "6px", fontSize: "10px", padding: "1px 6px" }}
                          >
                            Setoran Anda
                          </span>
                        )}
                        <span className="dsh__subtext">{p.nomorNasabah}</span>
                      </td>
                      <td>
                        <strong>{kg(p.beratKg)}</strong>
                      </td>
                      <td>
                        <span className="dsh__badgepct">{p.proporsiPersen}%</span>
                        <span className="dsh__subtext">dari {kg(batchAktif.totalBeratKg)}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: "11px", color: "#444" }}>
                          ({p.beratKg} kg / {batchAktif.totalBeratKg} kg) × {rp(totalDana)}
                        </code>
                      </td>
                      <td>
                        <strong className="dsh__green">{rp(p.hakUang)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f7f6f2", fontWeight: 700 }}>
                  <td>TOTAL BATCH</td>
                  <td>{kg(batchAktif.totalBeratKg)}</td>
                  <td>100%</td>
                  <td>Alokasi Bersih Nasabah</td>
                  <td>
                    <strong className="dsh__green">
                      {rp(batchAktif.penyaluran.reduce((a, b) => a + b.hakUang, 0))}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="dsh__batchcalcsummary">
            <div className="dsh__calcrow">
              <span>Total Penerimaan dari Pengepul:</span>
              <strong>{rp(batchAktif.uangDiterima)}</strong>
            </div>
            <div className="dsh__calcrow">
              <span>Total Disalurkan ke Nasabah (Hak Bagi Hasil):</span>
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

          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#fbfaf7",
              border: "1px solid #e7e3d8",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#5f594d",
              lineHeight: 1.5,
            }}
          >
            ⚖️ <strong>Prinsip Syariah Wadiah &amp; Mudharabah:</strong> Seluruh perhitungan hak nasabah bersumber langsung dari timbangan setoran dan penerimaan riil penjualan ke mitra pengepul daur ulang tanpa biaya tersembunyi.
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
