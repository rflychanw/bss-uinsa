-- =============================================================================
-- SKEMA DATABASE SUPABASE (AUTH + POSTGRES + RLS + STORAGE)
-- BANK SAMPAH SYARIAH (BSS) UINSA
-- =============================================================================
-- Hardened untuk Supabase:
--   1. Autentikasi memakai Supabase Auth (`auth.users`), BUKAN `password_hash` manual
--   2. Fungsi SECURITY DEFINER diletakkan di schema `private` (non-exposed API)
--      dengan `SET search_path = ''` dan pengecekan `auth.uid()`
--   3. RLS aktif pada seluruh 10 tabel dengan `(select auth.uid())` & tanpa policy ganda
--   4. Seluruh Foreign Key diindeks + bucket `bukti-pendaftaran` (INSERT/SELECT/UPDATE)
--   5. Views memakai `WITH (security_invoker = true)` agar menghormati RLS
-- =============================================================================

-- Menggunakan gen_random_uuid() bawaan PostgreSQL 17 (tanpa menambah ekstensi ke schema public)
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.auth_provider_type AS ENUM ('supabase', 'google', 'local');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.role_type AS ENUM ('nasabah', 'petugas', 'bendahara', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.metode_bayar_daftar_type AS ENUM ('qris', 'va', 'tunai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_pendaftaran_type AS ENUM ('menunggu', 'aktif', 'ditolak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_verifikasi_setoran_type AS ENUM (
    'menunggu_verifikasi',
    'terverifikasi',
    'ditolak'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_penjualan_setoran_type AS ENUM (
    'belum_terjual',
    'terjual',
    'disalurkan'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.jenis_pencairan_type AS ENUM (
    'tabungan_wadiah',
    'tunai',
    'bank',
    'ewallet'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_tahapan_type AS ENUM (
    'terkumpul',
    'dijual_ke_pengepul',
    'uang_diterima',
    'disalurkan_ke_nasabah'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_penyaluran_type AS ENUM (
    'terjadwal',
    'disalurkan'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.metode_penarikan_type AS ENUM ('tunai', 'bank', 'ewallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_penarikan_type AS ENUM ('menunggu', 'selesai', 'ditolak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. TRIGGER FUNCTION HELPER (updated_at — search_path aman)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. TABEL USERS (Terhubung 1:1 dengan Supabase Auth `auth.users`)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             varchar(255) NOT NULL UNIQUE,
  username          varchar(100) NOT NULL UNIQUE,
  nama_lengkap      varchar(150) NOT NULL,
  nomor_induk_staf  varchar(50) UNIQUE,
  jabatan           varchar(120),
  auth_provider     public.auth_provider_type NOT NULL DEFAULT 'supabase',
  is_email_verified boolean NOT NULL DEFAULT false,
  role              public.role_type NOT NULL DEFAULT 'nasabah',
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_email_domain_staf CHECK (
    (role = 'petugas'   AND email ~* '@petugas\.com$') OR
    (role = 'bendahara' AND email ~* '@bendahara\.com$') OR
    (role IN ('admin', 'nasabah'))
  )
);

CREATE OR REPLACE FUNCTION private.prevent_non_admin_role_change()
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
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.username IS DISTINCT FROM OLD.username
    OR NEW.nomor_induk_staf IS DISTINCT FROM OLD.nomor_induk_staf
    OR NEW.auth_provider IS DISTINCT FROM OLD.auth_provider
    OR NEW.is_email_verified IS DISTINCT FROM OLD.is_email_verified
  ) THEN
    SELECT role INTO caller_role FROM public.users WHERE id = (SELECT auth.uid());
    IF caller_role IS DISTINCT FROM 'admin'::public.role_type THEN
      RAISE EXCEPTION 'Hanya Administrator Sistem yang dapat mengubah role, status aktif, identitas staf, atau email akun.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_protect_role ON public.users;
CREATE TRIGGER trg_users_protect_role
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_non_admin_role_change();

CREATE OR REPLACE FUNCTION private.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role public.role_type;
  raw_name      text;
  base_username text;
BEGIN
  assigned_role := COALESCE((NEW.raw_app_meta_data->>'role')::public.role_type, 'nasabah'::public.role_type);
  raw_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nama_lengkap'), ''), split_part(NEW.email, '@', 1));
  base_username := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9._-]', '', 'g')
                   || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6);

  INSERT INTO public.users (
    id,
    email,
    username,
    nama_lengkap,
    nomor_induk_staf,
    jabatan,
    auth_provider,
    is_email_verified,
    role,
    is_active
  ) VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NULLIF(trim(NEW.raw_app_meta_data->>'username'), ''), base_username),
    raw_name,
    NULLIF(trim(NEW.raw_app_meta_data->>'nomor_induk_staf'), ''),
    NULLIF(trim(NEW.raw_app_meta_data->>'jabatan'), ''),
    'supabase'::public.auth_provider_type,
    (NEW.email_confirmed_at IS NOT NULL),
    assigned_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 4. TABEL NASABAH
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nasabah (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  no_buku_tabungan     varchar(50) NOT NULL UNIQUE,
  no_hp                varchar(20),
  rekening_pencairan   varchar(100),
  metode_bayar_daftar  public.metode_bayar_daftar_type NOT NULL DEFAULT 'qris',
  status_pendaftaran   public.status_pendaftaran_type NOT NULL DEFAULT 'menunggu',
  bukti_bayar_url      text,
  bukti_ig_bss_url     text,
  bukti_ig_lab_url     text,
  tanggal_upload_bukti timestamptz,
  verified_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at          timestamptz,
  terakhir_setor_at    timestamptz,
  saldo_akhir          numeric(14, 2) NOT NULL DEFAULT 0 CHECK (saldo_akhir >= 0),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. TABEL JENIS SAMPAH
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jenis_sampah (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_sampah  varchar(20) NOT NULL UNIQUE,
  nama_sampah  varchar(100) NOT NULL,
  kategori     varchar(80) NOT NULL,
  satuan       varchar(20) NOT NULL DEFAULT 'kg',
  deskripsi    text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. TABEL PRICELIST
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricelist (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_sampah_id  uuid NOT NULL REFERENCES public.jenis_sampah(id) ON DELETE CASCADE,
  harga_per_satuan numeric(12, 2) NOT NULL CHECK (harga_per_satuan > 0),
  berlaku_mulai    timestamptz NOT NULL DEFAULT NOW(),
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricelist_aktif_per_jenis
  ON public.pricelist (jenis_sampah_id)
  WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 7. TABEL PENJUALAN PENGEPUL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.penjualan_pengepul (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no_penjualan          varchar(50) NOT NULL UNIQUE,
  bendahara_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  nama_pengepul         varchar(150) NOT NULL,
  tanggal_penjualan     date NOT NULL DEFAULT CURRENT_DATE,
  total_berat_kg        numeric(10, 3) NOT NULL DEFAULT 0 CHECK (total_berat_kg >= 0),
  estimasi_nilai_awal   numeric(12, 2) NOT NULL DEFAULT 0 CHECK (estimasi_nilai_awal >= 0),
  total_nilai_jual      numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_nilai_jual >= 0),
  nominal_uang_diterima numeric(12, 2) NOT NULL DEFAULT 0 CHECK (nominal_uang_diterima >= 0),
  total_disalurkan      numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_disalurkan >= 0),
  selisih_kas_bss       numeric(12, 2) NOT NULL DEFAULT 0,
  tanggal_uang_diterima timestamptz,
  tanggal_disalurkan    timestamptz,
  status_tahapan        public.status_tahapan_type NOT NULL DEFAULT 'terkumpul',
  created_at            timestamptz NOT NULL DEFAULT NOW(),
  updated_at            timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. TABEL RIWAYAT TAHAPAN PENJUALAN
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riwayat_tahapan_penjualan (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_pengepul_id uuid NOT NULL REFERENCES public.penjualan_pengepul(id) ON DELETE CASCADE,
  tahapan               public.status_tahapan_type NOT NULL,
  pencatat_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  catatan               text,
  created_at            timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. TABEL SETORAN NASABAH
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.setoran_nasabah (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no_transaksi            varchar(50) NOT NULL UNIQUE,
  nasabah_id              uuid NOT NULL REFERENCES public.nasabah(id) ON DELETE CASCADE,
  petugas_id              uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  jenis_sampah_id         uuid NOT NULL REFERENCES public.jenis_sampah(id) ON DELETE RESTRICT,
  pricelist_id            uuid REFERENCES public.pricelist(id) ON DELETE SET NULL,
  penjualan_pengepul_id   uuid REFERENCES public.penjualan_pengepul(id) ON DELETE SET NULL,
  berat_kg                numeric(10, 3) NOT NULL CHECK (berat_kg > 0),
  jumlah_satuan           varchar(50),
  harga_satuan_saat_setor numeric(12, 2) NOT NULL CHECK (harga_satuan_saat_setor >= 0),
  estimasi_nilai_total    numeric(12, 2) NOT NULL CHECK (estimasi_nilai_total >= 0),
  nilai_realisasi         numeric(12, 2) CHECK (nilai_realisasi >= 0),
  status_verifikasi       public.status_verifikasi_setoran_type NOT NULL DEFAULT 'menunggu_verifikasi',
  verified_by             uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at             timestamptz,
  status_penjualan        public.status_penjualan_setoran_type NOT NULL DEFAULT 'belum_terjual',
  jenis_pencairan         public.jenis_pencairan_type NOT NULL DEFAULT 'tabungan_wadiah',
  is_lunas_di_depan       boolean NOT NULL DEFAULT false,
  tanggal_setor           timestamptz NOT NULL DEFAULT NOW(),
  created_at              timestamptz NOT NULL DEFAULT NOW(),
  updated_at              timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. TABEL PENYALURAN NASABAH
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.penyaluran_nasabah (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  penjualan_pengepul_id uuid NOT NULL REFERENCES public.penjualan_pengepul(id) ON DELETE CASCADE,
  setoran_nasabah_id    uuid NOT NULL UNIQUE REFERENCES public.setoran_nasabah(id) ON DELETE CASCADE,
  nasabah_id            uuid NOT NULL REFERENCES public.nasabah(id) ON DELETE CASCADE,
  pencatat_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  proporsi_persen       numeric(6, 2) NOT NULL CHECK (proporsi_persen >= 0 AND proporsi_persen <= 100),
  nominal_hak_nasabah   numeric(12, 2) NOT NULL CHECK (nominal_hak_nasabah >= 0),
  status_penyaluran     public.status_penyaluran_type NOT NULL DEFAULT 'terjadwal',
  tanggal_disalurkan    timestamptz,
  created_at            timestamptz NOT NULL DEFAULT NOW(),
  updated_at            timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. TABEL PENARIKAN SALDO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.penarikan_saldo (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no_penarikan      varchar(50) NOT NULL UNIQUE,
  nasabah_id        uuid NOT NULL REFERENCES public.nasabah(id) ON DELETE CASCADE,
  validator_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  nominal           numeric(12, 2) NOT NULL,
  metode            public.metode_penarikan_type NOT NULL,
  tujuan_pencairan  varchar(150) NOT NULL,
  catatan           text,
  status            public.status_penarikan_type NOT NULL DEFAULT 'menunggu',
  tanggal_pengajuan timestamptz NOT NULL DEFAULT NOW(),
  tanggal_validasi  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_nominal_penarikan CHECK (nominal >= 2000)
);

-- -----------------------------------------------------------------------------
-- 12. TABEL AUDIT LOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action     varchar(100) NOT NULL,
  table_name varchar(50) NOT NULL,
  record_id  uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address varchar(45),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. TRIGGERS (updated_at & sync terakhir_setor_at)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'nasabah',
    'jenis_sampah',
    'pricelist',
    'penjualan_pengepul',
    'setoran_nasabah',
    'penyaluran_nasabah',
    'penarikan_saldo'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.sync_nasabah_terakhir_setor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status_verifikasi <> 'ditolak'::public.status_verifikasi_setoran_type THEN
    UPDATE public.nasabah
    SET terakhir_setor_at = GREATEST(COALESCE(terakhir_setor_at, NEW.tanggal_setor), NEW.tanggal_setor)
    WHERE id = NEW.nasabah_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_setoran_sync_terakhir_setor ON public.setoran_nasabah;
CREATE TRIGGER trg_setoran_sync_terakhir_setor
  AFTER INSERT ON public.setoran_nasabah
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_nasabah_terakhir_setor();

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

CREATE OR REPLACE TRIGGER trg_nasabah_protect_sensitive
  BEFORE UPDATE ON public.nasabah
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_nasabah_sensitive_fields();

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

CREATE OR REPLACE FUNCTION private.validate_penarikan_saldo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status public.status_pendaftaran_type;
  v_kredit numeric(14, 2);
  v_debet  numeric(14, 2);
  v_saldo  numeric(14, 2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status_pendaftaran INTO v_status
    FROM public.nasabah
    WHERE id = NEW.nasabah_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Rekening nasabah tidak ditemukan.';
    END IF;

    IF v_status IS DISTINCT FROM 'aktif'::public.status_pendaftaran_type THEN
      RAISE EXCEPTION 'Hanya rekening nasabah aktif yang dapat melakukan penarikan saldo.';
    END IF;

    IF NEW.nominal IS NULL OR NEW.nominal <= 0 THEN
      RAISE EXCEPTION 'Nominal penarikan harus lebih dari Rp 0.';
    END IF;

    IF NEW.metode IN ('bank'::public.metode_penarikan_type, 'ewallet'::public.metode_penarikan_type)
       AND NEW.nominal < 10000 THEN
      RAISE EXCEPTION 'Minimal penarikan melalui E-Wallet atau Transfer Bank adalah Rp 10.000 karena biaya dan pajak administrasi.';
    ELSIF NEW.metode = 'tunai'::public.metode_penarikan_type
       AND NEW.nominal < 2000 THEN
      RAISE EXCEPTION 'Minimal penarikan tunai adalah Rp 2.000.';
    END IF;

    SELECT COALESCE(SUM(COALESCE(nilai_realisasi, estimasi_nilai_total)), 0)
    INTO v_kredit
    FROM public.setoran_nasabah
    WHERE nasabah_id = NEW.nasabah_id
      AND status_verifikasi = 'terverifikasi'::public.status_verifikasi_setoran_type;

    SELECT COALESCE(SUM(nominal), 0)
    INTO v_debet
    FROM public.penarikan_saldo
    WHERE nasabah_id = NEW.nasabah_id
      AND status IN ('selesai'::public.status_penarikan_type, 'menunggu'::public.status_penarikan_type);

    v_saldo := GREATEST(0, v_kredit - v_debet);
    IF NEW.nominal > v_saldo THEN
      RAISE EXCEPTION 'Saldo tidak mencukupi (tersedia Rp %, diminta Rp %).', v_saldo, NEW.nominal;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.nasabah_id IS DISTINCT FROM OLD.nasabah_id OR NEW.nominal IS DISTINCT FROM OLD.nominal THEN
      RAISE EXCEPTION 'Nominal dan pemilik penarikan tidak dapat diubah setelah tercatat.';
    END IF;
    IF OLD.status IN ('selesai'::public.status_penarikan_type, 'ditolak'::public.status_penarikan_type)
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Status penarikan yang sudah final tidak dapat diubah kembali.';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_penarikan_validate_saldo
  BEFORE INSERT OR UPDATE ON public.penarikan_saldo
  FOR EACH ROW
  EXECUTE FUNCTION private.validate_penarikan_saldo();

-- -----------------------------------------------------------------------------
-- 14. INDEKS LENGKAP (SELURUH FOREIGN KEY & QUERY UTAMA)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role, is_active);
CREATE INDEX IF NOT EXISTS idx_nasabah_status ON public.nasabah (status_pendaftaran, terakhir_setor_at);
CREATE INDEX IF NOT EXISTS idx_nasabah_verified_by ON public.nasabah (verified_by);
CREATE INDEX IF NOT EXISTS idx_pricelist_jenis ON public.pricelist (jenis_sampah_id);
CREATE INDEX IF NOT EXISTS idx_pricelist_created_by ON public.pricelist (created_by);
CREATE INDEX IF NOT EXISTS idx_penjualan_bendahara ON public.penjualan_pengepul (bendahara_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_tahapan_batch ON public.riwayat_tahapan_penjualan (penjualan_pengepul_id, created_at);
CREATE INDEX IF NOT EXISTS idx_riwayat_tahapan_pencatat ON public.riwayat_tahapan_penjualan (pencatat_id);
CREATE INDEX IF NOT EXISTS idx_setoran_nasabah ON public.setoran_nasabah (nasabah_id, tanggal_setor DESC);
CREATE INDEX IF NOT EXISTS idx_setoran_petugas ON public.setoran_nasabah (petugas_id);
CREATE INDEX IF NOT EXISTS idx_setoran_jenis ON public.setoran_nasabah (jenis_sampah_id);
CREATE INDEX IF NOT EXISTS idx_setoran_pricelist ON public.setoran_nasabah (pricelist_id);
CREATE INDEX IF NOT EXISTS idx_setoran_batch ON public.setoran_nasabah (penjualan_pengepul_id);
CREATE INDEX IF NOT EXISTS idx_setoran_verified_by ON public.setoran_nasabah (verified_by);
CREATE INDEX IF NOT EXISTS idx_setoran_status ON public.setoran_nasabah (status_verifikasi, status_penjualan);
CREATE INDEX IF NOT EXISTS idx_penyaluran_nasabah ON public.penyaluran_nasabah (nasabah_id, penjualan_pengepul_id);
CREATE INDEX IF NOT EXISTS idx_penyaluran_batch ON public.penyaluran_nasabah (penjualan_pengepul_id);
CREATE INDEX IF NOT EXISTS idx_penyaluran_pencatat ON public.penyaluran_nasabah (pencatat_id);
CREATE INDEX IF NOT EXISTS idx_penarikan_nasabah ON public.penarikan_saldo (nasabah_id, status, tanggal_pengajuan DESC);
CREATE INDEX IF NOT EXISTS idx_penarikan_validator ON public.penarikan_saldo (validator_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_lookup ON public.audit_log (table_name, record_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 15. HELPER NON-EXPOSED (`private`) & ROW-LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS public.role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN (SELECT auth.uid()) IS NULL THEN NULL
    ELSE (SELECT role FROM public.users WHERE id = (SELECT auth.uid()) AND is_active = true LIMIT 1)
  END;
$$;

CREATE OR REPLACE FUNCTION private.current_nasabah_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN (SELECT auth.uid()) IS NULL THEN NULL
    ELSE (SELECT id FROM public.nasabah WHERE user_id = (SELECT auth.uid()) LIMIT 1)
  END;
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_nasabah_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_nasabah_id() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nasabah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_sampah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penjualan_pengepul ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_tahapan_penjualan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran_nasabah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penyaluran_nasabah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penarikan_saldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies: users
DROP POLICY IF EXISTS "users_select_own_or_staff" ON public.users;
CREATE POLICY "users_select_own_or_staff" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas', 'bendahara')
  );

DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) = 'admin'
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) = 'admin'
  );

DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;
CREATE POLICY "users_delete_admin_only" ON public.users
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'admin');

-- Policies: nasabah
DROP POLICY IF EXISTS "nasabah_select_own_or_staff" ON public.nasabah;
CREATE POLICY "nasabah_select_own_or_staff" ON public.nasabah
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas', 'bendahara')
  );

DROP POLICY IF EXISTS "nasabah_insert_self_or_staff" ON public.nasabah;
CREATE POLICY "nasabah_insert_self_or_staff" ON public.nasabah
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = (SELECT auth.uid()) AND status_pendaftaran = 'menunggu')
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas')
  );

DROP POLICY IF EXISTS "nasabah_update_self_or_verifikator" ON public.nasabah;
CREATE POLICY "nasabah_update_self_or_verifikator" ON public.nasabah
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas')
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas')
  );

DROP POLICY IF EXISTS "nasabah_delete_admin_only" ON public.nasabah;
CREATE POLICY "nasabah_delete_admin_only" ON public.nasabah
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'admin');

-- Policies: jenis_sampah (pisahkan TO anon vs TO authenticated agar anon tidak menyentuh schema private)
DROP POLICY IF EXISTS "jenis_sampah_select_public" ON public.jenis_sampah;
DROP POLICY IF EXISTS "jenis_sampah_select_anon" ON public.jenis_sampah;
CREATE POLICY "jenis_sampah_select_anon" ON public.jenis_sampah
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "jenis_sampah_select_authenticated" ON public.jenis_sampah;
CREATE POLICY "jenis_sampah_select_authenticated" ON public.jenis_sampah
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR (SELECT private.current_user_role()) IN ('admin', 'bendahara', 'petugas')
  );

