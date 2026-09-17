import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResponsesService } from './responses.service';
import { Response } from './response.entity';
import { SurveysService } from '../surveys/surveys.service';
import { QuestionType } from '../../shared/constants/question-type.constant';

describe('ResponsesService', () => {
  const surveyId = 'survey-1';
  const organizationId = 'org-1';
  const userId = 'user-1';
  const questionId = 'question-1';

  const survey = {
    id: surveyId,
    organizationId,
    questions: [{ id: questionId, surveyId, text: 'Rate your week', type: QuestionType.RATING, orderIndex: 0 }],
  };

  function buildTestModule(existingResponse: unknown) {
    const responseRepository = {
      findOne: jest.fn().mockResolvedValue(existingResponse),
      create: jest.fn().mockImplementation((entity) => entity),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'response-1', submittedAt: new Date() })),
    };
    const surveysService = { getSurveyForOrganization: jest.fn().mockResolvedValue(survey) };

    return { responseRepository, surveysService };
  }

  it('rejects a second submission within the rolling 7-day window', async () => {
    const { responseRepository, surveysService } = buildTestModule({ id: 'existing-response' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: getRepositoryToken(Response), useValue: responseRepository },
        { provide: SurveysService, useValue: surveysService },
      ],
    }).compile();

    const service = moduleRef.get(ResponsesService);

    await expect(
      service.submit(surveyId, organizationId, userId, { answers: [{ questionId, ratingValue: 4 }] }),
    ).rejects.toThrow(ConflictException);
  });

  it('accepts a submission when no prior response exists in the window', async () => {
    const { responseRepository, surveysService } = buildTestModule(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: getRepositoryToken(Response), useValue: responseRepository },
        { provide: SurveysService, useValue: surveysService },
      ],
    }).compile();

    const service = moduleRef.get(ResponsesService);
    const result = await service.submit(surveyId, organizationId, userId, {
      answers: [{ questionId, ratingValue: 4 }],
    });

    expect(result.id).toBe('response-1');
    expect(responseRepository.save).toHaveBeenCalled();
  });

  it('rejects an answer referencing a question outside the survey', async () => {
    const { responseRepository, surveysService } = buildTestModule(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: getRepositoryToken(Response), useValue: responseRepository },
        { provide: SurveysService, useValue: surveysService },
      ],
    }).compile();

    const service = moduleRef.get(ResponsesService);

    await expect(
      service.submit(surveyId, organizationId, userId, {
        answers: [{ questionId: 'question-from-another-survey', ratingValue: 4 }],
      }),
    ).rejects.toThrow(ConflictException);
  });
});
