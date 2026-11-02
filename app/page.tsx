import Reveal from "@/components/Reveal";
import SiteHeader from "@/components/SiteHeader";
import HeroCarousel from "@/components/HeroCarousel";
import Steps from "@/components/Steps";
import Calculator from "@/components/Calculator";
import Motif from "@/components/Motif";

const IG = "https://www.instagram.com/bss_uinsa/";

export default function Home() {
  return (
    <>
      <Reveal />

      <SiteHeader />

      <main id="top">
        {/* ---------------- hero ---------------- */}
        <section className="hero">
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <h1 className="hero__title" data-reveal>
                Sampah kampus, jadi saldo.
              </h1>
              <p className="hero__lede" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
                Bank Sampah Syariah UIN Sunan Ampel Surabaya menimbang sampah
                anorganikmu, mencatatnya di buku tabungan, lalu mengubahnya jadi
                rupiah.
              </p>
              <div className="hero__act" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
                <a className="btn btn--amber" href="#hitung">
                  Hitung nilai sampahmu
                </a>
                <a className="link" href="#cara">
                  Cara setor
                </a>
              </div>
              <p className="hero__note" data-reveal style={{ "--d": "210ms" } as React.CSSProperties}>
                Layanan di lingkungan FEBI, Jl. Ahmad Yani 117, Surabaya.
              </p>
            </div>

            <HeroCarousel />
          </div>
        </section>

        {/* ---------------- cara kerja ---------------- */}
        <section className="cara" id="cara">
          <div className="wrap">
            <Steps />
          </div>
        </section>

        {/* ---------------- kalkulator ---------------- */}
        <section className="hitung" id="hitung">
          <div className="wrap hitung__grid">
            <div>
              <h2 className="hitung__h" data-reveal>
                Hitung dulu, baru berangkat.
              </h2>
              <p className="hitung__p" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
                Timbang kasar di rumah, masukkan beratnya di sini, dan kamu tahu
                kira-kira berapa yang akan tercatat di buku tabungan sebelum
                berangkat ke sekretariat.
              </p>
              <p className="hitung__note" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
                Angka di atas kisaran harga yang berlaku di bank sampah kampus.
                Nilai akhir ditetapkan petugas saat penimbangan dan mengikuti
                harga pengepul pekan itu.
              </p>

              <div className="hitung__no" data-reveal style={{ "--d": "210ms" } as React.CSSProperties}>
                <h3>Yang tidak kami terima</h3>
                <ul>
                  <li>Sampah organik, sisa makanan, dan daun dari halaman</li>
                  <li>Popok bayi, pembalut, dan masker sekali pakai</li>
                  <li>Baterai bekas, lampu, dan limbah B3 rumah tangga</li>
                </ul>
              </div>
            </div>
            <Calculator />
          </div>
        </section>

        {/* ---------------- program ---------------- */}
        <section className="program" id="program">
          <div className="wrap">
            <p className="program__stmt" data-reveal>
              Menabung sampah kantin{" "}
              <img src="/img/plastik.jpg" alt="Bal botol PET di gudang daur ulang" width={48} height={48} />,
              menyedekahkan hasilnya{" "}
              <img src="/img/kaleng.jpg" alt="Kaleng aluminium yang digepengkan" width={48} height={48} />,
              lalu mengolah plastik bersih jadi kerajinan.
            </p>

            <div className="program__tail">
              <p data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
                Yang dibutuhkan cuma sampah kering yang sudah dipilah dan satu
                kantong yang tidak bocor. Sisanya urusan timbangan.
              </p>
              <a
                className="btn btn--ink"
                href={IG}
                target="_blank"
                rel="noreferrer"
                data-reveal
                style={{ "--d": "140ms" } as React.CSSProperties}
              >
                Tanya program
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- syariah ---------------- */}
        <section className="syariah" id="syariah">
          <div className="wrap syariah__grid">
            <h2 className="syariah__h" data-reveal>
              Syariah itu cara menimbang, bukan label.
            </h2>

            <div className="syariah__b" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
              <h3>Timbangan terbuka</h3>
              <p>
                Berat dibaca di depan nasabah dan ditulis di buku tabungan, jadi
                tidak ada potongan yang muncul belakangan.
              </p>
            </div>

            <div className="syariah__b" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
              <h3>Nilai tanpa bunga</h3>
              <p>
                Saldo sampah tidak berbunga dan tidak dipinjamkan dengan bunga.
                Sebagian hasil bisa kamu salurkan sebagai sedekah lewat kas BSS.
              </p>
            </div>

            <div className="syariah__b" data-reveal style={{ "--d": "210ms" } as React.CSSProperties}>
              <h3>Akad titip jual</h3>
              <p>
                Sampah yang kamu setor dijual bersama, bukan dibeli putus di
                muka. Hasilnya kembali ke nasabah sesuai berat yang tercatat.
              </p>
            </div>

            <img
              className="syariah__pic"
              src="/img/setor.jpg"
              alt="Meja layanan bank sampah dengan karung dan timbangan"
              width={300}
              height={300}
              loading="lazy"
            />

            <div className="syariah__act" data-reveal style={{ "--d": "280ms" } as React.CSSProperties}>
              <a className="btn btn--paper" href={IG} target="_blank" rel="noreferrer">
                Tanya soal akad
              </a>
            </div>
          </div>
        </section>

        {/* ---------------- kunjungi ---------------- */}
        <section className="kunjungi" id="kunjungi">
          <div className="wrap kunjungi__grid">
            <div className="kunjungi__copy">
              <h2 className="kunjungi__h" data-reveal>
                Bawa sampahmu ke FEBI.
              </h2>

              <dl className="facts" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
                <div className="fact">
                  <dt>Alamat</dt>
                  <dd>
                    Gedung FEBI, UIN Sunan Ampel Surabaya
                    <br />
                    <span>Jl. Ahmad Yani 117, Surabaya</span>
                  </dd>
                </div>
                <div className="fact">
                  <dt>Jam layanan</dt>
                  <dd>
                    Mengikuti jam kerja fakultas
                    <br />
                    <span>Konfirmasi lewat Instagram sebelum datang</span>
                  </dd>
                </div>
                <div className="fact">
                  <dt>Kontak</dt>
                  <dd>
                    <a className="link" href={IG} target="_blank" rel="noreferrer">
                      @bss_uinsa
                    </a>
                    <br />
                    <span>Instagram pengurus BSS UINSA</span>
                  </dd>
                </div>
              </dl>

              <a
                className="btn btn--green"
                href={IG}
                target="_blank"
                rel="noreferrer"
                data-reveal
                style={{ "--d": "140ms" } as React.CSSProperties}
              >
                Buka Instagram
              </a>
            </div>

            <figure className="kunjungi__fig" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
              <img
                src="/img/tempat.jpg"
                alt="Masjid Ampel di Surabaya, penanda kawasan di sekitar kampus"
                width={400}
                height={400}
                loading="lazy"
              />
              <figcaption>
                Masjid Ampel, penanda kawasan tempat kampus ini berdiri — beberapa
                menit dari Jl. Ahmad Yani.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ---------------- faq ---------------- */}
        <section className="faq" id="tanya">
          <div className="wrap faq__grid">
            <div className="faq__intro">
              <h2 className="faq__h" data-reveal>
                Yang sering ditanya.
              </h2>

              <p className="faq__note" data-reveal style={{ "--d": "70ms" } as React.CSSProperties}>
                Belum terjawab? Tanya langsung lewat{" "}
                <a href={IG} target="_blank" rel="noreferrer">
                  Instagram BSS
                </a>
                .
              </p>

              <nav className="faq__toc" aria-label="Kelompok pertanyaan" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
                <a href="#qa-setor">Setor sampah</a>
                <a href="#qa-saldo">Saldo dan hasil</a>
                <a href="#qa-akad">Akad</a>
              </nav>
            </div>

            <div className="faq__list">
              <div className="faq__group" id="qa-setor">
                <h3 className="faq__glabel" data-reveal>Setor sampah</h3>
                <details className="faq__item" data-reveal>
                  <summary>Sampah apa saja yang diterima?</summary>
                  <p>
                    Plastik (botol, gelas, kemasan), kertas dan kardus, kaleng dan
                    logam, serta kaca. Sampah organik dan limbah berbahaya seperti
                    baterai tidak diterima di sekretariat.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "50ms" } as React.CSSProperties}>
                  <summary>Harus mahasiswa UINSA?</summary>
                  <p>
                    Tidak. Warga sekitar dan tamu kampus boleh menabung. Setiap
                    nasabah dicatat dengan nomor sendiri supaya saldonya tidak
                    tertukar.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "100ms" } as React.CSSProperties}>
                  <summary>Ada minimal setoran?</summary>
                  <p>
                    Tidak ada. Satu kantong sampah terpilah tetap ditimbang dan
                    dicatat di buku tabungan.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "150ms" } as React.CSSProperties}>
                  <summary>Baru pertama kali, alurnya bagaimana?</summary>
                  <p>
                    Bawa sampah kering pertamamu ke sekretariat. Petugas menimbang
                    di depanmu, mencatat berat di buku tabungan, lalu menjelaskan
                    akadnya. Setelah itu kamu punya nomor nasabah sendiri.
                  </p>
                </details>
              </div>

              <div className="faq__group" id="qa-saldo">
                <h3 className="faq__glabel" data-reveal>Saldo dan hasil</h3>
                <details className="faq__item" data-reveal>
                  <summary>Kapan saldo bisa diambil?</summary>
                  <p>
                    Pada hari layanan, setelah penimbangan dicatat. Bisa tunai, bisa
                    juga dialihkan untuk sedekah lewat kas BSS.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "50ms" } as React.CSSProperties}>
                  <summary>Apakah ada bunga atau potongan?</summary>
                  <p>
                    Tidak ada bunga. Berat dibaca di depan nasabah dan ditulis di
                    buku tabungan, jadi tidak ada potongan yang muncul belakangan.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "100ms" } as React.CSSProperties}>
                  <summary>Bisa dialihkan untuk sedekah?</summary>
                  <p>
                    Bisa. Sebagian hasil setoran dapat kamu salurkan sebagai sedekah
                    lewat kas BSS, dan sisanya tetap jadi saldo tabunganmu.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "150ms" } as React.CSSProperties}>
                  <summary>Bagaimana harga sampah ditentukan?</summary>
                  <p>
                    Tiap jenis punya harga per kilogram dan daftarnya ada di
                    kalkulator di halaman ini. Jenis dan kondisi menentukan
                    harganya, jadi plastik bening berbeda dengan plastik warna.
                  </p>
                </details>
              </div>

              <div className="faq__group" id="qa-akad">
                <h3 className="faq__glabel" data-reveal>Akad</h3>
                <details className="faq__item" data-reveal>
                  <summary>Kenapa disebut bank sampah syariah?</summary>
                  <p>
                    Karena akadnya titip jual: sampah yang kamu setor dijual
                    bersama, lalu hasilnya kembali ke nasabah sesuai berat yang
                    tercatat — tanpa bunga dan tanpa potongan yang tidak
                    dijelaskan.
                  </p>
                </details>
                <details className="faq__item" data-reveal style={{ "--d": "50ms" } as React.CSSProperties}>
                  <summary>Sampahku dibeli putus atau dititipkan?</summary>
                  <p>
                    Dititipkan untuk dijual bersama, bukan dibeli putus di muka.
                    Hasil penjualan kembali ke nasabah sesuai berat yang tercatat
                    saat penimbangan.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- cta ---------------- */}
        <section className="cta">
          <div className="wrap cta__in">
            <h2 className="cta__h" data-reveal>
              Mulai dari satu kantong.
            </h2>
            <div className="cta__act" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
              <a className="btn btn--ink" href={IG} target="_blank" rel="noreferrer">
                DM @bss_uinsa
              </a>
              <p>Bawa sampah kering pertamamu ke sekretariat, atau tanya dulu lewat Instagram.</p>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="ftr">
        <div className="ftr__motif" aria-hidden="true">
          <Motif uid="ftr" dots={false} />
        </div>

        <div className="wrap">
          <div className="ftr__grid">
            <div className="ftr__brand">
              <img src="/logo-96.png" alt="" width={44} height={44} />
              <p>
                <strong>Bank Sampah Syariah UINSA</strong>
                Laboratorium FEBI, UIN Sunan Ampel Surabaya.
                <br />
                Jl. Ahmad Yani 117, Surabaya.
              </p>
            </div>

            <div className="ftr__col">
              <h3>Halaman</h3>
              <ul>
                <li>
                  <a href="#cara">Cara kerja</a>
                </li>
                <li>
                  <a href="#hitung">Harga sampah</a>
                </li>
                <li>
                  <a href="#program">Program</a>
                </li>
                <li>
                  <a href="#tanya">Tanya jawab</a>
                </li>
              </ul>
            </div>

            <div className="ftr__col">
              <h3>Lainnya</h3>
              <ul>
                <li>
                  <a href={IG} target="_blank" rel="noreferrer">
                    Instagram @bss_uinsa
                  </a>
                </li>
                <li>
                  <a href="https://uinsa.ac.id" target="_blank" rel="noreferrer">
                    UIN Sunan Ampel
                  </a>
                </li>
                <li>
                  <a href="https://febi.uinsa.ac.id" target="_blank" rel="noreferrer">
                    FEBI UINSA
                  </a>
                </li>
              </ul>
            </div>

            <div className="ftr__col">
              <h3>Akun</h3>
              <ul>
                <li>
                  <a href="/masuk">Masuk</a>
                </li>
                <li>
                  <a href="/daftar">Daftar jadi nasabah</a>
                </li>
                <li>
                  <a href="/nasabah">Ruang nasabah</a>
                </li>
                <li>
                  <a href="/admin">Ruang petugas</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="ftr__foot">
            <p>
              © {new Date().getFullYear()} Bank Sampah Syariah UIN Sunan Ampel
              Surabaya.
            </p>
            <p className="credits">
              Foto:{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Bales_of_PET_bottles_closeup.jpg">
                “Bales of PET bottles closeup”
              </a>{" "}
              oleh Grendelkhan,{" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>;{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Bagian_Dalam_Bank_Sampah_Rukun_Asri_Desa_Kembaran_Kebumen.jpg">
                “Bagian Dalam Bank Sampah Rukun Asri”
              </a>{" "}
              oleh SATELIT BM9,{" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>;{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Recycling_center_operations_110804-F-VJ113-084.jpg">
                “Recycling center operations”
              </a>{" "}
              oleh Hayden Hyatt, domain publik;{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Crushed_cans_(9691248780).jpg">
                “Crushed cans”
              </a>{" "}
              oleh Ruth Hartnup,{" "}
              <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>;{" "}
              <a href="https://commons.wikimedia.org/wiki/File:Ampel_Mosque_in_2008.jpg">
                “Ampel Mosque in 2008”
              </a>{" "}
              oleh consigliere ivan,{" "}
              <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a> — semua
              via Wikimedia Commons.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
