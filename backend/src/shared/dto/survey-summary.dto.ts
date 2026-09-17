import { QuestionType } from '../constants/question-type.constant';

export interface RatingRollupDto {
  type: QuestionType.RATING;
  average: number;
  count: number;
}

export interface YesNoRollupDto {
  type: QuestionType.YES_NO;
  yesCount: number;
  noCount: number;
}

export interface QuestionRollupDto {
  questionId: string;
  text: string;
  rollup: RatingRollupDto | YesNoRollupDto;
}

export interface SurveySummaryDto {
  surveyId: string;
  windowStart: Date;
  windowEnd: Date;
  completionCount: number;
  organizationMemberCount: number;
  completionRate: number;
  questionRollups: QuestionRollupDto[];
}
