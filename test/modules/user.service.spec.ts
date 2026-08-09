import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../src/service/modules/users/user.service';
import { UserRepository } from '../../src/repositories/modules/user.repository';
import { CreateUserDto } from '../../src/dto/user/create-user.dto';
import { UpdateUserDto } from '../../src/dto/user/update-user.dto';
import { ListUsersQueryDto } from '../../src/dto/user/list-users-query.dto';
import { UserRole } from '../../src/types/enums/user-role.enum';
import {
  FINANCE_ADMIN_EMAIL,
  SUPPORT_ADMIN_EMAIL,
  TEST_PASSWORD_PLAIN,
  TEST_USER_ID,
  TEST_USER_ID_NONEXISTENT,
} from '../config/constants';
import {
  buildPaginatedResult,
  buildUser,
  mockUserRepository,
} from '../config/functionUnitTest';

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('UserService', () => {
  let service: UserService;
  let repository: ReturnType<typeof mockUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('harus mengembalikan paginated result dari repository', async () => {
      const paginated = buildPaginatedResult([buildUser()]);
      repository.findAll.mockResolvedValue(paginated);

      const query: ListUsersQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        role: undefined,
        isActive: undefined,
      });
      expect(result).toEqual(paginated);
    });

    it('harus meneruskan filter search, role, isActive ke repository', async () => {
      repository.findAll.mockResolvedValue(buildPaginatedResult([]));

      const query: ListUsersQueryDto = {
        page: 2,
        limit: 5,
        search: 'finance',
        role: UserRole.FINANCE_ADMIN,
        isActive: true,
      };
      await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        search: 'finance',
        role: UserRole.FINANCE_ADMIN,
        isActive: true,
      });
    });

    it('harus menggunakan default page=1 dan limit=10 jika tidak disediakan', async () => {
      repository.findAll.mockResolvedValue(buildPaginatedResult([]));

      await service.findAll({});

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------

  describe('findById', () => {
    it('harus mengembalikan user jika ditemukan', async () => {
      const user = buildUser();
      repository.findById.mockResolvedValue(user);

      const result = await service.findById(TEST_USER_ID);

      expect(repository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(result).toEqual(user);
    });

    it('harus throw NotFoundException jika user tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(TEST_USER_ID_NONEXISTENT)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findById(TEST_USER_ID_NONEXISTENT)).rejects.toThrow(
        `User with id "${TEST_USER_ID_NONEXISTENT}" not found`,
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    const createDto: CreateUserDto = {
      fullName: 'New Admin',
      email: SUPPORT_ADMIN_EMAIL,
      password: TEST_PASSWORD_PLAIN,
      role: UserRole.SUPPORT_ADMIN,
    };

    it('harus menyimpan password sebagai bcrypt hash, bukan plaintext', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildUser());

      await service.create(createDto);

      const createCall = repository.create.mock.calls[0][0];

      expect(createCall.passwordHash).toBeDefined();
      expect(createCall.passwordHash).not.toBe(createDto.password);

      const isValid = await bcrypt.compare(
        createDto.password,
        createCall.passwordHash as string,
      );
      expect(isValid).toBe(true);
    });

    it('harus throw ConflictException jika email sudah dipakai', async () => {
      repository.findByEmail.mockResolvedValue(
        buildUser({ email: createDto.email }),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `A user with email "${createDto.email}" already exists`,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('harus set isActive=true untuk user baru', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildUser());

      await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });

    it('harus mengembalikan user yang tersimpan', async () => {
      const savedUser = buildUser({
        fullName: createDto.fullName,
        email: createDto.email,
        role: createDto.role,
      });
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(savedUser);

      const result = await service.create(createDto);

      expect(result).toEqual(savedUser);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('harus mengupdate field yang diberikan dan mengembalikan user terupdate', async () => {
      const user = buildUser();
      const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
        role: UserRole.SUPER_ADMIN,
      };
      const updated = buildUser({
        fullName: 'Updated Name',
        role: UserRole.SUPER_ADMIN,
      });

      repository.findById.mockResolvedValue(user);
      repository.update.mockResolvedValue(updated);

      const result = await service.update(TEST_USER_ID, updateDto);

      expect(repository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(repository.update).toHaveBeenCalledWith(TEST_USER_ID, {
        fullName: 'Updated Name',
        role: UserRole.SUPER_ADMIN,
      });
      expect(result).toEqual(updated);
    });

    it('harus throw NotFoundException jika user tidak ditemukan', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(TEST_USER_ID_NONEXISTENT, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('harus tidak mengirim field undefined ke repository.update', async () => {
      const user = buildUser();
      repository.findById.mockResolvedValue(user);
      repository.update.mockResolvedValue(user);

      await service.update(TEST_USER_ID, { fullName: 'Only Name Change' });

      expect(repository.update).toHaveBeenCalledWith(TEST_USER_ID, {
        fullName: 'Only Name Change',
      });
    });
  });

  // -------------------------------------------------------------------------
  // deactivate
  // -------------------------------------------------------------------------

  describe('deactivate', () => {
    it('harus set isActive=false dan mengembalikan user yang dinonaktifkan', async () => {
      repository.findById.mockResolvedValue(buildUser({ isActive: true }));
      repository.update.mockResolvedValue(buildUser({ isActive: false }));

      const result = await service.deactivate(TEST_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(TEST_USER_ID, {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });

    it('harus throw NotFoundException jika user tidak ditemukan', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.deactivate(TEST_USER_ID_NONEXISTENT),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('harus memanggil softDelete dengan id yang benar', async () => {
      repository.findById.mockResolvedValue(buildUser());
      repository.softDelete.mockResolvedValue(undefined);

      await service.remove(TEST_USER_ID);

      expect(repository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(repository.softDelete).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('harus throw NotFoundException sebelum softDelete jika user tidak ada', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(TEST_USER_ID_NONEXISTENT)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
