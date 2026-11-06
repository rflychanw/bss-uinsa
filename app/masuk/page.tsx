"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import {
  AKUN_DEMO,
  beranda,
  masuk,
  sesiSekarang,
  type Akun,
} from "../../lib/auth";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [kirim, setKirim] = useState(false);
  const [infoVerifikasi, setInfoVerifikasi] = useState<{
    nomor?: string;
    email?: string;
  } | null>(null);

  /* sudah punya sesi? langsung ke ruangnya */
  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi) router.replace(beranda(sesi.role));

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("verifikasi") === "sukses" ||
        params.get("status") === "verifikasi"
      ) {
        const no = params.get("nomor") || "";
        const em = params.get("email") || "";
        setInfoVerifikasi({ nomor: no, email: em });
        if (em) setEmail(em);
      }
    }
  }, [router]);

  const isiDemo = (akun: Akun) => {
    setEmail(akun.email);
    setSandi(akun.sandi);
    setPesan("");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");
    setKirim(true);

    const hasil = masuk(email, sandi);
    if (!hasil.ok) {
      setPesan(hasil.pesan);
      setKirim(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    const tujuan =
      next && next.startsWith(beranda(hasil.sesi.role))
        ? next
        : beranda(hasil.sesi.role);

    router.replace(tujuan);
  };

  return (
    <AuthShell
      judul="Masuk Akun"
      sub="Silakan masuk sesuai peran Anda (Nasabah, Petugas Jaga, Bendahara, atau Admin) sesuai SRS Bank Sampah Syariah UINSA."
      catatan="Mode demo — akun contoh tersedia di formulir ini. Sesi tersimpan di browser Anda."
    >
      {infoVerifikasi && (
        <div
          style={{
            background: "#f4faf4",
            border: "1px solid #95d59c",
            borderRadius: "6px",
            padding: "12px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#1d5823",
            lineHeight: 1.5,
          }}
          role="status"
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>✓</span> Pendaftaran & Bukti Bayar Terkirim!
          </div>
          <div>
            Akun Anda{" "}
            {infoVerifikasi.nomor ? (
              <strong>({infoVerifikasi.nomor})</strong>
            ) : null}{" "}
            berhasil didaftarkan dan saat ini{" "}
            <strong>sedang menunggu proses verifikasi oleh Admin BSS</strong>.
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#2d6a34",
            }}
          >
            Admin akan memeriksa bukti pembayaran terlebih dahulu. Silakan tunggu hingga status aktivasi disetujui sebelum masuk.
          </div>
        </div>
      )}

      <form className="auth__fields" onSubmit={onSubmit} noValidate>
        <div className="auth__field">
          <label className="auth__label" htmlFor="email">
            Alamat Email
          </label>
          <input
            className="auth__input"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="sandi">
            Kata Sandi
          </label>
          <span className="auth__peekwrap">
            <input
              className="auth__input auth__input--peek"
              id="sandi"
              name="sandi"
              type={lihat ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Minimal 8 karakter"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth__peek"
              onClick={() => setLihat((v) => !v)}
              aria-pressed={lihat}
            >
              {lihat ? "Sembunyi" : "Lihat"}
            </button>
          </span>
        </div>

        {pesan ? (
          <p className="auth__err" role="alert">
            {pesan}
          </p>
        ) : null}

        <button className="auth__btn" type="submit" disabled={kirim}>
          {kirim ? "Memeriksa kredensial…" : "Masuk"}
        </button>
      </form>

      <div className="auth__demo">
        <p className="auth__demotitle">Akun demo siap pakai (sesuai Use Case & RBAC SRS v1.0)</p>
        {AKUN_DEMO.map((akun) => (
          <div className="auth__demorow" key={akun.email}>
            <div className="auth__demoinfo">
              <b>{akun.jabatan || akun.role.toUpperCase()}</b>
              <code>{akun.email}</code>
              <code>{akun.sandi}</code>
            </div>
            <button
              type="button"
              className="auth__fill"
              onClick={() => isiDemo(akun)}
              title={`Isi otomatis ${akun.nama}`}
            >
              Isi
            </button>
          </div>
        ))}
      </div>

      <p className="auth__alt">
        Belum punya akun? <a href="/daftar">Daftar jadi nasabah baru</a>
      </p>
    </AuthShell>
  );
}
