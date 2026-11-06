"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sesiSekarang, type Sesi } from "../../lib/auth";
import {
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

export default function DashboardNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sembunyiSaldo, setSembunyiSaldo] = useState(false);
  const [setoranList, setSetoranList] = useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [penarikanList, setPenarikanList] = useState<PenarikanUang[]>([]);

  // State Modal / Panel Tarik Saldo ala E-Wallet
  const [bukaModalTarik, setBukaModalTarik] = useState(false);
  const [metodeTarik, setMetodeTarik] = useState<MetodePenarikan>("ewallet");
  const [provider, setProvider] = useState<string>("DANA");
  const [nomorTujuan, setNomorTujuan] = useState<string>("081234567890");
  const [nominalTarik, setNominalTarik] = useState<number>(10000);
  const [catatanTarik, setCatatanTarik] = useState<string>("Pencairan saldo BSS Pay");
  const [errorTarik, setErrorTarik] = useState<string>("");
  const [strukBerhasil, setStrukBerhasil] = useState<PenarikanUang | null>(null);

  // State tab mutasi di beranda e-wallet
  const [tabMutasi, setTabMutasi] = useState<"semua" | "masuk" | "keluar">("semua");

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
      catatan: catatanTarik || "Penarikan saldo dompet BSS",
      status: isTunai ? "menunggu" : "selesai",
      petugas: isTunai
        ? "Menunggu Validasi Petugas Jaga"
        : metodeTarik === "ewallet"
        ? `Otomatis via ${provider}`
        : `Otomatis Transfer ${provider}`,
    });

    muatUlangData();
    setStrukBerhasil(trxBaru);
  };

  // Gabungan mutasi masuk (setoran) dan keluar (penarikan) ala E-Wallet
  const daftarMutasi = [
    ...ringkasan.semuaSetoran.map((s) => ({
      uid: `in-${s.id}`,
      id: s.id,
      tipe: "masuk" as const,
      judul: `Setor ${s.jenisSampahNama}`,
      sub: `${s.tanggal} • ${s.jumlahSatuan || kg(s.beratKg)} • ${s.dicatatOleh}`,
      nominal: s.nilaiRealisasi ?? s.estimasiNilai,
      status:
        s.statusVerifikasi === "menunggu_verifikasi"
          ? ("menunggu_verifikasi" as const)
          : ("terverifikasi" as const),
      badge:
        s.statusVerifikasi === "menunggu_verifikasi"
          ? "⏳ Menunggu Verifikasi Petugas"
          : "✓ Saldo Masuk (Terverifikasi)",
    })),
    ...(mounted ? penarikanList.filter((p) => p.nomorNasabah === nomorNasabah) : []).map(
      (p) => ({
        uid: `out-${p.id}`,
        id: p.id,
        tipe: "keluar" as const,
        judul:
          p.metode === "tunai"
            ? "Tarik Tunai di Pos Jaga"
            : p.metode === "ewallet"
            ? `Top Up E-Wallet (${p.tujuan || "E-Wallet"})`
            : `Transfer Bank (${p.tujuan || "Rekening Bank"})`,
        sub: `${p.tanggal} • ${p.petugas}`,
        nominal: p.nominal,
        status: p.status === "menunggu" ? ("menunggu_validasi" as const) : ("selesai" as const),
        badge:
          p.status === "menunggu"
            ? "⏳ Menunggu Validasi Petugas"
            : "✓ Pencairan Berhasil",
      })
    ),
  ].filter((m) => {
    if (tabMutasi === "masuk") return m.tipe === "masuk";
    if (tabMutasi === "keluar") return m.tipe === "keluar";
    return true;
  });

  return (
    <div className="dsh__page">
      {/* ==============================================================
          1. HERO DOMPET DIGITAL (E-WALLET CARD BSS PAY)
         ============================================================== */}
      <section
        aria-label="Dompet Digital BSS Pay"
        style={{
          background:
            "linear-gradient(135deg, #133b1d 0%, #1d592b 58%, #266d36 100%)",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "clamp(20px, 3.2vw, 30px)",
          boxShadow: "0 16px 36px rgba(19, 59, 29, 0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ornamen Latar Belakang E-Wallet */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-40px",
            top: "-50px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "60px",
            bottom: "-70px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(235, 187, 94, 0.1)",
            pointerEvents: "none",
          }}
        />

        {/* Bar Atas Kartu E-Wallet */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(6px)",
                padding: "5px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.03em",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              💳 BSS Pay • Wadiah Wallet
            </span>
            <span style={{ fontSize: "13px", opacity: 0.85 }}>
              ID: <strong>{nomorNasabah}</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "rgba(235, 187, 94, 0.2)",
                border: "1px solid rgba(235, 187, 94, 0.45)",
                color: "#ffe29a",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              🌱 {kg(ringkasan.totalBeratTerverifikasiKg)} Sampah Terverifikasi
            </span>
          </div>
        </div>

        {/* Saldo Utama E-Wallet */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.82)",
                  fontWeight: 500,
                }}
              >
                Saldo Aktif Tersedia ({namaLengkap})
              </span>
              <button
                type="button"
                onClick={() => setSembunyiSaldo(!sembunyiSaldo)}
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                aria-label="Sembunyikan atau tampilkan saldo"
              >
                {sembunyiSaldo ? "👁️ Lihat" : "🙈 Tutup"}
              </button>
            </div>

            <div
              style={{
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sembunyiSaldo ? "Rp ••••••••" : rp(ringkasan.saldoTersedia)}
            </div>

            {/* Info Tambahan di Bawah Saldo */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "10px",
                fontSize: "12px",
              }}
            >
              {ringkasan.totalMenungguVerifikasiRp > 0 && (
                <span
                  style={{
                    background: "rgba(255, 193, 7, 0.2)",
                    color: "#ffe082",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  ⏳ +{rp(ringkasan.totalMenungguVerifikasiRp)} menunggu verifikasi petugas
                </span>
              )}
              {ringkasan.totalDitarikMenunggu > 0 && (
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.16)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  💵 {rp(ringkasan.totalDitarikMenunggu)} tunai menunggu validasi petugas
                </span>
              )}
              <span style={{ opacity: 0.85, alignSelf: "center" }}>
                Min. penarikan <strong>{rp(MINIMAL_PENARIKAN_RP)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* BAR AKSI CEPAT E-WALLET (QUICK ACTION DOCK) */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.96)",
            color: "#1c1a15",
            borderRadius: "14px",
            padding: "14px 12px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
            gap: "10px",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
          }}
        >
          <button
            type="button"
            onClick={() => bukaQuickAction("ewallet")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "#f4fbf5",
              border: "1px solid #cde6d1",
              borderRadius: "10px",
              padding: "10px 8px",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#25632d",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              📱
            </span>
            <strong style={{ fontSize: "12.5px", color: "#173f1c" }}>
              Ke E-Wallet
            </strong>
            <span style={{ fontSize: "10.5px", color: "#5e6b60" }}>
              DANA, GoPay, OVO
            </span>
          </button>

          <button
            type="button"
            onClick={() => bukaQuickAction("bank")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "#f4fbf5",
              border: "1px solid #cde6d1",
              borderRadius: "10px",
              padding: "10px 8px",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#1d4ed8",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              🏦
            </span>
            <strong style={{ fontSize: "12.5px", color: "#1e3a8a" }}>
              Transfer Bank
            </strong>
            <span style={{ fontSize: "10.5px", color: "#5e6b60" }}>
              BSI, BRI, Mandiri, BCA
            </span>
          </button>

          <button
            type="button"
            onClick={() => bukaQuickAction("tunai")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "#fffaf0",
              border: "1px solid #ebd5a7",
              borderRadius: "10px",
              padding: "10px 8px",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#b4690e",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              💵
            </span>
            <strong style={{ fontSize: "12.5px", color: "#7c4706" }}>
              Tarik Tunai
            </strong>
            <span style={{ fontSize: "10.5px", color: "#7a6646" }}>
              Validasi Petugas Jaga
            </span>
          </button>

          <Link
            href="/nasabah/kalkulator"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "#faf9f5",
              border: "1px solid #e3ded1",
              borderRadius: "10px",
              padding: "10px 8px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#3d3930",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              ⚖️
            </span>
            <strong style={{ fontSize: "12.5px", color: "#2b2821" }}>
              Simulasi Setor
            </strong>
            <span style={{ fontSize: "10.5px", color: "#6d675c" }}>
              Satuan / Kiloan
            </span>
          </Link>

          <Link
            href="/nasabah/riwayat"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "#faf9f5",
              border: "1px solid #e3ded1",
              borderRadius: "10px",
              padding: "10px 8px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background: "#524c40",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
              }}
            >
              📜
            </span>
            <strong style={{ fontSize: "12.5px", color: "#2b2821" }}>
              Riwayat & Struk
            </strong>
            <span style={{ fontSize: "10.5px", color: "#6d675c" }}>
              Cetak Buku Tabungan
            </span>
          </Link>
        </div>
      </section>

      {/* ==============================================================
          2. MODAL / DRAWER PENCAIRAN SALDO E-WALLET (MUNCUL SAAT DIKLIK)
         ============================================================== */}
      {bukaModalTarik && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 17, 0.65)",
            backdropFilter: "blur(4px)",
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
              borderRadius: "18px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.28)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {strukBerhasil ? (
              /* TAMPILAN STRUK E-WALLET SETELAH BERHASIL */
              <div style={{ textAlign: "center", padding: "8px 4px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background:
                      strukBerhasil.status === "selesai" ? "#e6f6e8" : "#fff4db",
                    color:
                      strukBerhasil.status === "selesai" ? "#1e6b27" : "#b26a00",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "28px",
                    margin: "0 auto 14px",
                  }}
                >
                  {strukBerhasil.status === "selesai" ? "✓" : "⏳"}
                </div>

                <span
                  className={`dsh__chip ${
                    strukBerhasil.status === "selesai"
                      ? "dsh__chip--green"
                      : "dsh__chip--amber"
                  }`}
                >
                  {strukBerhasil.status === "selesai"
                    ? "Pencairan Otomatis Berhasil"
                    : "Menunggu Validasi Petugas Jaga"}
                </span>

                <h3
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    margin: "10px 0 4px",
                    color: "#1b1915",
                  }}
                >
                  {rp(strukBerhasil.nominal)}
                </h3>
                <p style={{ fontSize: "13px", color: "#666", margin: "0 0 18px" }}>
                  No. Referensi: <strong>{strukBerhasil.id}</strong> •{" "}
                  {strukBerhasil.tanggal}
                </p>

                <div
                  style={{
                    background: "#f8f7f3",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "13px",
                    display: "grid",
                    gap: "8px",
                    marginBottom: "18px",
                    border: "1px dashed #d5d0c3",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Metode Pencairan</span>
                    <strong>{formatMetodePenarikan(strukBerhasil.metode)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Tujuan</span>
                    <strong>{strukBerhasil.tujuan}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Validator / Sistem</span>
                    <strong>{strukBerhasil.petugas}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666" }}>Sisa Saldo Aktif</span>
                    <strong style={{ color: "#25632d" }}>
                      {rp(ringkasan.saldoTersedia)}
                    </strong>
                  </div>
                </div>

                {strukBerhasil.metode === "tunai" && (
                  <p
                    style={{
                      fontSize: "12.5px",
                      background: "#fff9eb",
                      color: "#855200",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    Tunjukkan kode <strong>{strukBerhasil.id}</strong> ini kepada{" "}
                    <strong>Petugas Jaga</strong> di meja pelayanan untuk divalidasi
                    dan menerima uang tunai.
                  </p>
                )}

                <button
                  type="button"
                  className="dsh__btn"
                  style={{ width: "100%", borderRadius: "10px", padding: "12px" }}
                  onClick={() => {
                    setStrukBerhasil(null);
                    setBukaModalTarik(false);
                  }}
                >
                  Selesai & Kembali ke Dompet
                </button>
              </div>
            ) : (
              /* FORM TARIK SALDO E-WALLET */
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span className="dsh__tagbadge">BSS Pay Instant</span>
                    <h3 style={{ margin: "4px 0 0", fontSize: "19px" }}>
                      {metodeTarik === "ewallet"
                        ? "📱 Cairkan ke Saldo E-Wallet"
                        : metodeTarik === "bank"
                        ? "🏦 Transfer ke Rekening Bank"
                        : "💵 Tarik Tunai di Pos Jaga"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBukaModalTarik(false)}
                    style={{
                      background: "#f2efe8",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Tab Ganti Metode di Dalam Modal */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "6px",
                    background: "#f4f2ec",
                    padding: "4px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  {(
                    [
                      { id: "ewallet", label: "📱 E-Wallet" },
                      { id: "bank", label: "🏦 Bank" },
                      { id: "tunai", label: "💵 Tunai" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => bukaQuickAction(m.id)}
                      style={{
                        padding: "8px 6px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background:
                          metodeTarik === m.id ? "#25632d" : "transparent",
                        color: metodeTarik === m.id ? "#fff" : "#555",
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Info Saldo Tersedia */}
                <div
                  style={{
                    background: "#f2f9f3",
                    border: "1px solid #cce5d0",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    fontSize: "13px",
                  }}
                >
                  <span>Saldo Aktif Bisa Ditarik:</span>
                  <strong style={{ color: "#1c5e24", fontSize: "15px" }}>
                    {rp(ringkasan.saldoTersedia)}
                  </strong>
                </div>

                {errorTarik && (
                  <div
                    style={{
                      background: "#fff2f2",
                      border: "1px solid #f5bcbc",
                      color: "#9b1c1c",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      marginBottom: "14px",
                    }}
                  >
                    {errorTarik}
                  </div>
                )}

                <form onSubmit={handleProsesTarik} className="dsh__form">
                  {/* Pilihan Provider E-Wallet / Bank dengan Pill Button */}
                  {metodeTarik === "ewallet" && (
                    <div className="dsh__field">
                      <label className="dsh__label">Pilih Dompet E-Wallet</label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
                        }}
                      >
                        {["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"].map(
                          (ew) => (
                            <button
                              key={ew}
                              type="button"
                              onClick={() => setProvider(ew)}
                              style={{
                                padding: "8px",
                                borderRadius: "8px",
                                border:
                                  provider === ew
                                    ? "2px solid #25632d"
                                    : "1px solid #dcd7cc",
                                background:
                                  provider === ew ? "#edf8ef" : "#ffffff",
                                fontWeight: 700,
                                fontSize: "12.5px",
                                cursor: "pointer",
                                color: "#1f1d18",
                              }}
                            >
                              {ew}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {metodeTarik === "bank" && (
                    <div className="dsh__field">
                      <label className="dsh__label">Pilih Bank Tujuan</label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
                        }}
                      >
                        {[
                          "Bank BSI",
                          "Bank Mandiri",
                          "Bank BRI",
                          "Bank BCA",
                          "Bank BNI",
                          "Bank Jatim",
                        ].map((bk) => (
                          <button
                            key={bk}
                            type="button"
                            onClick={() => setProvider(bk)}
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border:
                                provider === bk
                                  ? "2px solid #25632d"
                                  : "1px solid #dcd7cc",
                              background:
                                provider === bk ? "#edf8ef" : "#ffffff",
                              fontWeight: 700,
                              fontSize: "12px",
                              cursor: "pointer",
                              color: "#1f1d18",
                            }}
                          >
                            {bk}
                          </button>
                        ))}
                      </div>
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
                            ? "Contoh: 081234567890"
                            : "Contoh: 7182930412"
                        }
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#fffaf0",
                        border: "1px solid #ebd5a7",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        fontSize: "12.5px",
                        color: "#7a520b",
                      }}
                    >
                      ℹ️ Untuk <strong>Tarik Tunai</strong>, pengajuan Anda akan
                      berstatus <strong>Menunggu Validasi Petugas Jaga</strong>{" "}
                      sampai uang tunai diserahkan di meja pelayanan.
                    </div>
                  )}

                  {/* Nominal Penarikan */}
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
                      style={{ fontSize: "18px", fontWeight: 700 }}
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
                            padding: "5px 10px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border:
                              nominalTarik === nom
                                ? "1.5px solid #25632d"
                                : "1px solid #d5d0c4",
                            background:
                              nominalTarik === nom ? "#e8f5ea" : "#faf9f5",
                            color: nominalTarik === nom ? "#1b4d21" : "#555",
                            fontWeight: 700,
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
                            padding: "5px 10px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #25632d",
                            background: "#25632d",
                            color: "#fff",
                            fontWeight: 700,
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

                  <button
                    type="submit"
                    className="dsh__btn"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "14px",
                      borderRadius: "10px",
                    }}
                  >
                    {metodeTarik === "tunai"
                      ? `Buat Tiket Tarik Tunai ${rp(nominalTarik)}`
                      : `Kirim ${rp(nominalTarik)} ke ${provider} Sekarang`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          3. BAWAH: MUTASI DOMPET DIGITAL (CASHFLOW) & KALKULATOR
         ============================================================== */}
      <div className="dsh__split">
        {/* Panel Kiri: Mutasi Dompet (Uang Masuk & Uang Keluar ala E-Wallet) */}
        <section className="dsh__card" aria-label="Mutasi Dompet BSS Pay">
          <div className="dsh__cardhead" style={{ alignItems: "center" }}>
            <div>
              <h2 className="dsh__h2">Aktivitas & Mutasi Dompet</h2>
              <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
                Riwayat saldo masuk dari verifikasi sampah & penarikan saldo.
              </p>
            </div>
            <Link href="/nasabah/riwayat" className="dsh__more">
              Semua Mutasi →
            </Link>
          </div>

          {/* Filter Pill E-Wallet: Semua / Saldo Masuk / Saldo Keluar */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(
              [
                { id: "semua", label: "Semua Aktivitas" },
                { id: "masuk", label: "↓ Saldo Masuk (Setor)" },
                { id: "keluar", label: "↑ Saldo Keluar (Tarik)" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabMutasi(t.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border:
                    tabMutasi === t.id
                      ? "1px solid #25632d"
                      : "1px solid #dedad0",
                  background: tabMutasi === t.id ? "#25632d" : "#faf9f5",
                  color: tabMutasi === t.id ? "#ffffff" : "#5c574d",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="dsh__rows">
            {daftarMutasi.slice(0, 6).map((m) => {
              const isMasuk = m.tipe === "masuk";
              const isPending =
                m.status === "menunggu_verifikasi" ||
                m.status === "menunggu_validasi";
              return (
                <div
                  key={m.uid}
                  className="dsh__row"
                  style={{
                    borderBottom: "1px solid #f0ede6",
                    paddingBlock: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: isPending
                          ? "#fff4db"
                          : isMasuk
                          ? "#e7f6e9"
                          : "#f3f0e8",
                        color: isPending
                          ? "#b26a00"
                          : isMasuk
                          ? "#1e6b27"
                          : "#443f35",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "17px",
                        flexShrink: 0,
                        fontWeight: 800,
                      }}
                    >
                      {isMasuk ? "↓" : "↑"}
                    </span>
                    <div className="dsh__rowmain">
                      <strong>{m.judul}</strong>
                      <span className="dsh__subtext">{m.sub}</span>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          className={`dsh__chip ${
                            isPending ? "dsh__chip--amber" : "dsh__chip--green"
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dsh__rowval">
                    <b
                      style={{
                        fontSize: "15px",
                        color: isPending
                          ? "#b26a00"
                          : isMasuk
                          ? "#1f6e29"
                          : "#2b261f",
                      }}
                    >
                      {isMasuk ? "+" : "-"}
                      {rp(m.nominal)}
                    </b>
                    <small style={{ fontSize: "11px", color: "#888" }}>
                      {m.id}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Panel Kanan: Kalkulator Pintar */}
        <section className="dsh__card" aria-label="Kalkulator Pintar">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Simulasi Top-Up Sampah</h2>
              <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
                Hitung berapa tambahan saldo E-Wallet dari sampah kiloan, gram, atau satuan (pcs) Anda.
              </p>
            </div>
            <span className="dsh__tagbadge">Kalkulator BSS</span>
          </div>

          <KalkulatorPintar mode="nasabah" />
        </section>
      </div>
    </div>
  );
}
