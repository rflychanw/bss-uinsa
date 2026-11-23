-- =============================================================================
-- MIGRASI 005: BERSIHKAN KOLOM TAMBAHAN YANG TIDAK DIPAKAI DI UI WEB
-- Jalankan 1 kali di Supabase Dashboard -> SQL Editor (Project djwbzkjxvikmrmvwneuu)
-- =============================================================================

-- 1. Perbarui trigger proteksi nasabah (hapus referensi catatan_verifikasi)
CREATE OR REPLACE FUNCTION private.protect_nasabah_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role public.role_type;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  IF (
    NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.no_buku_tabungan IS DISTINCT FROM OLD.no_buku_tabungan
    OR NEW.status_pendaftaran IS DISTINCT FROM OLD.status_pendaftaran
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.terakhir_setor_at IS DISTINCT FROM OLD.terakhir_setor_at
  ) THEN
    SELECT role INTO caller_role FROM public.users WHERE id = (SELECT auth.uid());
    IF caller_role NOT IN ('admin'::public.role_type, 'petugas'::public.role_type) THEN
      RAISE EXCEPTION 'Hanya Petugas atau Admin yang berwenang mengubah status pendaftaran, verifikasi, atau nomor buku tabungan.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Hapus sementara view yang bergantung pada kolom kategori & is_sedekah
DROP VIEW IF EXISTS public.v_saldo_dan_keaktifan_nasabah;

-- 3. Hapus kolom yang tidak digunakan di web
ALTER TABLE public.nasabah
  DROP COLUMN IF EXISTS kategori,
  DROP COLUMN IF EXISTS fakultas,
  DROP COLUMN IF EXISTS prodi,
  DROP COLUMN IF EXISTS alamat,
  DROP COLUMN IF EXISTS catatan_verifikasi;

ALTER TABLE public.penarikan_saldo
  DROP CONSTRAINT IF EXISTS chk_nominal_penarikan,
  DROP COLUMN IF EXISTS is_sedekah,
  ADD CONSTRAINT chk_nominal_penarikan CHECK (nominal >= 2000);

DROP TYPE IF EXISTS public.kategori_nasabah_type;

-- 4. Bangun ulang view saldo & keaktifan nasabah
CREATE OR REPLACE VIEW public.v_saldo_dan_keaktifan_nasabah
WITH (security_invoker = true) AS
WITH kredit AS (
  SELECT
    nasabah_id,
    COALESCE(SUM(COALESCE(nilai_realisasi, estimasi_nilai_total)), 0) AS total_kredit_valid,
    COALESCE(SUM(berat_kg), 0) AS total_berat_valid_kg
  FROM public.setoran_nasabah
  WHERE status_verifikasi = 'terverifikasi'
  GROUP BY nasabah_id
),
pending_setoran AS (
  SELECT
    nasabah_id,
    COALESCE(SUM(estimasi_nilai_total), 0) AS total_menunggu_verifikasi_rp,
    COALESCE(SUM(berat_kg), 0) AS total_menunggu_verifikasi_kg
  FROM public.setoran_nasabah
  WHERE status_verifikasi = 'menunggu_verifikasi'
  GROUP BY nasabah_id
),
debet AS (
  SELECT
    nasabah_id,
    COALESCE(SUM(nominal) FILTER (WHERE status = 'selesai'), 0) AS total_debet_selesai,
    COALESCE(SUM(nominal) FILTER (WHERE status = 'menunggu'), 0) AS total_penarikan_menunggu
  FROM public.penarikan_saldo
  GROUP BY nasabah_id
)
SELECT
  n.id AS nasabah_id,
  u.id AS user_id,
  n.no_buku_tabungan,
  u.nama_lengkap,
  u.email,
  n.status_pendaftaran,
  n.terakhir_setor_at,
  CASE
    WHEN n.terakhir_setor_at IS NOT NULL AND n.terakhir_setor_at >= NOW() - INTERVAL '30 days'
      THEN true
    ELSE false
  END AS is_aktif_menyetor,
  COALESCE(k.total_berat_valid_kg, 0) + COALESCE(ps.total_menunggu_verifikasi_kg, 0) AS total_berat_semua_kg,
  COALESCE(k.total_kredit_valid, 0) AS total_kredit_valid,
  COALESCE(ps.total_menunggu_verifikasi_rp, 0) AS total_menunggu_verifikasi_rp,
  COALESCE(d.total_debet_selesai, 0) AS total_debet_selesai,
  COALESCE(d.total_penarikan_menunggu, 0) AS total_penarikan_menunggu,
  GREATEST(0, COALESCE(k.total_kredit_valid, 0) - COALESCE(d.total_debet_selesai, 0)) AS saldo_tersedia
FROM public.nasabah n
JOIN public.users u ON u.id = n.user_id
LEFT JOIN kredit k ON k.nasabah_id = n.id
LEFT JOIN pending_setoran ps ON ps.nasabah_id = n.id
LEFT JOIN debet d ON d.nasabah_id = n.id;

GRANT SELECT ON public.v_saldo_dan_keaktifan_nasabah TO authenticated;
