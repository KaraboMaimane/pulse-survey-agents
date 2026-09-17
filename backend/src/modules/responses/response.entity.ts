import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Survey } from '../surveys/survey.entity';
import { User } from '../users/user.entity';
import { Answer } from './answer.entity';

// One response per (surveyId, userId) per rolling 7-day window is enforced in
// ResponsesService, not via a DB constraint: a rolling window has no fixed
// boundary to key a UNIQUE constraint on. See SOLUTION.md for the race-condition
// trade-off this implies.
@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'survey_id' })
  surveyId: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  survey: Survey;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @OneToMany(() => Answer, (answer) => answer.response, { cascade: true })
  answers: Answer[];

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}
