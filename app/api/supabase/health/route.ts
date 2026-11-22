import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        message:
          "Variabel .env.local untuk Supabase belum diisi. Lihat .env.example.",
      },
      { status: 200 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("v_pricelist_aktif")
      .select("kode_sampah")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          configured: true,
          connected: false,
          message: `Koneksi terhubung ke Supabase, namun skema belum siap: ${error.message}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      configured: true,
      connected: true,
      pricelistReady: Array.isArray(data) && data.length > 0,
      message: "Supabase terhubung dan skema BSS UINSA siap digunakan.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        message: err instanceof Error ? err.message : "Gagal memeriksa koneksi Supabase.",
      },
      { status: 500 }
    );
  }
}
