import {
  Body,
  Controller,
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
import { Throttle } from '@nestjs/throttler';
import { BaseController } from '../../base-controller';
import { InvoiceService } from '../../../service/modules/invoices/invoice.service';
import { CreateInvoiceDto } from '../../../dto/invoice/create-invoice.dto';
import { PayInvoiceDto } from '../../../dto/invoice/pay-invoice.dto';
import { ListInvoicesQueryDto } from '../../../dto/invoice/list-invoices-query.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../types/enums/user-role.enum';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController extends BaseController {
  constructor(private readonly invoiceService: InvoiceService) {
    super();
  }

  @ApiOperation({ summary: 'Get list invoices dengan pagination dan filter' })
  @SwaggerResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListInvoicesQueryDto) {
    const result = await this.invoiceService.findAll(query);
    return this.paginated(result, 'Invoices retrieved successfully');
  }

  @ApiOperation({ summary: 'Get detail invoice by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'Invoice not found' })
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const invoice = await this.invoiceService.findById(id);
    return this.success(invoice, 'Invoice retrieved successfully');
  }

  @ApiOperation({ summary: 'Buat invoice baru' })
  @ApiBody({ type: CreateInvoiceDto })
  @SwaggerResponse({ status: 201, description: 'Invoice created successfully' })
  @SwaggerResponse({ status: 400, description: 'Bad request' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 409, description: 'Duplicate invoice' })
  @SwaggerResponse({ status: 429, description: 'Too many requests' })
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() actor: User) {
    const invoice = await this.invoiceService.create(dto, actor.id);
    return this.success(invoice, 'Invoice created successfully');
  }

  @ApiOperation({ summary: 'Tandai invoice sebagai sudah dibayar' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PayInvoiceDto })
  @SwaggerResponse({
    status: 200,
    description: 'Invoice marked as paid successfully',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invoice sudah dibayar atau dibatalkan',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'Invoice not found' })
  @Patch(':id/pay')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async pay(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PayInvoiceDto,
    @CurrentUser() actor: User,
  ) {
    const invoice = await this.invoiceService.pay(id, dto, actor.id);
    return this.success(invoice, 'Invoice marked as paid successfully');
  }

  @ApiOperation({ summary: 'Batalkan invoice' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Invoice cancelled successfully',
  })
  @SwaggerResponse({
    status: 400,
    description: 'Invoice tidak bisa dibatalkan',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'Invoice not found' })
  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    const invoice = await this.invoiceService.cancel(id, actor.id);
    return this.success(invoice, 'Invoice cancelled successfully');
  }

  @ApiOperation({ summary: 'Kirim manual reminder email untuk invoice' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Reminder queued successfully' })
  @SwaggerResponse({
    status: 400,
    description: 'Invoice sudah paid atau cancelled',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'Invoice not found' })
  @SwaggerResponse({ status: 429, description: 'Too many requests' })
  @Post(':id/send-reminder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async sendReminder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.invoiceService.sendReminder(id);
    return this.success(null, 'Reminder queued successfully');
  }
}
