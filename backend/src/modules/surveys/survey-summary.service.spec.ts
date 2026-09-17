import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SurveySummaryService } from './survey-summary.service';
import { SurveysService } from './surveys.service';
import { Response } from '../responses/response.entity';
import { User } from '../users/user.entity';
import { Survey } from './survey.entity';
import { QuestionType } from '../../shared/constants/question-type.constant';
import { UserRole } from '../../shared/constants/roles.constant';

describe('SurveySummaryService', () => {
  const surveyId = 'survey-1';
  const organizationId = 'org-1';
  const ratingQuestionId = 'question-rating';
  const yesNoQuestionId = 'question-yesno';

  const survey = {
    id: surveyId,
    organizationId,
    title: 'Weekly Pulse',
    isActive: true,
    questions: [
      { id: ratingQuestionId, surveyId, text: 'Rate your week', type: QuestionType.RATING, orderIndex: 0 },
      { id: yesNoQuestionId, surveyId, text: 'Did you feel supported?', type: QuestionType.YES_NO, orderIndex: 1 },
    ],
  } as unknown as Survey;

  function buildResponse(submittedAt: Date, ratingValue: number, yesNoValue: boolean) {
    return {
      id: `response-${submittedAt.getTime()}`,
      surveyId,
      organizationId,
      submittedAt,
      answers: [
        { questionId: ratingQuestionId, ratingValue, yesNoValue: null },
        { questionId: yesNoQuestionId, ratingValue: null, yesNoValue },
      ],
    };
  }

  it('computes completion count, rate, and per-question rollups within the rolling 7-day window', async () => {
    const now = Date.now();
    const withinWindow = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const withinWindow2 = new Date(now - 6 * 24 * 60 * 60 * 1000);
    const outsideWindow = new Date(now - 10 * 24 * 60 * 60 * 1000);

    const responses = [
      buildResponse(withinWindow, 5, true),
      buildResponse(withinWindow2, 3, false),
      buildResponse(outsideWindow, 1, true),
    ];

    const responseRepository = { find: jest.fn().mockResolvedValue(responses) };
    const userRepository = { count: jest.fn().mockResolvedValue(4) };
    const surveysService = { getSurveyForOrganization: jest.fn().mockResolvedValue(survey) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SurveySummaryService,
        { provide: getRepositoryToken(Response), useValue: responseRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: SurveysService, useValue: surveysService },
      ],
    }).compile();

    const service = moduleRef.get(SurveySummaryService);
    const summary = await service.getSummary(surveyId, organizationId);

    expect(surveysService.getSurveyForOrganization).toHaveBeenCalledWith(surveyId, organizationId);
    expect(userRepository.count).toHaveBeenCalledWith({ where: { organizationId, role: UserRole.MEMBER } });

    expect(summary.completionCount).toBe(2);
    expect(summary.organizationMemberCount).toBe(4);
    expect(summary.completionRate).toBe(0.5);

    const ratingRollup = summary.questionRollups.find((rollup) => rollup.questionId === ratingQuestionId);
    expect(ratingRollup?.rollup).toEqual({ type: QuestionType.RATING, average: 4, count: 2 });

    const yesNoRollup = summary.questionRollups.find((rollup) => rollup.questionId === yesNoQuestionId);
    expect(yesNoRollup?.rollup).toEqual({ type: QuestionType.YES_NO, yesCount: 1, noCount: 1 });
  });

  it('returns a zero completion rate when the organization has no members', async () => {
    const responseRepository = { find: jest.fn().mockResolvedValue([]) };
    const userRepository = { count: jest.fn().mockResolvedValue(0) };
    const surveysService = { getSurveyForOrganization: jest.fn().mockResolvedValue(survey) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SurveySummaryService,
        { provide: getRepositoryToken(Response), useValue: responseRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: SurveysService, useValue: surveysService },
      ],
    }).compile();

    const service = moduleRef.get(SurveySummaryService);
    const summary = await service.getSummary(surveyId, organizationId);

    expect(summary.completionRate).toBe(0);
  });
});
