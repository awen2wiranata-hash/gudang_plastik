import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcryptjs"; 

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Username tidak ditemukan!" }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, message: "Password salah!" }, { status: 401 });
    }

    const response = NextResponse.json(
      { 
        success: true, 
        message: "Login Berhasil",
        user: { nama: user.nama, role: user.role } 
      }, 
      { status: 200 }
    );

    const tokenValue = `${user.username}|${user.role}`;

    response.cookies.set({
      name: "token",
      value: tokenValue, // 🔥 FIX: Hilangkan encodeURIComponent agar split("|") di layout berjalan normal
      httpOnly: false, 
      path: "/",
      maxAge: 60 * 60 * 24, // 1 Hari
    });

    return response;

  } catch (error) {
    console.error("Error login server:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}