export interface AnswerDto {
  questionId: string;
  ratingValue: number | null;
  yesNoValue: boolean | null;
}

export interface ResponseDto {
  id: string;
  surveyId: string;
  submittedAt: Date;
  answers: AnswerDto[];
}
