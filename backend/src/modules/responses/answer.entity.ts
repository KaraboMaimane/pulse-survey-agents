import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from '../surveys/question.entity';
import { Response } from './response.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'response_id' })
  responseId: string;

  @ManyToOne(() => Response, (response) => response.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: Response;

  @Index()
  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'rating_value', type: 'smallint', nullable: true })
  ratingValue: number | null;

  @Column({ name: 'yes_no_value', type: 'boolean', nullable: true })
  yesNoValue: boolean | null;
}
