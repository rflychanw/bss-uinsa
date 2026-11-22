import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { hasSupabaseEnv } from "./client";

/**
 * Supabase SSR client untuk Server Components, Route Handlers, dan Server Actions.
 * Menggunakan cookies untuk membaca & menyegarkan sesi Auth secara aman.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase belum dikonfigurasi di .env.local (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Diabaikan ketika dipanggil dari Server Component read-only;
            // penyegaran cookie ditangani oleh proxy.ts
          }
        },
      },
    }
  );
}

/**
 * Supabase Admin Client (HANYA untuk Server-Side API Routes / Admin CRUD).
 * Membutuhkan SUPABASE_SERVICE_ROLE_KEY dan tidak pernah boleh diimpor di komponen client.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.includes("your-service-role")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di .env.local."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
