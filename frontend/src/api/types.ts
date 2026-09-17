export type UserRole = 'manager' | 'member';
export type QuestionType = 'rating' | 'yes_no';

export interface Identity {
  userId: string;
  userName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  orderIndex: number;
}

export interface Survey {
  id: string;
  title: string;
  isActive: boolean;
  questions: Question[];
}

export interface AnswerInput {
  questionId: string;
  ratingValue?: number;
  yesNoValue?: boolean;
}

export type QuestionRollup =
  | { type: 'rating'; average: number; count: number }
  | { type: 'yes_no'; yesCount: number; noCount: number };

export interface QuestionRollupEntry {
  questionId: string;
  text: string;
  rollup: QuestionRollup;
}

export interface SurveySummary {
  surveyId: string;
  windowStart: string;
  windowEnd: string;
  completionCount: number;
  organizationMemberCount: number;
  completionRate: number;
  questionRollups: QuestionRollupEntry[];
}

export interface ApiErrorBody {
  message: string | string[];
  error: string;
  statusCode: number;
}
