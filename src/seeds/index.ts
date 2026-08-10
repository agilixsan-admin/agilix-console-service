import { DataSource } from 'typeorm';
import { dbConfig } from '../configs/db';
import { seedSuperAdmin } from './super-admin.seed';

async function runSeeds() {
  const dataSource = new DataSource(dbConfig);

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    await seedSuperAdmin(dataSource);

    console.log('✓ All seeds completed successfully');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
