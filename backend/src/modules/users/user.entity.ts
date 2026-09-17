import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../shared/constants/roles.constant';
import { Organization } from '../organizations/organization.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
