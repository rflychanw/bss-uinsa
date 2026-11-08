"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  formatMetodePenarikan,
  getDaftarPenarikan,
  getDaftarSetoran,
  hitungRingkasanSaldoNasabah,
  kg,
  MINIMAL_PENARIKAN_RP,
  NASABAH_DEMO,
  RIWAYAT_SETORAN_AWAL,
  rp,
  tambahPenarikan,
  type MetodePenarikan,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../../lib/bss";
import { sesiSekarang, type Sesi } from "../../../lib/auth";
import LembarBukuTabungan from "../../../components/app/LembarBukuTabungan";

export default function RiwayatNasabah() {
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [tabUtama, setTabUtama] = useState<"setoran" | "penarikan" | "buku">("setoran");
  const [filterSetoran, setFilterSetoran] = useState<
    "semua" | "terverifikasi" | "menunggu_verifikasi"
  >("semua");
  const [semuaSetoranState, setSemuaSetoranState] =
    useState<SetoranNasabah[]>(RIWAYAT_SETORAN_AWAL);
  const [daftarPenarikan, setDaftarPenarikan] = useState<PenarikanUang[]>([]);
  const [tampilSemuaSetoran, setTampilSemuaSetoran] = useState(false);
  const [tampilSemuaPenarikan, setTampilSemuaPenarikan] = useState(false);

  const [nominalTarik, setNominalTarik] = useState<number>(10000);
  const [metodeTarik, setMetodeTarik] = useState<MetodePenarikan>("ewallet");
  const [namaPenyedia, setNamaPenyedia] = useState<string>("DANA");
  const [nomorTujuan, setNomorTujuan] = useState<string>("081234567890");
  const [notifTarik, setNotifTarik] = useState<string>("");
  const [errorTarik, setErrorTarik] = useState<string>("");

  const idNominal = useId();
  const idPenyedia = useId();
  const idNomorTujuan = useId();

  useEffect(() => {
    setSesi(sesiSekarang());
    setSemuaSetoranState(getDaftarSetoran());
    setDaftarPenarikan(getDaftarPenarikan());
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "penarikan") {
        setTabUtama("penarikan");
      } else if (params.get("tab") === "buku") {
        setTabUtama("buku");
      }
    }
  }, []);

  const noNasabah = sesi?.nomor || "BSS-0142";
  const namaNasabah = sesi?.nama || NASABAH_DEMO.nama;

  const ringkasanSaldo = useMemo(() => {
    return hitungRingkasanSaldoNasabah(noNasabah);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noNasabah, semuaSetoranState, daftarPenarikan]);

  const setoranMilikNasabah = useMemo(() => {
    return semuaSetoranState.filter((s) => s.nomorNasabah === noNasabah);
  }, [semuaSetoranState, noNasabah]);

  const daftarSetoran = useMemo(() => {
    if (filterSetoran === "semua") return setoranMilikNasabah;
    if (filterSetoran === "menunggu_verifikasi") {
      return setoranMilikNasabah.filter(
        (s) => s.statusVerifikasi === "menunggu_verifikasi"
      );
    }
    return setoranMilikNasabah.filter(
      (s) => s.statusVerifikasi !== "menunggu_verifikasi"
    );
  }, [filterSetoran, setoranMilikNasabah]);

  const setoranTampil = tampilSemuaSetoran
    ? daftarSetoran
    : daftarSetoran.slice(0, 3);

  const totalBerat = daftarSetoran.reduce((s, r) => s + r.beratKg, 0);
  const totalNilai = daftarSetoran.reduce(
    (s, r) => s + (r.nilaiRealisasi ?? r.estimasiNilai),
    0
  );

  const penarikanNasabah = useMemo(() => {
    return daftarPenarikan.filter((p) => p.nomorNasabah === noNasabah);
  }, [daftarPenarikan, noNasabah]);

  const penarikanTampil = tampilSemuaPenarikan
    ? penarikanNasabah
    : penarikanNasabah.slice(0, 3);

  const handlePilihMetode = (m: MetodePenarikan) => {
    setMetodeTarik(m);
    if (m === "bank") {
      setNamaPenyedia("Bank BSI");
      setNomorTujuan("7182930412");
    } else if (m === "ewallet") {
      setNamaPenyedia("DANA");
      setNomorTujuan("081234567890");
    }
  };

  const handleAjukanTarikSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTarik("");
    setNotifTarik("");

    if (nominalTarik < MINIMAL_PENARIKAN_RP) {
      setErrorTarik(`Minimal penarikan adalah ${rp(MINIMAL_PENARIKAN_RP)}.`);
      return;
    }

    if (nominalTarik > ringkasanSaldo.saldoTersedia) {
      setErrorTarik(
        `Saldo aktif (${rp(ringkasanSaldo.saldoTersedia)}) tidak mencukupi.`
      );
      return;
    }

    if (metodeTarik !== "tunai" && !nomorTujuan.trim()) {
      setErrorTarik("Masukkan nomor rekening atau akun tujuan.");
      return;
    }

    const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const isTunai = metodeTarik === "tunai";
    const infoTujuan = isTunai
      ? "Tunai di Pos Jaga"
      : `${namaPenyedia} · ${nomorTujuan.trim()}`;

    const baru = tambahPenarikan({
      nomorNasabah: noNasabah,
      namaNasabah,
      tanggal: tanggalHariIni,
      nominal: nominalTarik,
      metode: metodeTarik,
      tujuan: infoTujuan,
      catatan: "Penarikan saldo tabungan",
      status: "menunggu",
      petugas: "Menunggu Validasi Petugas / Kasir BSS",
    });

    setDaftarPenarikan(getDaftarPenarikan());
    setNotifTarik(
      `Pengajuan penarikan ${baru.id} (${rp(nominalTarik)}) berhasil dikirim dengan status Menunggu Validasi Petugas.`
    );
  };

  return (
    <div className="dsh__page">
      <header className="dsh__head dsh__head--split">
        <div>
          <h1 className="dsh__h1">Riwayat & Penarikan</h1>
          <p className="dsh__sub">
            Mutasi setoran dan pencairan saldo <strong>{namaNasabah}</strong> ({noNasabah})
          </p>
        </div>
        <button
          type="button"
          className="dsh__btnoutline no-print"
          onClick={() => window.print()}
        >
          Cetak
        </button>
      </header>

      <div className="dsh__filtertabs no-print" role="tablist">
        <button
          type="button"
          className="dsh__filtertab"
          data-active={tabUtama === "setoran"}
          onClick={() => setTabUtama("setoran")}
          role="tab"
          aria-selected={tabUtama === "setoran"}
        >
          Setoran Sampah ({setoranMilikNasabah.length})
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={tabUtama === "penarikan"}
          onClick={() => setTabUtama("penarikan")}
          role="tab"
          aria-selected={tabUtama === "penarikan"}
        >
          Penarikan Saldo ({penarikanNasabah.length})
        </button>
        <button
          type="button"
          className="dsh__filtertab"
          data-active={tabUtama === "buku"}
          onClick={() => setTabUtama("buku")}
          role="tab"
          aria-selected={tabUtama === "buku"}
        >
          📖 Lembar Buku Tabungan
        </button>
      </div>

      {tabUtama === "setoran" && (
        <section className="dsh__card" aria-label="Tabel Riwayat Setoran">
          <div className="dsh__cardhead">
            <div>
              <h2 className="dsh__h2">Mutasi Setoran</h2>
              <p className="dsh__carddesc" style={{ margin: "2px 0 0" }}>
                Total: <strong>{kg(totalBerat)}</strong> · <strong>{rp(totalNilai)}</strong>
              </p>
            </div>

            <div className="dsh__filtertabs no-print" style={{ marginBottom: 0 }}>
              {(
                [
                  { id: "semua", label: "Semua" },
                  { id: "terverifikasi", label: "Valid" },
                  { id: "menunggu_verifikasi", label: "Menunggu" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="dsh__filtertab"
                  style={{ padding: "5px 10px", fontSize: "12px" }}
                  data-active={filterSetoran === f.id}
                  onClick={() => {
                    setFilterSetoran(f.id);
                    setTampilSemuaSetoran(false);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dsh__rows">
            {setoranTampil.map((r) => {
              const belumVerif = r.statusVerifikasi === "menunggu_verifikasi";
              const nilaiRp = r.nilaiRealisasi ?? r.estimasiNilai;
              return (
                <div key={r.id} className="dsh__row">
                  <div className="dsh__rowmain">
                    <strong>{r.jenisSampahNama}</strong>
                    <span className="dsh__subtext">
                      {r.tanggal} · {r.jumlahSatuan || kg(r.beratKg)} · {r.id}
                    </span>
                  </div>
                  <div className="dsh__rowval">
                    <b className={belumVerif ? "dsh__amber" : "dsh__green"}>
                      +{rp(nilaiRp)}
                    </b>
                    <span
                      className={`dsh__chip ${
                        belumVerif ? "dsh__chip--amber" : "dsh__chip--green"
                      }`}
                    >
                      {belumVerif ? "Menunggu Verifikasi" : "Terverifikasi"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {daftarSetoran.length > 3 && (
            <button
              type="button"
              className="dsh__expandbtn no-print"
              onClick={() => setTampilSemuaSetoran((prev) => !prev)}
            >
              {tampilSemuaSetoran
                ? "Ringkas Daftar Setoran ↑"
                : `Lihat Lengkap (${daftarSetoran.length} Setoran) ↓`}
            </button>
          )}
        </section>
      )}

      {tabUtama === "penarikan" && (
        <>
          {notifTarik && (
            <div className="dsh__alert dsh__alert--success" role="alert">
              {notifTarik}
            </div>
          )}

          {errorTarik && (
            <div
              className="dsh__alert"
              role="alert"
              style={{
                background: "#fdf2f2",
                border: "1px solid #f2c6c6",
                color: "#9b1c1c",
              }}
            >
              {errorTarik}
            </div>
          )}

          <div className="dsh__split">
            <section
              className="dsh__card no-print"
              aria-label="Form Tarik Saldo Nasabah"
            >
              <div className="dsh__cardhead">
                <h2 className="dsh__h2">Cairkan Saldo</h2>
                <span className="dsh__meta">
                  Tersedia: <strong className="dsh__green">{rp(ringkasanSaldo.saldoTersedia)}</strong>
                </span>
              </div>

              <div
                className="dsh__filtertabs"
                style={{ marginBottom: "10px" }}
                role="tablist"
              >
                {(
                  [
                    { id: "ewallet", label: "E-Wallet" },
                    { id: "bank", label: "Bank" },
                    { id: "tunai", label: "Tunai Pos" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="dsh__filtertab"
                    style={{ flex: 1, textAlign: "center", padding: "6px 10px" }}
                    data-active={metodeTarik === m.id}
                    onClick={() => handlePilihMetode(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAjukanTarikSaldo} className="dsh__form">
                {metodeTarik !== "tunai" ? (
                  <div className="dsh__grid2" style={{ gap: "10px" }}>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idPenyedia}>
                        {metodeTarik === "ewallet" ? "Penyedia" : "Bank"}
                      </label>
                      <select
                        id={idPenyedia}
                        className="dsh__select"
                        value={namaPenyedia}
                        onChange={(e) => setNamaPenyedia(e.target.value)}
                      >
                        {metodeTarik === "ewallet" ? (
                          <>
                            <option value="DANA">DANA</option>
                            <option value="GoPay">GoPay</option>
                            <option value="OVO">OVO</option>
                            <option value="ShopeePay">ShopeePay</option>
                          </>
                        ) : (
                          <>
                            <option value="Bank BSI">Bank BSI</option>
                            <option value="Bank Mandiri">Bank Mandiri</option>
                            <option value="Bank BRI">Bank BRI</option>
                            <option value="Bank BCA">Bank BCA</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="dsh__field">
                      <label className="dsh__label" htmlFor={idNomorTujuan}>
                        {metodeTarik === "ewallet" ? "Nomor HP" : "No. Rekening"}
                      </label>
                      <input
                        id={idNomorTujuan}
                        type="text"
                        required
                        className="dsh__input"
                        value={nomorTujuan}
                        onChange={(e) => setNomorTujuan(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="dsh__subtext" style={{ margin: 0 }}>
                    Pencairan tunai divalidasi oleh Petugas Jaga di meja pelayanan.
                  </p>
                )}

                <div className="dsh__field">
                  <label className="dsh__label" htmlFor={idNominal}>
                    Nominal (Min. {rp(MINIMAL_PENARIKAN_RP)})
                  </label>
                  <input
                    id={idNominal}
                    type="number"
                    min={MINIMAL_PENARIKAN_RP}
                    max={Math.max(
                      MINIMAL_PENARIKAN_RP,
                      ringkasanSaldo.saldoTersedia
                    )}
                    step="500"
                    required
                    className="dsh__input"
                    value={nominalTarik}
                    onChange={(e) => setNominalTarik(Number(e.target.value))}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {[2000, 5000, 10000, 20000, 50000].map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setNominalTarik(nom)}
                        style={{
                          padding: "4px 9px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border:
                            nominalTarik === nom
                              ? "1px solid #17140f"
                              : "1px solid #dcdad3",
                          background:
                            nominalTarik === nom ? "#17140f" : "#ffffff",
                          color: nominalTarik === nom ? "#ffffff" : "#4a4436",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {rp(nom)}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="dsh__btn">
                  {metodeTarik === "tunai"
                    ? `Ajukan Tarik Tunai ${rp(nominalTarik)}`
                    : `Cairkan ${rp(nominalTarik)}`}
                </button>
              </form>
            </section>

            <section
              className="dsh__card"
              aria-label="Tabel Riwayat Penarikan Saldo"
            >
              <div className="dsh__cardhead">
                <h2 className="dsh__h2">Riwayat Penarikan</h2>
                <span className="dsh__meta">
                  Total: <strong>{rp(ringkasanSaldo.totalDitarikSelesai)}</strong>
                </span>
              </div>

              <div className="dsh__rows">
                {penarikanTampil.length === 0 ? (
                  <p className="dsh__empty">Belum ada riwayat penarikan.</p>
                ) : (
                  penarikanTampil.map((p) => {
                    const isMenunggu = p.status === "menunggu";
                    return (
                      <div key={p.id} className="dsh__row">
                        <div className="dsh__rowmain">
                          <strong>
                            {p.tujuan || formatMetodePenarikan(p.metode)}
                          </strong>
                          <span className="dsh__subtext">
                            {p.tanggal} · {p.id}
                          </span>
                        </div>
                        <div className="dsh__rowval">
                          <b className={isMenunggu ? "dsh__amber" : "dsh__green"}>
                            -{rp(p.nominal)}
                          </b>
                          <span
                            className={`dsh__chip ${
                              isMenunggu
                                ? "dsh__chip--amber"
                                : "dsh__chip--green"
                            }`}
                          >
                            {isMenunggu ? "Menunggu" : "Selesai"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {penarikanNasabah.length > 3 && (
                <button
                  type="button"
                  className="dsh__expandbtn no-print"
                  onClick={() => setTampilSemuaPenarikan((prev) => !prev)}
                >
                  {tampilSemuaPenarikan
                    ? "Ringkas Riwayat Penarikan ↑"
                    : `Lihat Lengkap (${penarikanNasabah.length} Penarikan) ↓`}
                </button>
              )}
            </section>
          </div>
        </>
      )}

      {tabUtama === "buku" && (
        <section aria-label="Lembar Tabungan Nasabah">
          <LembarBukuTabungan
            nomorNasabahProp={noNasabah}
            namaNasabahProp={namaNasabah}
            showToolbar={true}
          />
        </section>
      )}
    </div>
  );
}
