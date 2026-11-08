"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import { beranda, daftar, sesiSekarang, type KategoriNasabah } from "../../lib/auth";
import { DAFTAR_FAKULTAS_UINSA } from "../../lib/bss";

type Sukses = {
  nama: string;
  email: string;
  nomor: string;
  kategori: KategoriNasabah;
  fakultas?: string;
  prodi?: string;
  metode: MetodeBayar;
  namaFileBukti?: string;
  buktiUrl?: string;
};
type MetodeBayar = "qris" | "va" | "tunai";

export default function DaftarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tahap, setTahap] = useState<"formulir" | "pembayaran" | "berhasil">("formulir");
  const [kategori, setKategori] = useState<KategoriNasabah>("internal");
  const [fakultas, setFakultas] = useState("");
  const [prodi, setProdi] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [metode, setMetode] = useState<MetodeBayar>("qris");
  const [fileBukti, setFileBukti] = useState<File | null>(null);
  const [buktiUrl, setBuktiUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [pesanBayar, setPesanBayar] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  const fakultasTerpilih = DAFTAR_FAKULTAS_UINSA.find(
    (f) => f.singkatan === fakultas || f.nama === fakultas
  );
  const daftarProdi = fakultasTerpilih?.prodi || [];

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
    if (kategori === "internal") {
      if (!fakultas) {
        setPesan("Silakan pilih Fakultas Anda di UINSA.");
        return;
      }
      if (!prodi) {
        setPesan("Silakan pilih Program Studi (Prodi) Anda.");
        return;
      }
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

  const prosesFile = (file: File) => {
    setPesanBayar("");
    if (file.size > 1 * 1024 * 1024) {
      setPesanBayar("Ukuran gambar bukti maksimal 1MB.");
      return;
    }
    const tipeValid = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!file.type.startsWith("image/") || !tipeValid.includes(file.type)) {
      setPesanBayar("Format berkas harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }

    setFileBukti(file);
    const reader = new FileReader();
    reader.onload = () => {
      setBuktiUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const hapusFile = () => {
    setFileBukti(null);
    setBuktiUrl("");
    setPesanBayar("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onKonfirmasiPembayaran = () => {
    setPesanBayar("");

    if (metode !== "tunai" && !fileBukti) {
      setPesanBayar("Harap unggah bukti pembayaran / transfer sebelum melanjutkan.");
      return;
    }

    const hasil = daftar({
      nama,
      email,
      sandi,
      kategori,
      fakultas: kategori === "internal" ? (fakultasTerpilih?.singkatan || fakultas) : "Umum",
      prodi: kategori === "internal" ? prodi : undefined,
      buktiBayar: buktiUrl || (fileBukti ? fileBukti.name : undefined),
      namaFileBukti: fileBukti?.name,
      metodeBayar: metode,
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
      kategori,
      fakultas: kategori === "internal" ? (fakultasTerpilih?.singkatan || fakultas) : undefined,
      prodi: kategori === "internal" ? prodi : undefined,
      metode,
      namaFileBukti: fileBukti?.name,
      buktiUrl,
    });

    router.push(
      `/masuk?verifikasi=sukses&nomor=${encodeURIComponent(
        hasil.nomor
      )}&email=${encodeURIComponent(hasil.email)}`
    );
  };

  /* ------------------------------------------------ TAHAP 3: SELESAI / AKUN DIAKTIFKAN */
  if (tahap === "berhasil" && sukses) {
    const labelMetode =
      sukses.metode === "qris"
        ? "QRIS BSS UINSA"
        : sukses.metode === "va"
        ? "Virtual Account BSI"
        : "Tunai di Meja Timbang";

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
            ✓ Pembayaran Berlangganan Rp 10.000 Berhasil Diverifikasi
          </div>

          <dl className="auth__donelist">
            <div>
              <dt>Nama Lengkap</dt>
              <dd>{sukses.nama}</dd>
            </div>
            <div>
              <dt>Kategori</dt>
              <dd>
                {sukses.kategori === "internal"
                  ? `Internal Kampus (${sukses.fakultas || ""}${sukses.prodi ? ` - ${sukses.prodi}` : ""})`
                  : "Masyarakat Umum"}
              </dd>
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
            <div>
              <dt>Bukti Bayar</dt>
              <dd>
                {sukses.namaFileBukti ? (
                  <span style={{ color: "#25632d", fontWeight: 600 }}>
                    ✓ {sukses.namaFileBukti}
                  </span>
                ) : (
                  <span style={{ color: "#736b5d" }}>Bayar Tunai di Meja</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Status Keanggotaan</dt>
              <dd>Nasabah Wadiah (Aktif Seumur Hidup)</dd>
            </div>
          </dl>

          {sukses.buktiUrl && (
            <div
              style={{
                background: "#fbfaf7",
                border: "1px solid #e0ddd3",
                borderRadius: "6px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#736b5d",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Pratinjau Bukti Pembayaran:
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sukses.buktiUrl}
                alt="Bukti pembayaran"
                style={{
                  maxHeight: "140px",
                  maxWidth: "100%",
                  borderRadius: "4px",
                  border: "1px solid #dcd7cc",
                  objectFit: "contain",
                }}
              />
            </div>
          )}

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
              <strong style={{ fontSize: "15px", color: "#221f19", display: "block" }}>
                Langganan Anggota BSS Sekali Bayar
              </strong>
              <span style={{ fontSize: "12px", color: "#665f53", display: "block", marginTop: "2px" }}>
                Pendaftar: <b>{nama}</b> • {kategori === "internal" ? `${fakultasTerpilih?.singkatan || fakultas} (${prodi})` : "Masyarakat Umum"}
              </span>
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

          {/* Komponen Unggah Bukti Pembayaran */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                Unggah Bukti Pembayaran{" "}
                {metode !== "tunai" ? (
                  <span style={{ color: "#a31c1c" }}>*</span>
                ) : (
                  <span
                    style={{
                      color: "#7a7469",
                      fontWeight: 400,
                      fontSize: "12px",
                    }}
                  >
                    (Opsional untuk Tunai)
                  </span>
                )}
              </label>
              <span style={{ fontSize: "11px", color: "#7a7469" }}>
                JPG, PNG, WEBP (Maks. 1MB)
              </span>
            </div>

            <input
              id="input-bukti-bayar"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  prosesFile(e.target.files[0]);
                }
              }}
            />

            {!fileBukti ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    prosesFile(e.dataTransfer.files[0]);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${
                    isDragging ? "#2f7d3a" : pesanBayar ? "#c74949" : "#d8d3c5"
                  }`,
                  background: isDragging ? "#f4faf4" : "#fbfaf7",
                  borderRadius: "8px",
                  padding: "18px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#edeae1",
                    marginBottom: "8px",
                    color: "#544e43",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#221f19",
                  }}
                >
                  Klik atau seret struk transfer ke sini
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#736b5d",
                    margin: "4px 0 0 0",
                  }}
                >
                  {metode === "tunai"
                    ? "Lampirkan tanda terima / titipan jika ada"
                    : "Wajib lampirkan screenshot struk transfer berhasil"}
                </p>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #c2e2c5",
                  background: "#f4faf4",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  {buktiUrl && fileBukti.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={buktiUrl}
                      alt="Thumbnail bukti"
                      style={{
                        width: "44px",
                        height: "44px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #c2e2c5",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "4px",
                        background: "#e2efe4",
                        color: "#25632d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "11px",
                        flexShrink: 0,
                      }}
                    >
                      FILE
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#221f19",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={fileBukti.name}
                    >
                      {fileBukti.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#25632d",
                        fontWeight: 500,
                      }}
                    >
                      {(fileBukti.size / 1024).toFixed(0)} KB • ✓ Bukti terpasang
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
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
                    onClick={hapusFile}
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

            {pesanBayar && (
              <p
                className="auth__err"
                role="alert"
                style={{ margin: "2px 0 0 0" }}
              >
                {pesanBayar}
              </p>
            )}
          </div>

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
              Setelah dikirim, Anda akan dialihkan ke halaman login dan akun menunggu verifikasi admin.
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
          💳 <strong>Biaya Berlangganan:</strong> Rp 10.000 (sekali bayar seumur hidup untuk administrasi buku tabungan & rekening wadiah). Bukti transfer/pembayaran diunggah pada tahap selanjutnya.
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
            placeholder={
              kategori === "internal"
                ? "Nama sesuai KTM / KTP"
                : "Nama lengkap sesuai KTP"
            }
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="auth__label">Kategori Nasabah</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setKategori("internal");
                setPesan("");
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                border: `2px solid ${kategori === "internal" ? "#2f7d3a" : "#dcd7cc"}`,
                background: kategori === "internal" ? "#f4faf4" : "#ffffff",
                color: kategori === "internal" ? "#1e5b26" : "#444",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              🏛️ Internal Kampus
            </button>
            <button
              type="button"
              onClick={() => {
                setKategori("umum");
                setPesan("");
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                border: `2px solid ${kategori === "umum" ? "#2f7d3a" : "#dcd7cc"}`,
                background: kategori === "umum" ? "#f4faf4" : "#ffffff",
                color: kategori === "umum" ? "#1e5b26" : "#444",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              🌐 Umum
            </button>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6e685d", lineHeight: 1.4 }}>
            {kategori === "internal"
              ? "Khusus mahasiswa, dosen, atau civitas akademika UIN Sunan Ampel Surabaya."
              : "Terbuka bagi warga sekitar kampus, mitra, dan masyarakat umum."}
          </p>
        </div>

        {kategori === "internal" && (
          <div
            style={{
              display: "grid",
              gap: "12px",
              padding: "12px 14px",
              background: "#fbfaf7",
              border: "1px solid #e7e3d8",
              borderRadius: "6px",
            }}
          >
            <div className="auth__field">
              <label className="auth__label" htmlFor="fakultas">
                Fakultas
              </label>
              <select
                className="auth__input"
                id="fakultas"
                name="fakultas"
                value={fakultas}
                onChange={(e) => {
                  setFakultas(e.target.value);
                  setProdi("");
                  setPesan("");
                }}
                style={{ cursor: "pointer", background: "#fff" }}
                required
              >
                <option value="">-- Pilih Fakultas UINSA --</option>
                {DAFTAR_FAKULTAS_UINSA.map((f) => (
                  <option key={f.singkatan} value={f.singkatan}>
                    {f.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth__field">
              <label className="auth__label" htmlFor="prodi">
                Program Studi (Prodi)
              </label>
              <select
                className="auth__input"
                id="prodi"
                name="prodi"
                value={prodi}
                onChange={(e) => {
                  setProdi(e.target.value);
                  setPesan("");
                }}
                disabled={!fakultas}
                style={{
                  cursor: fakultas ? "pointer" : "not-allowed",
                  background: fakultas ? "#fff" : "#f5f4ef",
                  opacity: fakultas ? 1 : 0.75,
                }}
                required
              >
                <option value="">
                  {fakultas ? "-- Pilih Program Studi --" : "-- Pilih Fakultas Terlebih Dahulu --"}
                </option>
                {daftarProdi.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
