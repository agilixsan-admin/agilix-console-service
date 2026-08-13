import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../../models/user.model';
import { UserRepository } from '../../../repositories/modules/user.repository';
import { PaginatedResult } from '../../../types/response.types';
import { CreateUserDto } from '../../../dto/user/create-user.dto';
import { UpdateUserDto } from '../../../dto/user/update-user.dto';
import { ListUsersQueryDto } from '../../../dto/user/list-users-query.dto';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { AuditAction } from '../../../types/enums/audit-action.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async create(dto: CreateUserDto, actorId: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `A user with email "${dto.email}" already exists`,
      );
    }

    const saltRounds =
      this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: true,
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.USER_CREATED,
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<User> {
    await this.findById(id);

    const updatedUser = await this.userRepository.update(id, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.role !== undefined && { role: dto.role }),
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.USER_UPDATED,
      targetType: 'User',
      targetId: id,
      metadata: { ...dto },
    });

    return updatedUser;
  }

  async deactivate(id: string, actorId: string): Promise<User> {
    await this.findById(id);

    const deactivatedUser = await this.userRepository.update(id, {
      isActive: false,
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.USER_DEACTIVATED,
      targetType: 'User',
      targetId: id,
    });

    return deactivatedUser;
  }

  async remove(id: string, actorId: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.softDelete(id);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.USER_DELETED,
      targetType: 'User',
      targetId: id,
    });
  }
}
