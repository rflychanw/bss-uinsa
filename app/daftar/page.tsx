"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import { beranda, daftar, sesiSekarang } from "../../lib/auth";
import {
  konversiGambarKeWebp,
  type HasilKonversiWebp,
} from "../../lib/imageUtils";

type Sukses = {
  nama: string;
  email: string;
  nomor: string;
  metode: MetodeBayar;
  namaFileBayar?: string;
  buktiUrlBayar?: string;
  namaFileBss?: string;
  buktiUrlBss?: string;
  namaFileLab?: string;
  buktiUrlLab?: string;
  tanggalUpload?: string;
};
type MetodeBayar = "qris" | "va" | "tunai";

export default function DaftarPage() {
  const router = useRouter();

  // Input refs untuk ketiga upload
  const fileBayarRef = useRef<HTMLInputElement>(null);
  const fileBssRef = useRef<HTMLInputElement>(null);
  const fileLabRef = useRef<HTMLInputElement>(null);

  const [tahap, setTahap] = useState<"formulir" | "pembayaran" | "berhasil">("formulir");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");

  const [metode, setMetode] = useState<MetodeBayar>("qris");

  // State untuk bukti pembayaran / struk transfer
  const [buktiBayar, setBuktiBayar] = useState<HasilKonversiWebp | null>(null);
  const [isDraggingBayar, setIsDraggingBayar] = useState(false);
  const [isConvertingBayar, setIsConvertingBayar] = useState(false);

  // State untuk bukti follow IG Bank Sampah Syariah
  const [buktiBss, setBuktiBss] = useState<HasilKonversiWebp | null>(null);
  const [isDraggingBss, setIsDraggingBss] = useState(false);
  const [isConvertingBss, setIsConvertingBss] = useState(false);

  // State untuk bukti follow IG Lab FEBI
  const [buktiLab, setBuktiLab] = useState<HasilKonversiWebp | null>(null);
  const [isDraggingLab, setIsDraggingLab] = useState(false);
  const [isConvertingLab, setIsConvertingLab] = useState(false);

  // State copy VA
  const [salinVa, setSalinVa] = useState(false);

  const [pesanBayar, setPesanBayar] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi) router.replace(beranda(sesi.role));
  }, [router]);

  const onLanjutPembayaran = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");

    if (!nama.trim()) {
      setPesan("Nama lengkap wajib diisi.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setPesan("Email tidak valid.");
      return;
    }
    if (sandi.length < 8) {
      setPesan("Kata sandi minimal 8 karakter.");
      return;
    }
    if (sandi !== ulangi) {
      setPesan("Ulangi kata sandi belum sama.");
      return;
    }

    setTahap("pembayaran");
  };

  // Proses berkas bukti Pembayaran / Transfer
  const prosesBerkasBayar = async (file: File) => {
    setPesanBayar("");
    if (!file.type.startsWith("image/")) {
      setPesanBayar("Format bukti pembayaran harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    setIsConvertingBayar(true);
    try {
      const hasil = await konversiGambarKeWebp(file, "bukti-bayar");
      setBuktiBayar(hasil);
    } catch (err) {
      setPesanBayar(
        err instanceof Error ? err.message : "Gagal memproses gambar bukti bayar."
      );
    } finally {
      setIsConvertingBayar(false);
    }
  };

  const hapusBerkasBayar = () => {
    setBuktiBayar(null);
    if (fileBayarRef.current) fileBayarRef.current.value = "";
  };

  // Proses berkas bukti Follow BSS
  const prosesBerkasBss = async (file: File) => {
    setPesanBayar("");
    if (!file.type.startsWith("image/")) {
      setPesanBayar("Format screenshot follow BSS harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    setIsConvertingBss(true);
    try {
      const hasil = await konversiGambarKeWebp(file, "follow-bss");
      setBuktiBss(hasil);
    } catch (err) {
      setPesanBayar(
        err instanceof Error ? err.message : "Gagal memproses gambar follow BSS."
      );
    } finally {
      setIsConvertingBss(false);
    }
  };

  const hapusBerkasBss = () => {
    setBuktiBss(null);
    if (fileBssRef.current) fileBssRef.current.value = "";
  };

  // Proses berkas bukti Follow Lab FEBI
  const prosesBerkasLab = async (file: File) => {
    setPesanBayar("");
    if (!file.type.startsWith("image/")) {
      setPesanBayar("Format screenshot follow Lab FEBI harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    setIsConvertingLab(true);
    try {
      const hasil = await konversiGambarKeWebp(file, "follow-lab-febi");
      setBuktiLab(hasil);
    } catch (err) {
      setPesanBayar(
        err instanceof Error ? err.message : "Gagal memproses gambar follow Lab FEBI."
      );
    } finally {
      setIsConvertingLab(false);
    }
  };

  const hapusBerkasLab = () => {
    setBuktiLab(null);
    if (fileLabRef.current) fileLabRef.current.value = "";
  };

  const handleSalinVa = async () => {
    const nomor = "992830822144099";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(nomor);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = nomor;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setSalinVa(true);
      setTimeout(() => setSalinVa(false), 2200);
    } catch {
      setSalinVa(true);
      setTimeout(() => setSalinVa(false), 2200);
    }
  };

  const onKonfirmasiPembayaran = () => {
    setPesanBayar("");

    // Verifikasi bukti bayar untuk metode non-tunai
    if (metode !== "tunai" && !buktiBayar) {
      setPesanBayar(
        "Harap unggah bukti pembayaran / struk transfer sebelum melanjutkan."
      );
      return;
    }

    // Verifikasi bukti screenshot follow IG
    if (!buktiBss) {
      setPesanBayar(
        "Harap unggah screenshot bukti follow Instagram Bank Sampah Syariah (@bss_uinsa)."
      );
      return;
    }

    if (!buktiLab) {
      setPesanBayar(
        "Harap unggah screenshot bukti follow Instagram Laboratorium FEBI UINSA."
      );
      return;
    }

    const hasil = daftar({
      nama,
      email,
      sandi,
      kategori: "umum",
      fakultas: "Umum",
      buktiBayar: buktiBayar?.dataUrl || buktiBss.dataUrl,
      namaFileBukti: buktiBayar?.namaFile || buktiBss.namaFile,
      buktiFollowBss: buktiBss.dataUrl,
      namaFileBuktiBss: buktiBss.namaFile,
      buktiFollowLab: buktiLab.dataUrl,
      namaFileBuktiLab: buktiLab.namaFile,
      tanggalUploadBukti: buktiBayar?.tanggalUpload || buktiBss.tanggalUpload,
      metodeBayar: metode,
      statusVerifikasi: "menunggu",
    });

    if (!hasil.ok) {
      setPesan(hasil.pesan);
      setTahap("formulir");
      return;
    }

    setSukses({
      nama,
      email,
      nomor: hasil.nomor,
      metode,
      namaFileBayar: buktiBayar?.namaFile,
      buktiUrlBayar: buktiBayar?.dataUrl,
      namaFileBss: buktiBss.namaFile,
      buktiUrlBss: buktiBss.dataUrl,
      namaFileLab: buktiLab.namaFile,
      buktiUrlLab: buktiLab.dataUrl,
      tanggalUpload: buktiBayar?.tanggalUpload || buktiBss.tanggalUpload,
    });

    router.push(
      `/masuk?verifikasi=sukses&nomor=${encodeURIComponent(
        hasil.nomor
      )}&email=${encodeURIComponent(hasil.email)}`
    );
  };

  /* ------------------------------------------------ TAHAP 3: SELESAI / AKUN TERDAFTAR */
  if (tahap === "berhasil" && sukses) {
    const labelMetode =
      sukses.metode === "qris"
        ? "QRIS BSS UINSA"
        : sukses.metode === "va"
        ? "Virtual Account BSI"
        : "Tunai di Meja Timbang";

    return (
      <AuthShell
        judul="Pendaftaran Berhasil Dikirim"
        sub="Bukti pembayaran dan screenshot follow Instagram BSS & Lab FEBI telah diterima dan terkirim ke antrean verifikasi petugas."
        catatan="Status keanggotaan aktif seumur hidup setelah disetujui oleh sekretariat BSS UINSA."
      >
        <div className="auth__done">
          <div
            style={{
              padding: "12px 16px",
              background: "#edf7ee",
              border: "1px solid #c2e2c5",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#27632e",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ✓ Bukti Pendaftaran & Pembayaran Berhasil Dikirim
          </div>

          <dl className="auth__donelist">
            <div>
              <dt>Nama Lengkap</dt>
              <dd>{sukses.nama}</dd>
            </div>
            <div>
              <dt>Nomor Nasabah</dt>
              <dd>
                <b>{sukses.nomor}</b>
              </dd>
            </div>
            <div>
              <dt>Email Akun</dt>
              <dd>{sukses.email}</dd>
            </div>
            <div>
              <dt>Metode Bayar</dt>
              <dd>{labelMetode}</dd>
            </div>
            {sukses.namaFileBayar && (
              <div>
                <dt>Bukti Bayar</dt>
                <dd>
                  <span style={{ color: "#25632d", fontWeight: 600 }}>
                    ✓ {sukses.namaFileBayar}
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt>Follow IG BSS</dt>
              <dd>
                <span style={{ color: "#25632d", fontWeight: 600 }}>
                  ✓ {sukses.namaFileBss}
                </span>
              </dd>
            </div>
            <div>
              <dt>Follow IG Lab FEBI</dt>
              <dd>
                <span style={{ color: "#25632d", fontWeight: 600 }}>
                  ✓ {sukses.namaFileLab}
                </span>
              </dd>
            </div>
            <div>
              <dt>Status Aktivasi</dt>
              <dd>
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  Menunggu Verifikasi Admin
                </span>
              </dd>
            </div>
          </dl>

          <a className="auth__btn" href="/masuk">
            Ke Halaman Masuk Akun
          </a>
        </div>
      </AuthShell>
    );
  }

  /* ------------------------------------------------ TAHAP 2: BUKTI PEMBAYARAN & FOLLOW INSTAGRAM */
  if (tahap === "pembayaran") {
    return (
      <AuthShell
        judul="Bukti Pembayaran & Syarat Pendaftaran"
        sub="Pilih metode pembayaran administrasi Rp 10.000, lampirkan bukti pembayaran serta screenshot follow Instagram Bank Sampah Syariah & Lab FEBI."
        catatan="Status keanggotaan aktif seumur hidup untuk pembukuan rekening wadiah digital."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Kotak Ringkasan Tagihan & Pendaftar */}
          <div
            style={{
              background: "#fbfaf7",
              border: "1px solid #e5e0d4",
              borderRadius: "8px",
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#736b5d",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                Tagihan Aktivasi Nasabah
              </span>
              <strong style={{ fontSize: "14px", color: "#221f19", display: "block" }}>
                {nama}
              </strong>
              <span style={{ fontSize: "12px", color: "#665f53", display: "block" }}>
                {email} • Nasabah Wadiah
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#25632d",
                  fontVariantNumeric: "tabular-nums",
                  display: "block",
                }}
              >
                Rp 10.000
              </span>
              <span style={{ fontSize: "11px", color: "#7a7469" }}>
                Biaya Sekali Bayar
              </span>
            </div>
          </div>

          {/* Pilihan Metode Bayar (QRIS, VA BSI, Tunai) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label className="auth__label">Pilih Metode Pembayaran</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setMetode("qris")}
                style={{
                  padding: "9px 6px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "qris" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "qris" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                QRIS BSS
              </button>
              <button
                type="button"
                onClick={() => setMetode("va")}
                style={{
                  padding: "9px 6px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "va" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "va" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                VA BSI
              </button>
              <button
                type="button"
                onClick={() => setMetode("tunai")}
                style={{
                  padding: "9px 6px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "tunai" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "tunai" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Tunai di Meja
              </button>
            </div>
          </div>

          {/* ======================= DUMMY QRIS ======================= */}
          {metode === "qris" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "10px",
                padding: "16px",
                background: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              {/* Header Kartu QRIS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "2px solid #e72424",
                  paddingBottom: "8px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "#e72424",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: "14px",
                      letterSpacing: "1px",
                      padding: "2px 8px",
                      borderRadius: "3px",
                    }}
                  >
                    QRIS
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>
                    STANDAR PEMBAYARAN NASIONAL
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#e72424",
                    border: "1px solid #e72424",
                    padding: "1px 6px",
                    borderRadius: "3px",
                  }}
                >
                  GPN
                </span>
              </div>

              {/* Info Merchant */}
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <strong style={{ display: "block", fontSize: "14px", color: "#1a1a1a" }}>
                  BANK SAMPAH SYARIAH FEBI UINSA
                </strong>
                <span style={{ fontSize: "11px", color: "#666", display: "block" }}>
                  NMID: ID1020261102998 • A01
                </span>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#25632d",
                    background: "#edf7ee",
                    padding: "2px 10px",
                    borderRadius: "12px",
                  }}
                >
                  Nominal: Rp 10.000
                </span>
              </div>

              {/* Tampilan Visual QR Code Dummy yang Realistis */}
              <div
                style={{
                  width: "190px",
                  height: "190px",
                  margin: "0 auto",
                  padding: "10px",
                  background: "#ffffff",
                  border: "2px solid #221f19",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg
                  width="170"
                  height="170"
                  viewBox="0 0 170 170"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="170" height="170" fill="#ffffff" />

                  {/* Corner Finder 1 (Top Left) */}
                  <rect x="10" y="10" width="42" height="42" fill="#1f1b13" rx="4" />
                  <rect x="17" y="17" width="28" height="28" fill="#ffffff" rx="2" />
                  <rect x="23" y="23" width="16" height="16" fill="#1f1b13" rx="1" />

                  {/* Corner Finder 2 (Top Right) */}
                  <rect x="118" y="10" width="42" height="42" fill="#1f1b13" rx="4" />
                  <rect x="125" y="17" width="28" height="28" fill="#ffffff" rx="2" />
                  <rect x="131" y="23" width="16" height="16" fill="#1f1b13" rx="1" />

                  {/* Corner Finder 3 (Bottom Left) */}
                  <rect x="10" y="118" width="42" height="42" fill="#1f1b13" rx="4" />
                  <rect x="17" y="125" width="28" height="28" fill="#ffffff" rx="2" />
                  <rect x="23" y="131" width="16" height="16" fill="#1f1b13" rx="1" />

                  {/* Timing patterns & Matrix Dots */}
                  <rect x="60" y="14" width="7" height="7" fill="#1f1b13" />
                  <rect x="74" y="14" width="7" height="7" fill="#1f1b13" />
                  <rect x="88" y="14" width="7" height="7" fill="#1f1b13" />
                  <rect x="102" y="14" width="7" height="7" fill="#1f1b13" />

                  <rect x="60" y="28" width="7" height="7" fill="#1f1b13" />
                  <rect x="74" y="35" width="7" height="7" fill="#1f1b13" />
                  <rect x="95" y="28" width="7" height="7" fill="#1f1b13" />

                  <rect x="14" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="28" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="42" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="56" y="60" width="7" height="7" fill="#1f1b13" />

                  <rect x="14" y="74" width="7" height="7" fill="#1f1b13" />
                  <rect x="28" y="88" width="7" height="7" fill="#1f1b13" />
                  <rect x="42" y="74" width="7" height="7" fill="#1f1b13" />

                  <rect x="102" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="116" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="137" y="60" width="7" height="7" fill="#1f1b13" />
                  <rect x="151" y="60" width="7" height="7" fill="#1f1b13" />

                  <rect x="60" y="102" width="7" height="7" fill="#1f1b13" />
                  <rect x="74" y="102" width="7" height="7" fill="#1f1b13" />
                  <rect x="88" y="102" width="7" height="7" fill="#1f1b13" />
                  <rect x="102" y="116" width="7" height="7" fill="#1f1b13" />

                  <rect x="118" y="118" width="12" height="12" fill="#1f1b13" />
                  <rect x="137" y="118" width="12" height="12" fill="#1f1b13" />
                  <rect x="118" y="137" width="12" height="12" fill="#1f1b13" />
                  <rect x="137" y="137" width="19" height="19" fill="#1f1b13" />

                  {/* Center Badge BSS */}
                  <circle cx="85" cy="85" r="16" fill="#ffffff" stroke="#25632d" strokeWidth="2" />
                  <path
                    d="M85 75L77 82V91C77 94 85 96 85 96C85 96 93 94 93 91V82L85 75Z"
                    fill="#25632d"
                  />
                  <path
                    d="M82 86L84.5 88.5L88.5 83.5"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Petunjuk QRIS */}
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <p style={{ fontSize: "11px", color: "#555", margin: 0, lineHeight: 1.4 }}>
                  Scan dengan <b>BSI Mobile, BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA</b>, atau m-Banking apa saja.
                </p>
                <span style={{ fontSize: "10px", color: "#888", display: "block", marginTop: "4px" }}>
                  Dicetak otomatis oleh Sistem Bank Sampah Syariah UINSA
                </span>
              </div>
            </div>
          )}

          {/* ======================= VA BSI DENGAN FITUR SALIN ======================= */}
          {metode === "va" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "8px",
                padding: "14px 16px",
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Bank Tujuan:</span>
                <strong style={{ fontSize: "13px", color: "#221f19" }}>
                  Bank Syariah Indonesia (BSI)
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f9f8f4",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #eae5d9",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#6e685d", display: "block" }}>
                    Nomor Virtual Account BSI:
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "#25632d",
                      letterSpacing: "0.5px",
                    }}
                  >
                    99283-0822144099
                  </span>
                </div>

                {/* Tombol Fitur Salin VA */}
                <button
                  type="button"
                  onClick={handleSalinVa}
                  style={{
                    background: salinVa ? "#25632d" : "#ffffff",
                    color: salinVa ? "#ffffff" : "#221f19",
                    border: `1px solid ${salinVa ? "#25632d" : "#c8c3b7"}`,
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                  title="Salin nomor Virtual Account ke clipboard"
                >
                  {salinVa ? "✓ Tersalin!" : "📋 Salin VA"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#666" }}>Atas Nama Rekening:</span>
                <span style={{ fontWeight: 600, color: "#333" }}>BSS FEBI UINSA</span>
              </div>
            </div>
          )}

          {metode === "tunai" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "8px",
                padding: "12px 16px",
                background: "#ffffff",
                fontSize: "12px",
                color: "#555",
                lineHeight: 1.5,
              }}
            >
              <strong>Bayar Tunai di Meja Timbang:</strong>
              <div style={{ marginTop: "2px", color: "#666" }}>
                Biaya administrasi Rp 10.000 dapat diserahkan langsung kepada Petugas Jaga saat penimbangan setoran perdana di Pos Meja Timbang BSS FEBI UINSA.
              </div>
            </div>
          )}

          {/* ======================= UPLOAD 1: BUKTI PEMBAYARAN / STRUK ======================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <label
                className="auth__label"
                htmlFor="input-bukti-bayar"
                style={{ cursor: "pointer", marginBottom: 0 }}
              >
                1. Bukti Pembayaran / Struk Transfer{" "}
                {metode !== "tunai" ? (
                  <span style={{ color: "#a31c1c" }}>*</span>
                ) : (
                  <span style={{ color: "#7a7469", fontWeight: 400, fontSize: "11px" }}>
                    (Opsional untuk Tunai)
                  </span>
                )}
              </label>
              <span style={{ fontSize: "11px", color: "#7a7469" }}>
                JPG, PNG, atau WEBP
              </span>
            </div>

            <input
              id="input-bukti-bayar"
              ref={fileBayarRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  prosesBerkasBayar(e.target.files[0]);
                }
              }}
            />

            {!buktiBayar ? (
              <div
                onClick={() => fileBayarRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingBayar(true);
                }}
                onDragLeave={() => setIsDraggingBayar(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingBayar(false);
                  if (e.dataTransfer.files?.[0]) {
                    prosesBerkasBayar(e.dataTransfer.files[0]);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileBayarRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${isDraggingBayar ? "#2f7d3a" : "#d8d3c5"}`,
                  background: isDraggingBayar ? "#f4faf4" : "#fbfaf7",
                  borderRadius: "8px",
                  padding: "16px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {isConvertingBayar ? (
                  <div style={{ color: "#25632d", fontSize: "13px", fontWeight: 600 }}>
                    ⏳ Memproses gambar...
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#edeae1",
                        marginBottom: "6px",
                        color: "#544e43",
                      }}
                    >
                      🧾
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#221f19" }}>
                      Pilih struk transfer / bukti bayar QRIS / VA
                    </div>
                    <p style={{ fontSize: "11px", color: "#736b5d", margin: "4px 0 0" }}>
                      {metode === "tunai"
                        ? "Lampirkan tanda terima jika ada titipan uang muka"
                        : "Wajib lampirkan screenshot struk transfer yang berhasil"}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #c2e2c5",
                  background: "#f4faf4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buktiBayar.dataUrl}
                    alt="Preview Bukti Bayar"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #c2e2c5",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#221f19",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={buktiBayar.namaFile}
                    >
                      {buktiBayar.namaFile}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#25632d", fontWeight: 600 }}>
                      ✓ {buktiBayar.ukuranKB} KB • Berkas terpasang
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileBayarRef.current?.click()}
                    style={{
                      background: "#fff",
                      border: "1px solid #dcd7cc",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "#444",
                      cursor: "pointer",
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={hapusBerkasBayar}
                    style={{
                      background: "transparent",
                      border: "1px solid transparent",
                      borderRadius: "4px",
                      padding: "4px 6px",
                      fontSize: "11px",
                      color: "#a31c1c",
                      cursor: "pointer",
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shortcut Follow Akun Instagram */}
          <div
            style={{
              background: "#faf9f5",
              border: "1px solid #e7e2d6",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#736b5d",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Langkah Tambahan: Follow Akun Instagram Resmi
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <a
                href="https://www.instagram.com/bss_uinsa/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #d6cfbe",
                  color: "#221f19",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "background 0.15s ease",
                }}
              >
                <span>📸</span>
                <span>@bss_uinsa ↗</span>
              </a>

              <a
                href="https://www.instagram.com/febi_uinsa_official/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #d6cfbe",
                  color: "#221f19",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "background 0.15s ease",
                }}
              >
                <span>🏛️</span>
                <span>Lab FEBI UINSA ↗</span>
              </a>
            </div>
          </div>

          {/* ======================= UPLOAD 2: BUKTI FOLLOW IG BSS ======================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              className="auth__label"
              htmlFor="input-follow-bss"
              style={{ cursor: "pointer", marginBottom: 0 }}
            >
              2. Bukti Screenshot Follow IG Bank Sampah Syariah (@bss_uinsa){" "}
              <span style={{ color: "#a31c1c" }}>*</span>
            </label>

            <input
              id="input-follow-bss"
              ref={fileBssRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  prosesBerkasBss(e.target.files[0]);
                }
              }}
            />

            {!buktiBss ? (
              <div
                onClick={() => fileBssRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingBss(true);
                }}
                onDragLeave={() => setIsDraggingBss(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingBss(false);
                  if (e.dataTransfer.files?.[0]) {
                    prosesBerkasBss(e.dataTransfer.files[0]);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileBssRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${isDraggingBss ? "#2f7d3a" : "#d8d3c5"}`,
                  background: isDraggingBss ? "#f4faf4" : "#fbfaf7",
                  borderRadius: "8px",
                  padding: "16px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {isConvertingBss ? (
                  <div style={{ color: "#25632d", fontSize: "13px", fontWeight: 600 }}>
                    ⏳ Memproses gambar...
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#edeae1",
                        marginBottom: "6px",
                        color: "#544e43",
                      }}
                    >
                      📸
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#221f19" }}>
                      Pilih screenshot follow @bss_uinsa
                    </div>
                    <p style={{ fontSize: "11px", color: "#736b5d", margin: "4px 0 0" }}>
                      Lampirkan tangkapan layar akun yang sudah memfollow @bss_uinsa
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #c2e2c5",
                  background: "#f4faf4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buktiBss.dataUrl}
                    alt="Preview BSS"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #c2e2c5",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#221f19",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={buktiBss.namaFile}
                    >
                      {buktiBss.namaFile}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#25632d", fontWeight: 600 }}>
                      ✓ {buktiBss.ukuranKB} KB • Berkas terpasang
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileBssRef.current?.click()}
                    style={{
                      background: "#fff",
                      border: "1px solid #dcd7cc",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "#444",
                      cursor: "pointer",
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={hapusBerkasBss}
                    style={{
                      background: "transparent",
                      border: "1px solid transparent",
                      borderRadius: "4px",
                      padding: "4px 6px",
                      fontSize: "11px",
                      color: "#a31c1c",
                      cursor: "pointer",
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================= UPLOAD 3: BUKTI FOLLOW IG LAB FEBI ======================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              className="auth__label"
              htmlFor="input-follow-lab"
              style={{ cursor: "pointer", marginBottom: 0 }}
            >
              3. Bukti Screenshot Follow IG Laboratorium FEBI UINSA{" "}
              <span style={{ color: "#a31c1c" }}>*</span>
            </label>

            <input
              id="input-follow-lab"
              ref={fileLabRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  prosesBerkasLab(e.target.files[0]);
                }
              }}
            />

            {!buktiLab ? (
              <div
                onClick={() => fileLabRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLab(true);
                }}
                onDragLeave={() => setIsDraggingLab(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLab(false);
                  if (e.dataTransfer.files?.[0]) {
                    prosesBerkasLab(e.dataTransfer.files[0]);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileLabRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${isDraggingLab ? "#2f7d3a" : "#d8d3c5"}`,
                  background: isDraggingLab ? "#f4faf4" : "#fbfaf7",
                  borderRadius: "8px",
                  padding: "16px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {isConvertingLab ? (
                  <div style={{ color: "#25632d", fontSize: "13px", fontWeight: 600 }}>
                    ⏳ Memproses gambar...
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#edeae1",
                        marginBottom: "6px",
                        color: "#544e43",
                      }}
                    >
                      🏛️
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#221f19" }}>
                      Pilih screenshot follow Lab FEBI UINSA
                    </div>
                    <p style={{ fontSize: "11px", color: "#736b5d", margin: "4px 0 0" }}>
                      Lampirkan tangkapan layar akun yang sudah memfollow Lab FEBI
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #c2e2c5",
                  background: "#f4faf4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buktiLab.dataUrl}
                    alt="Preview Lab FEBI"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #c2e2c5",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#221f19",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={buktiLab.namaFile}
                    >
                      {buktiLab.namaFile}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#25632d", fontWeight: 600 }}>
                      ✓ {buktiLab.ukuranKB} KB • Berkas terpasang
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileLabRef.current?.click()}
                    style={{
                      background: "#fff",
                      border: "1px solid #dcd7cc",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "#444",
                      cursor: "pointer",
                    }}
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={hapusBerkasLab}
                    style={{
                      background: "transparent",
                      border: "1px solid transparent",
                      borderRadius: "4px",
                      padding: "4px 6px",
                      fontSize: "11px",
                      color: "#a31c1c",
                      cursor: "pointer",
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {pesanBayar && (
            <p className="auth__err" role="alert" style={{ margin: "2px 0 0 0" }}>
              {pesanBayar}
            </p>
          )}

          {/* Tombol Aksi Pembayaran */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="auth__btn"
              onClick={onKonfirmasiPembayaran}
            >
              Kirim Bukti & Selesaikan Pendaftaran
            </button>
            <p
              style={{
                fontSize: "12px",
                color: "#736b5d",
                textAlign: "center",
                margin: "-2px 0 2px 0",
                lineHeight: 1.4,
              }}
            >
              Setelah dikirim, akun menunggu verifikasi admin/petugas di sekretariat BSS FEBI UINSA.
            </p>
            <button
              type="button"
              onClick={() => setTahap("formulir")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "13px",
                color: "#6b655b",
                cursor: "pointer",
                padding: "6px",
              }}
            >
              ← Kembali Ubah Data Identitas
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  /* ------------------------------------------------ TAHAP 1: FORMULIR BIODATA */
  return (
    <AuthShell
      judul="Daftar Nasabah Baru"
      sub="Buka buku tabungan syariah digital. Aktivasi membutuhkan bukti pembayaran serta screenshot follow Instagram Bank Sampah Syariah (@bss_uinsa) dan Lab FEBI."
      catatan="Mode demo — data pendaftaran tersimpan di browser ini. Akun pengelola diterbitkan oleh sekretariat BSS."
    >
      <form className="auth__fields" onSubmit={onLanjutPembayaran} noValidate>
        {/* Banner info persyaratan */}
        <div
          style={{
            padding: "12px 14px",
            background: "#edf7ee",
            border: "1px solid #bce1bf",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#1c5625",
            lineHeight: 1.5,
          }}
        >
          💳 <strong>Syarat Pendaftaran:</strong> Menyiapkan bukti pembayaran
          serta screenshot follow Instagram <b>@bss_uinsa</b> dan <b>Lab FEBI</b> pada
          langkah selanjutnya.
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="nama">
            Nama lengkap
          </label>
          <input
            className="auth__input"
            id="nama"
            name="nama"
            type="text"
            autoComplete="name"
            placeholder="Nama lengkap sesuai KTP"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="email">
            Email
          </label>
          <input
            className="auth__input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="sandi">
            Kata sandi
          </label>
          <span className="auth__peekwrap">
            <input
              className="auth__input auth__input--peek"
              id="sandi"
              name="sandi"
              type={lihat ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth__peek"
              onClick={() => setLihat(!lihat)}
              aria-label={lihat ? "Sembunyikan sandi" : "Lihat sandi"}
            >
              {lihat ? "Tutup" : "Lihat"}
            </button>
          </span>
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="ulangi">
            Ulangi kata sandi
          </label>
          <input
            className="auth__input"
            id="ulangi"
            name="ulangi"
            type={lihat ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ketik ulang sandi"
            value={ulangi}
            onChange={(e) => setUlangi(e.target.value)}
            required
          />
        </div>

        {pesan && (
          <p className="auth__err" role="alert">
            {pesan}
          </p>
        )}

        <button className="auth__btn" type="submit">
          Lanjut ke Pembayaran & Unggah Bukti →
        </button>

        <p className="auth__alt">
          Sudah punya akun? <a href="/masuk">Masuk</a>
        </p>
      </form>
    </AuthShell>
  );
}
