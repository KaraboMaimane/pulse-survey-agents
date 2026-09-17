import { QuestionType } from '../constants/question-type.constant';

export interface QuestionDto {
  id: string;
  text: string;
  type: QuestionType;
  orderIndex: number;
}

export interface SurveyDto {
  id: string;
  title: string;
  isActive: boolean;
  questions: QuestionDto[];
}
