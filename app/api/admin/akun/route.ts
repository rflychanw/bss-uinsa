import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { UserRow } from "@/lib/supabase/types";

type StaffRole = "petugas" | "bendahara";

function formatEmailSesuaiRole(raw: string, role: StaffRole): string {
  const clean = raw.trim().toLowerCase();
  if (!clean) return "";
  if (role === "petugas") {
    if (clean.endsWith("@petugas.com")) return clean;
    if (clean.endsWith("@gmail.com")) {
      return `${clean.slice(0, -"@gmail.com".length)}gmail@petugas.com`;
    }
    const base = clean.includes("@") ? clean.split("@")[0] : clean;
    return `${base}gmail@petugas.com`;
  }
  if (clean.endsWith("@bendahara.com")) return clean;
  if (clean.endsWith("@gmail.com")) {
    return `${clean.slice(0, -"@gmail.com".length)}gmail@bendahara.com`;
  }
  const base = clean.includes("@") ? clean.split("@")[0] : clean;
  return `${base}gmail@bendahara.com`;
}

async function requireAdminCaller() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401, pesan: "Sesi login tidak valid." };
  }

  const admin = createSupabaseAdminClient();
  const { data: callerProfile } = await admin
    .from("users")
    .select("id, role, is_active, nama_lengkap")
    .eq("id", user.id)
    .maybeSingle();

  if (!callerProfile || !callerProfile.is_active || callerProfile.role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      pesan: "Hanya Administrator Sistem yang dapat mengelola akun.",
    };
  }

  return { ok: true as const, admin, caller: callerProfile };
}

