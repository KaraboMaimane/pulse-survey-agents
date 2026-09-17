import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { Question } from './question.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column()
  title: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Question, (question) => question.survey, { cascade: true })
  questions: Question[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