DROP POLICY IF EXISTS "jenis_sampah_insert_admin_bendahara" ON public.jenis_sampah;
CREATE POLICY "jenis_sampah_insert_admin_bendahara" ON public.jenis_sampah
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

DROP POLICY IF EXISTS "jenis_sampah_update_admin_bendahara" ON public.jenis_sampah;
CREATE POLICY "jenis_sampah_update_admin_bendahara" ON public.jenis_sampah
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('admin', 'bendahara'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

DROP POLICY IF EXISTS "jenis_sampah_delete_admin_bendahara" ON public.jenis_sampah;
CREATE POLICY "jenis_sampah_delete_admin_bendahara" ON public.jenis_sampah
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

-- Policies: pricelist
DROP POLICY IF EXISTS "pricelist_select_public" ON public.pricelist;
DROP POLICY IF EXISTS "pricelist_select_anon" ON public.pricelist;
CREATE POLICY "pricelist_select_anon" ON public.pricelist
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "pricelist_select_authenticated" ON public.pricelist;
CREATE POLICY "pricelist_select_authenticated" ON public.pricelist
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR (SELECT private.current_user_role()) IN ('admin', 'bendahara', 'petugas')
  );

DROP POLICY IF EXISTS "pricelist_insert_admin_bendahara" ON public.pricelist;
CREATE POLICY "pricelist_insert_admin_bendahara" ON public.pricelist
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

