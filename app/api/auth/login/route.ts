import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Pastikan path prisma kamu sudah benar
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. CARI USER DI DATABASE BERDASARKAN USERNAME
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    // Jika username tidak ditemukan di database
    if (!user) {
      return NextResponse.json({ success: false, message: "Username tidak ditemukan!" }, { status: 401 });
    }

    // 2. CEK APAKAH PASSWORD COCOK (Menggunakan Bcrypt)
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // Jika password salah
    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, message: "Password salah!" }, { status: 401 });
    }

    // 3. JIKA COCOK, BUAT RESPONSE BERHASIL
    const response = NextResponse.json(
      { 
        success: true, 
        message: "Login Berhasil",
        user: { nama: user.nama, role: user.role } // Kirim data nama & role ke frontend
      }, 
      { status: 200 }
    );

    // 4. BERIKAN TIKET (COOKIE) BERISI INFORMASI ROLE DIA
    // Kita simpan teks gabungan berupa "id_user|ROLE" di dalam cookie
    const tokenValue = `${user.id}|${user.role}`;

    response.cookies.set({
      name: "token",
      value: tokenValue, // Sekarang isinya dinamis (bisa SUPER_ADMIN atau ADMIN)
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 Hari
    });

    return response;

  } catch (error) {
    console.error("Error login server:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}