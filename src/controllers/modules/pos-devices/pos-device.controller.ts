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
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('POS Devices')
@ApiBearerAuth()
@Controller('pos-devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosDeviceController extends BaseController {
  constructor(private readonly posDeviceService: PosDeviceService) {
    super();
  }

  @ApiOperation({ summary: 'Get list POS devices dengan pagination dan filter' })
  @SwaggerResponse({ status: 200, description: 'POS devices retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
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

  @ApiOperation({ summary: 'Get detail POS device by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'POS device retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'POS device not found' })
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const device = await this.posDeviceService.findById(id);
    return this.success(device, 'POS device retrieved successfully');
  }

  @ApiOperation({ summary: 'Daftarkan POS device baru' })
  @ApiBody({ type: CreatePosDeviceDto })
  @SwaggerResponse({ status: 201, description: 'POS device registered successfully' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 409, description: 'Serial number already registered' })
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePosDeviceDto, @CurrentUser() actor: User) {
    const device = await this.posDeviceService.create(dto, actor.id);
    return this.success(device, 'POS device registered successfully');
  }

  @ApiOperation({ summary: 'Update data POS device' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdatePosDeviceDto })
  @SwaggerResponse({ status: 200, description: 'POS device updated successfully' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'POS device not found' })
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

  @ApiOperation({ summary: 'Kirim heartbeat dari POS device' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: HeartbeatPosDeviceDto })
  @SwaggerResponse({ status: 200, description: 'Heartbeat received' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 404, description: 'POS device not found' })
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: HeartbeatPosDeviceDto,
  ) {
    const device = await this.posDeviceService.heartbeat(id, dto);
    return this.success(device, 'Heartbeat received');
  }

  @ApiOperation({ summary: 'Hapus POS device' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'POS device deleted successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'POS device not found' })
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
