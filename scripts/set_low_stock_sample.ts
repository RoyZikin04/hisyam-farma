import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Buat 2 barang menjadi stok menipis (≤ 10) dan stok habis (0)
  const barang = await prisma.penjualan.findMany({ take: 2 });
  if (barang.length >= 2) {
    await prisma.penjualan.update({
      where: { id: barang[0].id },
      data: { stok: 4 }, // Menipis
    });
    await prisma.penjualan.update({
      where: { id: barang[1].id },
      data: { stok: 0 }, // Habis
    });
    console.log(`Updated ${barang[0].nama_barang} to stok 4, and ${barang[1].nama_barang} to stok 0`);
  }
}

main().finally(() => prisma.$disconnect());
