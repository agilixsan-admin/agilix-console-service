import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/service/modules/auth/auth.service';
import { UserRepository } from '../../src/repositories/modules/user.repository';
import { ConfigService } from '@nestjs/config';
import {
  SUPER_ADMIN_EMAIL,
  TEST_ACCESS_TOKEN,
  TEST_PASSWORD_HASH,
  TEST_PASSWORD_PLAIN,
  TEST_REFRESH_TOKEN,
  TEST_USER_ID,
  TEST_USER_ID_NONEXISTENT,
} from '../config/constants';
import {
  buildUser,
  buildUserWithPassword,
  mockConfigService,
  mockJwtService,
  mockUserRepository,
} from '../config/functionUnitTest';
import { UserRole } from '../../src/types/enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let configService: ReturnType<typeof mockConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('harus mengembalikan accessToken, refreshToken, dan data user saat login berhasil', async () => {
      const hash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.SUPER_ADMIN,
        passwordHash: hash,
      });

      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      jwtService.sign
        .mockReturnValueOnce(TEST_ACCESS_TOKEN)
        .mockReturnValueOnce(TEST_REFRESH_TOKEN);

      const result = await service.login({
        email: SUPER_ADMIN_EMAIL,
        password: TEST_PASSWORD_PLAIN,
      });

      expect(result.accessToken).toBe(TEST_ACCESS_TOKEN);
      expect(result.refreshToken).toBe(TEST_REFRESH_TOKEN);
      expect(result.user.email).toBe(SUPER_ADMIN_EMAIL);
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
      expect(userRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('harus throw UnauthorizedException jika email tidak ditemukan', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: TEST_PASSWORD_PLAIN,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('harus throw UnauthorizedException jika password salah', async () => {
      const user = buildUserWithPassword({ passwordHash: TEST_PASSWORD_HASH });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        service.login({
          email: SUPER_ADMIN_EMAIL,
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('harus throw UnauthorizedException jika user tidak aktif', async () => {
      const hash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({
        isActive: false,
        passwordHash: hash,
      });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        service.login({
          email: SUPER_ADMIN_EMAIL,
          password: TEST_PASSWORD_PLAIN,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('harus memperbarui lastLoginAt setelah login berhasil', async () => {
      const hash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({ passwordHash: hash });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      await service.login({
        email: SUPER_ADMIN_EMAIL,
        password: TEST_PASSWORD_PLAIN,
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  describe('refresh', () => {
    it('harus mengembalikan accessToken baru jika refresh token valid', async () => {
      const user = buildUser();
      jwtService.verify.mockReturnValue({
        sub: TEST_USER_ID,
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.FINANCE_ADMIN,
      });
      userRepository.findById.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      const result = await service.refresh({
        refreshToken: TEST_REFRESH_TOKEN,
      });

      expect(result.accessToken).toBe(TEST_ACCESS_TOKEN);
    });

    it('harus throw UnauthorizedException jika refresh token tidak valid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus throw UnauthorizedException jika user dari token tidak aktif', async () => {
      jwtService.verify.mockReturnValue({
        sub: TEST_USER_ID,
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.FINANCE_ADMIN,
      });
      userRepository.findById.mockResolvedValue(buildUser({ isActive: false }));

      await expect(
        service.refresh({ refreshToken: TEST_REFRESH_TOKEN }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus throw UnauthorizedException jika user dari token tidak ditemukan', async () => {
      jwtService.verify.mockReturnValue({
        sub: TEST_USER_ID_NONEXISTENT,
        email: 'gone@example.com',
        role: UserRole.FINANCE_ADMIN,
      });
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: TEST_REFRESH_TOKEN }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // getProfile
  // -------------------------------------------------------------------------

  describe('getProfile', () => {
    it('harus mengembalikan user berdasarkan id', async () => {
      const user = buildUser();
      userRepository.findById.mockResolvedValue(user);

      const result = await service.getProfile(TEST_USER_ID);

      expect(userRepository.findById).toHaveBeenCalledWith(TEST_USER_ID);
      expect(result).toEqual(user);
    });

    it('harus throw UnauthorizedException jika user tidak ditemukan', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.getProfile(TEST_USER_ID_NONEXISTENT),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
