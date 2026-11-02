"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import { beranda, daftar, sesiSekarang } from "../../lib/auth";

type Sukses = { nama: string; email: string; nomor: string };
type MetodeBayar = "qris" | "va" | "tunai";

export default function DaftarPage() {
  const router = useRouter();
  const [tahap, setTahap] = useState<"formulir" | "pembayaran" | "berhasil">("formulir");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [metode, setMetode] = useState<MetodeBayar>("qris");
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

  const onKonfirmasiPembayaran = () => {
    const hasil = daftar({ nama, email, sandi });
    if (!hasil.ok) {
      setPesan(hasil.pesan);
      setTahap("formulir");
      return;
    }

    setSukses({
      nama: hasil.sesi.nama,
      email: hasil.sesi.email,
      nomor: hasil.nomor,
    });
    setTahap("berhasil");
  };

  /* ------------------------------------------------ TAHAP 3: SELESAI / AKUN DIAKTIFKAN */
  if (tahap === "berhasil" && sukses) {
    return (
      <AuthShell
        judul="Akun Nasabah Aktif"
        sub="Pendaftaran dan pembayaran berlangganan berhasil diverifikasi. Buku tabungan digital syariah Anda siap digunakan."
        catatan="Status keanggotaan aktif seumur hidup — gunakan nomor nasabah ini untuk setiap penyetoran di sekretariat BSS."
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
            ✓ Pembayaran Berlangganan Rp 10.000 Lunas (Sekali Bayar)
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
              <dt>Status Keanggotaan</dt>
              <dd>Nasabah Wadiah (Aktif Seumur Hidup)</dd>
            </div>
          </dl>
          <a className="auth__btn" href="/nasabah">
            Buka Ruang Nasabah
          </a>
          <p className="auth__alt">
            Mau beralih akun? <a href="/masuk">Masuk</a>
          </p>
        </div>
      </AuthShell>
    );
  }

  /* ------------------------------------------------ TAHAP 2: PEMBAYARAN BERLANGGANAN 10K */
  if (tahap === "pembayaran") {
    return (
      <AuthShell
        judul="Biaya Berlangganan BSS"
        sub="Sistem Bank Sampah Syariah memberlakukan biaya registrasi sekali bayar Rp 10.000 untuk langganan keanggotaan seumur hidup."
        catatan="Biaya dipakai untuk penerbitan buku tabungan digital wadiah & administrasi pengelolaan sampah terintegrasi."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Kotak Ringkasan Tagihan */}
          <div
            style={{
              background: "#fbfaf7",
              border: "1px solid #e5e0d4",
              borderRadius: "8px",
              padding: "16px 20px",
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
              <strong style={{ fontSize: "15px", color: "#221f19" }}>
                Langganan Anggota BSS Sekali Bayar
              </strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#25632d",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Rp 10.000
              </span>
              <span style={{ fontSize: "11px", color: "#7a7469", display: "block" }}>
                Seumur hidup
              </span>
            </div>
          </div>

          {/* Pemilihan Metode Pembayaran */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label className="auth__label">Pilih Metode Pembayaran</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setMetode("qris")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "qris" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "qris" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                QRIS BSS
              </button>
              <button
                type="button"
                onClick={() => setMetode("va")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "va" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "va" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                VA BSI
              </button>
              <button
                type="button"
                onClick={() => setMetode("tunai")}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: `2px solid ${metode === "tunai" ? "#2f7d3a" : "#ddd"}`,
                  background: metode === "tunai" ? "#f4faf4" : "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Tunai di Meja
              </button>
            </div>
          </div>

          {/* Tampilan Detail Berdasarkan Metode Terpilih */}
          {metode === "qris" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  margin: "0 auto 12px",
                  background: "#f0efe9",
                  border: "2px solid #221f19",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                }}
              >
                {/* Visual QR Code Minimalis */}
                <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="#ffffff" rx="4" />
                  <rect x="10" y="10" width="30" height="30" fill="#221f19" />
                  <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="20" width="10" height="10" fill="#221f19" />
                  <rect x="60" y="10" width="30" height="30" fill="#221f19" />
                  <rect x="65" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="70" y="20" width="10" height="10" fill="#221f19" />
                  <rect x="10" y="60" width="30" height="30" fill="#221f19" />
                  <rect x="15" y="65" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="70" width="10" height="10" fill="#221f19" />
                  <circle cx="50" cy="50" r="8" fill="#2f7d3a" />
                  <rect x="55" y="60" width="15" height="15" fill="#221f19" />
                  <rect x="75" y="75" width="15" height="15" fill="#221f19" />
                </svg>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#333", marginTop: "4px" }}>
                  QRIS BSS UINSA
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>
                Scan via BSI Mobile, GoPay, OVO, ShopeePay, atau m-Banking apa saja.
              </p>
              <span style={{ fontSize: "11px", color: "#888", display: "block", marginTop: "4px" }}>
                NMID: ID1020261102998 • Bank Sampah Syariah UINSA
              </span>
            </div>
          )}

          {metode === "va" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "8px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Bank Tujuan:</span>
                <strong style={{ fontSize: "13px" }}>Bank Syariah Indonesia (BSI)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Nomor Virtual Account:</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#25632d",
                    background: "#edf7ee",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  99283-0822144099
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Atas Nama:</span>
                <span style={{ fontSize: "13px" }}>BSS FEBI UINSA</span>
              </div>
            </div>
          )}

          {metode === "tunai" && (
            <div
              style={{
                border: "1px solid #e0ddd3",
                borderRadius: "8px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <p style={{ fontSize: "13px", color: "#333", margin: "0 0 6px 0" }}>
                <strong>Bayar Tunai di Meja Timbang</strong>
              </p>
              <p style={{ fontSize: "12px", color: "#666", margin: 0, lineHeight: 1.5 }}>
                Anda dapat menyerahkan uang tunai Rp 10.000 kepada Petugas Jaga saat penimbangan setoran perdana di Pos BSS FEBI UINSA.
              </p>
            </div>
          )}

          {/* Tombol Aksi Pembayaran */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="auth__btn"
              onClick={onKonfirmasiPembayaran}
            >
              Saya Sudah Bayar (Aktivasi Akun Rp 10.000)
            </button>
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
      sub="Buka buku tabungan syariah digital. Berlaku sistem biaya berlangganan keanggotaan Rp 10.000 sekali bayar seumur hidup."
      catatan="Mode demo — data pendaftaran tersimpan di browser ini. Akun pengelola diterbitkan oleh sekretariat BSS."
    >
      <form className="auth__fields" onSubmit={onLanjutPembayaran} noValidate>
        {/* Banner info biaya berlangganan */}
        <div
          style={{
            padding: "10px 14px",
            background: "#fdf8ee",
            border: "1px solid #eddcb9",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#7e5209",
            lineHeight: 1.45,
          }}
        >
          💳 <strong>Biaya Berlangganan:</strong> Rp 10.000 (sekali bayar seumur hidup untuk administrasi buku tabungan & rekening wadiah).
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
            placeholder="Nama sesuai KTM / KTP"
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
          Lanjut ke Pembayaran (Rp 10.000) →
        </button>

        <p className="auth__alt">
          Sudah punya akun? <a href="/masuk">Masuk</a>
        </p>
      </form>
    </AuthShell>
  );
}