DROP POLICY IF EXISTS "pricelist_update_admin_bendahara" ON public.pricelist;
CREATE POLICY "pricelist_update_admin_bendahara" ON public.pricelist
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('admin', 'bendahara'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

DROP POLICY IF EXISTS "pricelist_delete_admin_bendahara" ON public.pricelist;
CREATE POLICY "pricelist_delete_admin_bendahara" ON public.pricelist
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('admin', 'bendahara'));

-- Policies: setoran_nasabah
DROP POLICY IF EXISTS "setoran_select_own_or_staff" ON public.setoran_nasabah;
CREATE POLICY "setoran_select_own_or_staff" ON public.setoran_nasabah
  FOR SELECT TO authenticated
  USING (
    nasabah_id = (SELECT private.current_nasabah_id())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas', 'bendahara')
  );

DROP POLICY IF EXISTS "setoran_insert_petugas_admin" ON public.setoran_nasabah;
CREATE POLICY "setoran_insert_petugas_admin" ON public.setoran_nasabah
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) IN ('petugas', 'admin'));

DROP POLICY IF EXISTS "setoran_update_staff" ON public.setoran_nasabah;
CREATE POLICY "setoran_update_staff" ON public.setoran_nasabah
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('petugas', 'bendahara', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('petugas', 'bendahara', 'admin'));

