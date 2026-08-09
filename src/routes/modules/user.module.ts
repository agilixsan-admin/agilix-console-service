import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../models/user.model';
import { UserRepository } from '../../../repositories/modules/user.repository';
import { UserService } from '../../../service/modules/users/user.service';
import { UserController } from '../../../controllers/modules/users/user.controller';

/**
 * UserModule
 *
 * NestJS module that wires together the entire User domain:
 *   Entity → Repository → Service → Controller
 *
 * Source of truth: ARCHITECTURE_RULES.md § Folder Structure
 *
 * TypeOrmModule.forFeature([User]):
 *   Registers the User entity with TypeORM and makes the TypeORM
 *   Repository<User> injectable (consumed by UserRepository).
 *
 * Exports:
 *   - UserRepository: exported so AuthModule (Phase 1.3) can inject it
 *     into JwtStrategy for user validation without re-importing the full module.
 *   - UserService: exported so AuthModule can call service-level methods.
 *
 * Guards (JwtAuthGuard + RolesGuard) will be applied at the controller
 * or route level once the Auth module is implemented in Phase 1.3.
 */
@Module({
  imports: [
    // Registers User entity with TypeORM for this module scope
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