export async function POST(request: Request) {
  const gate = await requireAdminCaller();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, pesan: gate.pesan }, { status: gate.status });
  }

  let body: {
    nama?: string;
    email?: string;
    sandi?: string;
    role?: string;
    nomor?: string;
    jabatan?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format data permintaan tidak valid." },
      { status: 400 }
    );
  }

  const role: StaffRole | null =
    body.role === "petugas" || body.role === "bendahara" ? body.role : null;
  if (!role) {
    return NextResponse.json(
      {
        ok: false,
        pesan: "Pembuatan akun melalui panel Admin hanya untuk peran Petugas atau Bendahara.",
      },
      { status: 400 }
    );
  }

  const nama = (body.nama || "").trim();
  const sandi = body.sandi || "";
  if (nama.length < 2) {
    return NextResponse.json(
      { ok: false, pesan: "Nama lengkap minimal 2 karakter." },
      { status: 400 }
    );
  }
  if (sandi.length < 6) {
    return NextResponse.json(
      { ok: false, pesan: "Kata sandi minimal 6 karakter." },
      { status: 400 }
    );
  }

  const email = formatEmailSesuaiRole(body.email || "", role);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, pesan: "Format email staf tidak valid." },
      { status: 400 }
    );
  }

  const { admin } = gate;
  const { data: allStaff } = await admin
    .from("users")
    .select("id, email, nomor_induk_staf, role")
    .eq("role", role);

  let nomor = (body.nomor || "").trim().toUpperCase();
  if (!nomor) {
    const prefix = role === "petugas" ? "PETUGAS-" : "BENDAHARA-";
    let maxNum = 0;
    for (const s of allStaff || []) {
      const m = s.nomor_induk_staf?.match(/(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    nomor = `${prefix}${String(maxNum + 1).padStart(2, "0")}`;
  }

  const { data: dupEmail } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (dupEmail) {
    return NextResponse.json(
      { ok: false, pesan: `Email ${email} sudah digunakan oleh akun lain.` },
      { status: 409 }
    );
  }

  const { data: dupNomor } = await admin
    .from("users")
    .select("id")
    .eq("nomor_induk_staf", nomor)
    .maybeSingle();
  if (dupNomor) {
    return NextResponse.json(
      { ok: false, pesan: `Nomor ID ${nomor} sudah terdaftar.` },
      { status: 409 }
    );
  }

  const username = email.split("@")[0].replace(/[^a-z0-9._-]/gi, "").toLowerCase();
  const jabatan =
    (body.jabatan || "").trim() ||
    (role === "petugas" ? "Petugas Jaga Piket BSS" : "Bendahara Pengelola BSS");

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: sandi,
    email_confirm: true,
    app_metadata: {
      role,
      username,
      nomor_induk_staf: nomor,
      jabatan,
    },
    user_metadata: {
      nama_lengkap: nama,
    },
  });

  if (authErr || !created?.user) {
    return NextResponse.json(
      {
        ok: false,
        pesan: authErr?.message || "Gagal membuat akun staf di Supabase Auth.",
      },
      { status: 400 }
    );
  }

  const userId = created.user.id;
  await admin
    .from("users")
    .update({
      nama_lengkap: nama,
      username,
      nomor_induk_staf: nomor,
      jabatan,
      role,
      is_email_verified: true,
      is_active: true,
    })
    .eq("id", userId);

  return NextResponse.json({
    ok: true,
    akun: {
      id: userId,
      email,
      role,
      nama,
      nomor,
      jabatan,
      statusVerifikasi: "aktif",
    },
  });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminCaller();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, pesan: gate.pesan }, { status: gate.status });
  }

  let body: {
    userId?: string;
    identitasLama?: string;
    nama?: string;
    email?: string;
    sandi?: string;
    role?: string;
    nomor?: string;
    jabatan?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format data pembaruan tidak valid." },
      { status: 400 }
    );
  }

  const { admin } = gate;
  let target: UserRow | null = null;
  if (body.userId) {
    const { data } = await admin
      .from("users")
      .select("*")
      .eq("id", body.userId)
      .maybeSingle();
    target = data;
  } else if (body.identitasLama) {
    const idClean = body.identitasLama.trim();
    const { data: byNomor } = await admin
      .from("users")
      .select("*")
      .ilike("nomor_induk_staf", idClean)
      .maybeSingle();
    if (byNomor) {
      target = byNomor;
    } else {
      const { data: byEmail } = await admin
        .from("users")
        .select("*")
        .ilike("email", idClean)
        .maybeSingle();
      target = byEmail;
    }
  } else {
    return NextResponse.json(
      { ok: false, pesan: "Identitas akun staf tidak ditemukan." },
      { status: 400 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { ok: false, pesan: "Akun staf tidak ditemukan di database." },
      { status: 404 }
    );
  }
  if (target.role !== "petugas" && target.role !== "bendahara") {
    return NextResponse.json(
      {
        ok: false,
        pesan: "Operasi edit di panel Admin hanya diperbolehkan untuk akun Petugas atau Bendahara.",
      },
      { status: 403 }
    );
  }

  const roleBaru: StaffRole =
    body.role === "petugas" || body.role === "bendahara"
      ? body.role
      : (target.role as StaffRole);

  const namaBaru =
    body.nama !== undefined ? body.nama.trim() : target.nama_lengkap;
  if (namaBaru.length < 2) {
    return NextResponse.json(
      { ok: false, pesan: "Nama lengkap minimal 2 karakter." },
      { status: 400 }
    );
  }

  const emailBaru = formatEmailSesuaiRole(
    body.email !== undefined ? body.email : target.email,
    roleBaru
  );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBaru)) {
    return NextResponse.json(
      { ok: false, pesan: "Format email staf tidak valid." },
      { status: 400 }
    );
  }

  const sandiBaru = (body.sandi || "").trim();
  if (sandiBaru && sandiBaru.length < 6) {
    return NextResponse.json(
      { ok: false, pesan: "Kata sandi baru minimal 6 karakter." },
      { status: 400 }
    );
  }

  const nomorBaru = (body.nomor?.trim() || target.nomor_induk_staf || "").toUpperCase();
  const jabatanBaru =
    body.jabatan !== undefined ? body.jabatan.trim() : target.jabatan;

  const { data: dupEmail } = await admin
    .from("users")
    .select("id")
    .eq("email", emailBaru)
    .neq("id", target.id)
    .maybeSingle();
  if (dupEmail) {
    return NextResponse.json(
      { ok: false, pesan: `Email ${emailBaru} sudah dipakai oleh akun lain.` },
      { status: 409 }
    );
  }

  if (nomorBaru) {
    const { data: dupNomor } = await admin
      .from("users")
      .select("id")
      .eq("nomor_induk_staf", nomorBaru)
      .neq("id", target.id)
      .maybeSingle();
    if (dupNomor) {
      return NextResponse.json(
        { ok: false, pesan: `Nomor ID ${nomorBaru} sudah dipakai akun lain.` },
        { status: 409 }
      );
    }
  }

  const authPatch: Record<string, unknown> = {
    email: emailBaru,
    email_confirm: true,
    app_metadata: {
      role: roleBaru,
      nomor_induk_staf: nomorBaru || null,
      jabatan: jabatanBaru || null,
    },
    user_metadata: {
      nama_lengkap: namaBaru,
    },
  };
  if (sandiBaru) {
    authPatch.password = sandiBaru;
  }

  const { error: authUpdErr } = await admin.auth.admin.updateUserById(
    target.id,
    authPatch
  );
  if (authUpdErr) {
    return NextResponse.json(
      { ok: false, pesan: authUpdErr.message },
      { status: 400 }
    );
  }

  const { error: dbUpdErr } = await admin
    .from("users")
    .update({
      email: emailBaru,
      nama_lengkap: namaBaru,
      nomor_induk_staf: nomorBaru || null,
      jabatan: jabatanBaru || null,
      role: roleBaru,
    })
    .eq("id", target.id);

  if (dbUpdErr) {
    return NextResponse.json(
      { ok: false, pesan: dbUpdErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    akun: {
      id: target.id,
      email: emailBaru,
      nama: namaBaru,
      nomor: nomorBaru || target.username,
      role: roleBaru,
      jabatan: jabatanBaru,
      statusVerifikasi: "aktif",
    },
  });
}

