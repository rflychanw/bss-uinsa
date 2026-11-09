"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  DAFTAR_NASABAH_MASTER,
  hitungRingkasanSaldoNasabah,
  kg,
  rp,
  type NasabahMaster,
} from "../../../lib/bss";
import {
  akunLokal,
  verifikasiAkun,
  type Akun,
} from "../../../lib/auth";

export default function NasabahAdmin() {
  const [daftar, setDaftar] =
    useState<NasabahMaster[]>(DAFTAR_NASABAH_MASTER);
  const [antrean, setAntrean] = useState<Akun[]>([]);
  const [modalBukti, setModalBukti] = useState<{
    nama: string;
    nomor: string;
    foto?: string;
    metode?: string;
  } | null>(null);
  const [cari, setCari] = useState<string>("");
  const [sukses, setSukses] = useState<string>("");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);

  const muatData = () => {
    const lokal = akunLokal();
    const menunggu = lokal.filter((a) => a.statusVerifikasi === "menunggu");
    setAntrean(menunggu);

    const aktifLokal = lokal.filter((a) => a.statusVerifikasi === "aktif");
    const masterBaru: NasabahMaster[] = aktifLokal.map((a) => ({
      nomor: a.nomor,
      nama: a.nama,
      email: a.email,
      fakultas: "Umum",
      totalBeratKg: 0,
      totalDisalurkan: 0,
      estimasiGudang: 0,
      status: "aktif",
      terdaftar: a.tanggalDaftar || "28 Okt 2026",
    }));

    // Gabungkan dengan DAFTAR_NASABAH_MASTER unik berdasarkan nomor
    const nomorAda = new Set(DAFTAR_NASABAH_MASTER.map((m) => m.nomor));
    const tambahan = masterBaru.filter((m) => !nomorAda.has(m.nomor));
    setDaftar([...tambahan, ...DAFTAR_NASABAH_MASTER]);
  };

  useEffect(() => {
    muatData();
  }, []);

  const handleVerifikasiNasabah = (a: Akun) => {
    verifikasiAkun(a.email);
    muatData();
    setSukses(`Akun nasabah ${a.nama} (${a.nomor}) berhasil diverifikasi dan diaktifkan.`);
    if (modalBukti?.nomor === a.nomor) setModalBukti(null);
    setTimeout(() => setSukses(""), 5000);
  };

  const idCari = useId();

  const filtered = useMemo(() => {
    if (!cari.trim()) return daftar;
    const q = cari.toLowerCase();
    return daftar.filter(
      (n) =>
        n.nama.toLowerCase().includes(q) ||
        n.nomor.toLowerCase().includes(q) ||
        (n.email && n.email.toLowerCase().includes(q))
    );
  }, [daftar, cari]);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Master Data Nasabah & Pengguna</h1>
        <p className="dsh__sub">
          Kelola direktori nasabah dan pembagian hak akses (RBAC) Bank Sampah Syariah UINSA (FR-006 & BR-005).
        </p>
      </header>

      {sukses && (
        <div className="dsh__alert dsh__alert--success" role="alert">
          {sukses}
        </div>
      )}

      {/* Antrean Verifikasi Pendaftar Baru */}
      {antrean.length > 0 && (
        <section
          className="dsh__card"
          style={{
            border: "1px solid #d4a754",
            background: "#fffdf9",
            marginBottom: "20px",
          }}
          aria-label="Antrean Verifikasi Nasabah Baru"
        >
          <div className="dsh__cardhead">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#c9820c",
                  }}
                />
                <h2 className="dsh__h2" style={{ margin: 0 }}>
                  Antrean Verifikasi Pendaftar Baru
                </h2>
              </div>
              <p className="dsh__carddesc" style={{ marginTop: "4px" }}>
                Terdapat <strong>{antrean.length}</strong> nasabah baru yang telah melakukan pembayaran dan menunggu verifikasi aktivasi akun oleh Admin.
              </p>
            </div>
            <span
              className="dsh__chip dsh__chip--amber"
              style={{ fontWeight: 600 }}
            >
              {antrean.length} Perlu Tindakan
            </span>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>Nomor Registrasi</th>
                  <th>Nama & Email</th>
                  <th>Metode Bayar</th>
                  <th>Bukti Pembayaran</th>
                  <th>Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {antrean.map((a) => (
                  <tr key={a.email}>
                    <td>
                      <code className="dsh__code">{a.nomor}</code>
                    </td>
                    <td>
                      <strong>{a.nama}</strong>
                      <span className="dsh__subtext">{a.email}</span>
                    </td>
                    <td>
                      <span style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: 600 }}>
                        {a.metodeBayar || "qris"}
                      </span>
                    </td>
                    <td>
                      {a.buktiBayar ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {a.buktiBayar.startsWith("data:image/") && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.buktiBayar}
                              alt="Bukti"
                              style={{
                                width: "32px",
                                height: "32px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid #ddd",
                              }}
                            />
                          )}
                          <button
                            type="button"
                            className="dsh__btnoutline"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() =>
                              setModalBukti({
                                nama: a.nama,
                                nomor: a.nomor,
                                foto: a.buktiBayar,
                                metode: a.metodeBayar,
                              })
                            }
                          >
                            👁 Lihat Bukti
                          </button>
                        </div>
                      ) : (
                        <span className="dsh__subtext">Bayar Tunai</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dsh__btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          background: "#25632d",
                          borderColor: "#1e5225",
                        }}
                        onClick={() => handleVerifikasiNasabah(a)}
                      >
                        ✓ Verifikasi & Aktifkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Preview Bukti Pembayaran */}
      {modalBukti && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setModalBukti(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#1f1b13" }}>
                  Bukti Pembayaran Registrasi
                </h3>
                <span style={{ fontSize: "12px", color: "#6e685d" }}>
                  {modalBukti.nama} ({modalBukti.nomor}) • Metode: {modalBukti.metode?.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalBukti(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#6e685d",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                background: "#f7f6f2",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              {modalBukti.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modalBukti.foto}
                  alt={`Bukti bayar ${modalBukti.nama}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    borderRadius: "4px",
                    border: "1px solid #d9d6cd",
                  }}
                />
              ) : (
                <p style={{ color: "#777", fontSize: "13px" }}>
                  Tidak ada berkas gambar bukti bayar.
                </p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="dsh__btnoutline"
                onClick={() => setModalBukti(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="dsh__btn"
                style={{ background: "#25632d", borderColor: "#1e5225" }}
                onClick={() => {
                  const target = antrean.find((a) => a.nomor === modalBukti.nomor);
                  if (target) handleVerifikasiNasabah(target);
                }}
              >
                ✓ Setujui & Aktifkan Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Data Nasabah Terdaftar (Full-Width Sesuai BR-004 & BR-005 SRS v1.0) */}
      <section className="dsh__card" aria-label="Tabel Direktori Nasabah">
        <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dsh__h2">Direktori Buku Tabungan Nasabah Kampus</h2>
            <span className="dsh__meta">{filtered.length} nasabah aktif terdaftar dalam pangkalan data</span>
          </div>
          <div className="dsh__filterwrap">
            <label htmlFor={idCari} className="sr-only">Cari Nasabah</label>
            <input
              id={idCari}
              type="text"
              placeholder="Cari nama, email, atau nomor BSS..."
              className="dsh__input dsh__input--sm"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              style={{ minWidth: "260px" }}
            />
          </div>
        </div>

        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th>Nomor BSS</th>
                <th>Nama Nasabah</th>
                <th>Total Setor</th>
                <th>Saldo Aktif (Siap Tarik)</th>
                <th>Menunggu Verifikasi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(tampilSemua ? filtered : filtered.slice(0, 4)).map((n) => {
                const rk = hitungRingkasanSaldoNasabah(n.nomor);
                const beratTotal =
                  rk.totalBeratSemuaKg > 0
                    ? rk.totalBeratSemuaKg
                    : n.totalSetorKg ?? n.totalBeratKg ?? 0;
                const saldoAktif =
                  rk.semuaSetoran.length > 0
                    ? rk.saldoTersedia
                    : n.akumulasiTersalurkan ?? n.totalDisalurkan ?? 0;
                return (
                  <tr key={n.nomor}>
                    <td>
                      <code className="dsh__code">{n.nomor}</code>
                    </td>
                    <td>
                      <strong>{n.nama}</strong>
                      <span className="dsh__subtext">{n.email}</span>
                    </td>
                    <td>{kg(beratTotal)}</td>
                    <td>
                      <strong className="dsh__green">{rp(saldoAktif)}</strong>
                      {rk.totalDitarikSelesai > 0 && (
                        <span className="dsh__subtext">
                          Telah ditarik: {rp(rk.totalDitarikSelesai)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="dsh__amber">
                        {rp(rk.totalMenungguVerifikasiRp)}
                      </span>
                    </td>
                    <td>
                      <span className="dsh__chip dsh__chip--green">{n.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 4 && (
          <button
            type="button"
            className="dsh__expandbtn"
            onClick={() => setTampilSemua((prev) => !prev)}
          >
            {tampilSemua
              ? "Ringkas Direktori Nasabah ↑"
              : `Lihat Lengkap (${filtered.length} Nasabah) ↓`}
          </button>
        )}
      </section>
    </div>
  );
}
