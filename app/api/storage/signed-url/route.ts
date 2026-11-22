import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const BUCKET_BUKTI = "bukti-pendaftaran";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json(
      { ok: false, pesan: "Autentikasi diperlukan." },
      { status: 401 }
    );
  }

  let body: { paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Payload tidak valid." },
      { status: 400 }
    );
  }

  const STORAGE_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9._-]+$/i;
  const rawPaths = Array.isArray(body.paths) ? body.paths : [];
  const cleanPaths = rawPaths.filter(
    (p): p is string =>
      typeof p === "string" &&
      !p.includes("..") &&
      !p.includes("\\") &&
      STORAGE_PATH_RE.test(p.trim())
  );

  if (cleanPaths.length === 0) {
    return NextResponse.json({ ok: true, urls: {} });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { ok: false, pesan: "Akun tidak aktif." },
      { status: 403 }
    );
  }

  const isStaff = ["admin", "petugas", "bendahara"].includes(profile.role);
  const authorizedPaths = isStaff
    ? cleanPaths
    : cleanPaths.filter((p) => p.startsWith(`${user.id}/`));

  if (authorizedPaths.length === 0) {
    return NextResponse.json(
      { ok: false, pesan: "Anda tidak memiliki izin melihat berkas ini." },
      { status: 403 }
    );
  }

  const { data: signedList, error: signErr } = await admin.storage
    .from(BUCKET_BUKTI)
    .createSignedUrls(authorizedPaths, 3600);

  if (signErr) {
    return NextResponse.json(
      { ok: false, pesan: signErr.message },
      { status: 500 }
    );
  }

  const urls: Record<string, string> = {};
  for (const item of signedList || []) {
    if (item.path && item.signedUrl) {
      urls[item.path] = item.signedUrl;
    }
  }

  return NextResponse.json({ ok: true, urls });
}
