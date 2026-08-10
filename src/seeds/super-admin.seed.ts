import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { UserRole } from '../types/enums/user-role.enum';

export async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@agilix.com' },
  });

  if (existingAdmin) {
    console.log('✓ SUPER_ADMIN already exists, skipping seed');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const superAdmin = userRepository.create({
    fullName: 'Super Administrator',
    email: 'admin@agilix.com',
    passwordHash: hashedPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(superAdmin);

  console.log('✓ SUPER_ADMIN user created successfully');
  console.log('  Email: admin@agilix.com');
  console.log('  Password: Admin123!');
  console.log('  ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
}
