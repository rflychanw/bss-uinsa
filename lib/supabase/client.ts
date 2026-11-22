import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Memeriksa apakah variabel environment publik Supabase sudah diisi.
 * Mengembalikan false jika belum dikonfigurasi (aman untuk fallback mode demo).
 */
export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("YOUR_PROJECT_ID") &&
      !key.includes("your-anon-public-key")
  );
}

/**
 * Membuat (atau mengambil singleton) Supabase client untuk komponen browser/client.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local."
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
