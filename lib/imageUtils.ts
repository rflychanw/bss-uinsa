/**
 * Utility untuk konversi gambar ke format WebP di sisi peramban (client-side)
 * dan penamaan berkas dengan format tanggal upload (YYYY-MM-DD).
 */

export type HasilKonversiWebp = {
  file: File;
  dataUrl: string;
  namaFile: string;
  ukuranKB: number;
  ukuranAsliKB: number;
  tanggalUpload: string; // Format: YYYY-MM-DD
  tanggalUploadFormatted: string; // Contoh: "09 Nov 2026"
  lebar: number;
  tinggi: number;
};

export function formatTanggalUpload(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTanggalIndonesia(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return formatTanggalUpload(d);
  }
}

/**
 * Membuat nama berkas berformat: [YYYY-MM-DD]_[tag].webp
 * Contoh: 2026-11-09_follow-bss.webp atau 2026-11-09_follow-lab-febi.webp
 */
export function buatNamaFileWebp(
  tag: string,
  namaAsli?: string,
  d = new Date()
): string {
  const tanggal = formatTanggalUpload(d);
  const cleanTag = tag
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-");

  let suffix = "";
  if (namaAsli) {
    const base = namaAsli
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 16);
    if (base && !cleanTag.includes(base)) {
      suffix = `_${base}`;
    }
  }

  return `${tanggal}_${cleanTag}${suffix}.webp`;
}

/**
 * Konversi gambar dari File input apa saja (JPG, PNG, WebP, HEIC bila didukung)
 * menjadi WebP menggunakan HTML5 Canvas, sekaligus meresize jika resolusi terlalu tinggi
 * agar aman disimpan di LocalStorage atau dikirim ke backend.
 */
export async function konversiGambarKeWebp(
  file: File,
  tag: string,
  kualitas = 0.85,
  maksDimensi = 1280
): Promise<HasilKonversiWebp> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Konversi gambar hanya dapat dijalankan di browser."));
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Berkas harus berupa gambar (PNG, JPG, JPEG, atau WEBP)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error("Gambar tidak dapat dimuat atau rusak."));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Resize proporsional jika melebihi batas maksimal dimensi
          if (width > maksDimensi || height > maksDimensi) {
            if (width > height) {
              height = Math.round((height * maksDimensi) / width);
              width = maksDimensi;
            } else {
              width = Math.round((width * maksDimensi) / height);
              height = maksDimensi;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Gagal menginisialisasi canvas 2D context."));
            return;
          }

          // Gambar ke canvas dengan latar putih untuk transparansi jika ada
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Konversi ke data URL WebP
          const dataUrl = canvas.toDataURL("image/webp", kualitas);

          const namaFile = buatNamaFileWebp(tag, file.name);
          const tanggalUpload = formatTanggalUpload();
          const tanggalUploadFormatted = formatTanggalIndonesia();
          const ukuranAsliKB = Math.round(file.size / 1024);

          // Konversi ke Blob untuk menghasilkan File object baru
          canvas.toBlob(
            (blob) => {
              const finalBlob = blob || new Blob([], { type: "image/webp" });
              const webpFile = new File([finalBlob], namaFile, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              const ukuranKB =
                Math.round(finalBlob.size / 1024) ||
                Math.round((dataUrl.length * 0.75) / 1024);

              resolve({
                file: webpFile,
                dataUrl,
                namaFile,
                ukuranKB,
                ukuranAsliKB,
                tanggalUpload,
                tanggalUploadFormatted,
                lebar: width,
                tinggi: height,
              });
            },
            "image/webp",
            kualitas
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
