"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  BATCH_PENGEPUL_AWAL,
  DAFTAR_NASABAH_MASTER,
  getDaftarPenarikan,
  getDaftarSetoran,
  getKategoriSampah,
  hitungRingkasanSaldoNasabah,
  kg,
  rp,
  type PenarikanUang,
  type SetoranNasabah,
} from "../../../lib/bss";

type BarisLaporanPdf = {
  id: string;
  no: number;
  namaNasabah: string;
  isFirstOfNasabah: boolean;
  tanggal: string;
  sandiDanBerat: string;
  debet: number | null;
  kredit: number | null;
  saldo: number;
};

// Data Autentik Dokumen Resmi PDF "Laporan Keuangan BSS.pdf"
const TRANSAKSI_PDF_RESMI: BarisLaporanPdf[] = [
  // --- 1. KOPSYARMA ---
  { id: "kop-1", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: true, tanggal: "24/04/2024", sandiDanBerat: "A1 / 17,6 X 1.000", debet: null, kredit: 17600, saldo: 17600 },
  { id: "kop-2", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "24/04/2024", sandiDanBerat: "A2 / 1,4 X 900", debet: null, kredit: 1260, saldo: 18860 },
  { id: "kop-3", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "24/04/2024", sandiDanBerat: "A8 / 5 X 200", debet: null, kredit: 1000, saldo: 19860 },
  { id: "kop-4", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "5/6/2024", sandiDanBerat: "A1 / 31,7 X 1000", debet: null, kredit: 31700, saldo: 51560 },
  { id: "kop-5", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "5/6/2024", sandiDanBerat: "A8 / 4,35 X 200", debet: null, kredit: 870, saldo: 52430 },
  { id: "kop-6", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "5/6/2024", sandiDanBerat: "H3 / 0,05 X 50", debet: null, kredit: 2.5, saldo: 52432.5 },
  { id: "kop-7", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "10/9/2024", sandiDanBerat: "A1 / 3,56 X 1000", debet: null, kredit: 3560, saldo: 55992.5 },
  { id: "kop-8", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "10/9/2024", sandiDanBerat: "A1 / 9,69 X 1000", debet: null, kredit: 9690, saldo: 65682.5 },
  { id: "kop-9", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "10/9/2024", sandiDanBerat: "A2 / 0,080 X 900", debet: null, kredit: 72, saldo: 65754.5 },
  { id: "kop-10", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "27/09/2024", sandiDanBerat: "A8 / 0,5 X 200", debet: null, kredit: 100, saldo: 65854.5 },
  { id: "kop-11", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "27/09/2024", sandiDanBerat: "A1 / 7,73 X 1.000", debet: null, kredit: 7730, saldo: 73584.5 },
  { id: "kop-12", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "27/09/2024", sandiDanBerat: "A2 / 3,35 X 900", debet: null, kredit: 3015, saldo: 76599.5 },
  { id: "kop-13", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "27/09/2024", sandiDanBerat: "A8 / 0,49 X 200", debet: null, kredit: 98, saldo: 76697.5 },
  { id: "kop-14", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "27/09/2024", sandiDanBerat: "A1 / 3,63 X 1.000", debet: null, kredit: 3630, saldo: 80327.5 },
  { id: "kop-15", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "2/10/2024", sandiDanBerat: "A1 / 3,665 X 1.000", debet: null, kredit: 3665, saldo: 83992.5 },
  { id: "kop-16", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "2/10/2024", sandiDanBerat: "A2 / 0,650 X 900", debet: null, kredit: 585, saldo: 84577.5 },
  { id: "kop-17", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "2/10/2024", sandiDanBerat: "A8 / 1,105 X 200", debet: null, kredit: 221, saldo: 84798.5 },
  { id: "kop-18", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "24/10/2024", sandiDanBerat: "A1 / 14 X 1.000", debet: null, kredit: 14000, saldo: 98798.5 },
  { id: "kop-19", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "24/10/2024", sandiDanBerat: "A2 / 1,12 X 900", debet: null, kredit: 1008, saldo: 99806.5 },
  { id: "kop-20", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "24/10/2024", sandiDanBerat: "A8 / 3,1 X 200", debet: null, kredit: 620, saldo: 100426.5 },
  { id: "kop-21", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "29/10/2024", sandiDanBerat: "A1 / 4,58 X 1.000", debet: null, kredit: 4580, saldo: 105006.5 },
  { id: "kop-22", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "15/11/2024", sandiDanBerat: "A8 / 1,80 X 200", debet: null, kredit: 360, saldo: 105366.5 },
  { id: "kop-23", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "15/11/2024", sandiDanBerat: "A2 / 3,56 X 900", debet: null, kredit: 3204, saldo: 108570.5 },
  { id: "kop-24", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "15/11/2024", sandiDanBerat: "A1 / 11,08 X 1.000", debet: null, kredit: 11080, saldo: 119650.5 },
  { id: "kop-25", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 6,495 X 1.000", debet: null, kredit: 6495, saldo: 126145.5 },
  { id: "kop-26", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 0,585 X 1.000", debet: null, kredit: 585, saldo: 126730.5 },
  { id: "kop-27", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 7,180 X 1.000", debet: null, kredit: 7180, saldo: 133910.5 },
  { id: "kop-28", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A2 / 2,185 X 900", debet: null, kredit: 1966, saldo: 135876.5 },
  { id: "kop-29", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "B1 / 2,108 X 2.500", debet: null, kredit: 5270, saldo: 141146.5 },
  { id: "kop-30", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "B2 / 1,323 X 2.000", debet: null, kredit: 2646, saldo: 143792.5 },
  { id: "kop-31", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A4 / 1,130 X 1.600", debet: null, kredit: 1809, saldo: 145601.5 },
  { id: "kop-32", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A3 / 1,012 X 2.800", debet: null, kredit: 2835, saldo: 148436.5 },
  { id: "kop-33", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A8 / 4,370 X 200", debet: null, kredit: 874, saldo: 149310.5 },
  { id: "kop-34", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "H3 / 0,180 X 50", debet: null, kredit: 9, saldo: 149319.5 },
  { id: "kop-35", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 9,365 X 1.000", debet: null, kredit: 9365, saldo: 158684.5 },
  { id: "kop-36", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A8 / 3,790 X 200", debet: null, kredit: 758, saldo: 159442.5 },
  { id: "kop-37", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A2 / 1,527 X 900", debet: null, kredit: 1375, saldo: 160817.5 },
  { id: "kop-38", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 4,865 X 1.000", debet: null, kredit: 4865, saldo: 165682.5 },
  { id: "kop-39", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A2 / 2,960 X 900", debet: null, kredit: 2664, saldo: 168346.5 },
  { id: "kop-40", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 4,285 X 1.000", debet: null, kredit: 4285, saldo: 172631.5 },
  { id: "kop-41", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A1 / 3,720 X 1.000", debet: null, kredit: 3720, saldo: 176351.5 },
  { id: "kop-42", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "11/2/2025", sandiDanBerat: "A8 / 2,010 X 200", debet: null, kredit: 402, saldo: 176753.5 },
  { id: "kop-43", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "1/12/2025", sandiDanBerat: "B1 / 3,366 X 2.500", debet: null, kredit: 8415, saldo: 185168.5 },
  { id: "kop-44", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "6/4/2026", sandiDanBerat: "B1 / 2,884 X 2.500", debet: null, kredit: 7210, saldo: 192378.5 },
  { id: "kop-45", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "28/05/2026", sandiDanBerat: "A1 / 5,495 X 1000", debet: null, kredit: 5495, saldo: 197873.5 },
  { id: "kop-46", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "28/05/2026", sandiDanBerat: "A2 / 2,385 X 900", debet: null, kredit: 2146, saldo: 200019.5 },
  { id: "kop-47", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "8/9/2026", sandiDanBerat: "A1 / 11,9 X 1000", debet: null, kredit: 11900, saldo: 211919.5 },
  { id: "kop-48", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "8/9/2026", sandiDanBerat: "B4 / 0,5 X 700", debet: null, kredit: 350, saldo: 212269.5 },
  { id: "kop-49", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "8/9/2026", sandiDanBerat: "A8 / 2,3 X 200", debet: null, kredit: 4600, saldo: 216869.5 },
  { id: "kop-50", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "16/09/2026", sandiDanBerat: "A1 / 4,3 X 1000", debet: null, kredit: 4300, saldo: 221169.5 },
  { id: "kop-51", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "16/09/2026", sandiDanBerat: "A2 / 8,6 X 900", debet: null, kredit: 7740, saldo: 228909.5 },
  { id: "kop-52", no: 1, namaNasabah: "Kopsyarma", isFirstOfNasabah: false, tanggal: "16/09/2026", sandiDanBerat: "A8 / 0,32 X 200", debet: null, kredit: 64, saldo: 228973.5 },

  // --- 2. IDA AYU NUR ---
  { id: "ida-1", no: 2, namaNasabah: "Ida Ayu Nur", isFirstOfNasabah: true, tanggal: "5/6/2024", sandiDanBerat: "B2 / 0,55 X 2000", debet: null, kredit: 1100, saldo: 1100 },
  { id: "ida-2", no: 2, namaNasabah: "Ida Ayu Nur", isFirstOfNasabah: false, tanggal: "7/6/2024", sandiDanBerat: "B2 / 0,62 X 2000", debet: null, kredit: 1240, saldo: 2340 },

  // --- 3. ALFIAN ---
  { id: "alf-1", no: 3, namaNasabah: "Alfian", isFirstOfNasabah: true, tanggal: "13/05/2024", sandiDanBerat: "A1 / 7,6 X 1.000", debet: null, kredit: 7600, saldo: 7600 },
  { id: "alf-2", no: 3, namaNasabah: "Alfian", isFirstOfNasabah: false, tanggal: "13/05/2024", sandiDanBerat: "B4 / 0,575 X 800", debet: null, kredit: 460, saldo: 8060 },
  { id: "alf-3", no: 3, namaNasabah: "Alfian", isFirstOfNasabah: false, tanggal: "19/11/2024", sandiDanBerat: "H1 / 0,96 X 1.400", debet: null, kredit: 1344, saldo: 9404 },
  { id: "alf-4", no: 3, namaNasabah: "Alfian", isFirstOfNasabah: false, tanggal: "19/11/2024", sandiDanBerat: "A2 / 9,760 X 900", debet: null, kredit: 8784, saldo: 18188 },
  { id: "alf-5", no: 3, namaNasabah: "Alfian", isFirstOfNasabah: false, tanggal: "11/3/2025", sandiDanBerat: "Penarikan Tunai Kasir", debet: 18188, kredit: null, saldo: 0 },
];

export default function RekapKeuanganAdmin() {
  const [periode, setPeriode] = useState<"semua" | "2026_2027" | "2024_2025">("semua");
  const [pilihanNasabah, setPilihanNasabah] = useState<string>("semua");
  const [cari, setCari] = useState<string>("");
  const [tampilSemua, setTampilSemua] = useState<boolean>(false);
  const [daftarSetoran, setDaftarSetoran] = useState<SetoranNasabah[]>([]);
  const [daftarPenarikan, setDaftarPenarikan] = useState<PenarikanUang[]>([]);

  const idCari = useId();

  useEffect(() => {
    setDaftarSetoran(getDaftarSetoran());
    setDaftarPenarikan(getDaftarPenarikan());
  }, []);

  // Format Rupiah standar dokumen akuntansi (contoh: "Rp 17.600,00" atau "Rp 2,50")
  const formatRupiahPdf = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "—";
    const parts = val.toFixed(2).split(".");
    const intPart = parseInt(parts[0], 10).toLocaleString("id-ID");
    const decPart = parts[1] || "00";
    return `Rp ${intPart},${decPart}`;
  };

  // Gabungkan data resmi PDF dengan setoran & penarikan sistem
  const seluruhTransaksi = useMemo<BarisLaporanPdf[]>(() => {
    const list: BarisLaporanPdf[] = [...TRANSAKSI_PDF_RESMI];

    // Tambahkan data transaksi dari nasabah sistem terdaftar
    DAFTAR_NASABAH_MASTER.forEach((nasabah, nIdx) => {
      const setoranUser = daftarSetoran.filter((s) => s.nomorNasabah === nasabah.nomor);
      const penarikanUser = daftarPenarikan.filter((p) => p.nomorNasabah === nasabah.nomor);

      if (setoranUser.length === 0 && penarikanUser.length === 0) return;

      type Mutasi = {
        tanggal: string;
        sandiDanBerat: string;
        debet: number | null;
        kredit: number | null;
        rawDate: string;
      };

      const mutasiList: Mutasi[] = [
        ...setoranUser.map((s) => ({
          tanggal: s.tanggal,
          sandiDanBerat: `${s.jenisSampahId || "A1"} / ${s.beratKg} X ${Math.round(s.estimasiNilai / (s.beratKg || 1))}`,
          debet: null,
          kredit: s.nilaiRealisasi ?? s.estimasiNilai,
          rawDate: s.tanggal,
        })),
        ...penarikanUser.map((p) => ({
          tanggal: p.tanggal,
          sandiDanBerat: `TRK / ${p.metode.toUpperCase()}`,
          debet: p.nominal,
          kredit: null,
          rawDate: p.tanggal,
        })),
      ];

      mutasiList.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

      let saldoBerjalan = 0;
      mutasiList.forEach((m, idx) => {
        if (m.kredit !== null) saldoBerjalan += m.kredit;
        if (m.debet !== null) saldoBerjalan -= m.debet;

        list.push({
          id: `${nasabah.nomor}-${idx}`,
          no: 4 + nIdx,
          namaNasabah: nasabah.nama,
          isFirstOfNasabah: idx === 0,
          tanggal: m.tanggal,
          sandiDanBerat: m.sandiDanBerat,
          debet: m.debet,
          kredit: m.kredit,
          saldo: Math.max(0, saldoBerjalan),
        });
      });
    });

    return list;
  }, [daftarSetoran, daftarPenarikan]);

  // Filter Data Transaksi
  const transaksiTerfilter = useMemo(() => {
    return seluruhTransaksi.filter((t) => {
      if (pilihanNasabah !== "semua" && t.namaNasabah !== pilihanNasabah) {
        return false;
      }
      if (periode === "2026_2027" && !t.tanggal.includes("2026") && !t.tanggal.includes("2027")) {
        return false;
      }
      if (periode === "2024_2025" && !t.tanggal.includes("2024") && !t.tanggal.includes("2025")) {
        return false;
      }
      if (cari.trim()) {
        const q = cari.toLowerCase();
        const match =
          t.namaNasabah.toLowerCase().includes(q) ||
          t.sandiDanBerat.toLowerCase().includes(q) ||
          t.tanggal.toLowerCase().includes(q) ||
          t.saldo.toString().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [seluruhTransaksi, pilihanNasabah, periode, cari]);

  // Hitung Total Debet, Kredit, dan Saldo
  const totalDebetTabel = useMemo(() => {
    return transaksiTerfilter.reduce((sum, t) => sum + (t.debet || 0), 0);
  }, [transaksiTerfilter]);

  const totalKreditTabel = useMemo(() => {
    return transaksiTerfilter.reduce((sum, t) => sum + (t.kredit || 0), 0);
  }, [transaksiTerfilter]);

  const totalSaldoAkhir = useMemo(() => {
    return totalKreditTabel - totalDebetTabel;
  }, [totalKreditTabel, totalDebetTabel]);

  // Ekspor CSV
  const handleEksporCSV = () => {
    const headers = [
      "No",
      "Nama Nasabah",
      "Tanggal Transaksi",
      "Sandi dan Berat",
      "Debet",
      "Kredit",
      "Saldo",
    ];

    const rows = transaksiTerfilter.map((t) => [
      t.isFirstOfNasabah ? String(t.no) : "",
      t.isFirstOfNasabah ? `"${t.namaNasabah}"` : "",
      t.tanggal,
      `"${t.sandiDanBerat}"`,
      t.debet ? `"${formatRupiahPdf(t.debet)}"` : '""',
      t.kredit ? `"${formatRupiahPdf(t.kredit)}"` : '""',
      `"${formatRupiahPdf(t.saldo)}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_BSS_${periode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const daftarPilihanNasabah = useMemo(() => {
    const setNama = new Set<string>();
    seluruhTransaksi.forEach((t) => setNama.add(t.namaNasabah));
    return Array.from(setNama);
  }, [seluruhTransaksi]);

  const barisTampil = tampilSemua ? transaksiTerfilter : transaksiTerfilter.slice(0, 10);

  const kasBssOperasional = BATCH_PENGEPUL_AWAL.reduce(
    (sum, b) => sum + (b.selisihKasBss || 0),
    0
  );

  return (
    <div className="dsh__page">
      {/* HEADER HALAMAN RESMI */}
      <header className="dsh__head dsh__head--split">
        <div>
          <div className="dsh__headrole">
            <span className="dsh__tagbadge">Bendahara Keuangan</span>
            <span className="dsh__dot" aria-hidden="true">•</span>
            <span className="dsh__meta">Bank Sampah Syariah UIN Sunan Ampel</span>
          </div>
          <h1 className="dsh__h1">Rekapitulasi &amp; Laporan Keuangan</h1>
          <p className="dsh__sub">
            Laporan kas/saldo tabungan nasabah perputaran dana syariah sesuai dokumen Laporan Keuangan BSS.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} className="no-print">
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            🖨️ Cetak Laporan
          </button>
          <button
            type="button"
            className="dsh__btn dsh__btn--download"
            onClick={handleEksporCSV}
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16} aria-hidden="true">
              <path
                d="M10 3.5v9m0 0 3-3m-3 3-3-3M4 14.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ekspor CSV (Excel)
          </button>
        </div>
      </header>

      {/* 4 STATS CARDS RINGKASAN SESUAI TEMPLATE AWAL */}
      <div className="dsh__statsgrid" style={{ marginBottom: "20px" }}>
        <div className="dsh__statcard dsh__statcard--primary">
          <span className="dsh__statbadge">Akad Wadiah</span>
          <p className="dsh__statlabel">Kewajiban Tabungan Nasabah</p>
          <p className="dsh__big dsh__big--green">{formatRupiahPdf(totalSaldoAkhir)}</p>
          <p className="dsh__statsmall">
            Total saldo wadiah aktif dari {daftarPilihanNasabah.length} nasabah terhitung
          </p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Kredit (Penyetoran)</p>
          <p className="dsh__big">{formatRupiahPdf(totalKreditTabel)}</p>
          <p className="dsh__statsmall">Akumulasi seluruh nilai setoran sampah terdata</p>
        </div>

        <div className="dsh__statcard">
          <p className="dsh__statlabel">Total Debet (Pencairan Saldo)</p>
          <p className="dsh__big" style={{ color: "#b91c1c" }}>{formatRupiahPdf(totalDebetTabel)}</p>
          <p className="dsh__statsmall">Pencairan saldo tabungan nasabah di kasir</p>
        </div>

        <div className="dsh__statcard dsh__statcard--accent">
          <span className="dsh__statbadge">Kas Syariah BSS</span>
          <p className="dsh__statlabel">Kas Operasional Pengelola</p>
          <p className="dsh__big dsh__big--amber">{rp(kasBssOperasional)}</p>
          <p className="dsh__statsmall">Hasil selisih penjualan ke pihak pengepul</p>
        </div>
      </div>

      {/* FILTER PERIODE WAKTU (CHIP) */}
      <div className="dsh__toolbar no-print" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#444", marginRight: "4px" }}>
            Periode Laporan:
          </span>
          <button
            type="button"
            className={`dsh__chip ${periode === "semua" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: periode === "semua" ? 700 : 500 }}
            onClick={() => setPeriode("semua")}
          >
            Semua Tahun
          </button>
          <button
            type="button"
            className={`dsh__chip ${periode === "2026_2027" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: periode === "2026_2027" ? 700 : 500 }}
            onClick={() => setPeriode("2026_2027")}
          >
            Tahun 2026 - 2027
          </button>
          <button
            type="button"
            className={`dsh__chip ${periode === "2024_2025" ? "dsh__chip--green" : ""}`}
            style={{ cursor: "pointer", fontWeight: periode === "2024_2025" ? 700 : 500 }}
            onClick={() => setPeriode("2024_2025")}
          >
            Tahun 2024 - 2025
          </button>
        </div>
      </div>

      {/* ==============================================================
          TABEL RINCIAN TRANSAKSI LAPORAN KEUANGAN
          TETAP MEMAKAI DESAIN TEMPLATE DASHBOARD (dsh__table)
          DENGAN ISI KOLOM PERSIS SESUAI DOKUMEN PDF:
          No | Nama Nasabah | Tanggal Transaksi | Sandi dan Berat | Debet | Kredit | Saldo
         ============================================================== */}
      <section
        className="dsh__card"
        style={{ marginTop: "12px" }}
        aria-label="Tabel Rincian Transaksi Laporan Keuangan"
      >
        <div
          className="dsh__cardhead"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 className="dsh__h2">Rincian Transaksi Laporan Kas/Saldo Tabungan</h2>
            <p className="dsh__carddesc" style={{ marginBottom: 0, marginTop: "4px" }}>
              Data transaksi mutasi tabungan nasabah sesuai dokumen Laporan Keuangan BSS.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }} className="no-print">
            <select
              className="dsh__select"
              style={{ padding: "6px 10px", fontSize: "13px", minWidth: "150px" }}
              value={pilihanNasabah}
              onChange={(e) => setPilihanNasabah(e.target.value)}
            >
              <option value="semua">Semua Nasabah</option>
              {daftarPilihanNasabah.map((nama) => (
                <option key={nama} value={nama}>
                  {nama}
                </option>
              ))}
            </select>

            <input
              id={idCari}
              type="search"
              className="dsh__input"
              style={{ padding: "6px 12px", fontSize: "13px", minWidth: "200px" }}
              placeholder="Cari sandi, tanggal..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />

            <span className="dsh__chip dsh__chip--green">
              {transaksiTerfilter.length} Baris Data
            </span>
          </div>
        </div>

        {/* TABEL DENGAN DESAIN ASLI TEMPLATE APLIKASI (dsh__table) */}
        <div className="dsh__tablewrap">
          <table className="dsh__table">
            <thead>
              <tr>
                <th style={{ width: "45px", textAlign: "center" }}>No</th>
                <th style={{ width: "160px" }}>Nama Nasabah</th>
                <th style={{ width: "120px", textAlign: "center" }}>Tanggal Transaksi</th>
                <th>Sandi dan Berat</th>
                <th style={{ width: "130px", textAlign: "right" }}>Debet</th>
                <th style={{ width: "130px", textAlign: "right" }}>Kredit</th>
                <th style={{ width: "140px", textAlign: "right" }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {transaksiTerfilter.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Tidak ada transaksi pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                barisTampil.map((t, idx) => {
                  const isNewGroup = t.isFirstOfNasabah;
                  return (
                    <tr
                      key={`${t.id}-${idx}`}
                      style={{
                        borderTop: isNewGroup && idx > 0 ? "2px solid #ded9cd" : undefined,
                        background: isNewGroup ? "#fcfbfa" : undefined,
                      }}
                    >
                      {/* Kolom No */}
                      <td style={{ textAlign: "center", fontWeight: 700, verticalAlign: "top" }}>
                        {isNewGroup ? t.no : ""}
                      </td>

                      {/* Kolom Nama Nasabah */}
                      <td style={{ verticalAlign: "top" }}>
                        {isNewGroup ? (
                          <strong style={{ color: "#1f1b13", fontSize: "13.5px" }}>
                            {t.namaNasabah}
                          </strong>
                        ) : null}
                      </td>

                      {/* Kolom Tanggal Transaksi */}
                      <td style={{ textAlign: "center", color: "#444" }}>
                        {t.tanggal}
                      </td>

                      {/* Kolom Sandi dan Berat */}
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace, Arial",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1f1b13",
                          }}
                        >
                          {t.sandiDanBerat}
                        </span>
                      </td>

                      {/* Kolom Debet */}
                      <td style={{ textAlign: "right" }}>
                        {t.debet ? (
                          <strong style={{ color: "#b91c1c" }}>
                            {formatRupiahPdf(t.debet)}
                          </strong>
                        ) : (
                          <span className="dsh__muted">—</span>
                        )}
                      </td>

                      {/* Kolom Kredit */}
                      <td style={{ textAlign: "right" }}>
                        {t.kredit ? (
                          <strong className="dsh__green">
                            +{formatRupiahPdf(t.kredit)}
                          </strong>
                        ) : (
                          <span className="dsh__muted">—</span>
                        )}
                      </td>

                      {/* Kolom Saldo */}
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ color: "#1e5225", fontWeight: 700 }}>
                          {formatRupiahPdf(t.saldo)}
                        </strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {transaksiTerfilter.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8f9fa", fontWeight: 800 }}>
                  <td colSpan={4} style={{ textAlign: "right", textTransform: "uppercase" }}>
                    Total Terhitung ({transaksiTerfilter.length} Transaksi):
                  </td>
                  <td style={{ textAlign: "right", color: "#b91c1c" }}>
                    {formatRupiahPdf(totalDebetTabel)}
                  </td>
                  <td style={{ textAlign: "right", color: "#15803d" }}>
                    +{formatRupiahPdf(totalKreditTabel)}
                  </td>
                  <td style={{ textAlign: "right", color: "#1e5225" }}>
                    {formatRupiahPdf(totalSaldoAkhir)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {transaksiTerfilter.length > 10 && (
          <button
            type="button"
            className="dsh__expandbtn no-print"
            onClick={() => setTampilSemua((prev) => !prev)}
          >
            {tampilSemua
              ? "Ringkas Rincian Transaksi ↑"
              : `Lihat Lengkap Seluruh Data (${transaksiTerfilter.length} Transaksi) ↓`}
          </button>
        )}
      </section>
    </div>
  );
}
