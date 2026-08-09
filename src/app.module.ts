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
import { UserModule } from './routes/modules/user.module';
import { AuthModule } from './routes/modules/auth.module';

/**
 * AppModule
 *
 * Root application module.
 * Registers global infrastructure (config, database) and all domain modules.
 *
 * Configuration order (IMPLEMENTATION_ROADMAP.md § Development Priority):
 *   1. ConfigModule  — environment variable schema
 *   2. TypeOrmModule — PostgreSQL connection
 *   3. UserModule    — Phase 1: User domain (current)
 *
 * TypeORM configuration:
 *   - synchronize: false  ← MANDATORY (DATABASE_RULES.md § Migration Policy)
 *   - migrations run manually: npx typeorm migration:run -d src/configs/db.ts
 *   - entities registered explicitly — no glob patterns in production builds
 *
 * Modules to be registered in subsequent phases:
 *   Phase 1.3: AuthModule
 *   Phase 2.1: AuditLogModule
 *   Phase 2.2: TenantModule
 *   Phase 2.3: RealtimeModule
 *   Phase 3.1: InvoiceModule
 *   Phase 3.2: QueueModule
 *   Phase 3.3: NotificationModule
 */
@Module({
  imports: [
    // --- Infrastructure ---

    /**
     * ConfigModule
     * Loads environment variables from .env and registers all config namespaces.
     * isGlobal: true makes ConfigService injectable everywhere
     * without re-importing ConfigModule in each feature module.
     */
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

    /**
     * TypeOrmModule (async)
     * Uses ConfigService so the DataSource is built after env vars are loaded.
     * Reads from databaseConfig namespace defined in src/configs/config.ts.
     *
     * IMPORTANT: synchronize is explicitly false.
     * All schema changes must go through migrations.
     * DATABASE_RULES.md § Migration Policy — Forbidden: synchronize=true
     */
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
          // Register entities explicitly — never use glob in production
          User,
          // Future entities added here as each phase is implemented:
          // Tenant,      — Phase 2.2
          // Invoice,     — Phase 3.1
          // PosDevice,   — Phase 3 (POS Device)
          // AuditLog,    — Phase 2.1
          // Notification — Phase 3.3
        ],
        migrations: [],
        synchronize: false, // ← NEVER change this to true
        logging: config.get<boolean>('database.logging'),
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // --- Domain Modules ---
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
