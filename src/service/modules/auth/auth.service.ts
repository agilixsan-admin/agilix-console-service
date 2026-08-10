import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../../repositories/modules/user.repository';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { LoginDto } from '../../../dto/auth/login.dto';
import { RefreshTokenDto } from '../../../dto/auth/refresh-token.dto';
import { User } from '../../../models/user.model';
import { AuditAction } from '../../../types/enums/audit-action.enum';
import { JwtPayload } from './jwt.strategy';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}

export interface RefreshResponse {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<number>('jwt.expiresIn') ?? 1800;

    const accessToken = this.jwtService.sign(payload);

    // Refresh token menggunakan secret terpisah (jwt.refreshSecret)
    // untuk mencegah token substitution attack.
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ??
        '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.AUTH_LOGIN,
      targetType: 'User',
      targetId: user.id,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: { email: user.email },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: typeof expiresIn === 'number' ? expiresIn : 1800,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<RefreshResponse> {
    // Cek blacklist terlebih dahulu sebelum verifikasi signature
    const isRevoked = await this.tokenBlacklistService.isBlacklisted(
      dto.refreshToken,
    );
    if (isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(newPayload),
    };
  }

  async logout(
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
    refreshToken?: string,
  ): Promise<void> {
    // Blacklist refresh token di Redis agar tidak dapat digunakan kembali
    if (refreshToken) {
      await this.tokenBlacklistService.blacklist(refreshToken);
    }

    await this.auditLogService.log({
      actorId,
      action: AuditAction.AUTH_LOGOUT,
      targetType: 'User',
      targetId: actorId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
