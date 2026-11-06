"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  formatMetodePenarikan,
  getDaftarPenarikan,
  getDaftarSetoran,
  hitungRingkasanSaldoNasabah,
  kg,
  MINIMAL_PENARIKAN_RP,
  NASABAH_DEMO,
  RIWAYAT_SETORAN_AWAL,
  rp,
  tambahPenarikan,
  type MetodePenarikan,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../../lib/bss";
import { sesiSekarang, type Sesi } from "../../../lib/auth";

export default function RiwayatNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [tabUtama, setTabUtama] = useState<"setoran" | "penarikan">("setoran");
  const [filterSetoran, setFilterSetoran] = useState<
    "semua" | "terverifikasi" | "menunggu_verifikasi"
  >("semua");
  const [semuaSetoranState, setSemuaSetoranState] =
    useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [daftarPenarikan, setDaftarPenarikan] = useState<PenarikanUang[]>([]);

  // Form Tarik Saldo Nasabah
  const [nominalTarik, setNominalTarik] = useState<number>(10000);
  const [metodeTarik, setMetodeTarik] = useState<MetodePenarikan>("tunai");
  const [namaPenyedia, setNamaPenyedia] = useState<string>("Bank BSI");
  const [nomorTujuan, setNomorTujuan] = useState<string>("");
  const [catatanTarik, setCatatanTarik] = useState<string>(
    "Penarikan saldo tabungan sampah"
  );
  const [notifTarik, setNotifTarik] = useState<string>("");
  const [errorTarik, setErrorTarik] = useState<string>("");

  const idNominal = useId();
  const idMetode = useId();
  const idPenyedia = useId();
  const idNomorTujuan = useId();
  const idCatatan = useId();

  useEffect(() => {
    setSesi(sesiSekarang());
    setSemuaSetoranState(getDaftarSetoran());
    setDaftarPenarikan(getDaftarPenarikan());
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "penarikan") {
        setTabUtama("penarikan");
      }
    }
  }, []);

  const noNasabah = sesi?.nomor || "BSS-0142";
  const namaNasabah = sesi?.nama || NASABAH_DEMO.nama;

  const ringkasanSaldo = useMemo(() => {
    return hitungRingkasanSaldoNasabah(noNasabah);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noNasabah, semuaSetoranState, daftarPenarikan]);

  const setoranMilikNasabah = useMemo(() => {
    return semuaSetoranState.filter((s) => s.nomorNasabah === noNasabah);
  }, [semuaSetoranState, noNasabah]);

  // Data Setoran Terfilter
  const daftarSetoran = useMemo(() => {
    if (filterSetoran === "semua") return setoranMilikNasabah;
    if (filterSetoran === "menunggu_verifikasi") {
      return setoranMilikNasabah.filter(
        (s) => s.statusVerifikasi === "menunggu_verifikasi"
      );
    }
    return setoranMilikNasabah.filter(
      (s) => s.statusVerifikasi !== "menunggu_verifikasi"
    );
  }, [filterSetoran, setoranMilikNasabah]);

  const totalBerat = daftarSetoran.reduce((s, r) => s + r.beratKg, 0);
  const totalNilai = daftarSetoran.reduce(
    (s, r) => s + (r.nilaiRealisasi ?? r.estimasiNilai),
    0
  );

  // Data Penarikan Saldo
  const penarikanNasabah = useMemo(() => {
    return daftarPenarikan.filter((p) => p.nomorNasabah === noNasabah);
  }, [daftarPenarikan, noNasabah]);

  const handlePrint = () => {
    window.print();
  };

  const handleAjukanTarikSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTarik("");
    setNotifTarik("");

    if (nominalTarik < MINIMAL_PENARIKAN_RP) {
      setErrorTarik(
        `Minimal penarikan saldo adalah ${rp(MINIMAL_PENARIKAN_RP)}.`
      );
      return;
    }

    if (nominalTarik > ringkasanSaldo.saldoTersedia) {
      setErrorTarik(
        `Saldo aktif Anda (${rp(
          ringkasanSaldo.saldoTersedia
        )}) tidak mencukupi untuk penarikan ${rp(nominalTarik)}.`
      );
      return;
    }

    if (metodeTarik !== "tunai" && !nomorTujuan.trim()) {
      setErrorTarik(
        metodeTarik === "bank"
          ? "Masukkan nomor rekening bank tujuan."
          : "Masukkan nomor HP / akun E-Wallet tujuan."
      );
      return;
    }

    const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const isTunai = metodeTarik === "tunai";
    const infoTujuan = isTunai
      ? "Tunai di Pos Meja Timbang"
      : `${namaPenyedia} — ${nomorTujuan.trim()}`;

    const baru = tambahPenarikan({
      nomorNasabah: noNasabah,
      namaNasabah,
      tanggal: tanggalHariIni,
      nominal: nominalTarik,
      metode: metodeTarik,
      tujuan: infoTujuan,
      catatan: catatanTarik || "Penarikan saldo tabungan sampah",
      status: isTunai ? "menunggu" : "selesai",
      petugas: isTunai
        ? "Menunggu Validasi Petugas Jaga"
        : metodeTarik === "ewallet"
        ? "Otomatis Sistem BSS (E-Wallet)"
        : "Otomatis Sistem BSS (Transfer Bank)",
    });

    setDaftarPenarikan(getDaftarPenarikan());

    if (isTunai) {
      setNotifTarik(
        `Permintaan Tarik Tunai ${baru.id} sebesar ${rp(
          nominalTarik
        )} berhasil dibuat dengan status MENUNGGU VALIDASI PETUGAS JAGA. Silakan tunjukkan ke Petugas Jaga untuk divalidasi dan menerima uang tunai.`
      );
    } else {
      setNotifTarik(
        `Penarikan ${baru.id} sebesar ${rp(
          nominalTarik
        )} ke ${infoTujuan} berhasil diproses secara otomatis dan saldo telah dikirim!`
      );
    }
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head dsh__head--split">
        <div>
          <h1 className="dsh__h1">Riwayat Setoran & Penarikan Saldo</h1>
          <p className="dsh__sub">
            Catatan verifikasi setoran sampah dan pencairan saldo{" "}
            <strong>{namaNasabah}</strong> ({noNasabah})
          </p>
        </div>
        <button
          type="button"
          className="dsh__btnprint no-print"
          onClick={handlePrint}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            width={16}
            height={16}
            aria-hidden="true"
          >
            <path
              d="M5 7V3h10v4M5 14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 12h10v5H5v-5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          Cetak Riwayat (FR-014)
        </button>
      </header>

      {/* Tab Navigasi Utama: Setoran Sampah vs Penarikan Saldo */}
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          borderBottom: "2px solid #e5e0d4",
          paddingBottom: "8px",
          flexWrap: "wrap",
        }}
        role="tablist"
      >
        <button
          type="button"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: tabUtama === "setoran" ? "#25632d" : "transparent",
            color: tabUtama === "setoran" ? "#ffffff" : "#635e54",
            transition: "all 0.15s ease",
          }}
          onClick={() => setTabUtama("setoran")}
          role="tab"
          aria-selected={tabUtama === "setoran"}
        >
          📦 Riwayat Setoran Sampah ({setoranMilikNasabah.length})
        </button>
        <button
          type="button"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 700,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: tabUtama === "penarikan" ? "#25632d" : "transparent",
            color: tabUtama === "penarikan" ? "#ffffff" : "#635e54",
            transition: "all 0.15s ease",
          }}
          onClick={() => setTabUtama("penarikan")}
          role="tab"
          aria-selected={tabUtama === "penarikan"}
        >
          💵 Tarik Saldo & Riwayat Penarikan (Min. {rp(MINIMAL_PENARIKAN_RP)})
        </button>
      </div>

      {/* ==============================================================
          TAB 1: RIWAYAT SETORAN SAMPAH
         ============================================================== */}
      {tabUtama === "setoran" && (
        <>
          {/* Filter tab status verifikasi setoran */}
          <div className="dsh__filtertabs no-print" role="tablist">
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterSetoran === "semua"}
              onClick={() => setFilterSetoran("semua")}
            >
              Semua ({setoranMilikNasabah.length})
            </button>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterSetoran === "terverifikasi"}
              onClick={() => setFilterSetoran("terverifikasi")}
            >
              ✓ Terverifikasi / Saldo Masuk (
              {
                setoranMilikNasabah.filter(
                  (s) => s.statusVerifikasi !== "menunggu_verifikasi"
                ).length
              }
              )
            </button>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterSetoran === "menunggu_verifikasi"}
              onClick={() => setFilterSetoran("menunggu_verifikasi")}
            >
              ⏳ Menunggu Verifikasi Petugas (
              {
                setoranMilikNasabah.filter(
                  (s) => s.statusVerifikasi === "menunggu_verifikasi"
                ).length
              }
              )
            </button>
          </div>

          <section className="dsh__card" aria-label="Tabel Riwayat Setoran">
            <div className="dsh__cardhead">
              <span className="dsh__cardcount">
                Menampilkan <strong>{daftarSetoran.length}</strong> transaksi
                setoran sampah
              </span>
              <span className="dsh__cardtotal">
                Total Berat: <strong>{kg(totalBerat)}</strong> · Total Nilai:{" "}
                <strong>{rp(totalNilai)}</strong>
              </span>
            </div>

            <div className="dsh__tablewrap">
              <table className="dsh__table">
                <thead>
                  <tr>
                    <th>No. ID</th>
                    <th>Tanggal</th>
                    <th>Jenis Sampah</th>
                    <th>Jumlah / Berat (Satuan/Kg)</th>
                    <th>Nilai Saldo (Rp)</th>
                    <th>Status Verifikasi Petugas</th>
                    <th>Petugas Jaga</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarSetoran.map((r) => {
                    const belumVerif =
                      r.statusVerifikasi === "menunggu_verifikasi";
                    const nilaiRp = r.nilaiRealisasi ?? r.estimasiNilai;
                    return (
                      <tr key={r.id}>
                        <td>
                          <code className="dsh__code">{r.id}</code>
                        </td>
                        <td>{r.tanggal}</td>
                        <td>
                          <strong>{r.jenisSampahNama}</strong>
                        </td>
                        <td>
                          <strong>{r.jumlahSatuan || kg(r.beratKg)}</strong>
                        </td>
                        <td>
                          <strong
                            className={belumVerif ? "dsh__amber" : "dsh__green"}
                          >
                            {rp(nilaiRp)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`dsh__chip ${
                              belumVerif
                                ? "dsh__chip--amber"
                                : "dsh__chip--green"
                            }`}
                          >
                            {belumVerif
                              ? "⏳ Menunggu Verifikasi Petugas"
                              : "✓ Terverifikasi (Saldo Masuk)"}
                          </span>
                        </td>
                        <td className="dsh__small">{r.dicatatOleh}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="dsh__note dsh__noteprint">
            <strong>Alur Verifikasi Setoran & Saldo Nasabah:</strong>
            <p>
              Setiap sampah satuan maupun kiloan yang disetor ke meja timbang akan
              diverifikasi oleh <strong>Petugas Jaga</strong>. Begitu statusnya{" "}
              <strong>Terverifikasi</strong>, nilai rupiahnya sah dan langsung
              masuk ke <strong>Saldo Aktif</strong> yang dapat ditarik kapan saja
              (minimal <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>) melalui Tunai,
              Bank, atau E-Wallet.
            </p>
          </div>
        </>
      )}

      {/* ==============================================================
          TAB 2: TARIK SALDO & RIWAYAT PENARIKAN (MIN. RP 2.000)
         ============================================================== */}
      {tabUtama === "penarikan" && (
        <>
          {/* Ringkasan Saldo & Penarikan */}
          <div className="dsh__statsgrid" style={{ marginBottom: "20px" }}>
            <div className="dsh__statcard dsh__statcard--primary">
              <span className="dsh__statbadge">Siap Ditarik</span>
              <p className="dsh__statlabel">Saldo Aktif Tersedia</p>
              <p className="dsh__big dsh__big--green">
                {rp(ringkasanSaldo.saldoTersedia)}
              </p>
              <p className="dsh__statsmall">
                Minimal penarikan <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>{" "}
                (Tunai / Bank / E-Wallet)
              </p>
            </div>
            <div className="dsh__statcard">
              <p className="dsh__statlabel">Total Saldo Berhasil Dicairkan</p>
              <p className="dsh__big">{rp(ringkasanSaldo.totalDitarikSelesai)}</p>
              <p className="dsh__statsmall">
                Dari{" "}
                {penarikanNasabah.filter((p) => p.status === "selesai").length}{" "}
                transaksi pencairan selesai
              </p>
            </div>
            <div className="dsh__statcard dsh__statcard--accent">
              <span className="dsh__statbadge">Validasi Pos Jaga</span>
              <p className="dsh__statlabel">Tunai Menunggu Validasi Petugas</p>
              <p className="dsh__big dsh__big--amber">
                {rp(ringkasanSaldo.totalDitarikMenunggu)}
              </p>
              <p className="dsh__statsmall">
                Khusus penarikan Tunai memerlukan validasi Petugas Jaga
              </p>
            </div>
          </div>

          {notifTarik && (
            <div
              className="dsh__alert dsh__alert--success"
              role="alert"
              style={{ marginBottom: "20px" }}
            >
              <strong>Berhasil:</strong> {notifTarik}
            </div>
          )}

          {errorTarik && (
            <div
              className="dsh__alert"
              role="alert"
              style={{
                marginBottom: "20px",
                background: "#fff5f5",
                border: "1px solid #f5c2c2",
                color: "#9b1c1c",
                padding: "12px 16px",
                borderRadius: "8px",
              }}
            >
              <strong>Perhatian:</strong> {errorTarik}
            </div>
          )}

          <div className="dsh__split">
            {/* FORM PENGAJUAN TARIK SALDO NASABAH */}
            <section
              className="dsh__card no-print"
              aria-label="Form Tarik Saldo Nasabah"
            >
              <div className="dsh__cardhead">
                <div>
                  <span
                    className="dsh__tagbadge"
                    style={{ marginBottom: "4px" }}
                  >
                    Minimal {rp(MINIMAL_PENARIKAN_RP)}
                  </span>
                  <h2 className="dsh__h2">Tarik Saldo Tabungan</h2>
                </div>
              </div>
              <p className="dsh__carddesc">
                Pilih metode pencairan: <strong>Tunai</strong> (divalidasi
                Petugas Jaga saat serah terima), <strong>Saldo Bank</strong>,
                atau <strong>E-Wallet</strong> (otomatis langsung masuk).
              </p>

              <form onSubmit={handleAjukanTarikSaldo} className="dsh__form">
                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idNominal}>
                    Nominal Penarikan (Minimal {rp(MINIMAL_PENARIKAN_RP)})
                  </label>
                  <input
                    id={idNominal}
                    type="number"
                    min={MINIMAL_PENARIKAN_RP}
                    max={Math.max(
                      MINIMAL_PENARIKAN_RP,
                      ringkasanSaldo.saldoTersedia
                    )}
                    step="500"
                    required
                    className="dsh__input"
                    value={nominalTarik}
                    onChange={(e) => setNominalTarik(Number(e.target.value))}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "6px",
                    }}
                  >
                    {[2000, 5000, 10000, 20000, 50000].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setNominalTarik(nom)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          borderRadius: "5px",
                          border:
                            nominalTarik === nom
                              ? "1px solid #25632d"
                              : "1px solid #d8d3c5",
                          background:
                            nominalTarik === nom ? "#eaf5ec" : "#faf9f5",
                          color: nominalTarik === nom ? "#1b4d21" : "#555",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {rp(nom)}
                      </button>
                    ))}
                    {ringkasanSaldo.saldoTersedia >= MINIMAL_PENARIKAN_RP && (
                      <button
                        type="button"
                        onClick={() =>
                          setNominalTarik(ringkasanSaldo.saldoTersedia)
                        }
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          borderRadius: "5px",
                          border: "1px solid #25632d",
                          background: "#25632d",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Tarik Semua ({rp(ringkasanSaldo.saldoTersedia)})
                      </button>
                    )}
                  </div>
                </div>

                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idMetode}>
                    Metode Pencairan Saldo
                  </label>
                  <select
                    id={idMetode}
                    className="dsh__select"
                    value={metodeTarik}
                    onChange={(e) => {
                      const m = e.target.value as MetodePenarikan;
                      setMetodeTarik(m);
                      if (m === "bank") setNamaPenyedia("Bank BSI");
                      if (m === "ewallet") setNamaPenyedia("DANA");
                    }}
                  >
                    <option value="tunai">
                      💵 Tunai (Dengan Validasi Petugas Jaga)
                    </option>
                    <option value="bank">
                      🏦 Saldo Bank (Transfer Rekening — Langsung Cair)
                    </option>
                    <option value="ewallet">
                      📱 Saldo E-Wallet (DANA / GoPay / OVO / ShopeePay — Langsung Cair)
                    </option>
                  </select>
                </div>

                {metodeTarik === "bank" && (
                  <>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idPenyedia}>
                        Pilih Bank Tujuan
                      </label>
                      <select
                        id={idPenyedia}
                        className="dsh__select"
                        value={namaPenyedia}
                        onChange={(e) => setNamaPenyedia(e.target.value)}
                      >
                        <option value="Bank BSI">Bank Syariah Indonesia (BSI)</option>
                        <option value="Bank Mandiri">Bank Mandiri</option>
                        <option value="Bank BRI">Bank BRI</option>
                        <option value="Bank BCA">Bank BCA</option>
                        <option value="Bank BNI">Bank BNI</option>
                        <option value="Bank Jatim Syariah">Bank Jatim Syariah</option>
                      </select>
                    </div>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idNomorTujuan}>
                        Nomor Rekening Tujuan
                      </label>
                      <input
                        id={idNomorTujuan}
                        type="text"
                        required
                        className="dsh__input"
                        placeholder="Contoh: 7182930412"
                        value={nomorTujuan}
                        onChange={(e) => setNomorTujuan(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {metodeTarik === "ewallet" && (
                  <>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idPenyedia}>
                        Pilih E-Wallet Tujuan
                      </label>
                      <select
                        id={idPenyedia}
                        className="dsh__select"
                        value={namaPenyedia}
                        onChange={(e) => setNamaPenyedia(e.target.value)}
                      >
                        <option value="DANA">DANA</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="ShopeePay">ShopeePay</option>
                        <option value="LinkAja Syariah">LinkAja Syariah</option>
                      </select>
                    </div>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idNomorTujuan}>
                        Nomor HP / Akun E-Wallet
                      </label>
                      <input
                        id={idNomorTujuan}
                        type="text"
                        required
                        className="dsh__input"
                        placeholder="Contoh: 081234567890"
                        value={nomorTujuan}
                        onChange={(e) => setNomorTujuan(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idCatatan}>
                    Catatan Penarikan (Opsional)
                  </label>
                  <input
                    id={idCatatan}
                    type="text"
                    className="dsh__input"
                    value={catatanTarik}
                    onChange={(e) => setCatatanTarik(e.target.value)}
                    placeholder="Contoh: Penarikan saldo tabungan sampah"
                  />
                </div>

                <button type="submit" className="dsh__btn">
                  {metodeTarik === "tunai"
                    ? `Ajukan Tarik Tunai ${rp(nominalTarik)} (Validasi Petugas)`
                    : `Cairkan Sekarang ${rp(nominalTarik)} ke ${namaPenyedia}`}
                </button>
              </form>
            </section>

            {/* TABEL RIWAYAT PENARIKAN */}
            <section
              className="dsh__card"
              aria-label="Tabel Riwayat Penarikan Saldo"
            >
              <div className="dsh__cardhead">
                <div>
                  <h2 className="dsh__h2">Riwayat Penarikan Uang</h2>
                  <p
                    className="dsh__carddesc"
                    style={{ marginBottom: 0, marginTop: "4px" }}
                  >
                    Daftar penarikan Tunai, Saldo Bank, dan E-Wallet Anda.
                  </p>
                </div>
                <span className="dsh__chip dsh__chip--green">
                  {penarikanNasabah.length} Transaksi
                </span>
              </div>

              <div className="dsh__tablewrap">
                <table className="dsh__table">
                  <thead>
                    <tr>
                      <th>No. ID & Tanggal</th>
                      <th>Nominal</th>
                      <th>Metode & Tujuan</th>
                      <th>Validator / Petugas</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penarikanNasabah.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "#888",
                          }}
                        >
                          Belum ada riwayat penarikan saldo untuk akun ini.
                        </td>
                      </tr>
                    ) : (
                      penarikanNasabah.map((p) => {
                        const isMenunggu = p.status === "menunggu";
                        return (
                          <tr key={p.id}>
                            <td>
                              <code className="dsh__code">{p.id}</code>
                              <span className="dsh__subtext">{p.tanggal}</span>
                            </td>
                            <td>
                              <strong
                                className={
                                  isMenunggu ? "dsh__amber" : "dsh__green"
                                }
                              >
                                {rp(p.nominal)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`dsh__chip ${
                                  p.metode === "tunai"
                                    ? "dsh__chip--amber"
                                    : "dsh__chip--green"
                                }`}
                              >
                                {formatMetodePenarikan(p.metode)}
                              </span>
                              {p.tujuan && (
                                <span
                                  className="dsh__subtext"
                                  style={{ marginTop: "3px" }}
                                >
                                  {p.tujuan}
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className="dsh__subtext"
                                style={{ color: "#333" }}
                              >
                                {p.petugas}
                              </span>
                            </td>
                            <td>
                              {isMenunggu ? (
                                <span className="dsh__chip dsh__chip--amber">
                                  ⏳ Menunggu Validasi Petugas
                                </span>
                              ) : (
                                <span className="dsh__chip dsh__chip--green">
                                  ✓ Selesai / Cair
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
          </div>
        </>
      )}
    </div>
  );
}
