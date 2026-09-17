import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { resetAndSeed, SeededFixtures } from './fixtures';

describe('Pulse Surveys (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fixtures: SeededFixtures;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleRef.get(DataSource);
  });

  beforeEach(async () => {
    fixtures = await resetAndSeed(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  function authHeaders(userId: string, organizationId: string) {
    return { 'X-User-Id': userId, 'X-Org-Id': organizationId };
  }

  describe('happy path', () => {
    it('lets a member view the active survey, submit a response, and a manager view the summary', async () => {
      const { acme } = fixtures;
      const memberId = acme.memberIds[0];

      const activeSurveyResponse = await request(app.getHttpServer())
        .get('/surveys/active')
        .set(authHeaders(memberId, acme.organizationId))
        .expect(200);

      expect(activeSurveyResponse.body.id).toBe(acme.surveyId);
      expect(activeSurveyResponse.body.questions).toHaveLength(2);

      const [ratingQuestion, yesNoQuestion] = activeSurveyResponse.body.questions;

      await request(app.getHttpServer())
        .post(`/surveys/${acme.surveyId}/responses`)
        .set(authHeaders(memberId, acme.organizationId))
        .send({
          answers: [
            { questionId: ratingQuestion.id, ratingValue: 5 },
            { questionId: yesNoQuestion.id, yesNoValue: true },
          ],
        })
        .expect(201);

      const summaryResponse = await request(app.getHttpServer())
        .get(`/surveys/${acme.surveyId}/summary`)
        .set(authHeaders(acme.managerId, acme.organizationId))
        .expect(200);

      expect(summaryResponse.body.completionCount).toBe(1);
      expect(summaryResponse.body.organizationMemberCount).toBe(2);
      expect(summaryResponse.body.completionRate).toBe(0.5);

      const ratingRollup = summaryResponse.body.questionRollups.find(
        (rollup: { questionId: string }) => rollup.questionId === ratingQuestion.id,
      );
      expect(ratingRollup.rollup).toEqual({ type: 'rating', average: 5, count: 1 });
    });

    it('rejects a second submission from the same member within the rolling window', async () => {
      const { acme } = fixtures;
      const memberId = acme.memberIds[0];

      const activeSurveyResponse = await request(app.getHttpServer())
        .get('/surveys/active')
        .set(authHeaders(memberId, acme.organizationId));
      const [ratingQuestion] = activeSurveyResponse.body.questions;

      await request(app.getHttpServer())
        .post(`/surveys/${acme.surveyId}/responses`)
        .set(authHeaders(memberId, acme.organizationId))
        .send({ answers: [{ questionId: ratingQuestion.id, ratingValue: 3 }] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/surveys/${acme.surveyId}/responses`)
        .set(authHeaders(memberId, acme.organizationId))
        .send({ answers: [{ questionId: ratingQuestion.id, ratingValue: 4 }] })
        .expect(409);
    });
  });

  describe('multi-tenant isolation', () => {
    it('never lets one organization see another organization\'s active survey', async () => {
      const { acme, globex } = fixtures;

      const response = await request(app.getHttpServer())
        .get('/surveys/active')
        .set(authHeaders(globex.managerId, globex.organizationId))
        .expect(200);

      expect(response.body.id).toBe(globex.surveyId);
      expect(response.body.id).not.toBe(acme.surveyId);
    });

    it('returns 404 rather than another organization\'s summary when a manager targets a foreign survey id', async () => {
      const { acme, globex } = fixtures;

      await request(app.getHttpServer())
        .get(`/surveys/${acme.surveyId}/summary`)
        .set(authHeaders(globex.managerId, globex.organizationId))
        .expect(404);
    });

    it('rejects a header claiming an organization the user does not belong to', async () => {
      const { acme, globex } = fixtures;

      await request(app.getHttpServer())
        .get('/surveys/active')
        .set(authHeaders(acme.memberIds[0], globex.organizationId))
        .expect(401);
    });

    it('does not let a member from one org submit a response to another org\'s survey', async () => {
      const { acme, globex } = fixtures;

      await request(app.getHttpServer())
        .post(`/surveys/${acme.surveyId}/responses`)
        .set(authHeaders(globex.memberIds[0], globex.organizationId))
        .send({ answers: [{ questionId: acme.questionIds[0], ratingValue: 5 }] })
        .expect(404);
    });
  });

  describe('role-based access control', () => {
    it('forbids a member from creating a survey', async () => {
      const { acme } = fixtures;

      await request(app.getHttpServer())
        .post('/surveys')
        .set(authHeaders(acme.memberIds[0], acme.organizationId))
        .send({ title: 'New Survey', questions: [{ text: 'How are you?', type: 'rating' }] })
        .expect(403);
    });

    it('forbids a member from viewing the manager summary', async () => {
      const { acme } = fixtures;

      await request(app.getHttpServer())
        .get(`/surveys/${acme.surveyId}/summary`)
        .set(authHeaders(acme.memberIds[0], acme.organizationId))
        .expect(403);
    });

    it('forbids a manager from submitting a member response', async () => {
      const { acme } = fixtures;

      await request(app.getHttpServer())
        .post(`/surveys/${acme.surveyId}/responses`)
        .set(authHeaders(acme.managerId, acme.organizationId))
        .send({ answers: [{ questionId: acme.questionIds[0], ratingValue: 5 }] })
        .expect(403);
    });

    it('lets a manager create a survey for their own organization', async () => {
      const { acme } = fixtures;

      const response = await request(app.getHttpServer())
        .post('/surveys')
        .set(authHeaders(acme.managerId, acme.organizationId))
        .send({
          title: 'New Survey',
          questions: [
            { text: 'How are you?', type: 'rating' },
            { text: 'Ready for next week?', type: 'yes_no' },
          ],
        })
        .expect(201);

      expect(response.body.title).toBe('New Survey');
      expect(response.body.questions).toHaveLength(2);
    });
  });
});
