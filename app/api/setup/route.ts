import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    // 1. Bersihkan data user lama agar tidak tabrakan/duplikat
    await prisma.user.deleteMany();

    // 2. Enkripsi password baru untuk kedua akun sakti kita
    const passwordSuperAdmin = await bcrypt.hash("super123", 10);
    const passwordAdmin = await bcrypt.hash("admin123", 10);

    // 3. Masukkan 2 akun dengan ROLE berbeda ke database
    await prisma.user.createMany({
      data: [
  {
    nama: "Owner Family Jaya",
    username: "superadmin",
    password: passwordSuperAdmin,
    role: Role.SUPER_ADMIN, // <-- Diubah menggunakan enum bawaan
  },
  {
    nama: "Staf Gudang Lapangan",
    username: "admin",
    password: passwordAdmin,
    role: Role.ADMIN, // <-- Diubah menggunakan enum bawaan
  }
]
    });

    return NextResponse.json({ 
      message: "✅ BERHASIL! Database telah di-reset. Akun Super Admin (superadmin / super123) dan Admin (admin / admin123) resmi terdaftar." 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal setup akun otomatis" }, { status: 500 });
  }
}