-- Policies: penarikan_saldo
DROP POLICY IF EXISTS "penarikan_select_own_or_staff" ON public.penarikan_saldo;
CREATE POLICY "penarikan_select_own_or_staff" ON public.penarikan_saldo
  FOR SELECT TO authenticated
  USING (
    nasabah_id = (SELECT private.current_nasabah_id())
    OR (SELECT private.current_user_role()) IN ('admin', 'petugas', 'bendahara')
  );

DROP POLICY IF EXISTS "penarikan_insert_nasabah_or_staff" ON public.penarikan_saldo;
CREATE POLICY "penarikan_insert_nasabah_or_staff" ON public.penarikan_saldo
  FOR INSERT TO authenticated
  WITH CHECK (
    (nasabah_id = (SELECT private.current_nasabah_id()) AND status = 'menunggu' AND validator_id IS NULL)
    OR (SELECT private.current_user_role()) IN ('bendahara', 'petugas', 'admin')
  );

DROP POLICY IF EXISTS "penarikan_update_bendahara_petugas" ON public.penarikan_saldo;
CREATE POLICY "penarikan_update_bendahara_petugas" ON public.penarikan_saldo
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('bendahara', 'petugas', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('bendahara', 'petugas', 'admin'));

-- Policies: penjualan_pengepul, riwayat_tahapan_penjualan, penyaluran_nasabah
DROP POLICY IF EXISTS "pengepul_select_authenticated" ON public.penjualan_pengepul;
CREATE POLICY "pengepul_select_authenticated" ON public.penjualan_pengepul
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pengepul_insert_bendahara_only" ON public.penjualan_pengepul;
CREATE POLICY "pengepul_insert_bendahara_only" ON public.penjualan_pengepul
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "pengepul_update_bendahara_only" ON public.penjualan_pengepul;
CREATE POLICY "pengepul_update_bendahara_only" ON public.penjualan_pengepul
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) = 'bendahara')
  WITH CHECK ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "pengepul_delete_bendahara_only" ON public.penjualan_pengepul;
