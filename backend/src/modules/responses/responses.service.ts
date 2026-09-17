import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Response } from './response.entity';
import { SurveysService } from '../surveys/surveys.service';
import { SubmitResponseDto } from '../../shared/dto/submit-response.dto';
import { ResponseDto } from '../../shared/dto/response.dto';
import { RESPONSE_WINDOW_DAYS } from '../../shared/constants/question-type.constant';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    private readonly surveysService: SurveysService,
  ) {}

  async submit(
    surveyId: string,
    organizationId: string,
    userId: string,
    dto: SubmitResponseDto,
  ): Promise<ResponseDto> {
    const survey = await this.surveysService.getSurveyForOrganization(surveyId, organizationId);
    const validQuestionIds = new Set(survey.questions.map((question) => question.id));

    for (const answer of dto.answers) {
      if (!validQuestionIds.has(answer.questionId)) {
        throw new ConflictException('Answer references a question outside this survey');
      }
    }

    const rollingWindowStart = this.rollingWindowStart();

    const existingResponse = await this.responseRepository.findOne({
      where: { surveyId, userId, submittedAt: MoreThanOrEqual(rollingWindowStart) },
    });

    if (existingResponse) {
      throw new ConflictException('A response has already been submitted within the current 7-day window');
    }

    const response = this.responseRepository.create({
      surveyId,
      userId,
      organizationId,
      answers: dto.answers.map((answer) => ({
        questionId: answer.questionId,
        ratingValue: answer.ratingValue ?? null,
        yesNoValue: answer.yesNoValue ?? null,
      })) as Response['answers'],
    });

    const saved = await this.responseRepository.save(response);
    return this.toDto(saved);
  }

  private toDto(response: Response): ResponseDto {
    return {
      id: response.id,
      surveyId: response.surveyId,
      submittedAt: response.submittedAt,
      answers: response.answers.map((answer) => ({
        questionId: answer.questionId,
        ratingValue: answer.ratingValue,
        yesNoValue: answer.yesNoValue,
      })),
    };
  }

  private rollingWindowStart(): Date {
    return new Date(Date.now() - RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  }
}
