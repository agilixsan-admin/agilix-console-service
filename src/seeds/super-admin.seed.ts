import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { UserRole } from '../types/enums/user-role.enum';

export async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@agilix.com';

  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✓ SUPER_ADMIN already exists, skipping seed');
    return;
  }

  const seedPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!seedPassword) {
    throw new Error(
      'SEED_SUPER_ADMIN_PASSWORD environment variable is not set',
    );
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const superAdmin = userRepository.create({
    fullName: 'Super Administrator',
    email: adminEmail,
    passwordHash: hashedPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(superAdmin);

  console.log('✓ SUPER_ADMIN user created successfully');
  console.log(`  Email: ${adminEmail}`);
}
