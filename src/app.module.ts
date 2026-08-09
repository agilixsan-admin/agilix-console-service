import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  serverConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  smtpConfig,
  bcryptConfig,
} from './configs/config';
import { User } from './models/user.model';
import { AuditLog } from './models/audit-log.model';
import { Tenant } from './models/tenant.model';
import { Invoice } from './models/invoice.model';
import { PosDevice } from './models/pos-device.model';
import { Notification } from './models/notification.model';
import { RequestContextMiddleware } from './middlewares/request-context.middleware';
import { InvoiceModule } from './routes/modules/invoice.module';
import { UserModule } from './routes/modules/user.module';
import { AuthModule } from './routes/modules/auth.module';
import { AuditLogModule } from './routes/modules/audit-log.module';
import { TenantModule } from './routes/modules/tenant.module';
import { RealtimeModule } from './routes/modules/realtime.module';

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
        ],
        migrations: [],
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
