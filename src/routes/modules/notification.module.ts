import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../../models/notification.model';
import { NotificationRepository } from '../../../repositories/modules/notification.repository';
import { NotificationService } from '../../service/modules/notifications/notification.service';
import { NotificationController } from '../../controllers/modules/notifications/notification.controller';
import { AuditLogModule } from './audit-log.module';
import { RealtimeModule } from './realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuditLogModule,
    RealtimeModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationRepository, NotificationService],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
