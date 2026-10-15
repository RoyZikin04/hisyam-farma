import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("libsql://") ? process.env.DATABASE_URL : undefined);
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  // Jika env Turso tersedia (di Vercel atau saat konek ke cloud):
  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter } as any);
  }

  // Fallback: Jika offline di laptop tanpa Turso, tetap baca dev.db lokal
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
