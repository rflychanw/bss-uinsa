"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DAFTAR_NASABAH_MASTER,
  getDaftarPenarikan,
  getDaftarSetoran,
  kg,
  rp,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../lib/bss";
import { sesiSekarang } from "../../lib/auth";

type BarisBukuTabungan = {
  nomorUrut: number;
  tanggal: string;
  sandiDanBerat: string;
  debet: number | null;
  kredit: number | null;
  saldo: number;
  paraf: string;
  isPending?: boolean;
  rawDate: Date;
};

interface LembarBukuTabunganProps {
  nomorNasabahProp?: string;
  namaNasabahProp?: string;
  prodiFakultasProp?: string;
  showToolbar?: boolean;
}

const BULAN_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  ags: 7,
  sep: 8,
  okt: 9,
  nov: 10,
  des: 11,
};

function parseTanggalIndo(str: string): Date {
  if (!str) return new Date();
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 3) {
    const hari = parseInt(parts[0], 10) || 1;
    const bulanStr = parts[1].toLowerCase().slice(0, 3);
    const bulan = BULAN_MAP[bulanStr] ?? 0;
    const tahun = parseInt(parts[2], 10) || 2026;
    return new Date(tahun, bulan, hari);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatTanggalTabel(str: string): string {
  const d = parseTanggalIndo(str);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function formatAngkaTabel(n: number | null): string {
  if (n === null || n === undefined || n === 0) return "-";
  return rp(n);
}

export default function LembarBukuTabungan({
  nomorNasabahProp,
  namaNasabahProp,
  prodiFakultasProp,
  showToolbar = true,
}: LembarBukuTabunganProps) {
  const [, setMounted] = useState(false);
  const [nomorNasabah, setNomorNasabah] = useState(nomorNasabahProp || "BSS-0142");
  const [namaNasabah, setNamaNasabah] = useState(namaNasabahProp || "Aisyah Rahmawati");
  const [prodiFakultas, setProdiFakultas] = useState(prodiFakultasProp || "FEBI (Sistem Informasi)");
  const [semuaSetoran, setSemuaSetoran] = useState<SetoranNasabah[]>([]);
  const [semuaPenarikan, setSemuaPenarikan] = useState<PenarikanUang[]>([]);

  // State Search & Filter di Atas Tabel & Tab di Bawah Tabel
  const [kataKunci, setKataKunci] = useState<string>("");
  const [filterTipe, setFilterTipe] = useState<"semua" | "kredit" | "debet">("semua");

  useEffect(() => {
    const sesi = sesiSekarang();
    const targetNomor = nomorNasabahProp || sesi?.nomor || "BSS-0142";
    const master =
      DAFTAR_NASABAH_MASTER.find((n) => n.nomor === targetNomor) ||
      DAFTAR_NASABAH_MASTER[0];

    const sesiFakultas = sesi?.fakultas
      ? sesi.kategori === "umum"
        ? "Masyarakat Umum"
        : `${sesi.fakultas}${sesi.prodi ? ` (${sesi.prodi})` : ""}`
      : null;

    setNomorNasabah(targetNomor);
    setNamaNasabah(namaNasabahProp || sesi?.nama || master.nama);
    setProdiFakultas(prodiFakultasProp || sesiFakultas || master.fakultas);

    setSemuaSetoran(getDaftarSetoran());
    setSemuaPenarikan(getDaftarPenarikan());
    setMounted(true);
  }, [nomorNasabahProp, namaNasabahProp, prodiFakultasProp]);

  // Hitung baris transaksi kronologis lengkap
  const { barisTransaksi, runningSaldoAkhir, totalKredit, totalDebet } = useMemo(() => {
    const setoranMilikNasabah = semuaSetoran.filter(
      (s) => s.nomorNasabah === nomorNasabah
    );
    const penarikanMilikNasabah = semuaPenarikan.filter(
      (p) => p.nomorNasabah === nomorNasabah
    );

    type ItemGabungan = {
      tipe: "setoran" | "penarikan";
      tanggalStr: string;
      rawDate: Date;
      itemSetoran?: SetoranNasabah;
      itemPenarikan?: PenarikanUang;
    };

    const gabungan: ItemGabungan[] = [];

    setoranMilikNasabah.forEach((s) => {
      const isPending = s.statusVerifikasi === "menunggu_verifikasi";
      if (!isPending) {
        gabungan.push({
          tipe: "setoran",
          tanggalStr: s.tanggal,
          rawDate: parseTanggalIndo(s.tanggal),
          itemSetoran: s,
        });
      }
    });

    penarikanMilikNasabah.forEach((p) => {
      if (p.status === "selesai") {
        gabungan.push({
          tipe: "penarikan",
          tanggalStr: p.tanggal,
          rawDate: parseTanggalIndo(p.tanggal),
          itemPenarikan: p,
        });
      }
    });

    // Urutkan kronologis dari tanggal terlama ke terbaru
    gabungan.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    let saldoBerjalan = 0;
    let sumKredit = 0;
    let sumDebet = 0;

    const list: BarisBukuTabungan[] = gabungan.map((item, idx) => {
      if (item.tipe === "setoran") {
        const s = item.itemSetoran!;
        const nilai = s.nilaiRealisasi ?? s.estimasiNilai;
        saldoBerjalan += nilai;
        sumKredit += nilai;

        const beratStr = s.jumlahSatuan || kg(s.beratKg);
        const sandiKode = s.jenisSampahId || s.jenisSampahNama.split(" ")[0] || "ST";
        const labelSandi = `${sandiKode} · ${beratStr}`;

        const parafPetugas = s.dicatatOleh
          ? s.dicatatOleh
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
          : "AF";

        return {
          nomorUrut: idx + 1,
          tanggal: formatTanggalTabel(s.tanggal),
          sandiDanBerat: labelSandi,
          debet: null,
          kredit: nilai,
          saldo: saldoBerjalan,
          paraf: parafPetugas,
          rawDate: item.rawDate,
        };
      } else {
        const p = item.itemPenarikan!;
        const nominal = p.nominal;
        saldoBerjalan -= nominal;
        sumDebet += nominal;

        let sandiTarik = "TRK · Tunai Pos";
        if (p.metode === "ewallet") {
          sandiTarik = "TRK · E-Wallet";
        } else if (p.metode === "bank") {
          sandiTarik = "TRK · Transfer Bank";
        }

        const parafPetugas = p.petugas
          ? p.petugas.includes("Ahmad")
            ? "AF"
            : "BSS"
          : "BSS";

        return {
          nomorUrut: idx + 1,
          tanggal: formatTanggalTabel(p.tanggal),
          sandiDanBerat: sandiTarik,
          debet: nominal,
          kredit: null,
          saldo: Math.max(0, saldoBerjalan),
          paraf: parafPetugas,
          rawDate: item.rawDate,
        };
      }
    });

    return {
      barisTransaksi: list,
      runningSaldoAkhir: Math.max(0, saldoBerjalan),
      totalKredit: sumKredit,
      totalDebet: sumDebet,
    };
  }, [semuaSetoran, semuaPenarikan, nomorNasabah]);

  // Hitung jumlah mutasi per kategori
  const jumlahKredit = useMemo(
    () => barisTransaksi.filter((b) => b.kredit !== null).length,
    [barisTransaksi]
  );
  const jumlahDebet = useMemo(
    () => barisTransaksi.filter((b) => b.debet !== null).length,
    [barisTransaksi]
  );

  // Filter & Search baris yang tampil di tabel
  const barisTampil = useMemo(() => {
    let list = barisTransaksi;

    // Filter tipe mutasi (Kredit / Debet)
    if (filterTipe === "kredit") {
      list = list.filter((b) => b.kredit !== null);
    } else if (filterTipe === "debet") {
      list = list.filter((b) => b.debet !== null);
    }

    // Search kata kunci
    const q = kataKunci.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.sandiDanBerat.toLowerCase().includes(q) ||
          b.tanggal.toLowerCase().includes(q) ||
          b.paraf.toLowerCase().includes(q) ||
          (b.kredit && b.kredit.toString().includes(q)) ||
          (b.debet && b.debet.toString().includes(q)) ||
          b.saldo.toString().includes(q)
      );
    }

    return list;
  }, [barisTransaksi, filterTipe, kataKunci]);

  const handleCetak = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <section className="dsh__card" aria-label="Lembar Tabungan Nasabah" style={{ padding: "20px" }}>
      {/* ==============================================================
          1. HEADER KOP BUKU TABUNGAN:
             - POJOK KIRI ATAS: LOGO UINSA (ASLI SESUAI GAMBAR BUKU)
             - TENGAH: JUDUL "LEMBAR TABUNGAN NASABAH" + NO. REKENING, NASABAH, UNIT
             - POJOK KANAN ATAS: LOGO BSS UINSA
         ============================================================== */}
      <div
        className="dsh__tabunganhead"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          paddingBottom: "16px",
          borderBottom: "1.5px solid #dedad0",
          marginBottom: "16px",
        }}
      >
        {/* POJOK KIRI ATAS: LOGO UINSA */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-uinsa.png"
            alt="Logo UIN Sunan Ampel Surabaya"
            width={52}
            height={52}
            style={{
              width: "auto",
              height: "50px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* TENGAH: TULISAN LEMBAR TABUNGAN NASABAH & IDENTITAS REKENING */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(16px, 2.2vw, 20px)",
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#17140f",
              textTransform: "uppercase",
            }}
          >
            LEMBAR TABUNGAN NASABAH
          </h2>
          <div
            style={{
              marginTop: "5px",
              fontSize: "13px",
              color: "#544d3f",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px 8px",
            }}
          >
            <span>
              No. Rekening: <strong>{nomorNasabah}</strong>
            </span>
            <span>·</span>
            <span>
              Nasabah: <strong>{namaNasabah}</strong>
            </span>
            <span>·</span>
            <span>
              Unit: <strong>{prodiFakultas}</strong>
            </span>
          </div>
        </div>

        {/* POJOK KANAN ATAS: LOGO BSS UINSA */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-96.png"
            alt="Logo Bank Sampah Syariah UINSA"
            width={46}
            height={46}
            style={{
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ==============================================================
          2. DI ATAS TABEL: SEARCH DAN FILTER
         ============================================================== */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: "1px dashed #e8e5dc",
        }}
      >
        {/* SEARCH INPUT */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: "1 1 280px", maxWidth: "420px" }}>
          <input
            type="text"
            className="dsh__input dsh__input--sm"
            placeholder="Cari transaksi, sandi sampah, tanggal..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            style={{ width: "100%", background: "#ffffff" }}
          />
          {kataKunci && (
            <button
              type="button"
              className="dsh__btnoutline"
              style={{ padding: "4px 8px", fontSize: "12px", whiteSpace: "nowrap" }}
              onClick={() => setKataKunci("")}
            >
              Reset
            </button>
          )}
        </div>

        {/* FILTER DROPDOWN & CETAK */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#665f50", fontWeight: 600 }}>Filter:</span>
            <select
              className="dsh__select dsh__select--sm"
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value as any)}
              style={{ minWidth: "160px" }}
            >
              <option value="semua">Semua Mutasi ({barisTransaksi.length})</option>
              <option value="kredit">Kredit / Setoran Masuk (+)</option>
              <option value="debet">Debet / Penarikan Keluar (-)</option>
            </select>
          </div>

          {showToolbar && (
            <button
              type="button"
              className="dsh__btnoutline"
              style={{ fontSize: "12px", padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={handleCetak}
            >
              🖨️ Cetak
            </button>
          )}
        </div>
      </div>

      {/* ==============================================================
          3. TABEL MUTASI BUKU TABUNGAN (7 KOLOM STANDAR DASHBOARD)
         ============================================================== */}
      <div className="dsh__tablewrap">
        <table className="dsh__table">
          <thead>
            <tr>
              <th style={{ width: "6%", textAlign: "center" }}>NO.</th>
              <th style={{ width: "12%", textAlign: "center" }}>TGL.</th>
              <th style={{ width: "27%" }}>SANDI &amp; BERAT</th>
              <th style={{ width: "14%", textAlign: "right" }}>DEBET</th>
              <th style={{ width: "14%", textAlign: "right" }}>KREDIT</th>
              <th style={{ width: "16%", textAlign: "right" }}>SALDO</th>
              <th style={{ width: "11%", textAlign: "center" }}>PARAF</th>
            </tr>
          </thead>
          <tbody>
            {barisTampil.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#8c8270" }}>
                  {kataKunci
                    ? `Tidak ditemukan mutasi yang sesuai dengan "${kataKunci}".`
                    : "Belum ada transaksi tabungan yang tercatat untuk filter ini."}
                </td>
              </tr>
            ) : (
              barisTampil.map((b) => (
                <tr key={`row-${b.nomorUrut}`}>
                  <td style={{ textAlign: "center" }}>
                    <code className="dsh__code">{b.nomorUrut}</code>
                  </td>
                  <td style={{ textAlign: "center" }}>{b.tanggal}</td>
                  <td>
                    <strong>{b.sandiDanBerat}</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {b.debet ? (
                      <span style={{ color: "#9e2a2b", fontWeight: 600 }}>
                        -{formatAngkaTabel(b.debet)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {b.kredit ? (
                      <span className="dsh__green">+{formatAngkaTabel(b.kredit)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{rp(b.saldo)}</strong>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="dsh__chip dsh__chip--green" style={{ fontSize: "11px", fontWeight: 700 }}>
                      {b.paraf}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {barisTransaksi.length > 0 && (
            <tfoot style={{ background: "#f8f7f4", borderTop: "1.5px solid #dedad0" }}>
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={3} style={{ textAlign: "right", padding: "10px 16px" }}>
                  Total Akumulasi Buku:
                </td>
                <td style={{ textAlign: "right", padding: "10px 16px", color: "#9e2a2b" }}>
                  {totalDebet > 0 ? `-${rp(totalDebet)}` : "-"}
                </td>
                <td style={{ textAlign: "right", padding: "10px 16px", color: "#276b30" }}>
                  +{rp(totalKredit)}
                </td>
                <td style={{ textAlign: "right", padding: "10px 16px", color: "#17140f" }}>
                  {rp(runningSaldoAkhir)}
                </td>
                <td style={{ textAlign: "center", padding: "10px 16px", fontSize: "11px", color: "#6e6859" }}>
                  Valid
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ==============================================================
          4. TAB PADA BAWAH TABEL (TAB MUTASI & INFORMASI LEMBAR)
         ============================================================== */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingTop: "14px",
          borderTop: "1px solid #e7e5de",
          marginTop: "14px",
        }}
      >
        {/* TAB FILTER KATEGORI DI BAWAH TABEL */}
        <div className="dsh__filtertabs" style={{ marginBottom: 0 }} role="tablist">
          <button
            type="button"
            className="dsh__filtertab"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            data-active={filterTipe === "semua"}
            onClick={() => setFilterTipe("semua")}
            role="tab"
            aria-selected={filterTipe === "semua"}
          >
            Semua Mutasi ({barisTransaksi.length})
          </button>
          <button
            type="button"
            className="dsh__filtertab"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            data-active={filterTipe === "kredit"}
            onClick={() => setFilterTipe("kredit")}
            role="tab"
            aria-selected={filterTipe === "kredit"}
          >
            Kredit / Setoran ({jumlahKredit})
          </button>
          <button
            type="button"
            className="dsh__filtertab"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            data-active={filterTipe === "debet"}
            onClick={() => setFilterTipe("debet")}
            role="tab"
            aria-selected={filterTipe === "debet"}
          >
            Debet / Penarikan ({jumlahDebet})
          </button>
        </div>

        {/* TAB LEMBAR / HALAMAN & STATUS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#665f50",
          }}
        >
          <span>Lembar Buku:</span>
          <span
            className="dsh__filtertab"
            style={{
              padding: "4px 10px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "default",
            }}
            data-active={true}
          >
            Lembar 01 (Hal. 1)
          </span>
          <span>·</span>
          <span>
            {barisTampil.length} dari {barisTransaksi.length} baris
          </span>
        </div>
      </div>
    </section>
  );
}
