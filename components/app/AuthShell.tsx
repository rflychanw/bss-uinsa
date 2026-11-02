import type { ReactNode } from "react";

/** Kerangka dua kolom untuk halaman /masuk dan /daftar. */
export default function AuthShell({
  judul,
  sub,
  catatan,
  children,
}: {
  judul: string;
  sub: string;
  catatan: string;
  children: ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__wrap">
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
          Kembali ke situs
        </a>

        <div className="auth__card">
          <aside className="auth__aside">
            <a className="auth__brand" href="/">
              <img src="/logo-96.png" alt="" width={40} height={40} />
              <span>
                Bank Sampah Syariah <em>UINSA</em>
              </span>
            </a>

            <div className="auth__pitch">
              <h2>Sampah kampus, jadi saldo.</h2>
              <p>
                Setoran ditimbang di depan nasabah, dicatat di buku tabungan,
                lalu berubah jadi rupiah yang bisa diambil kapan saja.
              </p>
              <ul>
                <li>Tanpa bunga, tanpa potongan.</li>
                <li>Sebagian saldo boleh jadi sedekah.</li>
                <li>Pencairan tunai di sekretariat FEBI.</li>
              </ul>
            </div>

            <p className="auth__note">{catatan}</p>
          </aside>

          <section className="auth__form" aria-labelledby="auth-judul">
            <header className="auth__head">
              <h1 className="auth__title" id="auth-judul">
                {judul}
              </h1>
              <p className="auth__sub">{sub}</p>
            </header>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
