import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Definisikan struktur tipe data update untuk membuang 'any'
interface UserUpdateInput {
  nama: string;
  username: string;
  role: Role;
  password?: string;
}

async function getUserFromCookie() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("token")?.value;
  if (!token) return { username: "System_Unknown", role: "UNKNOWN" };
  
  const parts = decodeURIComponent(token).split("|");
  return { username: parts[0] || "Unknown_User", role: parts[1] || "ADMIN" };
}

// ==========================================
// 1. GET: Ambil Semua Akun Pengguna
// ==========================================
export async function GET() {
  try {
    const actor = await getUserFromCookie();
    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak!" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data akun" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Daftarkan Staf/User Baru
// ==========================================
export async function POST(request: Request) {
  try {
    const { nama, username, password, role } = await request.json();
    const actor = await getUserFromCookie();

    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak!" }, { status: 403 });
    }

    if (!nama || !username || !password) {
      return NextResponse.json({ error: "Semua kolom wajib diisi!" }, { status: 400 });
    }

    const userExist = await prisma.user.findUnique({ where: { username } });
    if (userExist) {
      return NextResponse.json({ error: "Username sudah terdaftar!" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordTerenkripsi = await bcrypt.hash(password, salt);
    const enumRole = role === "SUPER_ADMIN" ? Role.SUPER_ADMIN : Role.ADMIN;

    await prisma.$transaction(async (tx) => {
      const userBaru = await tx.user.create({
        data: { 
          nama, 
          username, 
          password: passwordTerenkripsi, 
          role: enumRole 
        }
      });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "CREATE_USER_ACCOUNT",
          nomorNota: "-",
          dataLama: JSON.stringify({ pesan: "Akun baru belum terdaftar." }),
          dataBaru: JSON.stringify({ barang: [{ nama: `User: ${userBaru.username} (${userBaru.role})`, qty: 1 }] })
        }
      });
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dibuat!" }, { status: 201 });
  } catch (error) {
    const pesanError = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Gagal membuat akun baru: ${pesanError}` }, { status: 500 });
  }
}

// ==========================================
// 3. PUT: Edit & Reset Password
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, nama, username, password, role } = await request.json();
    const actor = await getUserFromCookie();

    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak!" }, { status: 403 });
    }

    const enumRole = role === "SUPER_ADMIN" ? Role.SUPER_ADMIN : Role.ADMIN;

    await prisma.$transaction(async (tx) => {
      const userLama = await tx.user.findUnique({ where: { id } });
      if (!userLama) throw new Error("Akun tidak ditemukan!");

      // Menggunakan interface ketat TypeScript (Bukan 'any' lagi)
      const dataUpdate: UserUpdateInput = { 
        nama: nama || userLama.nama, 
        username: username || userLama.username, 
        role: enumRole 
      };
      
      if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        dataUpdate.password = await bcrypt.hash(password, salt);
      }

      const userUpdate = await tx.user.update({
        where: { id },
        data: dataUpdate
      });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_USER_ACCOUNT",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: `User: ${userLama.username} (${userLama.role})`, qty: 1 }] }),
          dataBaru: JSON.stringify({ barang: [{ nama: `User: ${userUpdate.username} (${userUpdate.role})`, qty: 1 }] })
        }
      });
    });

    return NextResponse.json({ success: true, message: "Akun berhasil diperbarui!" }, { status: 200 });
  } catch (error) {
    const pesanError = error instanceof Error ? error.message : "Gagal memperbarui akun";
    return NextResponse.json({ error: pesanError }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Akun & Rekam Audit Log
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); 
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();
    if (actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak!" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      const userLama = await tx.user.findUnique({ where: { id } });
      if (!userLama) throw new Error("Akun tidak ditemukan!");

      if (userLama.username === actor.username) {
        throw new Error("Keamanan Sistem: Anda dilarang menghapus akun Anda sendiri!");
      }

      await tx.user.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "DELETE_USER_ACCOUNT",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: `User: ${userLama.username} (${userLama.role})`, qty: 1 }] }),
          dataBaru: JSON.stringify({ pesan: `Akun [${userLama.username}] telah dihancurkan dari sistem.` })
        }
      });
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus dari sistem!" }, { status: 200 });
  } catch (error) {
    const pesanError = error instanceof Error ? error.message : "Gagal menghapus data akun";
    return NextResponse.json({ error: pesanError }, { status: 500 });
  }
}