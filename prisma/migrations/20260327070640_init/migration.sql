-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" TEXT NOT NULL,
    "kodeBarang" TEXT NOT NULL,
    "namaBarang" TEXT NOT NULL,
    "kategori" TEXT,
    "stokSekarang" INTEGER NOT NULL DEFAULT 0,
    "leadTime" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "namaPabrik" TEXT NOT NULL,
    "kontak" TEXT,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiMasuk" (
    "id" TEXT NOT NULL,
    "nomorNota" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "TransaksiMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangMasuk" (
    "id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggalMasuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barangId" TEXT NOT NULL,
    "transaksiMasukId" TEXT NOT NULL,

    CONSTRAINT "BarangMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiKeluar" (
    "id" TEXT NOT NULL,
    "nomorNota" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "TransaksiKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangKeluar" (
    "id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggalKeluar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barangId" TEXT NOT NULL,
    "transaksiKeluarId" TEXT NOT NULL,

    CONSTRAINT "BarangKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peramalan" (
    "id" TEXT NOT NULL,
    "tanggalAwal" TIMESTAMP(3) NOT NULL,
    "tanggalAkhir" TIMESTAMP(3) NOT NULL,
    "nilaiSMA" DOUBLE PRECISION NOT NULL,
    "nilaiMAPE" DOUBLE PRECISION,
    "rop" DOUBLE PRECISION,
    "barangId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Peramalan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_kodeBarang_key" ON "Barang"("kodeBarang");

-- CreateIndex
CREATE UNIQUE INDEX "TransaksiMasuk_nomorNota_key" ON "TransaksiMasuk"("nomorNota");

-- CreateIndex
CREATE UNIQUE INDEX "TransaksiKeluar_nomorNota_key" ON "TransaksiKeluar"("nomorNota");

-- AddForeignKey
ALTER TABLE "TransaksiMasuk" ADD CONSTRAINT "TransaksiMasuk_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangMasuk" ADD CONSTRAINT "BarangMasuk_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangMasuk" ADD CONSTRAINT "BarangMasuk_transaksiMasukId_fkey" FOREIGN KEY ("transaksiMasukId") REFERENCES "TransaksiMasuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiKeluar" ADD CONSTRAINT "TransaksiKeluar_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangKeluar" ADD CONSTRAINT "BarangKeluar_transaksiKeluarId_fkey" FOREIGN KEY ("transaksiKeluarId") REFERENCES "TransaksiKeluar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peramalan" ADD CONSTRAINT "Peramalan_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
