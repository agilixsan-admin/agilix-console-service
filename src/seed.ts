/**
 * Seed entrypoint untuk production Docker image.
 *
 * Dijalankan dari dist/ tanpa ts-node:
 *   docker run --rm --network infra_net --env-file .env \
 *     -e DB_HOST=db-agilix -e DB_PORT=5432 \
 *     agilix-service:latest node dist/seed.js
 *
 * PENTING: Jalankan seed SETELAH migration selesai.
 * Konek langsung ke PostgreSQL (port 5432), BUKAN PgBouncer (6432).
 */
import { AppDataSource } from './configs/db';
import { seedSuperAdmin } from './seeds/super-admin.seed';
import { seedEmailTemplates } from './seeds/email-template.seed';

async function runSeeds(): Promise<void> {
  console.log('🔄 Initializing database connection...');
  console.log(`   Host : ${process.env.DB_HOST ?? 'localhost'}`);
  console.log(`   Port : ${process.env.DB_PORT ?? '5432'}`);
  console.log(`   DB   : ${process.env.DB_NAME ?? 'agilix_console'}`);

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Running seeds...');
    await seedSuperAdmin(AppDataSource);
    await seedEmailTemplates(AppDataSource);

    console.log('✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void runSeeds();
