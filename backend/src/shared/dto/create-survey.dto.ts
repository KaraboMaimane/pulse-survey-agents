import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsEnum, IsString, Length, ValidateNested } from 'class-validator';
import { QuestionType } from '../constants/question-type.constant';

export class CreateQuestionDto {
  @IsString()
  @Length(1, 300)
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;
}

export class CreateSurveyDto {
  @IsString()
  @Length(1, 200)
  title: string;

  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  questions: CreateQuestionDto[];
}
