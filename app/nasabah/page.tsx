"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
  BATCH_PENGEPUL_AWAL,
  DAFTAR_NASABAH_MASTER,
  formatMetodePenarikan,
  getDaftarPenarikan,
  getDaftarSetoran,
  hitungRingkasanSaldoNasabah,
  kg,
  MINIMAL_PENARIKAN_RP,
  RIWAYAT_SETORAN_AWAL,
  rp,
  tambahPenarikan,
  type MetodePenarikan,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../lib/bss";
import KalkulatorPintar from "../../components/app/KalkulatorPintar";
import LembarBukuTabungan from "../../components/app/LembarBukuTabungan";

export default function DashboardNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sembunyiSaldo, setSembunyiSaldo] = useState(false);
  const [, setSetoranList] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [penarikanList, setPenarikanList] = useState<PenarikanUang[]>([]);

  // Modal Tarik Saldo
  const [bukaModalTarik, setBukaModalTarik] = useState(false);
  const [tabTampilan, setTabTampilan] = useState<"ringkasan" | "buku_tabungan">("ringkasan");
  const [metodeTarik, setMetodeTarik] = useState<MetodePenarikan>("ewallet");
  const [provider, setProvider] = useState<string>("DANA");
  const [nomorTujuan, setNomorTujuan] = useState<string>("081234567890");
  const [nominalTarik, setNominalTarik] = useState<number>(10000);
  const [catatanTarik, setCatatanTarik] = useState<string>("Penarikan saldo tabungan");
  const [errorTarik, setErrorTarik] = useState<string>("");
  const [strukBerhasil, setStrukBerhasil] = useState<PenarikanUang | null>(null);

  const muatUlangData = () => {
    setSetoranList(getDaftarSetoran());
    setPenarikanList(getDaftarPenarikan());
  };

  useEffect(() => {
    setSesi(sesiSekarang());
    muatUlangData();
    setMounted(true);
  }, []);

  const nasabahData =
    DAFTAR_NASABAH_MASTER.find((n) => n.nomor === sesi?.nomor) ||
    DAFTAR_NASABAH_MASTER[0];

  const namaLengkap = sesi?.nama || nasabahData.nama;
  const namaDepan = namaLengkap.split(" ")[0];
  const nomorNasabah = sesi?.nomor || nasabahData.nomor;

  const ringkasan = mounted
    ? hitungRingkasanSaldoNasabah(nomorNasabah)
    : {
        semuaSetoran: RIWAYAT_SETORAN_AWAL.filter((s) => s.nomorNasabah === nomorNasabah),
        semuaPenarikan: [],
        totalSaldoTerverifikasi: 203300,
        totalMenungguVerifikasiRp: 18000,
        totalMenungguVerifikasiKg: 3.0,
        totalBeratTerverifikasiKg: 48.9,
        totalBeratSemuaKg: 51.9,
        totalDitarikSelesai: 125000,
        totalDitarikMenunggu: 0,
        saldoTersedia: 78300,
      };

  const bukaQuickAction = (metode: MetodePenarikan) => {
    setErrorTarik("");
    setStrukBerhasil(null);
    setMetodeTarik(metode);
    if (metode === "ewallet") {
      setProvider("DANA");
      setNomorTujuan("081234567890");
    } else if (metode === "bank") {
      setProvider("Bank BSI");
      setNomorTujuan("7182930412");
    } else {
      setProvider("Pos Jaga BSS FEBI");
      setNomorTujuan("Tunai di Meja Timbang");
    }
    setBukaModalTarik(true);
  };

  const handleProsesTarik = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTarik("");

    if (nominalTarik < MINIMAL_PENARIKAN_RP) {
      setErrorTarik(`Minimal penarikan saldo adalah ${rp(MINIMAL_PENARIKAN_RP)}.`);
      return;
    }
    if (nominalTarik > ringkasan.saldoTersedia) {
      setErrorTarik(
        `Saldo aktif tidak mencukupi. Saldo tersedia: ${rp(ringkasan.saldoTersedia)}.`
      );
      return;
    }
    if (metodeTarik !== "tunai" && !nomorTujuan.trim()) {
      setErrorTarik("Nomor tujuan (Rekening / Nomor HP E-Wallet) wajib diisi.");
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
      : `${provider} — ${nomorTujuan.trim()}`;

    const trxBaru = tambahPenarikan({
      nomorNasabah,
      namaNasabah: namaLengkap,
      tanggal: tanggalHariIni,
      nominal: nominalTarik,
      metode: metodeTarik,
      tujuan: infoTujuan,
      catatan: catatanTarik || "Penarikan saldo tabungan",
      status: "menunggu",
      petugas: "Menunggu Validasi Petugas / Kasir BSS",
    });

    muatUlangData();
    setStrukBerhasil(trxBaru);
  };

  // Gabungan aktivitas masuk & keluar, diringkas hanya 3 item terbaru di beranda
  const semuaAktivitas = [
    ...ringkasan.semuaSetoran.map((s) => ({
      uid: `in-${s.id}`,
      id: s.id,
      tipe: "masuk" as const,
      judul: s.jenisSampahNama,
      sub: `${s.tanggal} · ${s.jumlahSatuan || kg(s.beratKg)}`,
      nominal: s.nilaiRealisasi ?? s.estimasiNilai,
      isPending: s.statusVerifikasi === "menunggu_verifikasi",
      statusLabel:
        s.statusVerifikasi === "menunggu_verifikasi"
          ? "Menunggu Verifikasi Petugas"
          : "Terverifikasi · Saldo Masuk",
    })),
    ...(mounted ? penarikanList.filter((p) => p.nomorNasabah === nomorNasabah) : []).map(
      (p) => ({
        uid: `out-${p.id}`,
        id: p.id,
        tipe: "keluar" as const,
        judul:
          p.metode === "tunai"
            ? "Tarik Tunai di Pos Jaga"
            : p.tujuan || "Pencairan Non-Tunai",
        sub: `${p.tanggal} · ${p.id}`,
        nominal: p.nominal,
        isPending: p.status === "menunggu",
        statusLabel:
          p.status === "menunggu"
            ? "Menunggu Validasi Petugas"
            : "Pencairan Selesai",
      })
    ),
  ];

  const aktivitasRingkas = semuaAktivitas.slice(0, 3);

  return (
    <div className="dsh__page">
      <header className="dsh__head">
        <h1 className="dsh__h1">Halo, {namaDepan}.</h1>
        <p className="dsh__sub">
          Dompet Tabungan Wadiah Bank Sampah Syariah UINSA
        </p>
      </header>

      {/* ==============================================================
          1. PANEL DOMPET DIGITAL (FLAT EDITORIAL SURFACE)
         ============================================================== */}
      <section className="dsh__wallet" aria-label="Dompet Tabungan Syariah">
        <div className="dsh__wallethead">
          <div className="dsh__walletid">
            <span>Rekening Wadiah</span>
            <span>·</span>
            <strong>{nomorNasabah}</strong>
            <span>·</span>
            <span>{namaLengkap}</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setTabTampilan(tabTampilan === "buku_tabungan" ? "ringkasan" : "buku_tabungan")}
              style={{
                fontSize: "12.5px",
                color: "#ffffff",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "4px",
                padding: "3px 10px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {tabTampilan === "buku_tabungan" ? "Tutup Lembar Buku" : "📖 Buka Buku Tabungan"}
            </button>
            <Link
              href="/nasabah/profil"
              style={{
                fontSize: "12.5px",
                color: "rgba(248, 248, 246, 0.85)",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              Halaman Penuh →
            </Link>
          </div>
        </div>

        <div className="dsh__walletmain">
          <div>
            <div className="dsh__walletlabel">
              <span>Saldo Aktif Tersedia</span>
              <button
                type="button"
                className="dsh__walleteye"
                onClick={() => setSembunyiSaldo(!sembunyiSaldo)}
                aria-label="Sembunyikan atau tampilkan nominal saldo"
              >
                {sembunyiSaldo ? "Tampilkan" : "Sembunyikan"}
              </button>
            </div>
            <div className="dsh__walletamount">
              {sembunyiSaldo ? "Rp ••••••••" : rp(ringkasan.saldoTersedia)}
            </div>
            <div className="dsh__walletmeta">
              <span>
                Minimal penarikan <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>
              </span>
              {ringkasan.totalMenungguVerifikasiRp > 0 && (
                <span>
                  · Menunggu verifikasi petugas:{" "}
                  <strong>+{rp(ringkasan.totalMenungguVerifikasiRp)}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="dsh__walletactions">
            <button
              type="button"
              className="dsh__walletbtn dsh__walletbtn--primary"
              onClick={() => bukaQuickAction("ewallet")}
            >
              Cairkan ke E-Wallet
            </button>
            <button
              type="button"
              className="dsh__walletbtn dsh__walletbtn--ghost"
              onClick={() => bukaQuickAction("bank")}
            >
              Transfer Bank
            </button>
            <button
              type="button"
              className="dsh__walletbtn dsh__walletbtn--ghost"
              onClick={() => bukaQuickAction("tunai")}
            >
              Tarik Tunai Pos
            </button>
          </div>
        </div>

        <div className="dsh__walletstrip">
          <div className="dsh__walletstat">
            <span>Total Setoran Terverifikasi</span>
            <strong>
              {rp(ringkasan.totalSaldoTerverifikasi)} ({kg(ringkasan.totalBeratTerverifikasiKg)})
            </strong>
          </div>
          <div className="dsh__walletstat">
            <span>Menunggu Verifikasi Petugas</span>
            <strong>
              {rp(ringkasan.totalMenungguVerifikasiRp)} ({kg(ringkasan.totalMenungguVerifikasiKg)})
            </strong>
          </div>
          <div className="dsh__walletstat">
            <span>Total Saldo Dicairkan</span>
            <strong>{rp(ringkasan.totalDitarikSelesai)}</strong>
          </div>
          {ringkasan.totalDitarikMenunggu > 0 && (
            <div className="dsh__walletstat">
              <span>Penarikan Menunggu Verifikasi</span>
              <strong>{rp(ringkasan.totalDitarikMenunggu)}</strong>
            </div>
          )}
        </div>
      </section>

      {/* ==============================================================
          2. MODAL PENCAIRAN SALDO (E-WALLET / BANK / TUNAI)
         ============================================================== */}
      {bukaModalTarik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23, 20, 15, 0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setBukaModalTarik(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #dedad0",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {strukBerhasil ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "14px",
                    borderBottom: "1px solid #f0eee8",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span
                      className={`dsh__chip ${
                        strukBerhasil.status === "selesai"
                          ? "dsh__chip--green"
                          : "dsh__chip--amber"
                      }`}
                    >
                      {strukBerhasil.status === "selesai"
                        ? "Pencairan Selesai"
                        : "Menunggu Validasi Petugas"}
                    </span>
                    <h3 style={{ margin: "8px 0 0", fontSize: "20px" }}>
                      Bukti Pencairan Saldo
                    </h3>
                  </div>
                  <code className="dsh__code">{strukBerhasil.id}</code>
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    marginBottom: "16px",
                  }}
                >
                  {rp(strukBerhasil.nominal)}
                </div>

                <dl className="dsh__kv" style={{ marginBottom: "18px" }}>
                  <div>
                    <dt>Metode & Tujuan</dt>
                    <dd>{strukBerhasil.tujuan}</dd>
                  </div>
                  <div>
                    <dt>Tanggal</dt>
                    <dd>{strukBerhasil.tanggal}</dd>
                  </div>
                  <div>
                    <dt>Status Verifikasi</dt>
                    <dd>{strukBerhasil.petugas}</dd>
                  </div>
                  <div>
                    <dt>Sisa Saldo Aktif</dt>
                    <dd>
                      <strong className="dsh__green">
                        {rp(ringkasan.saldoTersedia)}
                      </strong>
                    </dd>
                  </div>
                </dl>

                {strukBerhasil.metode === "tunai" ? (
                  <p
                    style={{
                      fontSize: "12.5px",
                      background: "#faf8f2",
                      border: "1px solid #e6dec8",
                      color: "#6b531c",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    Pengajuan tarik tunai berhasil dicatat dengan status <strong>Menunggu Validasi</strong>.
                    Tunjukkan nomor <strong>{strukBerhasil.id}</strong> kepada Petugas Jaga di meja timbang saat pengambilan uang.
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: "12.5px",
                      background: "#faf8f2",
                      border: "1px solid #e6dec8",
                      color: "#6b531c",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    Pengajuan pencairan non-tunai berhasil dicatat dengan status <strong>Menunggu Validasi</strong>.
                    Saldo akan ditransfer ke <strong>{strukBerhasil.tujuan}</strong> setelah diverifikasi oleh Petugas / Kasir BSS.
                  </p>
                )}

                <button
                  type="button"
                  className="dsh__btn"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setStrukBerhasil(null);
                    setBukaModalTarik(false);
                  }}
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "18px" }}>
                    Penarikan Saldo Tabungan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setBukaModalTarik(false)}
                    style={{
                      fontSize: "14px",
                      color: "#6e6859",
                      padding: "4px 8px",
                    }}
                  >
                    Tutup ✕
                  </button>
                </div>

                {/* Pilihan Metode */}
                <div
                  className="dsh__filtertabs"
                  style={{ marginBottom: "16px" }}
                  role="tablist"
                >
                  {(
                    [
                      { id: "ewallet", label: "E-Wallet" },
                      { id: "bank", label: "Transfer Bank" },
                      { id: "tunai", label: "Tunai Pos Jaga" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="dsh__filtertab"
                      style={{ flex: 1, textAlign: "center" }}
                      data-active={metodeTarik === m.id}
                      onClick={() => bukaQuickAction(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {errorTarik && (
                  <div
                    className="dsh__alert"
                    style={{
                      background: "#fdf2f2",
                      border: "1px solid #f2c6c6",
                      color: "#9b1c1c",
                      marginBottom: "14px",
                    }}
                  >
                    {errorTarik}
                  </div>
                )}

                <form onSubmit={handleProsesTarik} className="dsh__form">
                  {metodeTarik === "ewallet" && (
                    <div className="dsh__field">
                      <label className="dsh__label">Tujuan E-Wallet</label>
                      <select
                        className="dsh__select"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                      >
                        <option value="DANA">DANA</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="ShopeePay">ShopeePay</option>
                        <option value="LinkAja">LinkAja</option>
                      </select>
                    </div>
                  )}

                  {metodeTarik === "bank" && (
                    <div className="dsh__field">
                      <label className="dsh__label">Bank Tujuan</label>
                      <select
                        className="dsh__select"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                      >
                        <option value="Bank BSI">Bank Syariah Indonesia (BSI)</option>
                        <option value="Bank Mandiri">Bank Mandiri</option>
                        <option value="Bank BRI">Bank BRI</option>
                        <option value="Bank BCA">Bank BCA</option>
                        <option value="Bank BNI">Bank BNI</option>
                        <option value="Bank Jatim">Bank Jatim</option>
                      </select>
                    </div>
                  )}

                  {metodeTarik !== "tunai" ? (
                    <div className="dsh__field">
                      <label className="dsh__label">
                        {metodeTarik === "ewallet"
                          ? `Nomor HP ${provider}`
                          : `Nomor Rekening ${provider}`}
                      </label>
                      <input
                        type="text"
                        required
                        className="dsh__input"
                        value={nomorTujuan}
                        onChange={(e) => setNomorTujuan(e.target.value)}
                        placeholder={
                          metodeTarik === "ewallet"
                            ? "081234567890"
                            : "7182930412"
                        }
                      />
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#5c5546",
                        background: "#f7f6f1",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #e5e3dc",
                      }}
                    >
                      Penarikan tunai memerlukan validasi dari Petugas Jaga saat penyerahan uang di meja pelayanan.
                    </p>
                  )}

                  <div className="dsh__field">
                    <label className="dsh__label">
                      Nominal Penarikan (Minimal {rp(MINIMAL_PENARIKAN_RP)})
                    </label>
                    <input
                      type="number"
                      min={MINIMAL_PENARIKAN_RP}
                      max={Math.max(MINIMAL_PENARIKAN_RP, ringkasan.saldoTersedia)}
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
                        marginTop: "4px",
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
                            borderRadius: "6px",
                            border:
                              nominalTarik === nom
                                ? "1px solid #17140f"
                                : "1px solid #dcdad3",
                            background:
                              nominalTarik === nom ? "#17140f" : "#ffffff",
                            color: nominalTarik === nom ? "#ffffff" : "#4a4436",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {rp(nom)}
                        </button>
                      ))}
                      {ringkasan.saldoTersedia >= MINIMAL_PENARIKAN_RP && (
                        <button
                          type="button"
                          onClick={() => setNominalTarik(ringkasan.saldoTersedia)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #2f7d3a",
                            background: "#eaf5eb",
                            color: "#276b30",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Semua ({rp(ringkasan.saldoTersedia)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="dsh__field">
                    <label className="dsh__label">Catatan (Opsional)</label>
                    <input
                      type="text"
                      className="dsh__input"
                      value={catatanTarik}
                      onChange={(e) => setCatatanTarik(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="dsh__btn" style={{ width: "100%" }}>
                    {metodeTarik === "tunai"
                      ? `Ajukan Tarik Tunai ${rp(nominalTarik)}`
                      : `Cairkan ${rp(nominalTarik)} ke ${provider}`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          3. NAVIGASI TAMPILAN BERANDA (RINGKASAN vs BUKU TABUNGAN FISIK)
         ============================================================== */}
      <div className="dsh__filtertabs no-print" style={{ margin: "20px 0 16px 0" }} role="tablist">
        <button
          type="button"
          className="dsh__filtertab"
          data-active={tabTampilan === "ringkasan"}
          onClick={() => setTabTampilan("ringkasan")}
          role="tab"
          aria-selected={tabTampilan === "ringkasan"}
        >
          Ringkasan Mutasi &amp; Kalkulator
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={tabTampilan === "buku_tabungan"}
          onClick={() => setTabTampilan("buku_tabungan")}
          role="tab"
          aria-selected={tabTampilan === "buku_tabungan"}
        >
          📖 Lembar Tabungan Nasabah
        </button>
      </div>

      {tabTampilan === "buku_tabungan" ? (
        <section aria-label="Lembar Tabungan Nasabah">
          <LembarBukuTabungan
            nomorNasabahProp={nomorNasabah}
            namaNasabahProp={namaLengkap}
            prodiFakultasProp={
              sesi?.fakultas
                ? sesi.kategori === "umum"
                  ? "Masyarakat Umum"
                  : `${sesi.fakultas}${sesi.prodi ? ` (${sesi.prodi})` : ""}`
                : nasabahData.fakultas
            }
            showToolbar={true}
          />
        </section>
      ) : (
        <>
          {/* Split Ringkasan: 3 Aktivitas Terakhir + Kalkulator Pintar */}
          <div className="dsh__split">
          {/* Panel Kiri: Hanya 3 Aktivitas Terakhir + Tombol Lihat Lengkap */}
          <section className="dsh__card" aria-label="Aktivitas Terakhir">
            <div className="dsh__cardhead">
              <div>
                <h2 className="dsh__h2">Aktivitas Terakhir</h2>
                <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
                  3 mutasi terbaru pada dompet tabungan Anda.
                </p>
              </div>
              <span className="dsh__meta">{semuaAktivitas.length} total transaksi</span>
            </div>

            <div className="dsh__rows">
              {aktivitasRingkas.map((m) => (
                <div key={m.uid} className="dsh__row">
                  <div className="dsh__rowmain">
                    <strong>{m.judul}</strong>
                    <span className="dsh__subtext">
                      {m.sub} · {m.statusLabel}
                    </span>
                  </div>

                  <div className="dsh__rowval">
                    <b
                      className={
                        m.isPending
                          ? "dsh__amber"
                          : m.tipe === "masuk"
                          ? "dsh__green"
                          : ""
                      }
                    >
                      {m.tipe === "masuk" ? "+" : "-"}
                      {rp(m.nominal)}
                    </b>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="dsh__expandbtn"
                style={{ flex: 1, textAlign: "center" }}
                onClick={() => setTabTampilan("buku_tabungan")}
              >
                Buka Lembar Buku Tabungan Asli 📖
              </button>
              <Link
                href="/nasabah/riwayat"
                className="dsh__expandbtn"
                style={{ flex: 1, textAlign: "center" }}
              >
                Semua Riwayat ({semuaAktivitas.length}) →
              </Link>
            </div>
          </section>

          {/* Panel Kanan: Kalkulator Pintar Ringkas */}
          <section className="dsh__card" aria-label="Kalkulator Pintar">
            <div className="dsh__cardhead">
              <div>
                <h2 className="dsh__h2">Kalkulator Setoran</h2>
                <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
                  Simulasi nilai timbangan sampah (kg atau gram).
                </p>
              </div>
              <Link href="/nasabah/kalkulator" className="dsh__more">
                Lihat Daftar Harga →
              </Link>
            </div>

            <KalkulatorPintar mode="nasabah" />
          </section>
        </div>

        {/* Section Alur Pengepul & Bagi Hasil */}
        <section className="dsh__card" aria-label="Alur Penjualan Pengepul & Bagi Hasil" style={{ marginTop: "24px" }}>
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Alur Penjualan Pengepul & Bagi Hasil</h2>
              <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
                Transparansi 4 tahapan alur penyaluran dana dan perhitungan proporsional hak nasabah dari mitra pengepul.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="dsh__chip dsh__chip--green">Akad Wadiah Syariah</span>
              <Link href="/nasabah/pengepul" className="dsh__more">
                Buka Halaman Lengkap →
              </Link>
            </div>
          </div>

          {/* 4 Tahapan Pipeline */}
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
              <p>Bendahara menerima pembayaran dan sistem membagi proporsi hak nasabah.</p>
            </div>
            <div className="dsh__pipelinearrow">→</div>
            <div className="dsh__pipelinestep dsh__pipelinestep--active">
              <span className="dsh__stepbadge">Tahap 4</span>
              <strong>Disalurkan ke Nasabah</strong>
              <p>Uang otomatis disalurkan ke saldo nasabah, siap ditarik tunai/transfer.</p>
            </div>
          </div>

          {/* Transparansi Rumus */}
          <div
            style={{
              background: "#fdf8ee",
              border: "1px solid #ebd9b5",
              borderRadius: "6px",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#774a06",
              marginTop: "16px",
              lineHeight: 1.5,
            }}
          >
            <strong>Transparansi Rumus Bagi Hasil Proporsional (FR-033 & BR-017):</strong>
            <p style={{ margin: "4px 0 0 0" }}>
              Pendapatan nasabah tidak dipatok di awal, melainkan dihitung otomatis secara adil saat uang penjualan dari pengepul diterima:
              <br />
              <code style={{ background: "#f3e7cf", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginTop: "4px" }}>
                Hak Nasabah = (Berat Setoran Nasabah / Total Berat Batch) × Total Dana Alokasi Nasabah
              </code>
            </p>
          </div>

          {/* Realisasi Batch Pengepul Terkini */}
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "#17140f" }}>
              Realisasi Penjualan ke Pengepul Terkini
            </h3>
            <div className="dsh__list">
              {BATCH_PENGEPUL_AWAL.map((b) => (
                <div key={b.id} className="dsh__item" style={{ padding: "10px 12px" }}>
                  <div>
                    <strong>{b.nomorBatch}</strong> — {b.tanggalJual}
                    <span className="dsh__subtext">
                      Mitra: {b.namaPengepul} • Tonase: {kg(b.totalBeratKg)} • Diterima: {rp(b.uangDiterima ?? 0)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="dsh__chip dsh__chip--green" style={{ display: "inline-block", marginBottom: "3px" }}>
                      Hak Nasabah: +{rp(b.totalDisalurkan ?? 0)}
                    </span>
                    <span className="dsh__subtext">Kas Operasional BSS: +{rp(b.selisihKasBss ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </>
      )}
    </div>
  );
}
