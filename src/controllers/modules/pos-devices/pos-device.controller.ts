import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '../../base-controller';
import { PosDeviceService } from '../../../service/modules/pos-devices/pos-device.service';
import { CreatePosDeviceDto } from '../../../dto/pos-device/create-pos-device.dto';
import { UpdatePosDeviceDto } from '../../../dto/pos-device/update-pos-device.dto';
import { ListPosDevicesQueryDto } from '../../../dto/pos-device/list-pos-devices-query.dto';
import { HeartbeatPosDeviceDto } from '../../../dto/pos-device/heartbeat-pos-device.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../types/enums/user-role.enum';

@Controller('pos-devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosDeviceController extends BaseController {
  constructor(private readonly posDeviceService: PosDeviceService) {
    super();
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListPosDevicesQueryDto) {
    const result = await this.posDeviceService.findAll(query);
    return this.paginated(result, 'POS devices retrieved successfully');
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const device = await this.posDeviceService.findById(id);
    return this.success(device, 'POS device retrieved successfully');
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePosDeviceDto,
    @CurrentUser() actor: User,
  ) {
    const device = await this.posDeviceService.create(dto, actor.id);
    return this.success(device, 'POS device registered successfully');
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePosDeviceDto,
    @CurrentUser() actor: User,
  ) {
    const device = await this.posDeviceService.update(id, dto, actor.id);
    return this.success(device, 'POS device updated successfully');
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: HeartbeatPosDeviceDto,
  ) {
    const device = await this.posDeviceService.heartbeat(id, dto);
    return this.success(device, 'Heartbeat received');
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    await this.posDeviceService.remove(id, actor.id);
    return this.noContent('POS device deleted successfully');
  }
}
