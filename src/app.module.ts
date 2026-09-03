import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AppThrottlerGuard } from './guards/app-throttler.guard';
import {
  serverConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  smtpConfig,
  bcryptConfig,
  cronConfig,
  erpConfig,
} from './configs/config';
import { validationSchema } from './configs/validation.schema';
import { User } from './models/user.model';
import { AuditLog } from './models/audit-log.model';
import { Tenant } from './models/tenant.model';
import { Invoice } from './models/invoice.model';
import { PosDevice } from './models/pos-device.model';
import { Notification } from './models/notification.model';
import { EmailTemplate } from './models/email-template.model';
import { CreateUsersTable1723143600000 } from './migrations/1723143600000-CreateUsersTable';
import { CreateAuditLogsTable1723143700000 } from './migrations/1723143700000-CreateAuditLogsTable';
import { CreateTenantsTable1723143800000 } from './migrations/1723143800000-CreateTenantsTable';
import { CreateInvoicesTable1723143900000 } from './migrations/1723143900000-CreateInvoicesTable';
import { CreatePosDevicesTable1723144000000 } from './migrations/1723144000000-CreatePosDevicesTable';
import { CreateNotificationsTable1723144100000 } from './migrations/1723144100000-CreateNotificationsTable';
import { AddViewerRole1723144200000 } from './migrations/1723144200000-AddViewerRole';
import { CreateEmailTemplatesTable1723144300000 } from './migrations/1723144300000-CreateEmailTemplatesTable';
import { RequestContextMiddleware } from './middlewares/request-context.middleware';
import { HttpLoggerMiddleware } from './middlewares/http-logger.middleware';
import { InvoiceModule } from './routes/modules/invoice.module';
import { UserModule } from './routes/modules/user.module';
import { AuthModule } from './routes/modules/auth.module';
import { AuditLogModule } from './routes/modules/audit-log.module';
import { TenantModule } from './routes/modules/tenant.module';
import { RealtimeModule } from './routes/modules/realtime.module';
import { PosDeviceModule } from './routes/modules/pos-device.module';
import { NotificationModule } from './routes/modules/notification.module';
import { QueuesModule } from './queues/queues.module';
import { DashboardModule } from './routes/modules/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';

// Evaluasi di top-level — tersedia saat @Module decorator di-parse
const IS_TEST_ENV = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        serverConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        smtpConfig,
        bcryptConfig,
        cronConfig,
        erpConfig,
      ],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          ...(IS_TEST_ENV
            ? {}
            : {
                storage: new ThrottlerStorageRedisService({
                  host: config.get<string>('redis.host') ?? 'localhost',
                  port: config.get<number>('redis.port') ?? 6379,
                  password: config.get<string>('redis.password') || undefined,
                  retryStrategy: (times: number) => Math.min(times * 100, 3000),
                }),
              }),
          throttlers: [
            {
              name: 'global',
              ttl: 60_000,
              limit: IS_TEST_ENV ? 10_000 : 120,
            },
            {
              name: 'auth',
              ttl: 60_000,
              limit: IS_TEST_ENV ? 10_000 : 10,
            },
            {
              name: 'strict',
              ttl: 60_000,
              limit: IS_TEST_ENV ? 10_000 : 5,
            },
          ],
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [
          User,
          AuditLog,
          Tenant,
          Invoice,
          PosDevice,
          Notification,
          EmailTemplate,
        ],
        migrations: [
          CreateUsersTable1723143600000,
          CreateAuditLogsTable1723143700000,
          CreateTenantsTable1723143800000,
          CreateInvoicesTable1723143900000,
          CreatePosDevicesTable1723144000000,
          CreateNotificationsTable1723144100000,
          AddViewerRole1723144200000,
          CreateEmailTemplatesTable1723144300000,
        ],
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
        // ─── PgBouncer compatibility ──────────────────────────────────────
        // PgBouncer transaction pooling tidak support prepared statements.
        // TypeORM harus kirim query sebagai simple protocol, bukan extended.
        extra: {
          // Nonaktifkan prepared statements — wajib untuk transaction pooling
          options: '-c statement_timeout=30000',
          // Pool size kecil — PgBouncer yang handle pooling ke PostgreSQL
          max: config.get<number>('database.poolMax') ?? 5,
          // Tutup idle connection setelah 30 detik
          idleTimeoutMillis: 30_000,
          // Timeout saat mendapatkan connection dari pool
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),

    UserModule,
    AuthModule,
    AuditLogModule,
    TenantModule,
    RealtimeModule,
    InvoiceModule,
    PosDeviceModule,
    NotificationModule,
    QueuesModule,
    DashboardModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    // Global rate limiter — applies ThrottlerGuard to all routes.
    // Individual endpoints can override with @Throttle() or @SkipThrottle().
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpLoggerMiddleware, RequestContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
