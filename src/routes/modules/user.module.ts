import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../models/user.model';
import { UserRepository } from '../../../repositories/modules/user.repository';
import { UserService } from '../../../service/modules/users/user.service';
import { UserController } from '../../../controllers/modules/users/user.controller';
import { AuditLogModule } from './audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditLogModule],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
