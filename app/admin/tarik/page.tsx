"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  DAFTAR_NASABAH_MASTER,
  formatMetodePenarikan,
  getDaftarPenarikan,
  hitungRingkasanSaldoNasabah,
  MINIMAL_PENARIKAN_RP,
  rp,
  tambahPenarikan,
  validasiPenarikanTunai,
  type MetodePenarikan,
  type PenarikanUang,
} from "../../../lib/bss";
import { sesiSekarang, type Sesi } from "../../../lib/auth";

export default function TarikTunaiAdminPage() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [daftar, setDaftar] = useState<PenarikanUang[]>([]);
  const [cari, setCari] = useState<string>("");
  const [nasabahNomor, setNasabahNomor] = useState<string>(
    DAFTAR_NASABAH_MASTER[0].nomor
  );
  const [nominal, setNominal] = useState<number>(10000);
  const [metode, setMetode] = useState<MetodePenarikan>("tunai");
  const [tujuan, setTujuan] = useState<string>("Tunai di Pos Meja Timbang");
  const [catatan, setCatatan] = useState<string>(
    "Pencairan saldo tabungan di loket petugas"
  );
  const [notif, setNotif] = useState<string>("");

  const idSelectNasabah = useId();
  const idNominal = useId();
  const idMetode = useId();
  const idTujuan = useId();
  const idCatatan = useId();

  useEffect(() => {
    setSesi(sesiSekarang());
    setDaftar(getDaftarPenarikan());
  }, []);

  const nasabahTerpilih =
    DAFTAR_NASABAH_MASTER.find((n) => n.nomor === nasabahNomor) ||
    DAFTAR_NASABAH_MASTER[0];

  const ringkasanNasabahTerpilih = useMemo(() => {
    return hitungRingkasanSaldoNasabah(nasabahNomor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nasabahNomor, daftar]);

  const totalDitarikSelesai = useMemo(() => {
    return daftar
      .filter((d) => d.status === "selesai")
      .reduce((acc, curr) => acc + curr.nominal, 0);
  }, [daftar]);

  const totalMenungguValidasi = useMemo(() => {
    return daftar.filter((d) => d.status === "menunggu");
  }, [daftar]);

  const totalTunai = useMemo(() => {
    return daftar
      .filter((d) => d.metode === "tunai" && d.status === "selesai")
      .reduce((acc, curr) => acc + curr.nominal, 0);
  }, [daftar]);

  const totalNonTunai = useMemo(() => {
    return daftar
      .filter((d) => d.metode !== "tunai" && d.status === "selesai")
      .reduce((acc, curr) => acc + curr.nominal, 0);
  }, [daftar]);

  const filtered = useMemo(() => {
    if (!cari.trim()) return daftar;
    const q = cari.toLowerCase();
    return daftar.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.namaNasabah.toLowerCase().includes(q) ||
        d.nomorNasabah.toLowerCase().includes(q) ||
        d.metode.toLowerCase().includes(q) ||
        (d.tujuan && d.tujuan.toLowerCase().includes(q)) ||
        (d.catatan && d.catatan.toLowerCase().includes(q))
    );
  }, [daftar, cari]);

  const handleValidasiTunai = (item: PenarikanUang) => {
    const namaPetugas = sesi?.nama || "Ahmad Fauzi (Petugas Piket)";
    const updated = validasiPenarikanTunai(item.id, namaPetugas);
    setDaftar(updated);
    setNotif(
      `Penarikan Tunai ${item.id} sebesar ${rp(item.nominal)} untuk ${item.namaNasabah} (${item.nomorNasabah}) berhasil DIVALIDASI oleh Petugas Jaga.`
    );
    setTimeout(() => setNotif(""), 6000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal < MINIMAL_PENARIKAN_RP) {
      alert(`Minimal penarikan saldo adalah ${rp(MINIMAL_PENARIKAN_RP)}.`);
      return;
    }
    if (nominal > ringkasanNasabahTerpilih.saldoTersedia) {
      alert(
        `Nominal melebihi saldo aktif nasabah (${rp(
          ringkasanNasabahTerpilih.saldoTersedia
        )}).`
      );
      return;
    }

    const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const namaPetugas = sesi?.nama || "Ahmad Fauzi (Petugas Piket)";

    tambahPenarikan({
      nomorNasabah: nasabahTerpilih.nomor,
      namaNasabah: nasabahTerpilih.nama,
      tanggal: tanggalHariIni,
      nominal,
      metode,
      tujuan:
        metode === "tunai"
          ? "Tunai di Pos Meja Timbang"
          : tujuan || (metode === "ewallet" ? "E-Wallet Nasabah" : "Rekening Bank Nasabah"),
      catatan,
      status: "selesai",
      petugas: namaPetugas,
    });

    setDaftar(getDaftarPenarikan());
    setNotif(
      `Penarikan ${rp(nominal)} (${formatMetodePenarikan(metode)}) atas nama ${
        nasabahTerpilih.nama
      } (${nasabahTerpilih.nomor}) berhasil divalidasi dan dicatat.`
    );
    setTimeout(() => setNotif(""), 6000);
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <div className="dsh__headrole">
          <span className="dsh__tagbadge">Layanan Nasabah & Kasir Pos Jaga</span>
          <span className="dsh__dot" aria-hidden="true">•</span>
          <span className="dsh__meta">
            Validasi Tarik Tunai, Bank & E-Wallet (Min. {rp(MINIMAL_PENARIKAN_RP)})
          </span>
        </div>
        <h1 className="dsh__h1">Validasi & Riwayat Penarikan Saldo</h1>
        <p className="dsh__sub">
          Validasi permintaan tarik tunai dari nasabah di meja jaga serta pantau pencairan ke rekening Bank dan E-Wallet.
        </p>
      </header>

      {notif && (
        <div className="dsh__alert dsh__alert--success" role="alert" style={{ marginBottom: "20px" }}>
          <strong>Berhasil:</strong> {notif}
        </div>
      )}

      {/* Ringkasan Metrik Kas Keluar */}
      <div className="dsh__statsgrid">
        <div className="dsh__statcard dsh__statcard--primary">
          <p className="dsh__statlabel">Total Saldo Dicairkan (Selesai)</p>
          <p className="dsh__big dsh__big--green">{rp(totalDitarikSelesai)}</p>
          <p className="dsh__statsmall">
            Akumulasi penarikan yang telah sah & selesai
          </p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">
            {totalMenungguValidasi.length > 0
              ? `${totalMenungguValidasi.length} Antrean Tunai`
              : "Tidak Ada Antrean"}
          </span>
          <p className="dsh__statlabel">Menunggu Validasi Petugas (Tunai)</p>
          <p className="dsh__big dsh__big--amber">
            {totalMenungguValidasi.length} Pengajuan
          </p>
          <p className="dsh__statsmall">
            Klik tombol Validasi saat menyerahkan uang tunai ke nasabah
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Tunai Tervalidasi vs Non-Tunai</p>
          <p className="dsh__big">{rp(totalTunai)}</p>
          <p className="dsh__statsmall">
            Bank & E-Wallet otomatis: <strong>{rp(totalNonTunai)}</strong>
          </p>
        </div>
      </div>

      <div className="dsh__split">
        {/* Tabel Riwayat Penarikan */}
        <section className="dsh__card" aria-label="Tabel Riwayat Tarik Tunai">
          <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 className="dsh__h2">Daftar Pengajuan & Riwayat Penarikan</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
                Penarikan Tunai dari nasabah wajib divalidasi oleh Petugas Jaga. Bank & E-Wallet otomatis selesai.
              </p>
            </div>
            <div className="dsh__filterwrap">
              <input
                type="search"
                placeholder="Cari ID, nama nasabah, metode, tujuan..."
                className="dsh__input dsh__input--sm"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>
          </div>

          <div className="dsh__tablewrap">
            <table className="dsh__table">
              <thead>
                <tr>
                  <th>No. ID & Tanggal</th>
                  <th>Nasabah Penerima</th>
                  <th>Nominal Ditarik</th>
                  <th>Metode & Tujuan</th>
                  <th>Petugas / Validator</th>
                  <th>Status & Validasi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                      Tidak ditemukan riwayat penarikan sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isMenunggu = item.status === "menunggu";
                    return (
                      <tr key={item.id}>
                        <td>
                          <code className="dsh__code">{item.id}</code>
                          <span className="dsh__subtext">{item.tanggal}</span>
                        </td>
                        <td>
                          <strong>{item.namaNasabah}</strong>
                          <span className="dsh__subtext">{item.nomorNasabah}</span>
                        </td>
                        <td>
                          <strong className={isMenunggu ? "dsh__amber" : "dsh__green"}>
                            {rp(item.nominal)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`dsh__chip ${
                              item.metode === "tunai"
                                ? "dsh__chip--amber"
                                : "dsh__chip--green"
                            }`}
                          >
                            {formatMetodePenarikan(item.metode)}
                          </span>
                          {item.tujuan && (
                            <span className="dsh__subtext" style={{ marginTop: "3px" }}>
                              {item.tujuan}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="dsh__subtext" style={{ color: "#333" }}>
                            {item.petugas}
                          </span>
                        </td>
                        <td>
                          {isMenunggu ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                              <span className="dsh__chip dsh__chip--amber">
                                ⏳ Menunggu Validasi Petugas
                              </span>
                              <button
                                type="button"
                                className="dsh__btn"
                                style={{
                                  padding: "5px 10px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                                onClick={() => handleValidasiTunai(item)}
                              >
                                ✓ Validasi & Serahkan Tunai
                              </button>
                            </div>
                          ) : (
                            <span className="dsh__chip dsh__chip--green">
                              ✓ Selesai / Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Form Catat Penarikan Saldo */}
        <section className="dsh__card" aria-label="Formulir Tarik Tunai">
          <div className="dsh__cardhead">
            <div>
              <span className="dsh__tagbadge" style={{ marginBottom: "4px" }}>
                Loket Kasir Pos Jaga
              </span>
              <h2 className="dsh__h2">Catat Penarikan Langsung</h2>
            </div>
          </div>
          <p className="dsh__carddesc">
            Catat dan validasi langsung penarikan saldo nasabah (minimal{" "}
            <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>) via Tunai, Bank, atau E-Wallet.
          </p>

          <form onSubmit={handleSubmit} className="dsh__form">
            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idSelectNasabah}>
                Pilih Nasabah yang Mencairkan
              </label>
              <select
                id={idSelectNasabah}
                className="dsh__select"
                value={nasabahNomor}
                onChange={(e) => setNasabahNomor(e.target.value)}
              >
                {DAFTAR_NASABAH_MASTER.map((n) => {
                  const sld = hitungRingkasanSaldoNasabah(n.nomor).saldoTersedia;
                  return (
                    <option key={n.nomor} value={n.nomor}>
                      {n.nomor} — {n.nama} (Saldo Aktif: {rp(sld)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idNominal}>
                Nominal Uang yang Ditarik (Min. {rp(MINIMAL_PENARIKAN_RP)})
              </label>
              <input
                id={idNominal}
                type="number"
                step="500"
                min={MINIMAL_PENARIKAN_RP}
                max={Math.max(MINIMAL_PENARIKAN_RP, ringkasanNasabahTerpilih.saldoTersedia)}
                className="dsh__input"
                required
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value))}
              />
              <span className="dsh__subtext">
                Saldo valid tersedia saat ini:{" "}
                <strong>{rp(ringkasanNasabahTerpilih.saldoTersedia)}</strong> (Minimal tarik{" "}
                <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>)
              </span>
            </div>

            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idMetode}>
                Metode Pencairan Saldo
              </label>
              <select
                id={idMetode}
                className="dsh__select"
                value={metode}
                onChange={(e) => {
                  const m = e.target.value as MetodePenarikan;
                  setMetode(m);
                  if (m === "tunai") setTujuan("Tunai di Pos Meja Timbang");
                  else if (m === "bank") setTujuan("Bank BSI — ");
                  else if (m === "ewallet") setTujuan("DANA — ");
                }}
              >
                <option value="tunai">💵 Tunai di Pos Jaga (Tervalidasi Petugas)</option>
                <option value="bank">🏦 Saldo Bank (Transfer Bank BSI/BRI/Mandiri/BCA)</option>
                <option value="ewallet">📱 Saldo E-Wallet (DANA/GoPay/OVO/ShopeePay)</option>
              </select>
            </div>

            {metode !== "tunai" && (
              <div className="dsh__field">
                <label className="dsh__label" htmlFor={idTujuan}>
                  {metode === "bank" ? "Nama Bank & Nomor Rekening" : "Nama E-Wallet & Nomor HP"}
                </label>
                <input
                  id={idTujuan}
                  type="text"
                  className="dsh__input"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder={
                    metode === "bank"
                      ? "Contoh: Bank BSI — 7182930412"
                      : "Contoh: DANA — 081234567890"
                  }
                />
              </div>
            )}

            <div className="dsh__field">
              <label className="dsh__label" htmlFor={idCatatan}>
                Catatan / Keperluan
              </label>
              <input
                id={idCatatan}
                type="text"
                className="dsh__input"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="mis. Pencairan saldo tabungan wadiah"
              />
            </div>

            <button type="submit" className="dsh__btn">
              ✓ Validasi & Simpan Pencairan Saldo
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
