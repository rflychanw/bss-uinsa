"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import KalkulatorPintar, { type ItemKalkulatorHasil } from "../../../components/app/KalkulatorPintar";
import {
  DAFTAR_NASABAH_MASTER,
  getDaftarNasabahMaster,
  getDaftarSetoran,
  kg,
  rp,
  tambahBanyakSetoranBaru,
  type JenisSampah,
  type SetoranNasabah,
} from "../../../lib/bss";
import { sesiSekarang } from "../../../lib/auth";

export default function SetoranAdmin() {
  const [daftarNasabah, setDaftarNasabah] = useState(() =>
    getDaftarNasabahMaster()
  );
  const [nasabahTerpilih, setNasabahTerpilih] = useState(
    DAFTAR_NASABAH_MASTER[0].nomor
  );
  const [suksesMsg, setSuksesMsg] = useState<string>("");

  const idSelectNasabah = useId();

  useEffect(() => {
    const list = getDaftarNasabahMaster();
    setDaftarNasabah(list);
    if (list.length > 0) {
      setNasabahTerpilih(list[0].nomor);
    }
  }, []);

  const handleSimpanSetoran = (data: {
    items?: ItemKalkulatorHasil[];
    langsungVerifikasi?: boolean;
    jenis: JenisSampah;
    beratKg: number;
    estimasiRp: number;
  }) => {
    const list: ItemKalkulatorHasil[] =
      data.items && data.items.length > 0
        ? data.items
        : [
            {
              jenis: data.jenis,
              beratKg: data.beratKg,
              jumlahSatuan: `${data.beratKg} kg`,
              estimasiRp: data.estimasiRp,
            },
          ];

    const validItems = list.filter((it) => it.beratKg > 0);
    if (validItems.length === 0) {
      alert("Berat / jumlah sampah harus lebih besar dari 0.");
      return;
    }

    const targetNasabah =
      daftarNasabah.find((n) => n.nomor === nasabahTerpilih) ||
      daftarNasabah[0];

    const sesi = sesiSekarang();
    const namaPencatat = sesi?.nama || "Ahmad Fauzi (Petugas Piket)";
    const statusVerif =
      data.langsungVerifikasi === false ? "menunggu_verifikasi" : "terverifikasi";

    const tanggalHariIni = "09 Nov 2026";

    const currentLen = getDaftarSetoran().length;
    const newEntries: SetoranNasabah[] = validItems.map((it, idx) => ({
      id: `S-0${914 + currentLen + idx}`,
      nomorNasabah: targetNasabah.nomor,
      namaNasabah: targetNasabah.nama,
      tanggal: tanggalHariIni,
      jenisSampahId: it.jenis.id,
      jenisSampahNama: `${it.jenis.kode} · ${it.jenis.nama}`,
      beratKg: it.beratKg,
      jumlahSatuan: it.jumlahSatuan,
      estimasiNilai: it.estimasiRp,
      status: "belum_terjual",
      statusVerifikasi: statusVerif,
      dicatatOleh: namaPencatat,
    }));

    tambahBanyakSetoranBaru(newEntries);
    setDaftarNasabah(getDaftarNasabahMaster());

    const totalEst = validItems.reduce((acc, c) => acc + c.estimasiRp, 0);
    const totalKgVal = validItems.reduce((acc, c) => acc + c.beratKg, 0);

    setSuksesMsg(
      `${validItems.length} jenis sampah (${kg(totalKgVal)} = ${rp(
        totalEst
      )}) berhasil dicatat untuk ${targetNasabah.nama} (${
        targetNasabah.nomor
      }). Status keaktifan nasabah kini AKTIF.`
    );

    setTimeout(() => {
      setSuksesMsg("");
    }, 7000);
  };

  return (
    <div className="dsh__page">
      <header
        className="dsh__head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Petugas Jaga Piket</span>
            <span className="dsh__dot" aria-hidden="true">
              •
            </span>
            <span className="dsh__meta">Pos Meja Timbang BSS FEBI UINSA</span>
          </div>
          <h1 className="dsh__h1">Tambah Pencatatan Setoran</h1>
          <p className="dsh__sub">
            Input hasil penimbangan sampah nasabah di meja timbang. Nasabah yang tidak aktif (&gt; 1 bulan) akan otomatis kembali aktif setelah menyetor sampah.
          </p>
        </div>
        <div>
          <Link
            href="/admin"
            className="dsh__btnoutline"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              padding: "8px 14px",
            }}
          >
            ← Lihat Riwayat Pencatatan
          </Link>
        </div>
      </header>

      {suksesMsg && (
        <div
          className="dsh__alert dsh__alert--success"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          <strong>Berhasil Disimpan:</strong> {suksesMsg}
        </div>
      )}

      {/* Formulir Pencatatan & Kalkulator Pintar Petugas */}
      <section className="dsh__card" aria-label="Formulir Penimbangan Setoran">
        <div className="dsh__cardhead">
          <div>
            <h2 className="dsh__h2">Input Timbangan &amp; Kalkulator Pintar</h2>
            <p className="dsh__carddesc" style={{ marginBottom: 0 }}>
              Pilih nasabah yang sedang berada di meja timbang, lalu masukkan hasil timbangan.
            </p>
          </div>
        </div>

        <div className="dsh__formsection">
          <div className="dsh__field">
            <label className="dsh__label" htmlFor={idSelectNasabah}>
              Pilih Nasabah di Meja Timbang
            </label>
            <select
              id={idSelectNasabah}
              className="dsh__select"
              value={nasabahTerpilih}
              onChange={(e) => setNasabahTerpilih(e.target.value)}
            >
              {daftarNasabah.map((n) => (
                <option key={n.nomor} value={n.nomor}>
                  {n.nomor} — {n.nama} ({n.aktif ? "Aktif" : "Tidak Aktif > 1 Bln"})
                </option>
              ))}
            </select>
          </div>

          <KalkulatorPintar
            mode="petugas"
            onPilih={(data) => handleSimpanSetoran(data)}
          />
        </div>
      </section>
    </div>
  );
}
