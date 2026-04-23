import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logout Berhasil" });
  // Hapus tiket (cookie) saat logout
  response.cookies.delete("token");
  return response;
}