import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '../../base-controller';
import { AuthService, LoginResponse, RefreshResponse } from '../../../service/modules/auth/auth.service';
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
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponse> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<ApiResponse<void>> {
    return this.noContent('Logged out successfully');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User): Promise<ApiResponse<User>> {
    return this.success(user, 'Profile retrieved successfully');
  }
}
