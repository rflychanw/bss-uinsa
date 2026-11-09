"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  formatEmailSesuaiRole,
  hapusAkunCRUD,
  nomorAkunBaru,
  semuaAkun,
  tambahAkunCRUD,
  updateAkunCRUD,
  type Akun,
  type Role,
} from "../../lib/auth";
import {
  evaluasiKeaktifanNasabah,
  hitungRingkasanSaldoNasabah,
  kg,
  rp,
} from "../../lib/bss";

type RoleStaff = "petugas" | "bendahara";

export default function ManajemenAkunCrud({
  onDataChange,
  defaultRoleTab = "semua",
}: {
  onDataChange?: () => void;
  defaultRoleTab?: "semua" | "nasabah" | "petugas" | "bendahara";
}) {
  const [daftarAkun, setDaftarAkun] = useState<Akun[]>([]);
  const [filterRole, setFilterRole] = useState<
    "semua" | "nasabah" | "petugas" | "bendahara"
  >(defaultRoleTab);
  const [filterStatusNasabah, setFilterStatusNasabah] = useState<
    "semua" | "aktif" | "tidak_aktif"
  >("semua");
  const [cari, setCari] = useState("");
  const [notif, setNotif] = useState<{
    tipe: "sukses" | "error";
    pesan: string;
  } | null>(null);

  // State Form Tambah Akun Baru (Hanya untuk Petugas & Bendahara)
  const [bukaFormTambah, setBukaFormTambah] = useState(true);
  const [roleBaru, setRoleBaru] = useState<RoleStaff>("petugas");
  const [namaBaru, setNamaBaru] = useState("");
  const [emailInputBaru, setEmailInputBaru] = useState("");
  const [sandiBaru, setSandiBaru] = useState("petugas123");
  const [nomorBaru, setNomorBaru] = useState("");
  const [jabatanBaru, setJabatanBaru] = useState("Petugas Jaga Piket BSS");

  // State Modal Edit Akun (Hanya untuk Petugas & Bendahara)
  const [akunDiedit, setAkunDiedit] = useState<Akun | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSandi, setEditSandi] = useState("");
  const [editRole, setEditRole] = useState<RoleStaff>("petugas");
  const [editNomor, setEditNomor] = useState("");
  const [editJabatan, setEditJabatan] = useState("");

  // State Alert Modal Konfirmasi Delete
  const [akunAkanDihapus, setAkunAkanDihapus] = useState<Akun | null>(null);

  const idSearch = useId();

  const muatUlang = () => {
    // Hanya tampilkan akun petugas, bendahara, dan nasabah
    const data = semuaAkun().filter(
      (a) => a.role === "petugas" || a.role === "bendahara" || a.role === "nasabah"
    );
    setDaftarAkun(data);
    setNomorBaru(nomorAkunBaru(roleBaru));
    if (onDataChange) onDataChange();
  };

  useEffect(() => {
    muatUlang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pilihRolePembuatan = (r: RoleStaff) => {
    setRoleBaru(r);
    setNomorBaru(nomorAkunBaru(r));
    setEmailInputBaru("");
    if (r === "petugas") {
      setSandiBaru("petugas123");
      setJabatanBaru("Petugas Jaga Piket BSS");
    } else {
      setSandiBaru("bendahara123");
      setJabatanBaru("Bendahara Pengelola BSS");
    }
  };

  const tampilkanNotif = (tipe: "sukses" | "error", pesan: string) => {
    setNotif({ tipe, pesan });
    setTimeout(() => setNotif(null), 6000);
  };

  // Preview email otomatis untuk Petugas (@petugas.com) dan Bendahara (@bendahara.com)
  const previewEmailBaru = useMemo(() => {
    if (!emailInputBaru.trim()) {
      return roleBaru === "petugas"
        ? "usernamegmail@petugas.com"
        : "usernamegmail@bendahara.com";
    }
    return formatEmailSesuaiRole(emailInputBaru, roleBaru);
  }, [emailInputBaru, roleBaru]);

  // Tambah Akun Baru (CREATE — khusus Petugas & Bendahara)
  const handleTambahAkun = (e: React.FormEvent) => {
    e.preventDefault();

    const res = tambahAkunCRUD({
      nama: namaBaru,
      email: emailInputBaru,
      sandi: sandiBaru,
      role: roleBaru,
      nomor: nomorBaru,
      jabatan: jabatanBaru,
    });

    if (!res.ok) {
      tampilkanNotif("error", res.pesan);
      return;
    }

    setNamaBaru("");
    setEmailInputBaru("");
    muatUlang();
    setNomorBaru(nomorAkunBaru(roleBaru));
    tampilkanNotif(
      "sukses",
      `Akun ${res.akun.role.toUpperCase()} "${res.akun.nama}" (${res.akun.email} • ID: ${res.akun.nomor}) berhasil ditambahkan.`
    );
  };

  // Buka Modal Edit (UPDATE — khusus Petugas & Bendahara)
  const bukaModalEdit = (a: Akun) => {
    if (a.role !== "petugas" && a.role !== "bendahara") return;
    setAkunDiedit(a);
    setEditNama(a.nama);
    setEditEmail(a.email);
    setEditSandi(a.sandi);
    setEditRole(a.role);
    setEditNomor(a.nomor);
    setEditJabatan(a.jabatan || "");
  };

  // Simpan Perubahan Edit (UPDATE — khusus Petugas & Bendahara)
  const handleSimpanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!akunDiedit) return;

    const res = updateAkunCRUD(akunDiedit.nomor, {
      nama: editNama,
      email: editEmail,
      sandi: editSandi,
      role: editRole as Role,
      nomor: editNomor,
      jabatan: editJabatan,
    });

    if (!res.ok) {
      tampilkanNotif("error", res.pesan);
      return;
    }

    setAkunDiedit(null);
    muatUlang();
    tampilkanNotif(
      "sukses",
      `Data akun ${res.akun.role.toUpperCase()} "${res.akun.nama}" (${res.akun.email}) berhasil diperbarui.`
    );
  };

  // Konfirmasi & Eksekusi Hapus Akun (DELETE — berlaku untuk Petugas, Bendahara, dan Nasabah)
  const konfirmasiHapusAkun = () => {
    if (!akunAkanDihapus) return;
    const target = akunAkanDihapus;
    const res = hapusAkunCRUD(target.nomor);
    setAkunAkanDihapus(null);

    if (!res.ok) {
      tampilkanNotif("error", res.pesan);
      return;
    }

    muatUlang();
    tampilkanNotif(
      "sukses",
      `Akun ${target.role.toUpperCase()} "${target.nama}" (${target.email}) telah berhasil dihapus.`
    );
  };

  // Hitung ringkasan jumlah per peran & keaktifan nasabah
  const ringkasan = useMemo(() => {
    const petugas = daftarAkun.filter((a) => a.role === "petugas");
    const bendahara = daftarAkun.filter((a) => a.role === "bendahara");
    const nasabah = daftarAkun.filter((a) => a.role === "nasabah");

    let aktifCount = 0;
    let tidakAktifCount = 0;
    for (const n of nasabah) {
      const ev = evaluasiKeaktifanNasabah(n.terakhirSetor);
      if (ev.aktif) aktifCount++;
      else tidakAktifCount++;
    }

    return {
      total: daftarAkun.length,
      petugasCount: petugas.length,
      bendaharaCount: bendahara.length,
      staffCount: petugas.length + bendahara.length,
      nasabahCount: nasabah.length,
      nasabahAktifCount: aktifCount,
      nasabahTidakAktifCount: tidakAktifCount,
    };
  }, [daftarAkun]);

  // Filter daftar akun untuk tabel
  const akunTerfilter = useMemo(() => {
    return daftarAkun.filter((a) => {
      if (filterRole !== "semua" && a.role !== filterRole) return false;

      if (a.role === "nasabah" && filterStatusNasabah !== "semua") {
        const ev = evaluasiKeaktifanNasabah(a.terakhirSetor);
        if (filterStatusNasabah === "aktif" && !ev.aktif) return false;
        if (filterStatusNasabah === "tidak_aktif" && ev.aktif) return false;
      }

      if (cari.trim()) {
        const q = cari.toLowerCase();
        const cocok =
          a.nama.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.nomor.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.jabatan && a.jabatan.toLowerCase().includes(q)) ||
          (a.fakultas && a.fakultas.toLowerCase().includes(q));
        if (!cocok) return false;
      }

      return true;
    });
  }, [daftarAkun, filterRole, filterStatusNasabah, cari]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Alert Banner Notifikasi */}
      {notif && (
        <div
          className={`dsh__alert ${
            notif.tipe === "sukses" ? "dsh__alert--success" : ""
          }`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            ...(notif.tipe === "error"
              ? {
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                }
              : {}),
          }}
          role="alert"
        >
          <div>
            <strong>{notif.tipe === "sukses" ? "Berhasil:" : "Perhatian:"}</strong>{" "}
            {notif.pesan}
          </div>
          <button
            type="button"
            onClick={() => setNotif(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontSize: "15px",
              padding: "2px 6px",
            }}
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================
          BAGIAN 1: PEMBUATAN AKUN STAFF (KHUSUS PETUGAS & BENDAHARA)
          =================================================================== */}
      <section className="dsh__card" aria-label="Pembuatan Akun Petugas dan Bendahara">
        <div
          className="dsh__cardhead"
          style={{ marginBottom: bukaFormTambah ? "16px" : 0 }}
        >
          <div>
            <span className="dsh__tagbadge" style={{ marginBottom: "6px" }}>
              Registrasi Staff Pengelola
            </span>
            <h2 className="dsh__h2">Pembuatan Akun Petugas &amp; Bendahara</h2>
            <p
              className="dsh__carddesc"
              style={{ marginBottom: 0, marginTop: "4px" }}
            >
              Buat akun staff baru dengan format email{" "}
              <code>usernamegmail@petugas.com</code> atau{" "}
              <code>usernamegmail@bendahara.com</code>.
            </p>
          </div>
          <button
            type="button"
            className="dsh__btnoutline"
            onClick={() => setBukaFormTambah((v) => !v)}
          >
            {bukaFormTambah ? "Tutup Form ↑" : "+ Buat Akun Staff ↓"}
          </button>
        </div>

        {bukaFormTambah && (
          <form onSubmit={handleTambahAkun} className="dsh__form">
            <div className="dsh__field">
              <label className="dsh__label">Pilih Peran Staff</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => pilihRolePembuatan("petugas")}
                  className={
                    roleBaru === "petugas" ? "dsh__btn" : "dsh__btnoutline"
                  }
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Petugas (@petugas.com)
                </button>
                <button
                  type="button"
                  onClick={() => pilihRolePembuatan("bendahara")}
                  className={
                    roleBaru === "bendahara" ? "dsh__btn" : "dsh__btnoutline"
                  }
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Bendahara (@bendahara.com)
                </button>
              </div>
            </div>

            <div className="dsh__grid2">
              <div className="dsh__field">
                <label className="dsh__label">Nama Lengkap Staff</label>
                <input
                  type="text"
                  className="dsh__input"
                  placeholder={
                    roleBaru === "petugas"
                      ? "mis. Rizky Pratama"
                      : "mis. Dewi Lestari"
                  }
                  required
                  value={namaBaru}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNamaBaru(val);
                    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (slug) {
                      setEmailInputBaru(`${slug}gmail@${roleBaru}.com`);
                    } else {
                      setEmailInputBaru("");
                    }
                  }}
                />
              </div>

              <div className="dsh__field">
                <label className="dsh__label">
                  Alamat Email ({roleBaru === "petugas" ? "usernamegmail@petugas.com" : "usernamegmail@bendahara.com"})
                </label>
                <input
                  type="text"
                  className="dsh__input"
                  placeholder={
                    roleBaru === "petugas"
                      ? "usernamegmail@petugas.com"
                      : "usernamegmail@bendahara.com"
                  }
                  required
                  value={emailInputBaru}
                  onChange={(e) => setEmailInputBaru(e.target.value)}
                />
                <span className="dsh__subtext" style={{ color: "#276b30" }}>
                  Email aktif: <strong>{previewEmailBaru}</strong>
                </span>
              </div>
            </div>

            <div className="dsh__grid2">
              <div className="dsh__field">
                <label className="dsh__label">Kata Sandi Login</label>
                <input
                  type="text"
                  className="dsh__input"
                  required
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                  placeholder="Minimal 4 karakter"
                />
              </div>

              <div className="dsh__field">
                <label className="dsh__label">Nomor ID &amp; Jabatan</label>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    className="dsh__input"
                    required
                    value={nomorBaru}
                    onChange={(e) => setNomorBaru(e.target.value)}
                  />
                  <input
                    type="text"
                    className="dsh__input"
                    value={jabatanBaru}
                    onChange={(e) => setJabatanBaru(e.target.value)}
                    placeholder="Jabatan operasional"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="dsh__btn">
                + Tambah Akun {roleBaru === "petugas" ? "Petugas" : "Bendahara"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ===================================================================
          BAGIAN 2: TABEL DATA AKUN
          - Petugas & Bendahara: Create, Read, Update (Ikon Edit), Delete (Ikon Hapus)
          - Nasabah: Read & Delete (Ikon Hapus saja)
          =================================================================== */}
      <section className="dsh__card" aria-label="Tabel Direktori Akun Pengguna">
        <div className="dsh__cardhead" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dsh__h2">Daftar Akun Petugas, Bendahara &amp; Nasabah</h2>
            <p
              className="dsh__carddesc"
              style={{ marginBottom: 0, marginTop: "4px" }}
            >
              CRUD penuh untuk akun <strong>Petugas</strong> ({ringkasan.petugasCount}) &amp;{" "}
              <strong>Bendahara</strong> ({ringkasan.bendaharaCount}), serta{" "}
              <em>Read &amp; Delete</em> untuk akun <strong>Nasabah</strong> ({ringkasan.nasabahCount}).
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label htmlFor={idSearch} className="sr-only">
              Cari Akun
            </label>
            <input
              id={idSearch}
              type="search"
              className="dsh__input"
              style={{ width: "250px", padding: "8px 12px", fontSize: "13px" }}
              placeholder="Cari nama, email, atau ID..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Filter Role */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "14px",
            borderBottom: "1px solid #f0eee8",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterRole === "semua"}
              onClick={() => setFilterRole("semua")}
            >
              Semua ({ringkasan.total})
            </button>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterRole === "petugas"}
              onClick={() => setFilterRole("petugas")}
            >
              Petugas ({ringkasan.petugasCount})
            </button>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterRole === "bendahara"}
              onClick={() => setFilterRole("bendahara")}
            >
              Bendahara ({ringkasan.bendaharaCount})
            </button>
            <button
              type="button"
              className="dsh__filtertab"
              data-active={filterRole === "nasabah"}
              onClick={() => setFilterRole("nasabah")}
            >
              Nasabah ({ringkasan.nasabahCount})
            </button>
          </div>

          {(filterRole === "semua" || filterRole === "nasabah") && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "12px", color: "#6e685d", fontWeight: 600 }}
              >
                Status Nasabah:
              </span>
              <button
                type="button"
                className={`dsh__chip ${
                  filterStatusNasabah === "semua" ? "dsh__chip--blue" : ""
                }`}
                style={{ cursor: "pointer", border: "1px solid #d5d3cb" }}
                onClick={() => setFilterStatusNasabah("semua")}
              >
                Semua ({ringkasan.nasabahCount})
              </button>
              <button
                type="button"
                className={`dsh__chip ${
                  filterStatusNasabah === "aktif" ? "dsh__chip--green" : ""
                }`}
                style={{ cursor: "pointer", border: "1px solid #c8e6c9" }}
                onClick={() => setFilterStatusNasabah("aktif")}
              >
                Aktif ≤ 1 Bln ({ringkasan.nasabahAktifCount})
              </button>
              <button
                type="button"
                className={`dsh__chip ${
                  filterStatusNasabah === "tidak_aktif" ? "dsh__chip--amber" : ""
                }`}
                style={{ cursor: "pointer", border: "1px solid #ffe299" }}
                onClick={() => setFilterStatusNasabah("tidak_aktif")}
              >
                Tidak Aktif &gt; 1 Bln ({ringkasan.nasabahTidakAktifCount})
              </button>
            </div>
          )}
        </div>

        {/* Tabel Data Akun */}
        <div className="dsh__tablewrap" style={{ marginTop: "12px" }}>
          <table className="dsh__table">
            <thead>
              <tr>
                <th>ID / Nomor</th>
                <th>Nama &amp; Unit / Jabatan</th>
                <th>Email &amp; Sandi</th>
                <th>Peran</th>
                <th>Status &amp; Info Tabungan</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {akunTerfilter.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#777",
                    }}
                  >
                    Tidak ada data akun yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                akunTerfilter.map((a) => {
                  const isNasabah = a.role === "nasabah";
                  const canEdit = a.role === "petugas" || a.role === "bendahara";
                  const evalNasabah = isNasabah
                    ? evaluasiKeaktifanNasabah(a.terakhirSetor)
                    : null;
                  const saldoInfo = isNasabah
                    ? hitungRingkasanSaldoNasabah(a.nomor)
                    : null;
                  const beratTotal =
                    saldoInfo && saldoInfo.totalBeratSemuaKg > 0
                      ? saldoInfo.totalBeratSemuaKg
                      : a.totalSetorKg ?? 0;
                  const saldoAktif =
                    saldoInfo && saldoInfo.semuaSetoran.length > 0
                      ? saldoInfo.saldoTersedia
                      : a.akumulasiTersalurkan ?? 0;

                  return (
                    <tr key={a.nomor + a.email}>
                      <td>
                        <code className="dsh__code">{a.nomor}</code>
                      </td>
                      <td>
                        <strong>{a.nama}</strong>
                        <span className="dsh__subtext">
                          {a.jabatan ||
                            (a.fakultas
                              ? `${a.fakultas}${a.prodi ? ` (${a.prodi})` : ""}`
                              : "BSS UINSA")}
                        </span>
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: "12px",
                            color: "#1e5225",
                            fontWeight: 600,
                            display: "block",
                          }}
                        >
                          {a.email}
                        </code>
                        <span className="dsh__subtext">
                          Sandi: <code>{a.sandi}</code>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`dsh__chip ${
                            a.role === "petugas" || a.role === "bendahara"
                              ? "dsh__chip--blue"
                              : "dsh__chip--green"
                          }`}
                          style={{ textTransform: "uppercase", fontSize: "11px" }}
                        >
                          {a.role}
                        </span>
                      </td>
                      <td>
                        {isNasabah && evalNasabah ? (
                          <div style={{ display: "grid", gap: "3px" }}>
                            <div>
                              <span
                                className={`dsh__chip ${
                                  evalNasabah.aktif
                                    ? "dsh__chip--green"
                                    : "dsh__chip--amber"
                                }`}
                              >
                                {evalNasabah.aktif
                                  ? "Aktif (≤ 1 Bulan)"
                                  : "Tidak Aktif (> 1 Bulan)"}
                              </span>
                            </div>
                            <span className="dsh__subtext">
                              Setor terakhir: <strong>{evalNasabah.terakhir}</strong> (
                              {evalNasabah.selisihHari} hari lalu)
                            </span>
                            <span className="dsh__subtext">
                              Total: <strong>{kg(beratTotal)}</strong> • Saldo:{" "}
                              <strong className="dsh__green">{rp(saldoAktif)}</strong>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="dsh__chip dsh__chip--green">
                              Staff Aktif
                            </span>
                            <span className="dsh__subtext">
                              Terdaftar: {a.tanggalDaftar || "2026"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "6px",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* Tombol Ikon Edit — Hanya untuk Petugas & Bendahara */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => bukaModalEdit(a)}
                              aria-label={`Ubah akun ${a.nama}`}
                              title="Ubah Akun"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                border: "1px solid #d5d3cb",
                                background: "#ffffff",
                                color: "#3b362c",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                width={16}
                                height={16}
                                aria-hidden="true"
                              >
                                <path
                                  d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.793 8.793-3.621.793.793-3.621 8.793-8.793Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Tombol Ikon Delete — Untuk Petugas, Bendahara, dan Nasabah */}
                          <button
                            type="button"
                            onClick={() => setAkunAkanDihapus(a)}
                            aria-label={`Hapus akun ${a.nama}`}
                            title="Hapus Akun"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              border: "1px solid #f5c2c2",
                              background: "#fff5f5",
                              color: "#b91c1c",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              width={16}
                              height={16}
                              aria-hidden="true"
                            >
                              <path
                                d="M4.5 5.5h11M7.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M6 5.5l.7 10.1a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4L14 5.5M8.5 9v4.5M11.5 9v4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================================================================
          MODAL EDIT AKUN (UPDATE CRUD — KHUSUS PETUGAS & BENDAHARA)
          =================================================================== */}
      {akunDiedit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setAkunDiedit(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <span className="dsh__tagbadge">Perbarui Akun Staff</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px" }}>
                  {akunDiedit.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAkunDiedit(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="dsh__form">
              <div className="dsh__grid2">
                <div className="dsh__field">
                  <label className="dsh__label">Peran Staff</label>
                  <select
                    className="dsh__select"
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value as RoleStaff;
                      setEditRole(r);
                      setEditEmail(formatEmailSesuaiRole(editEmail, r));
                    }}
                  >
                    <option value="petugas">Petugas (@petugas.com)</option>
                    <option value="bendahara">Bendahara (@bendahara.com)</option>
                  </select>
                </div>

                <div className="dsh__field">
                  <label className="dsh__label">Nomor ID</label>
                  <input
                    type="text"
                    className="dsh__input"
                    required
                    value={editNomor}
                    onChange={(e) => setEditNomor(e.target.value)}
                  />
                </div>
              </div>

              <div className="dsh__field">
                <label className="dsh__label">Nama Lengkap</label>
                <input
                  type="text"
                  className="dsh__input"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                />
              </div>

              <div className="dsh__grid2">
                <div className="dsh__field">
                  <label className="dsh__label">Alamat Email</label>
                  <input
                    type="text"
                    className="dsh__input"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                  <span className="dsh__subtext">
                    Domain wajib: <strong>@{editRole}.com</strong>
                  </span>
                </div>

                <div className="dsh__field">
                  <label className="dsh__label">Kata Sandi</label>
                  <input
                    type="text"
                    className="dsh__input"
                    required
                    value={editSandi}
                    onChange={(e) => setEditSandi(e.target.value)}
                  />
                </div>
              </div>

              <div className="dsh__field">
                <label className="dsh__label">Jabatan Operasional</label>
                <input
                  type="text"
                  className="dsh__input"
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="dsh__btnoutline"
                  onClick={() => setAkunDiedit(null)}
                >
                  Batal
                </button>
                <button type="submit" className="dsh__btn">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          CUSTOM ALERT DIALOG KONFIRMASI DELETE AKUN
          =================================================================== */}
      {akunAkanDihapus && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23, 20, 15, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setAkunAkanDihapus(null)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-hapus-title"
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid #f5c2c2",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                width={22}
                height={22}
                aria-hidden="true"
              >
                <path
                  d="M10 6.5v4M10 13.5h.01M3.4 15.5h13.2c1.1 0 1.8-1.2 1.2-2.1L11.2 3.2c-.5-.9-1.9-.9-2.4 0L2.2 13.4c-.6.9.1 2.1 1.2 2.1Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3
              id="alert-hapus-title"
              style={{
                margin: "0 0 8px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#17140f",
              }}
            >
              Konfirmasi Hapus Akun
            </h3>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "13.5px",
                color: "#5c5546",
                lineHeight: 1.5,
              }}
            >
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong style={{ color: "#17140f" }}>
                {akunAkanDihapus.nama}
              </strong>{" "}
              ({akunAkanDihapus.role.toUpperCase()}) dari sistem?
            </p>

            <div
              style={{
                background: "#faf9f5",
                border: "1px solid #e7e5de",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12.5px",
                color: "#4a4436",
                marginBottom: "20px",
                display: "grid",
                gap: "4px",
              }}
            >
              <div>
                ID Akun: <code>{akunAkanDihapus.nomor}</code>
              </div>
              <div>
                Email: <code>{akunAkanDihapus.email}</code>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="dsh__btnoutline"
                onClick={() => setAkunAkanDihapus(null)}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={konfirmasiHapusAkun}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "1px solid #b91c1c",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
