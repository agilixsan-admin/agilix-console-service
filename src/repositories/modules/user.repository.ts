import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../models/user.model';
import { UserRole } from '../../types/enums/user-role.enum';
import { PaginatedResult } from '../../types/response.types';

export interface FindAllUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async findAll(options: FindAllUsersOptions): Promise<PaginatedResult<User>> {
    const page = options.page > 0 ? options.page : 1;
    const limit = Math.min(options.limit > 0 ? options.limit : 10, 100);
    const offset = (page - 1) * limit;

    const qb: SelectQueryBuilder<User> = this.repo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.search) {
      qb.andWhere('(user.fullName ILIKE :search OR user.email ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    if (options.role !== undefined) {
      qb.andWhere('user.role = :role', { role: options.role });
    }

    if (options.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: options.isActive });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    const saved = await this.repo.save(user);
    return this.repo.findOneOrFail({ where: { id: saved.id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
