/**
 * Migration entrypoint untuk production Docker image.
 *
 * Dijalankan dari dist/ tanpa ts-node:
 *   docker run --rm --network infra_net --env-file .env \
 *     -e DB_HOST=db-agilix -e DB_PORT=5432 \
 *     agilix-service:latest node dist/migrate.js
 *
 * PENTING: Konek langsung ke PostgreSQL (port 5432), BUKAN PgBouncer (6432)
 * karena migration butuh session-level connection dan DDL statements.
 */
import { AppDataSource } from './configs/db';

async function runMigrations(): Promise<void> {
  console.log('🔄 Initializing database connection...');
  console.log(`   Host : ${process.env.DB_HOST ?? 'localhost'}`);
  console.log(`   Port : ${process.env.DB_PORT ?? '5432'}`);
  console.log(`   DB   : ${process.env.DB_NAME ?? 'agilix_console'}`);

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const pending = await AppDataSource.showMigrations();
    if (!pending) {
      console.log('✅ No pending migrations — database is up to date');
      return;
    }

    console.log('🔄 Running migrations...');
    const migrations = await AppDataSource.runMigrations({
      transaction: 'each',
    });

    if (migrations.length === 0) {
      console.log('✅ No new migrations were executed');
    } else {
      migrations.forEach((m) => console.log(`   ✓ ${m.name}`));
      console.log(`✅ ${migrations.length} migration(s) executed successfully`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void runMigrations();