CREATE POLICY "pengepul_delete_bendahara_only" ON public.penjualan_pengepul
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "riwayat_tahapan_select_authenticated" ON public.riwayat_tahapan_penjualan;
CREATE POLICY "riwayat_tahapan_select_authenticated" ON public.riwayat_tahapan_penjualan
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "riwayat_tahapan_write_bendahara_only" ON public.riwayat_tahapan_penjualan;
CREATE POLICY "riwayat_tahapan_write_bendahara_only" ON public.riwayat_tahapan_penjualan
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "penyaluran_select_own_or_staff" ON public.penyaluran_nasabah;
CREATE POLICY "penyaluran_select_own_or_staff" ON public.penyaluran_nasabah
  FOR SELECT TO authenticated
  USING (
    nasabah_id = (SELECT private.current_nasabah_id())
    OR (SELECT private.current_user_role()) IN ('admin', 'bendahara', 'petugas')
  );

DROP POLICY IF EXISTS "penyaluran_insert_bendahara_only" ON public.penyaluran_nasabah;
CREATE POLICY "penyaluran_insert_bendahara_only" ON public.penyaluran_nasabah
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "penyaluran_update_bendahara_only" ON public.penyaluran_nasabah;
CREATE POLICY "penyaluran_update_bendahara_only" ON public.penyaluran_nasabah
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) = 'bendahara')
  WITH CHECK ((SELECT private.current_user_role()) = 'bendahara');

