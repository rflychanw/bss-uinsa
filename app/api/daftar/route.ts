import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const BUCKET_BUKTI = "bukti-pendaftaran";
const MAX_BYTES = 5 * 1024 * 1024;

type ParsedDataUrl = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

function parseDataUrl(input?: string): ParsedDataUrl | null {
  if (!input || !input.startsWith("data:")) return null;
  const match = input.match(/^data:(image\/(?:webp|png|jpeg|jpg));base64,(.+)$/i);
  if (!match) return null;

  const rawMime = match[1].toLowerCase();
  const contentType = rawMime === "image/jpg" ? "image/jpeg" : rawMime;
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/jpeg"
      ? "jpg"
      : "webp";

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    throw new Error("Ukuran gambar bukti melebihi batas 5 MB atau korup.");
  }

  return { buffer, contentType, ext };
}

function nextBookNumber(existing: { no_buku_tabungan: string }[]): string {
  let maxNum = 210;
  for (const row of existing) {
    const match = row.no_buku_tabungan?.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `BSS-${String(maxNum + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        pesan:
          err instanceof Error
            ? err.message
            : "Konfigurasi server Supabase belum lengkap.",
      },
      { status: 500 }
    );
  }

  let body: {
    nama?: string;
    email?: string;
    sandi?: string;
    kategori?: "umum" | "internal";
    fakultas?: string;
    prodi?: string;
    noHp?: string;
    alamat?: string;
    metodeBayar?: "qris" | "va" | "tunai";
    buktiBayar?: string;
    buktiFollowBss?: string;
    buktiFollowLab?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format data pendaftaran tidak valid." },
      { status: 400 }
    );
  }

  const nama = (body.nama || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const sandi = body.sandi || "";
  const kategori = body.kategori === "internal" ? "internal" : "umum";
  const fakultas =
    kategori === "internal" ? (body.fakultas || "FEBI").trim() : "Umum";
  const prodi =
    kategori === "internal" ? (body.prodi || "").trim() || null : null;
  const metodeBayar =
    body.metodeBayar === "va" || body.metodeBayar === "tunai"
      ? body.metodeBayar
      : "qris";

  if (nama.length < 2) {
    return NextResponse.json(
      { ok: false, pesan: "Nama lengkap minimal 2 karakter." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, pesan: "Format email tidak valid." },
      { status: 400 }
    );
  }
  if (email.endsWith("@petugas.com") || email.endsWith("@bendahara.com")) {
    return NextResponse.json(
      {
        ok: false,
        pesan:
          "Domain email staf tidak dapat digunakan untuk pendaftaran nasabah.",
      },
      { status: 400 }
    );
  }
  if (sandi.length < 6) {
    return NextResponse.json(
      { ok: false, pesan: "Kata sandi minimal 6 karakter." },
      { status: 400 }
    );
  }

  let parsedBayar: ParsedDataUrl | null = null;
  let parsedBss: ParsedDataUrl | null = null;
  let parsedLab: ParsedDataUrl | null = null;

  try {
    parsedBayar = parseDataUrl(body.buktiBayar);
    parsedBss = parseDataUrl(body.buktiFollowBss);
    parsedLab = parseDataUrl(body.buktiFollowLab);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        pesan:
          err instanceof Error
            ? err.message
            : "Berkas gambar bukti tidak valid.",
      },
      { status: 400 }
    );
  }

  // Cek apakah email sudah terdaftar
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json(
      {
        ok: false,
        pesan: `Email ${email} sudah terdaftar. Silakan masuk dengan akun tersebut.`,
      },
      { status: 409 }
    );
  }

  // Generate nomor buku tabungan berikutnya
  const { data: existingBooks } = await admin
    .from("nasabah")
    .select("no_buku_tabungan");

  const noBuku = nextBookNumber(
    (existingBooks as { no_buku_tabungan: string }[]) || []
  );

  const usernameBase = email
    .split("@")[0]
    .replace(/[^a-z0-9._-]/gi, "")
    .toLowerCase();
  const username = `${usernameBase || "nasabah"}_${Date.now().toString(36).slice(-4)}`;
  const jabatan =
    kategori === "internal"
      ? `Civitas UINSA (${fakultas}${prodi ? ` - ${prodi}` : ""})`
      : "Nasabah Umum";

  const { data: authCreated, error: authErr } =
    await admin.auth.admin.createUser({
      email,
      password: sandi,
      email_confirm: true,
      app_metadata: {
        role: "nasabah",
        username,
        jabatan,
      },
      user_metadata: {
        nama_lengkap: nama,
      },
    });

  if (authErr || !authCreated?.user) {
    const msg = authErr?.message?.toLowerCase().includes("already")
      ? `Email ${email} sudah terdaftar.`
      : authErr?.message || "Gagal membuat akun autentikasi nasabah.";
    return NextResponse.json({ ok: false, pesan: msg }, { status: 400 });
  }

  const userId = authCreated.user.id;
  const uploadedPaths: string[] = [];

  try {
    // Sinkronkan profil public.users
    await admin
      .from("users")
      .update({
        nama_lengkap: nama,
        username,
        jabatan,
        role: "nasabah",
        is_email_verified: true,
        is_active: true,
      })
      .eq("id", userId);

    const uploadAsset = async (
      parsed: ParsedDataUrl | null,
      filename: string
    ): Promise<string | null> => {
      if (!parsed) return null;
      const path = `${userId}/${filename}.${parsed.ext}`;
      const { error: upErr } = await admin.storage
        .from(BUCKET_BUKTI)
        .upload(path, parsed.buffer, {
          contentType: parsed.contentType,
          upsert: true,
        });
      if (upErr) {
        throw new Error(`Gagal mengunggah ${filename}: ${upErr.message}`);
      }
      uploadedPaths.push(path);
      return path;
    };

    const [buktiBayarPath, buktiBssPath, buktiLabPath] = await Promise.all([
      uploadAsset(parsedBayar, "bukti-bayar"),
      uploadAsset(parsedBss, "bukti-ig-bss"),
      uploadAsset(parsedLab, "bukti-ig-lab"),
    ]);

    const nowIso = new Date().toISOString();
    const { error: nasabahErr } = await admin.from("nasabah").insert({
      user_id: userId,
      no_buku_tabungan: noBuku,
      kategori,
      fakultas,
      prodi,
      no_hp: body.noHp?.trim() || null,
      alamat: body.alamat?.trim() || null,
      metode_bayar_daftar: metodeBayar,
      status_pendaftaran: "menunggu",
      bukti_bayar_url: buktiBayarPath,
      bukti_ig_bss_url: buktiBssPath,
      bukti_ig_lab_url: buktiLabPath,
      tanggal_upload_bukti:
        buktiBayarPath || buktiBssPath || buktiLabPath ? nowIso : null,
      terakhir_setor_at: null,
    });

    if (nasabahErr) {
      throw new Error(nasabahErr.message);
    }

    return NextResponse.json({
      ok: true,
      nomor: noBuku,
      email,
      nama,
      statusVerifikasi: "menunggu",
      buktiPaths: {
        bayar: buktiBayarPath,
        bss: buktiBssPath,
        lab: buktiLabPath,
      },
    });
  } catch (err) {
    // Rollback storage & Auth user jika insert nasabah gagal
    if (uploadedPaths.length > 0) {
      await admin.storage.from(BUCKET_BUKTI).remove(uploadedPaths);
    }
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      {
        ok: false,
        pesan:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan pendaftaran nasabah.",
      },
      { status: 500 }
    );
  }
}
