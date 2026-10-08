/**
 * In-Memory Rate Limiter untuk mitigasi serangan Brute Force pada Login
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan data lama setiap 10 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Memeriksa dan mencatat percobaan aksi berdasarkan identifier (misal: IP atau username)
 * @param key Pengenal unik
 * @param maxAttempts Batas maksimum percobaan (default: 5)
 * @param windowMs Durasi jendela waktu dalam milidetik (default: 5 menit = 300000ms)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    // Belum ada atau sudah lewat batas reset
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
  };
}

/**
 * Reset rate limit saat user berhasil login
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
