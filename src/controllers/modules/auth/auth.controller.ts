import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { BaseController } from '../../base-controller';
import {
  AuthService,
  LoginResponse,
  RefreshResponse,
} from '../../../service/modules/auth/auth.service';
import { LoginDto } from '../../../dto/auth/login.dto';
import { RefreshTokenDto } from '../../../dto/auth/refresh-token.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../../models/user.model';
import { ApiResponse } from '../../../types/response.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  /**
   * Login — rate limited to 10 requests per 60 seconds per IP.
   * Lebih ketat dari global throttle untuk mencegah brute force attack.
   * IMPLEMENTATION_ROADMAP.md Phase 10 § Security
   */
  @ApiOperation({ summary: 'Login user dan dapatkan JWT token' })
  @ApiBody({ type: LoginDto })
  @SwaggerResponse({ status: 200, description: 'Login berhasil' })
  @SwaggerResponse({ status: 401, description: 'Invalid credentials' })
  @SwaggerResponse({ status: 429, description: 'Too many requests' })
  @Post('login')
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request & { ipAddress?: string; userAgent?: string },
  ): Promise<ApiResponse<LoginResponse>> {
    const result = await this.authService.login(
      dto,
      req.ipAddress,
      req.userAgent,
    );
    return this.success(result, 'Login successful');
  }

  @ApiOperation({ summary: 'Refresh access token menggunakan refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @SwaggerResponse({ status: 200, description: 'Token berhasil di-refresh' })
  @SwaggerResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiResponse<RefreshResponse>> {
    const result = await this.authService.refresh(dto);
    return this.success(result, 'Token refreshed successfully');
  }

  @ApiOperation({ summary: 'Logout dan blacklist refresh token' })
  @ApiBearerAuth()
  @ApiBody({ type: RefreshTokenDto })
  @SwaggerResponse({ status: 200, description: 'Logout berhasil' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() actor: User,
    @Body() body: RefreshTokenDto,
    @Req() req: Request & { ipAddress?: string; userAgent?: string },
  ): Promise<ApiResponse<void>> {
    await this.authService.logout(
      actor.id,
      req.ipAddress,
      req.userAgent,
      body.refreshToken,
    );
    return this.noContent('Logged out successfully');
  }

  @ApiOperation({ summary: 'Get user profile yang sedang login' })
  @ApiBearerAuth()
  @SwaggerResponse({ status: 200, description: 'Profile retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User): Promise<ApiResponse<User>> {
    return this.success(user, 'Profile retrieved successfully');
  }
}
