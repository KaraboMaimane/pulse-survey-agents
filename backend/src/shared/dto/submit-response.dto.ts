import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { MAX_RATING_VALUE, MIN_RATING_VALUE } from '../constants/question-type.constant';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  @IsOptional()
  @Min(MIN_RATING_VALUE)
  @Max(MAX_RATING_VALUE)
  ratingValue?: number;

  @IsOptional()
  @IsBoolean()
  yesNoValue?: boolean;
}

export class SubmitResponseDto {
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  @ArrayMinSize(1)
  answers: SubmitAnswerDto[];
}
