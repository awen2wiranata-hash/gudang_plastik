import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nama, kontak, alamat } = await request.json();
    const baru = await prisma.customer.create({ data: { nama, kontak, alamat } });
    return NextResponse.json(baru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}