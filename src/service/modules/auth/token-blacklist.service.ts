import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  private readonly KEY_PREFIX = 'blacklist:rt:';

  private refreshTtlSeconds = 7 * 24 * 60 * 60;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host') ?? 'localhost',
      port: this.configService.get<number>('redis.port') ?? 6379,
      password: this.configService.get<string>('redis.password') || undefined,
      lazyConnect: true,
    });

    const rawTtl =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    this.refreshTtlSeconds = this.parseTtlToSeconds(rawTtl);
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  async blacklist(token: string): Promise<void> {
    const key = `${this.KEY_PREFIX}${token}`;
    await this.client.set(key, '1', 'EX', this.refreshTtlSeconds);
  }

  /**
   * Periksa apakah refresh token ada di blacklist.
   * Dipanggil saat proses refresh token.
   *
   * @returns true jika token sudah di-revoke, false jika masih valid.
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.KEY_PREFIX}${token}`;
    const result = await this.client.get(key);
    return result !== null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Parse TTL string seperti "7d", "30m", "3600" ke detik.
   * Mendukung suffix: s, m, h, d.
   */
  private parseTtlToSeconds(ttl: string): number {
    const numeric = parseInt(ttl, 10);
    if (isNaN(numeric)) return 7 * 24 * 60 * 60;

    if (ttl.endsWith('d')) return numeric * 24 * 60 * 60;
    if (ttl.endsWith('h')) return numeric * 60 * 60;
    if (ttl.endsWith('m')) return numeric * 60;
    return numeric;
  }
}
