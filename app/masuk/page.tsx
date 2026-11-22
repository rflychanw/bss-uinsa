"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import {
  AKUN_AWAL_MASTER,
  AKUN_DEMO,
  beranda,
  keluar,
  masuk,
  semuaAkun,
  sesiSekarang,
  type Akun,
  type Sesi,
} from "../../lib/auth";
import { hasSupabaseEnv } from "../../lib/supabase/client";
import {
  keluarSupabase,
  masukSupabase,
  sinkronkanDataSupabase,
} from "../../lib/supabase/sync";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [kirim, setKirim] = useState(false);
  const [sesiAktif, setSesiAktif] = useState<Sesi | null>(null);
  const [daftarAkunDemo, setDaftarAkunDemo] = useState<Akun[]>(() =>
    AKUN_DEMO.filter((a) => a.role === "nasabah")
  );
  const [infoVerifikasi, setInfoVerifikasi] = useState<{
    nomor?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    if (hasSupabaseEnv()) {
      sinkronkanDataSupabase().then((s) => setSesiAktif(s));
      setDaftarAkunDemo(
        AKUN_AWAL_MASTER.filter((a) => a.role === "nasabah").slice(0, 2)
      );
    } else {
      setSesiAktif(sesiSekarang());
      const semua = semuaAkun();
      const nasabahDemo = semua.filter((a) => a.role === "nasabah").slice(0, 2);
      if (nasabahDemo.length > 0) {
        setDaftarAkunDemo(nasabahDemo);
      }
    }

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
  }, []);

  const isiDemo = (akun: Akun) => {
    setEmail(akun.email);
    setSandi(akun.sandi);
    setPesan("");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");
    setKirim(true);

    const opsi = {
      izinkanRole: ["nasabah" as const],
      pesanTolakRole:
        "Halaman ini khusus untuk akun Nasabah. Pengelola internal BSS silakan masuk melalui portal pengelola resmi.",
    };

    const hasil = hasSupabaseEnv()
      ? await masukSupabase(email, sandi, opsi)
      : masuk(email, sandi, opsi);

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
      kicker="Portal Nasabah"
      judul="Masuk Akun Nasabah"
      sub="Pantau saldo tabungan sampah, riwayat penimbangan, dan ajukan pencairan dana Anda."
      catatan="Layanan nasabah Bank Sampah Syariah UINSA · Mode demo browser."
    >
      {sesiAktif ? (
        <div className="auth__session" role="status">
          <div>
            {sesiAktif.role === "nasabah" ? (
              <>
                Anda sudah masuk sebagai <strong>{sesiAktif.nama}</strong> ({sesiAktif.nomor}).
              </>
            ) : (
              <>
                Sesi pengelola (<strong>{sesiAktif.nama}</strong>) masih aktif di browser ini.
              </>
            )}
          </div>
          <div className="auth__sessionact">
            {sesiAktif.role === "nasabah" ? (
              <button
                type="button"
                className="auth__sessionbtn"
                onClick={() => router.push("/nasabah")}
              >
                Buka Ruang Nasabah
              </button>
            ) : null}
            <button
              type="button"
              className="auth__sessionout"
              onClick={async () => {
                if (hasSupabaseEnv()) {
                  await keluarSupabase();
                } else {
                  keluar();
                }
                setSesiAktif(null);
              }}
            >
              Keluar sesi
            </button>
          </div>
        </div>
      ) : null}
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
        <p className="auth__demotitle">Akun contoh nasabah siap pakai</p>
        {daftarAkunDemo.map((akun) => (
          <div className="auth__demorow" key={akun.nomor + akun.email}>
            <div className="auth__demoinfo">
              <b>{akun.nama}</b>
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
