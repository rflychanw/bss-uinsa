"use client";

import { useEffect, useState } from "react";
import {
  akunLokal,
  tolakAkun,
  verifikasiAkun,
  type Akun,
} from "../../../lib/auth";

export default function AktivasiAkunPage() {
  const [semua, setSemua] = useState<Akun[]>([]);
  const [modalBukti, setModalBukti] = useState<{
    nama: string;
    nomor: string;
    foto?: string;
    metode?: string;
    tanggal?: string;
  } | null>(null);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "info"; teks: string } | null>(null);
  const [cari, setCari] = useState<string>("");

  const muatData = () => {
    const data = akunLokal();
    setSemua(data);
  };

  useEffect(() => {
    muatData();
  }, []);

  const antrean = semua.filter((a) => a.statusVerifikasi === "menunggu");
  const aktif = semua.filter((a) => a.statusVerifikasi === "aktif");
  const ditolak = semua.filter((a) => a.statusVerifikasi === "ditolak");

  const handleVerifikasi = (a: Akun) => {
    verifikasiAkun(a.email);
    muatData();
    if (modalBukti?.nomor === a.nomor) setModalBukti(null);
    setPesan({
      tipe: "sukses",
      teks: `Akun nasabah ${a.nama} (${a.nomor}) berhasil diverifikasi dan diaktifkan. Nasabah kini dapat masuk ke sistem.`,
    });
    setTimeout(() => setPesan(null), 6000);
  };

  const handleTolak = (a: Akun) => {
    const konfirm = window.confirm(
      `Yakin ingin menolak pendaftaran nasabah ${a.nama} (${a.nomor})?`
    );
    if (!konfirm) return;

    tolakAkun(a.email);
    muatData();
    if (modalBukti?.nomor === a.nomor) setModalBukti(null);
    setPesan({
      tipe: "info",
      teks: `Pendaftaran nasabah ${a.nama} (${a.nomor}) telah ditolak.`,
    });
    setTimeout(() => setPesan(null), 6000);
  };

  const antreanTerfilter = antrean.filter(
    (a) =>
      a.nama.toLowerCase().includes(cari.toLowerCase()) ||
      a.nomor.toLowerCase().includes(cari.toLowerCase()) ||
      a.email.toLowerCase().includes(cari.toLowerCase())
  );

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <div className="dsh__headrole">
          <span className="dsh__tagbadge">Petugas Jaga & Verifikasi</span>
          <span className="dsh__dot" aria-hidden="true">•</span>
          <span className="dsh__meta">Bank Sampah Syariah UINSA</span>
        </div>
        <h1 className="dsh__h1">Aktivasi & Verifikasi Akun Nasabah</h1>
        <p className="dsh__sub">
          Periksa berkas bukti transfer biaya pendaftaran nasabah baru dan aktifkan akun agar nasabah dapat mulai menyetor.
        </p>
      </header>

      {pesan && (
        <div
          className={`dsh__alert ${
            pesan.tipe === "sukses" ? "dsh__alert--success" : "dsh__alert--info"
          }`}
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          {pesan.teks}
        </div>
      )}

      {/* Ringkasan Metrik */}
      <div className="dsh__statsgrid" style={{ marginBottom: "24px" }}>
        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Perlu Tindakan</span>
          <p className="dsh__statlabel">Menunggu Verifikasi</p>
          <p className="dsh__big dsh__big--amber">{antrean.length}</p>
          <p className="dsh__statsmall">Pendaftar baru menunggu verifikasi admin/petugas</p>
        </div>

        <div className="dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Akun Diaktifkan</p>
          <p className="dsh__big dsh__big--green">{aktif.length}</p>
          <p className="dsh__statsmall">Nasabah mandiri yang telah berhasil diverifikasi</p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Pendaftaran</p>
          <p className="dsh__big">{semua.length}</p>
          <p className="dsh__statsmall">Akun terdaftar di penyimpanan lokal sistem</p>
        </div>
      </div>

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
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#1f1b13" }}>
                  Bukti Pembayaran Registrasi
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6e685d" }}>
                  {modalBukti.nama} ({modalBukti.nomor}) • Metode: {modalBukti.metode?.toUpperCase() || "QRIS"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalBukti(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6e685d",
                  lineHeight: 1,
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                background: "#f7f6f2",
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              {modalBukti.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modalBukti.foto}
                  alt={`Bukti transfer ${modalBukti.nama}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "380px",
                    objectFit: "contain",
                    borderRadius: "4px",
                    border: "1px solid #d9d6cd",
                  }}
                />
              ) : (
                <p style={{ color: "#777", fontSize: "13px", margin: "20px 0" }}>
                  Tidak ada berkas bukti gambar yang dilampirkan (kemungkinan bayar tunai di meja timbang).
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
                  const target = semua.find((a) => a.nomor === modalBukti.nomor);
                  if (target) handleVerifikasi(target);
                }}
              >
                ✓ Setujui & Aktifkan Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel 1: Antrean Menunggu Verifikasi */}
      <section className="dsh__card" aria-label="Antrean Aktivasi Akun">
        <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "12px" }}>
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
                Antrean Pendaftar Baru Menunggu Aktivasi
              </h2>
            </div>
            <p className="dsh__carddesc" style={{ marginTop: "4px", marginBottom: 0 }}>
              Daftar nasabah baru yang telah mengunggah bukti bayar dan menunggu persetujuan akun.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="search"
              placeholder="Cari nama, email, no registrasi..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="dsh__select"
              style={{ padding: "6px 12px", fontSize: "13px", width: "240px" }}
            />
          </div>
        </div>

        {antreanTerfilter.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#17140f", marginBottom: "6px" }}>
              Tidak Ada Antrean Verifikasi
            </p>
            <p style={{ fontSize: "13px", maxWidth: "420px", margin: "0 auto", color: "#6e685d" }}>
              {cari
                ? "Tidak ada pendaftar yang cocok dengan kata kunci pencarian Anda."
                : "Semua pendaftaran nasabah baru telah diverifikasi atau belum ada nasabah baru yang mendaftar."}
            </p>
          </div>
        ) : (
          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>No. Registrasi</th>
                  <th>Nama & Email Nasabah</th>
                  <th>Tanggal Daftar</th>
                  <th>Metode Bayar</th>
                  <th>Bukti Pembayaran</th>
                  <th>Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {antreanTerfilter.map((a) => (
                  <tr key={a.email}>
                    <td>
                      <code className="dsh__code">{a.nomor}</code>
                    </td>
                    <td>
                      <strong>{a.nama}</strong>
                      <span className="dsh__subtext">{a.email}</span>
                    </td>
                    <td>{a.tanggalDaftar || "Hari ini"}</td>
                    <td>
                      <span
                        className="dsh__chip"
                        style={{ textTransform: "uppercase", fontWeight: 600, fontSize: "11px" }}
                      >
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
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                setModalBukti({
                                  nama: a.nama,
                                  nomor: a.nomor,
                                  foto: a.buktiBayar,
                                  metode: a.metodeBayar,
                                  tanggal: a.tanggalDaftar,
                                })
                              }
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
                                tanggal: a.tanggalDaftar,
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
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="dsh__btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            background: "#25632d",
                            borderColor: "#1e5225",
                          }}
                          onClick={() => handleVerifikasi(a)}
                        >
                          ✓ Aktifkan
                        </button>
                        <button
                          type="button"
                          className="dsh__btnoutline"
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            color: "#991b1b",
                            borderColor: "#fca5a5",
                          }}
                          onClick={() => handleTolak(a)}
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Tabel 2: Riwayat Akun Telah Diaktifkan */}
      {aktif.length > 0 && (
        <section className="dsh__card" aria-label="Riwayat Akun Diaktifkan" style={{ marginTop: "24px" }}>
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Riwayat Akun yang Telah Diaktifkan</h2>
              <p className="dsh__carddesc" style={{ marginTop: "4px", marginBottom: 0 }}>
                Daftar akun nasabah yang telah diverifikasi dan memiliki akses aktif ke sistem.
              </p>
            </div>
            <span className="dsh__chip dsh__chip--green">{aktif.length} Akun Aktif</span>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>No. BSS</th>
                  <th>Nama Nasabah</th>
                  <th>Email</th>
                  <th>Status Akun</th>
                  <th>Tanggal Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {aktif.map((a) => (
                  <tr key={a.email}>
                    <td>
                      <code className="dsh__code">{a.nomor}</code>
                    </td>
                    <td>
                      <strong>{a.nama}</strong>
                    </td>
                    <td>{a.email}</td>
                    <td>
                      <span className="dsh__chip dsh__chip--green">Terverifikasi / Aktif</span>
                    </td>
                    <td>{a.tanggalDaftar || "Aktif"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tabel 3: Riwayat Ditolak (jika ada) */}
      {ditolak.length > 0 && (
        <section className="dsh__card" aria-label="Riwayat Akun Ditolak" style={{ marginTop: "24px" }}>
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2" style={{ color: "#991b1b" }}>
                Pendaftaran Ditolak
              </h2>
              <p className="dsh__carddesc" style={{ marginTop: "4px", marginBottom: 0 }}>
                Akun dengan bukti pembayaran tidak valid atau ditolak oleh petugas.
              </p>
            </div>
            <span className="dsh__chip" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {ditolak.length} Ditolak
            </span>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>No. BSS</th>
                  <th>Nama Nasabah</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ditolak.map((a) => (
                  <tr key={a.email}>
                    <td>
                      <code className="dsh__code">{a.nomor}</code>
                    </td>
                    <td>
                      <strong>{a.nama}</strong>
                    </td>
                    <td>{a.email}</td>
                    <td>
                      <span className="dsh__chip" style={{ background: "#fee2e2", color: "#991b1b" }}>
                        Ditolak
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dsh__btnoutline"
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        onClick={() => handleVerifikasi(a)}
                      >
                        Pulihkan & Aktifkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}