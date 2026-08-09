import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.model';
import { DeviceStatus } from '../types/enums/device-status.enum';

@Entity('pos_devices')
@Index('idx_pos_devices_tenant_id', ['tenantId'])
@Index('idx_pos_devices_status', ['status'])
@Index('idx_pos_devices_last_seen_at', ['lastSeenAt'])
export class PosDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'device_code', type: 'varchar', length: 50, unique: true })
  deviceCode: string;

  @Column({ name: 'device_name', type: 'varchar', length: 255 })
  deviceName: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE,
  })
  status: DeviceStatus;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