DROP POLICY IF EXISTS "penyaluran_delete_bendahara_only" ON public.penyaluran_nasabah;
CREATE POLICY "penyaluran_delete_bendahara_only" ON public.penyaluran_nasabah
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'bendahara');

-- Policies: audit_log
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;
CREATE POLICY "audit_select_admin" ON public.audit_log
  FOR SELECT TO authenticated
  USING ((SELECT private.current_user_role()) = 'admin');

DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.audit_log;
CREATE POLICY "audit_insert_authenticated" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

-- -----------------------------------------------------------------------------
-- 16. VIEWS SIAP PAKAI (security_invoker = true)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_pricelist_aktif
WITH (security_invoker = true) AS
SELECT
  js.id AS jenis_sampah_id,
  js.kode_sampah,
  js.nama_sampah,
  js.kategori,
  js.satuan,
  js.deskripsi,
  p.id AS pricelist_id,
  p.harga_per_satuan,
  p.berlaku_mulai
FROM public.jenis_sampah js
JOIN public.pricelist p
  ON p.jenis_sampah_id = js.id
 AND p.is_active = true
WHERE js.is_active = true
ORDER BY js.kode_sampah;

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
  n.saldo_akhir::numeric AS saldo_tersedia
FROM public.nasabah n
JOIN public.users u ON u.id = n.user_id
LEFT JOIN kredit k ON k.nasabah_id = n.id
LEFT JOIN pending_setoran ps ON ps.nasabah_id = n.id
LEFT JOIN debet d ON d.nasabah_id = n.id;

-- -----------------------------------------------------------------------------
-- 17. SUPABASE STORAGE BUCKET & POLICIES (INSERT + SELECT + UPDATE untuk upsert)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-pendaftaran',
  'bukti-pendaftaran',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "bukti_upload_own_folder" ON storage.objects;
CREATE POLICY "bukti_upload_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'bukti-pendaftaran'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "bukti_update_own_folder" ON storage.objects;
CREATE POLICY "bukti_update_own_folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'bukti-pendaftaran'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'bukti-pendaftaran'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "bukti_select_own_or_staff" ON storage.objects;
CREATE POLICY "bukti_select_own_or_staff" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'bukti-pendaftaran'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT private.current_user_role()) IN ('admin', 'petugas', 'bendahara')
    )
  );

-- -----------------------------------------------------------------------------
-- 18. DATA API GRANTS (Minimal Privilege untuk `anon` & `authenticated`)
-- -----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.jenis_sampah, public.pricelist, public.v_pricelist_aktif TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.v_pricelist_aktif, public.v_saldo_dan_keaktifan_nasabah TO authenticated;
