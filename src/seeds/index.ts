import { AppDataSource } from '../configs/db';
import { seedSuperAdmin } from './super-admin.seed';
import { seedEmailTemplates } from './email-template.seed';

async function runSeeds() {
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    await seedSuperAdmin(dataSource);
    await seedEmailTemplates(dataSource);

    console.log('✓ All seeds completed successfully');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

void runSeeds();
