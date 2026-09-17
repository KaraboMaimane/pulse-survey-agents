import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionType } from '../../shared/constants/question-type.constant';
import { Survey } from './survey.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'survey_id' })
  surveyId: string;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: 'CASCADE' })
  survey: Survey;

  @Column()
  text: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ name: 'order_index' })
  orderIndex: number;
}
