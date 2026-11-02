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

  /* sudah punya sesi? langsung ke ruangnya */
  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi) router.replace(beranda(sesi.role));
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
      judul="Masuk"
      sub="Pakai akun nasabah atau petugas. Semua akun di sini masih demo, jadi tidak ada data sungguhan yang tersimpan."
      catatan="Mode demo — akun contoh tersedia di formulir ini. Sesi hanya tersimpan di browser kamu."
    >
      <form className="auth__fields" onSubmit={onSubmit} noValidate>
        <div className="auth__field">
          <label className="auth__label" htmlFor="email">
            Email
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
            Kata sandi
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
          {kirim ? "Memeriksa…" : "Masuk"}
        </button>
      </form>

      <div className="auth__demo">
        <p className="auth__demotitle">Akun hardcode</p>
        {AKUN_DEMO.map((akun) => (
          <div className="auth__demorow" key={akun.email}>
            <div className="auth__demoinfo">
              <b>{akun.role === "admin" ? "Petugas" : "Nasabah"}</b>
              <code>{akun.email}</code>
              <code>{akun.sandi}</code>
            </div>
            <button
              type="button"
              className="auth__fill"
              onClick={() => isiDemo(akun)}
            >
              Isi
            </button>
          </div>
        ))}
      </div>

      <p className="auth__alt">
        Belum punya akun? <a href="/daftar">Daftar jadi nasabah</a>
      </p>
    </AuthShell>
  );
}
