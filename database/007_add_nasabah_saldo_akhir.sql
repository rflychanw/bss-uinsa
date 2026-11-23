-- =============================================================================
-- MIGRASI 007: Simpan Kolom saldo_akhir di Tabel nasabah + Trigger Otomatis
-- Menjawab saran penyimpanan saldo akhir agar pembacaan cepat sekaligus terjaga
-- konsistensinya secara otomatis oleh PostgreSQL Trigger.
-- =============================================================================

-- 1. Tambah kolom saldo_akhir pada tabel public.nasabah
ALTER TABLE public.nasabah
  ADD COLUMN IF NOT EXISTS saldo_akhir numeric(14, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_nasabah_saldo_akhir_nonneg'
      AND conrelid = 'public.nasabah'::regclass
  ) THEN
    ALTER TABLE public.nasabah
      ADD CONSTRAINT chk_nasabah_saldo_akhir_nonneg CHECK (saldo_akhir >= 0);
  END IF;
END $$;

-- 2. Fungsi hitung ulang otomatis saldo_akhir per nasabah
CREATE OR REPLACE FUNCTION private.recompute_nasabah_saldo_akhir(p_nasabah_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kredit numeric(14, 2);
  v_debet  numeric(14, 2);
BEGIN
  IF p_nasabah_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM 1 FROM public.nasabah WHERE id = p_nasabah_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(COALESCE(nilai_realisasi, estimasi_nilai_total)), 0)
  INTO v_kredit
  FROM public.setoran_nasabah
  WHERE nasabah_id = p_nasabah_id
    AND status_verifikasi = 'terverifikasi'::public.status_verifikasi_setoran_type;

  SELECT COALESCE(SUM(nominal), 0)
  INTO v_debet
  FROM public.penarikan_saldo
  WHERE nasabah_id = p_nasabah_id
    AND status = 'selesai'::public.status_penarikan_type;

  UPDATE public.nasabah
  SET saldo_akhir = GREATEST(0, v_kredit - v_debet)
  WHERE id = p_nasabah_id;
END;
$$;

-- 3. Trigger handler sinkronisasi saldo_akhir saat setoran / penarikan berubah
CREATE OR REPLACE FUNCTION private.sync_nasabah_saldo_akhir()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM private.recompute_nasabah_saldo_akhir(OLD.nasabah_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.nasabah_id IS DISTINCT FROM NEW.nasabah_id THEN
    PERFORM private.recompute_nasabah_saldo_akhir(OLD.nasabah_id);
  END IF;

  PERFORM private.recompute_nasabah_saldo_akhir(NEW.nasabah_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_setoran_sync_saldo_akhir ON public.setoran_nasabah;
CREATE TRIGGER trg_setoran_sync_saldo_akhir
  AFTER INSERT OR UPDATE OF nasabah_id, estimasi_nilai_total, nilai_realisasi, status_verifikasi OR DELETE
  ON public.setoran_nasabah
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_nasabah_saldo_akhir();

DROP TRIGGER IF EXISTS trg_penarikan_sync_saldo_akhir ON public.penarikan_saldo;
CREATE TRIGGER trg_penarikan_sync_saldo_akhir
  AFTER INSERT OR UPDATE OF nasabah_id, nominal, status OR DELETE
  ON public.penarikan_saldo
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_nasabah_saldo_akhir();

-- 4. Lindungi saldo_akhir dari pengubahan langsung oleh klien (hanya boleh lewat trigger / internal)
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

  IF NEW.saldo_akhir IS DISTINCT FROM OLD.saldo_akhir AND pg_trigger_depth() <= 1 THEN
    RAISE EXCEPTION 'Kolom saldo_akhir dikelola otomatis oleh sistem melalui transaksi setoran dan penarikan.';
  END IF;

  IF (
    NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.no_buku_tabungan IS DISTINCT FROM OLD.no_buku_tabungan
    OR NEW.status_pendaftaran IS DISTINCT FROM OLD.status_pendaftaran
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.terakhir_setor_at IS DISTINCT FROM OLD.terakhir_setor_at
  ) AND pg_trigger_depth() <= 1 THEN
    SELECT role INTO caller_role FROM public.users WHERE id = (SELECT auth.uid());
    IF caller_role NOT IN ('admin'::public.role_type, 'petugas'::public.role_type) THEN
      RAISE EXCEPTION 'Hanya Petugas atau Admin yang berwenang mengubah status pendaftaran, verifikasi, atau nomor buku tabungan.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Backfill saldo_akhir seluruh nasabah yang sudah ada
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.nasabah LOOP
    PERFORM private.recompute_nasabah_saldo_akhir(r.id);
  END LOOP;
END $$;

-- 6. Perbarui view agar saldo_tersedia mengambil langsung dari nasabah.saldo_akhir
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
  n.saldo_akhir AS saldo_tersedia
FROM public.nasabah n
JOIN public.users u ON u.id = n.user_id
LEFT JOIN kredit k ON k.nasabah_id = n.id
LEFT JOIN pending_setoran ps ON ps.nasabah_id = n.id
LEFT JOIN debet d ON d.nasabah_id = n.id;
