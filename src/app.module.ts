import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  serverConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  smtpConfig,
  bcryptConfig,
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
      ],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // -------------------------------------------------------------------------
    // Rate Limiting — IMPLEMENTATION_ROADMAP.md Phase 10 § Security
    //
    // Global throttle: 100 requests per 60 seconds per IP.
    // Auth endpoints menggunakan throttle lebih ketat via @Throttle() decorator.
    // -------------------------------------------------------------------------
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),

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
      useClass: ThrottlerGuard,
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
