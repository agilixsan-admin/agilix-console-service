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

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController extends BaseController {
  constructor(private readonly invoiceService: InvoiceService) {
    super();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListInvoicesQueryDto) {
    const result = await this.invoiceService.findAll(query);
    return this.paginated(result, 'Invoices retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const invoice = await this.invoiceService.findById(id);
    return this.success(invoice, 'Invoice retrieved successfully');
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() actor: User) {
    const invoice = await this.invoiceService.create(dto, actor.id);
    return this.success(invoice, 'Invoice created successfully');
  }

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
}