export async function DELETE(request: Request) {
  const gate = await requireAdminCaller();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, pesan: gate.pesan }, { status: gate.status });
  }

  let body: { userId?: string; identitas?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Format data penghapusan tidak valid." },
      { status: 400 }
    );
  }

  const { admin, caller } = gate;
  let targetUserId = body.userId;

  if (!targetUserId && body.identitas) {
    const idClean = body.identitas.trim();
    const { data: byNomor } = await admin
      .from("users")
      .select("id")
      .ilike("nomor_induk_staf", idClean)
      .maybeSingle();

    if (byNomor) {
      targetUserId = byNomor.id;
    } else {
      const { data: byEmail } = await admin
        .from("users")
        .select("id")
        .ilike("email", idClean)
        .maybeSingle();

      if (byEmail) {
        targetUserId = byEmail.id;
      } else {
        const { data: foundNasabah } = await admin
          .from("nasabah")
          .select("user_id")
          .ilike("no_buku_tabungan", idClean)
          .maybeSingle();
        targetUserId = foundNasabah?.user_id;
      }
    }
  }

  if (!targetUserId) {
    return NextResponse.json(
      { ok: false, pesan: "Akun yang akan dihapus tidak ditemukan." },
      { status: 404 }
    );
  }

  if (targetUserId === caller.id) {
    return NextResponse.json(
      { ok: false, pesan: "Tidak dapat menghapus akun Administrator yang sedang aktif masuk." },
      { status: 400 }
    );
  }

  const { data: targetUser } = await admin
    .from("users")
    .select("id, role, email, nama_lengkap")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json(
      { ok: false, pesan: "Akun tidak ditemukan di database." },
      { status: 404 }
    );
  }

  if (targetUser.role === "admin") {
    return NextResponse.json(
      { ok: false, pesan: "Akun Administrator Sistem tidak dapat dihapus melalui panel." },
      { status: 403 }
    );
  }

  // Bersihkan file storage bukti pendaftaran jika akun adalah nasabah
  const { data: nasabahRow } = await admin
    .from("nasabah")
    .select("id, bukti_bayar_url, bukti_ig_bss_url, bukti_ig_lab_url")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const { error: delAuthErr } = await admin.auth.admin.deleteUser(targetUserId);
  if (delAuthErr) {
    const msg = delAuthErr.message || "";
    if (
      msg.toLowerCase().includes("foreign key") ||
      msg.toLowerCase().includes("constraint") ||
      msg.toLowerCase().includes("database error")
    ) {
      return NextResponse.json(
        {
          ok: false,
          pesan:
            "Akun tidak dapat dihapus permanen karena masih memiliki riwayat setoran, penarikan, atau transaksi audit yang tercatat.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, pesan: `Gagal menghapus akun: ${msg}` },
      { status: 400 }
    );
  }

  if (nasabahRow) {
    const paths = [
      nasabahRow.bukti_bayar_url,
      nasabahRow.bukti_ig_bss_url,
      nasabahRow.bukti_ig_lab_url,
    ].filter((p): p is string => Boolean(p && !p.startsWith("data:")));
    if (paths.length > 0) {
      await admin.storage.from("bukti-pendaftaran").remove(paths);
    }
  }

  return NextResponse.json({
    ok: true,
    pesan: `Akun ${targetUser.nama_lengkap} (${targetUser.email}) berhasil dihapus.`,
  });
}
