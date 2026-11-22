import type { Akun, Sesi } from "../auth";
import type {
  BatchPenjualanPengepul,
  JenisSampah,
  NasabahMaster,
  PenarikanUang,
  SetoranNasabah,
} from "../bss";
import type {
  NasabahRow,
  UserRow,
  VPricelistAktifRow,
  VSaldoNasabahRow,
} from "./types";

export const BSS_DATA_EVENT = "bss:data-updated";

export type SupabaseHydratedStore = {
  ready: boolean;
  pricelistReady: boolean;
  syncing: boolean;
  lastSyncAt: number;
  sesi: (Sesi & { dbId?: string; nasabahDbId?: string }) | null;
  akunList: (Akun & { dbId?: string; nasabahDbId?: string })[];
  pricelist: (JenisSampah & { dbId?: string; pricelistDbId?: string })[];
  setoranList: (SetoranNasabah & { dbId?: string })[];
  penarikanList: (PenarikanUang & { dbId?: string })[];
  batchList: (BatchPenjualanPengepul & { dbId?: string })[];
  nasabahMasterList: (NasabahMaster & {
    selisihHari?: number;
    aktif: boolean;
    sandi?: string;
    nasabahDbId?: string;
    userId?: string;
  })[];
  userById: Record<string, UserRow>;
  nasabahById: Record<string, NasabahRow>;
  nasabahByNomor: Record<string, NasabahRow>;
  saldoByNasabahId: Record<string, VSaldoNasabahRow>;
  jenisByKode: Record<string, VPricelistAktifRow>;
  jenisById: Record<string, VPricelistAktifRow>;
};

const initialStore = (): SupabaseHydratedStore => ({
  ready: false,
  pricelistReady: false,
  syncing: false,
  lastSyncAt: 0,
  sesi: null,
  akunList: [],
  pricelist: [],
  setoranList: [],
  penarikanList: [],
  batchList: [],
  nasabahMasterList: [],
  userById: {},
  nasabahById: {},
  nasabahByNomor: {},
  saldoByNasabahId: {},
  jenisByKode: {},
  jenisById: {},
});

const globalForBss = globalThis as typeof globalThis & {
  __bssSupabaseStore?: SupabaseHydratedStore;
};

export function getSupabaseStore(): SupabaseHydratedStore {
  if (!globalForBss.__bssSupabaseStore) {
    globalForBss.__bssSupabaseStore = initialStore();
  }
  return globalForBss.__bssSupabaseStore;
}

export function resetAuthenticatedStore() {
  const s = getSupabaseStore();
  const savedPricelist = s.pricelist;
  const savedPricelistReady = s.pricelistReady;
  const savedJenisByKode = s.jenisByKode;
  const savedJenisById = s.jenisById;

  Object.assign(s, initialStore(), {
    pricelist: savedPricelist,
    pricelistReady: savedPricelistReady,
    jenisByKode: savedJenisByKode,
    jenisById: savedJenisById,
  });
}

export function notifyBssDataUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BSS_DATA_EVENT));
  }
}

export function subscribeBssDataUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BSS_DATA_EVENT, listener);
  return () => window.removeEventListener(BSS_DATA_EVENT, listener);
}
