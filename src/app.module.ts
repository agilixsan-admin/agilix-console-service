import { Module } from '@nestjs/common';
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
          // Invoice      — Phase 3
          // PosDevice    — Phase 3
          // Notification — Phase 3
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
  ],
})
export class AppModule {}
