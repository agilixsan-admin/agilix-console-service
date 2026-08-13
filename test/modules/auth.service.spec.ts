import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/service/modules/auth/auth.service';
import { UserRepository } from '../../src/repositories/modules/user.repository';
import { AuditLogService } from '../../src/service/modules/audit-logs/audit-log.service';
import { TokenBlacklistService } from '../../src/service/modules/auth/token-blacklist.service';
import { ConfigService } from '@nestjs/config';
import { AuditAction } from '../../src/types/enums/audit-action.enum';
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
  mockAuditLogService,
  mockConfigService,
  mockJwtService,
  mockUserRepository,
} from '../config/functionUnitTest';
import { UserRole } from '../../src/types/enums/user-role.enum';

function mockTokenBlacklistService() {
  return {
    blacklist: jest.fn().mockResolvedValue(undefined),
    isBlacklisted: jest.fn().mockResolvedValue(false),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let auditLogService: ReturnType<typeof mockAuditLogService>;
  let tokenBlacklist: ReturnType<typeof mockTokenBlacklistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: AuditLogService, useFactory: mockAuditLogService },
        {
          provide: TokenBlacklistService,
          useFactory: mockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    auditLogService = module.get(AuditLogService);
    tokenBlacklist = module.get(TokenBlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('harus mengembalikan accessToken, refreshToken, dan data user saat login berhasil', async () => {
      const hash: string = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.SUPER_ADMIN,
        passwordHash: hash,
      });

      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      auditLogService.log.mockResolvedValue(undefined);
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('harus membuat refresh token dengan refreshSecret yang berbeda', async () => {
      const hash: string = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({ passwordHash: hash });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      auditLogService.log.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      await service.login({
        email: SUPER_ADMIN_EMAIL,
        password: TEST_PASSWORD_PLAIN,
      });

      // Call kedua dari jwtService.sign harus menyertakan secret refreshSecret
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ secret: expect.any(String) }),
      );
    });

    it('harus memanggil AuditLogService.log dengan AUTH_LOGIN setelah login berhasil', async () => {
      const hash: string = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({ passwordHash: hash });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      auditLogService.log.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      await service.login({
        email: SUPER_ADMIN_EMAIL,
        password: TEST_PASSWORD_PLAIN,
      });

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.AUTH_LOGIN }),
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
      const hash: string = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
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
      const hash: string = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);
      const user = buildUserWithPassword({ passwordHash: hash });
      userRepository.findByEmailWithPassword.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);
      auditLogService.log.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      await service.login({
        email: SUPER_ADMIN_EMAIL,
        password: TEST_PASSWORD_PLAIN,
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        user.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    it('harus memanggil AuditLogService.log dengan AUTH_LOGOUT', async () => {
      auditLogService.log.mockResolvedValue(undefined);

      await service.logout(TEST_USER_ID);

      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.AUTH_LOGOUT,
          actorId: TEST_USER_ID,
        }),
      );
    });

    it('harus memblacklist refresh token jika disediakan', async () => {
      auditLogService.log.mockResolvedValue(undefined);

      await service.logout(
        TEST_USER_ID,
        undefined,
        undefined,
        TEST_REFRESH_TOKEN,
      );

      expect(tokenBlacklist.blacklist).toHaveBeenCalledWith(TEST_REFRESH_TOKEN);
    });

    it('harus tidak memanggil blacklist jika refresh token tidak disediakan', async () => {
      auditLogService.log.mockResolvedValue(undefined);

      await service.logout(TEST_USER_ID);

      expect(tokenBlacklist.blacklist).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  describe('refresh', () => {
    it('harus mengembalikan accessToken baru jika refresh token valid', async () => {
      const user = buildUser();
      tokenBlacklist.isBlacklisted.mockResolvedValue(false);
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

    it('harus throw UnauthorizedException jika refresh token ada di blacklist', async () => {
      tokenBlacklist.isBlacklisted.mockResolvedValue(true);

      await expect(
        service.refresh({ refreshToken: TEST_REFRESH_TOKEN }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('harus throw UnauthorizedException jika refresh token tidak valid', async () => {
      tokenBlacklist.isBlacklisted.mockResolvedValue(false);
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refresh({ refreshToken: 'invalid.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('harus throw UnauthorizedException jika user dari token tidak aktif', async () => {
      tokenBlacklist.isBlacklisted.mockResolvedValue(false);
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
      tokenBlacklist.isBlacklisted.mockResolvedValue(false);
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

    it('harus memverifikasi refresh token menggunakan refreshSecret', async () => {
      const user = buildUser();
      tokenBlacklist.isBlacklisted.mockResolvedValue(false);
      jwtService.verify.mockReturnValue({
        sub: TEST_USER_ID,
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.FINANCE_ADMIN,
      });
      userRepository.findById.mockResolvedValue(user);
      jwtService.sign.mockReturnValue(TEST_ACCESS_TOKEN);

      await service.refresh({ refreshToken: TEST_REFRESH_TOKEN });

      expect(jwtService.verify).toHaveBeenCalledWith(
        TEST_REFRESH_TOKEN,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ secret: expect.any(String) }),
      );
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
