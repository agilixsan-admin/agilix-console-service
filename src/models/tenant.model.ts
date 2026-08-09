import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.model';
import { TenantStatus } from '../types/enums/tenant-status.enum';
import { PlanType } from '../types/enums/plan-type.enum';

@Entity('tenants')
@Index('idx_tenants_status', ['status'])
@Index('idx_tenants_plan_type', ['planType'])
@Index('idx_tenants_owner_email', ['ownerEmail'])
@Index('idx_tenants_expiry_date', ['expiryDate'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ name: 'owner_name', type: 'varchar', length: 255 })
  ownerName: string;

  @Column({ name: 'owner_email', type: 'varchar', length: 255 })
  ownerEmail: string;

  @Column({ name: 'owner_phone', type: 'varchar', length: 20, nullable: true })
  ownerPhone: string | null;

  @Column({ name: 'plan_type', type: 'enum', enum: PlanType })
  planType: PlanType;

  @Column({ name: 'outlet_count', type: 'int' })
  outletCount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
