import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; 

export async function GET() {
  try {
    // 1. Bersihkan data user lama 
    await prisma.user.deleteMany();

    // 2. Enkripsi password baru menggunakan bcryptjs
    const saltSuper = await bcrypt.genSalt(10);
    const passwordSuperAdmin = await bcrypt.hash("super123", saltSuper);

    const saltAdmin = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash("admin123", saltAdmin);

    // 3. Masukkan 2 akun induk SESUAI DENGAN SCHEMA (Tanpa Email)
    await prisma.user.createMany({
      data: [
        {
          nama: "Owner Family Jaya",
          username: "superadmin", // <-- Hanya butuh nama, username, password, role
          password: passwordSuperAdmin, 
          role: "SUPER_ADMIN", 
        },
        {
          nama: "Staf Gudang Lapangan",
          username: "admin",
          password: passwordAdmin, 
          role: "ADMIN", 
        }
      ]
    });

    return NextResponse.json({ 
      success: true,
      message: "✅ SINKRONISASI BERHASIL! Database user telah di-reset. Akun Utama: superadmin (password: super123) dan admin (password: admin123) siap dipakai login!" 
    });

  } catch (error: any) {
    console.error("Error Setup:", error);
    return NextResponse.json({ error: `Gagal setup akun otomatis: ${error.message || ""}` }, { status: 500 });
  }
}