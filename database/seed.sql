-- =============================================================================
-- SEED DATA AWAL — MASTER JENIS SAMPAH & PRICELIST RESMI BSS UINSA
-- Jalankan setelah database/schema.sql di Supabase SQL Editor
-- =============================================================================

WITH items (kode_sampah, nama_sampah, kategori, satuan, deskripsi, harga_per_satuan) AS (
  VALUES
    -- [A] KERTAS
    ('A1', 'Kardus Bagus', '[A] KERTAS', 'kg', 'Kardus coklat tebal & kering', 1000.00),
    ('A2', 'Kardus Jelek', '[A] KERTAS', 'kg', 'Kardus tipis / berdebu', 900.00),
    ('A3', 'Koran', '[A] KERTAS', 'kg', 'Koran bekas berkas bacaan', 2800.00),
    ('A4', 'HVS', '[A] KERTAS', 'kg', 'Kertas putih HVS / arsip / skripsi', 1600.00),
    ('A5', 'Buram', '[A] KERTAS', 'kg', 'Kertas buram cetak', 800.00),
    ('A6', 'Majalah', '[A] KERTAS', 'kg', 'Majalah & kertas glossy', 600.00),
    ('A7', 'Sak Semen', '[A] KERTAS', 'kg', 'Kantong sak semen bersih', 800.00),
    ('A8', 'Duplek', '[A] KERTAS', 'kg', 'Karton duplek kemasan makanan', 200.00),

    -- [B] PLASTIK 1
    ('B1', 'Botol PET Bening Bersih', '[B] PLASTIK 1', 'kg', 'Botol plastik bening tanpa label', 2500.00),
    ('B2', 'Botol PET Biru Muda Bersih', '[B] PLASTIK 1', 'kg', 'Botol air mineral biru muda bening', 2000.00),
    ('B3', 'Botol PET Warna Bersih', '[B] PLASTIK 1', 'kg', 'Botol plastik hijau / warna transparan', 1100.00),
    ('B4', 'Botol PET Kotor', '[B] PLASTIK 1', 'kg', 'Botol bercampur label & sedotan', 700.00),
    ('B6', 'Botol PET Jelek/Minyak', '[B] PLASTIK 1', 'kg', 'Botol bekas minyak / oli pekat', 50.00),

    -- [C] PLASTIK 2 & 3
    ('C1', 'Tutup Botol Minuman', '[C] PLASTIK 2', 'kg', 'Tutup botol air mineral HDPE', 1200.00),
    ('C2', 'Tutup Galon', '[C] PLASTIK 2', 'kg', 'Tutup galon air mineral', 1900.00),
    ('C3', 'Tutup Botol Minuman', '[C] PLASTIK 3', 'kg', 'Tutup botol campur warna', 1200.00),
    ('C4', 'Tutup Galon', '[C] PLASTIK 3', 'kg', 'Tutup galon biru pekat', 1900.00),

    -- [D] LOGAM & BESI
    ('D1', 'Besi Padat / Rangka', '[D] LOGAM & BESI', 'kg', 'Besi padat, rangka plat', 4500.00),
    ('D2', 'Aluminium & Kaleng', '[D] LOGAM & BESI', 'kg', 'Kaleng minuman soda & panci aluminium', 12000.00),
    ('D3', 'Tembaga Kupas', '[D] LOGAM & BESI', 'kg', 'Kabel / kawat tembaga murni', 55000.00),

    -- [E] KACA & LAINNYA
    ('E1', 'Botol Kaca Utuh', '[E] KACA & LAINNYA', 'kg', 'Botol kecap, saus, sirup utuh', 1500.00),
    ('E2', 'Minyak Jelantah Saring', '[E] KACA & LAINNYA', 'kg', 'Minyak goreng jelantah disaring bersih', 5500.00)
),
upserted_jenis AS (
  INSERT INTO public.jenis_sampah (kode_sampah, nama_sampah, kategori, satuan, deskripsi, is_active)
  SELECT kode_sampah, nama_sampah, kategori, satuan, deskripsi, true
  FROM items
  ON CONFLICT (kode_sampah) DO UPDATE
    SET nama_sampah = EXCLUDED.nama_sampah,
        kategori    = EXCLUDED.kategori,
        satuan      = EXCLUDED.satuan,
        deskripsi   = EXCLUDED.deskripsi,
        is_active   = true
  RETURNING id, kode_sampah
)
INSERT INTO public.pricelist (jenis_sampah_id, harga_per_satuan, is_active)
SELECT uj.id, i.harga_per_satuan, true
FROM upserted_jenis uj
JOIN items i ON i.kode_sampah = uj.kode_sampah
ON CONFLICT (jenis_sampah_id) WHERE is_active = true
DO UPDATE
  SET harga_per_satuan = EXCLUDED.harga_per_satuan,
      berlaku_mulai    = NOW();
