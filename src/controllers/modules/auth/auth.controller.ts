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
import { Request } from 'express';
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

@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request & { ipAddress?: string; userAgent?: string },
  ): Promise<LoginResponse> {
    return this.authService.login(dto, req.ipAddress, req.userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponse> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() actor: User,
    @Req() req: Request & { ipAddress?: string; userAgent?: string },
  ): Promise<ApiResponse<void>> {
    await this.authService.logout(actor.id, req.ipAddress, req.userAgent);
    return this.noContent('Logged out successfully');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User): Promise<ApiResponse<User>> {
    return this.success(user, 'Profile retrieved successfully');
  }
}
