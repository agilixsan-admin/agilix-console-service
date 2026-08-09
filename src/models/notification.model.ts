import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.model';
import { NotificationType } from '../types/enums/notification-type.enum';
import { NotificationStatus } from '../types/enums/notification-status.enum';

@Entity('notifications')
@Index('idx_notifications_tenant_id', ['tenantId'])
@Index('idx_notifications_status', ['status'])
@Index('idx_notifications_type', ['type'])
@Index('idx_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'type', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'recipient', type: 'varchar', length: 255 })
  recipient: string;

  @Column({ name: 'subject', type: 'varchar', length: 500 })
  subject: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
