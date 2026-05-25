import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Berhasil Logout" });

  // Hapus tiket token dengan cara memaksa masa berlakunya menjadi 0 detik
  response.cookies.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}