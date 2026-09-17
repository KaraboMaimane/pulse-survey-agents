import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from '../responses/response.entity';
import { User } from '../users/user.entity';
import { RESPONSE_WINDOW_DAYS, QuestionType } from '../../shared/constants/question-type.constant';
import { SurveysService } from './surveys.service';
import { SurveySummaryDto, QuestionRollupDto } from '../../shared/dto/survey-summary.dto';
import { UserRole } from '../../shared/constants/roles.constant';

@Injectable()
export class SurveySummaryService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly surveysService: SurveysService,
  ) {}

  async getSummary(surveyId: string, organizationId: string): Promise<SurveySummaryDto> {
    const survey = await this.surveysService.getSurveyForOrganization(surveyId, organizationId);

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const responses = await this.responseRepository.find({
      where: { surveyId, organizationId },
      relations: ['answers'],
    });

    const responsesInWindow = responses.filter(
      (response) => response.submittedAt >= windowStart && response.submittedAt <= windowEnd,
    );

    const organizationMemberCount = await this.userRepository.count({
      where: { organizationId, role: UserRole.MEMBER },
    });

    const completionCount = responsesInWindow.length;
    const completionRate = organizationMemberCount === 0 ? 0 : completionCount / organizationMemberCount;

    const questionRollups: QuestionRollupDto[] = [...survey.questions]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((question) => {
        const answersForQuestion = responsesInWindow
          .flatMap((response) => response.answers)
          .filter((answer) => answer.questionId === question.id);

        if (question.type === QuestionType.RATING) {
          const ratings = answersForQuestion
            .map((answer) => answer.ratingValue)
            .filter((value): value is number => value !== null);
          const average = ratings.length === 0 ? 0 : ratings.reduce((sum, value) => sum + value, 0) / ratings.length;

          return {
            questionId: question.id,
            text: question.text,
            rollup: { type: QuestionType.RATING, average, count: ratings.length },
          };
        }

        const yesCount = answersForQuestion.filter((answer) => answer.yesNoValue === true).length;
        const noCount = answersForQuestion.filter((answer) => answer.yesNoValue === false).length;

        return {
          questionId: question.id,
          text: question.text,
          rollup: { type: QuestionType.YES_NO, yesCount, noCount },
        };
      });

    return {
      surveyId,
      windowStart,
      windowEnd,
      completionCount,
      organizationMemberCount,
      completionRate,
      questionRollups,
    };
  }
}
