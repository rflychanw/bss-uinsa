"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AKUN_DEMO,
  beranda,
  masuk,
  semuaAkun,
  sesiSekarang,
  type Akun,
} from "../../lib/auth";

const ROLE_LABEL: Record<string, string> = {
  admin: "ADMIN",
  bendahara: "BENDAHARA",
  petugas: "PETUGAS",
};

export default function PortalBssPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [kirim, setKirim] = useState(false);
  const [akunStafDemo, setAkunStafDemo] = useState<Akun[]>(() =>
    AKUN_DEMO.filter((a) => a.role !== "nasabah")
  );

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi) {
      router.replace(beranda(sesi.role));
      return;
    }

    const semua = semuaAkun();
    const pilihan: Akun[] = [];
    for (const r of ["admin", "bendahara", "petugas"] as const) {
      const perRole = semua.filter((a) => a.role === r);
      if (perRole[0]) pilihan.push(perRole[0]);
    }
    if (pilihan.length > 0) {
      setAkunStafDemo(pilihan);
    }
  }, [router]);

  const peranTerdeteksi = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return "";
    if (clean.endsWith("@petugas.com") || clean === "petugas@bss.test") {
      return "Petugas Jaga";
    }
    if (clean.endsWith("@bendahara.com") || clean === "bendahara@bss.test") {
      return "Bendahara";
    }
    if (clean.endsWith("@bss.test")) {
      return "Administrator";
    }
    return "";
  }, [email]);

  const isiDemo = (akun: Akun) => {
    setEmail(akun.email);
    setSandi(akun.sandi);
    setPesan("");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");
    setKirim(true);

    const hasil = masuk(email, sandi, {
      izinkanRole: ["admin", "bendahara", "petugas"],
      pesanTolakRole:
        "Akun nasabah tidak memiliki otorisasi di Portal Pengelola BSS. Silakan masuk melalui halaman masuk nasabah.",
    });

    if (!hasil.ok) {
      setPesan(hasil.pesan);
      setKirim(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    const berandaRole = beranda(hasil.sesi.role);
    const bolehNext =
      next &&
      (next.startsWith(berandaRole) ||
        (hasil.sesi.role === "admin" &&
          (next.startsWith("/petugas") || next.startsWith("/bendahara"))));

    router.replace(bolehNext ? next : berandaRole);
  };

  return (
    <main className="portal">
      <div className="portal__wrap">
        <div className="portal__topbar">
          <a className="auth__back" href="/">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13 8H4M7.5 4.5 4 8l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Kembali ke beranda
          </a>
          <span className="portal__env">Akses Terbatas · Pengelola BSS UINSA</span>
        </div>

        <div className="portal__card">
          {/* Panel Kiri: Otoritas & Ruang Lingkup Internal */}
          <aside className="portal__aside">
            <a className="portal__brand" href="/">
              <img src="/logo-96.png" alt="" width={40} height={40} />
              <div className="portal__brandtext">
                <strong>Bank Sampah Syariah UINSA</strong>
                <span>Konsol Operasional Internal</span>
              </div>
            </a>

            <div className="portal__intro">
              <h2>Portal Kerja Pengelola &amp; Pengawasan Kas</h2>
              <p>
                Gerbang autentikasi terpisah bagi pengelola internal untuk
                menjaga ketertiban pencatatan timbangan, validasi anggota, serta
                pelaporan keuangan laboratorium FEBI.
              </p>
            </div>

            <ul className="portal__roles" aria-label="Cakupan peran pengelola">
              <li className="portal__roleitem">
                <span className="portal__rolecode">ADMIN</span>
                <span className="portal__roledesc">
                  Monitoring keaktifan, master pricelist &amp; manajemen akun staf
                </span>
              </li>
              <li className="portal__roleitem">
                <span className="portal__rolecode">BENDAHARA</span>
                <span className="portal__roledesc">
                  Arus penjualan pengepul, bagi hasil kas &amp; rekap mutasi
                </span>
              </li>
              <li className="portal__roleitem">
                <span className="portal__rolecode">PETUGAS</span>
                <span className="portal__roledesc">
                  Penimbangan setoran sampah &amp; verifikasi aktivasi nasabah
                </span>
              </li>
            </ul>

            <p className="portal__asidefoot">
              Laboratorium FEBI, Universitas Islam Negeri Sunan Ampel Surabaya.
              <br />
              Jl. Ahmad Yani 117, Surabaya.
            </p>
          </aside>

          {/* Panel Kanan: Formulir Autentikasi Staf */}
          <section className="portal__main" aria-labelledby="portal-judul">
            <header className="auth__head">
              <span className="auth__kicker">Autentikasi Staf Internal</span>
              <h1 className="auth__title" id="portal-judul">
                Masuk Portal Pengelola
              </h1>
              <p className="auth__sub">
                Gunakan kredensial resmi pengelola yang diterbitkan oleh
                Administrator Sistem BSS.
              </p>
            </header>

            <form className="auth__fields" onSubmit={onSubmit} noValidate>
              <div className="auth__field">
                <div className="portal__labelrow">
                  <label className="auth__label" htmlFor="portal-email">
                    Email Pengelola
                  </label>
                  {peranTerdeteksi ? (
                    <span className="portal__detected">{peranTerdeteksi}</span>
                  ) : null}
                </div>
                <input
                  className="auth__input"
                  id="portal-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="nama@petugas.com atau @bendahara.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth__field">
                <label className="auth__label" htmlFor="portal-sandi">
                  Kata Sandi
                </label>
                <span className="auth__peekwrap">
                  <input
                    className="auth__input auth__input--peek"
                    id="portal-sandi"
                    name="sandi"
                    type={lihat ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi staf"
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

              <button className="portal__submit" type="submit" disabled={kirim}>
                {kirim ? "Memverifikasi otorisasi…" : "Masuk Ruang Pengelola"}
              </button>
            </form>

            <div className="portal__ledger">
              <p className="portal__ledgertitle">
                Kredensial Uji Pengelola (Admin · Bendahara · Petugas)
              </p>
              {akunStafDemo.map((akun) => (
                <div className="portal__ledgerrow" key={akun.nomor + akun.email}>
                  <div className="portal__ledgerinfo">
                    <div className="portal__ledgerrole">
                      <span className="portal__tag">
                        {ROLE_LABEL[akun.role] || akun.role.toUpperCase()}
                      </span>
                      <span>{akun.nama}</span>
                    </div>
                    <div className="portal__cred">
                      <span>{akun.email}</span>
                      <span>·</span>
                      <span>{akun.sandi}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="auth__fill"
                    onClick={() => isiDemo(akun)}
                    title={`Isi kredensial ${akun.nama}`}
                  >
                    Isi
                  </button>
                </div>
              ))}
            </div>

            <p className="portal__policy">
              Akses khusus personel internal. Pembuatan atau perubahan akun
              staf dilakukan melalui panel Administrator, tanpa registrasi
              mandiri.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
