"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/app/AuthShell";
import { beranda, daftar, sesiSekarang } from "../../lib/auth";

type Sukses = { nama: string; email: string; nomor: string };

export default function DaftarPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesan, setPesan] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  useEffect(() => {
    const sesi = sesiSekarang();
    if (sesi) router.replace(beranda(sesi.role));
  }, [router]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPesan("");

    if (sandi !== ulangi) {
      setPesan("Ulangi kata sandi belum sama.");
      return;
    }

    const hasil = daftar({ nama, email, sandi });
    if (!hasil.ok) {
      setPesan(hasil.pesan);
      return;
    }

    setSukses({ nama: hasil.sesi.nama, email: hasil.sesi.email, nomor: hasil.nomor });
  };

  if (sukses) {
    return (
      <AuthShell
        judul="Akun dibuat"
        sub="Pendaftaran demo selesai. Nomor nasabah ini dipakai saat menyetor sampah di sekretariat."
        catatan="Mode demo — akun baru hanya tersimpan di browser ini, bukan di server BSS."
      >
        <div className="auth__done">
          <dl className="auth__donelist">
            <div>
              <dt>Nama</dt>
              <dd>{sukses.nama}</dd>
            </div>
            <div>
              <dt>Nomor nasabah</dt>
              <dd>
                <b>{sukses.nomor}</b>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{sukses.email}</dd>
            </div>
          </dl>
          <a className="auth__btn" href="/nasabah">
            Buka ruang nasabah
          </a>
          <p className="auth__alt">
            Mau pakai akun lain? <a href="/masuk">Masuk</a>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      judul="Daftar"
      sub="Cukup nama dan email. Nomor nasabah dibuat otomatis, lalu dipakai untuk mencatat setoranmu."
      catatan="Mode demo — data pendaftaran hanya tersimpan di browser ini. Akun petugas dibuat oleh sekretariat."
    >
      <form className="auth__fields" onSubmit={onSubmit} noValidate>
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
            placeholder="Nama sesuai KTM"
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
              onClick={() => setLihat((v) => !v)}
              aria-pressed={lihat}
            >
              {lihat ? "Sembunyi" : "Lihat"}
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
            placeholder="Tulis sekali lagi"
            value={ulangi}
            onChange={(e) => setUlangi(e.target.value)}
            required
          />
        </div>

        {pesan ? (
          <p className="auth__err" role="alert">
            {pesan}
          </p>
        ) : null}

        <button className="auth__btn" type="submit">
          Buat akun
        </button>
      </form>

      <p className="auth__alt">
        Sudah punya akun? <a href="/masuk">Masuk</a>
      </p>
    </AuthShell>
  );
}
