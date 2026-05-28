import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // 🔥 FIX 1: Disamakan menggunakan bcryptjs agar sinkron seluruh aplikasi
import { Role } from "@prisma/client";

export async function GET() {
  try {
    // 1. Bersihkan data user lama agar tidak tabrakan/duplikat
    await prisma.user.deleteMany();

    // 2. Enkripsi password baru menggunakan bcryptjs (Salt level 10)
    const saltSuper = await bcrypt.genSalt(10);
    const passwordSuperAdmin = await bcrypt.hash("super123", saltSuper);

    const saltAdmin = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash("admin123", saltAdmin);

    // 3. Masukkan 2 akun induk dengan ROLE berbeda ke database
    await prisma.user.createMany({
      data: [
        {
          nama: "Owner Family Jaya",
          username: "superadmin",
          password: passwordSuperAdmin, // Hasil hash bcryptjs
          role: Role.SUPER_ADMIN, 
        },
        {
          nama: "Staf Gudang Lapangan",
          username: "admin",
          password: passwordAdmin, // Hasil hash bcryptjs
          role: Role.ADMIN, 
        }
      ]
    });

    return NextResponse.json({ 
      success: true,
      message: "✅ SINKRONISASI BERHASIL! Database user telah di-reset menggunakan Enkripsi Bcryptjs. Akun Utama: superadmin (password: super123) dan admin (password: admin123) resmi terdaftar dan siap dipakai login!" 
    });

  } catch (error: any) {
    console.error("Error Setup:", error);
    return NextResponse.json({ error: `Gagal setup akun otomatis: ${error.message || ""}` }, { status: 500 });
  }
}