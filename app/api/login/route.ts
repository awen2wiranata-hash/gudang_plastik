import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Untuk keperluan Skripsi, kita gunakan hardcode (bisa diubah ke database nanti)
    if (username === "admin" && password === "admin123") {
      const response = NextResponse.json({ success: true, message: "Login Berhasil" }, { status: 200 });

      // Berikan tiket (cookie) yang berlaku selama 1 hari
      response.cookies.set({
        name: "token",
        value: "admin_family_jaya_terautentikasi",
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 Hari (dalam detik)
      });

      return response;
    }

    return NextResponse.json({ success: false, message: "Username atau Password salah!" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}