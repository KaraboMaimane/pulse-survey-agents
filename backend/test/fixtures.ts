import { DataSource } from 'typeorm';
import { Organization } from '../src/modules/organizations/organization.entity';
import { User } from '../src/modules/users/user.entity';
import { Survey } from '../src/modules/surveys/survey.entity';
import { UserRole } from '../src/shared/constants/roles.constant';
import { QuestionType } from '../src/shared/constants/question-type.constant';

export interface SeededFixtures {
  acme: { organizationId: string; managerId: string; memberIds: string[]; surveyId: string; questionIds: string[] };
  globex: { organizationId: string; managerId: string; memberIds: string[]; surveyId: string };
}

// Resets and re-seeds a minimal two-organization fixture set for e2e tests,
// mirroring src/database/seed.ts but scoped down and returning ids the tests
// assert against directly.
export async function resetAndSeed(dataSource: DataSource): Promise<SeededFixtures> {
  await dataSource.query('TRUNCATE "answers", "responses", "questions", "surveys", "users", "organizations" CASCADE');

  const organizationRepository = dataSource.getRepository(Organization);
  const userRepository = dataSource.getRepository(User);
  const surveyRepository = dataSource.getRepository(Survey);

  const acmeOrg = await organizationRepository.save({ name: 'Acme Co (e2e)' });
  const globexOrg = await organizationRepository.save({ name: 'Globex Corp (e2e)' });

  const acmeManager = await userRepository.save({ organizationId: acmeOrg.id, name: 'Acme Manager', role: UserRole.MANAGER });
  const acmeMembers = await userRepository.save([
    { organizationId: acmeOrg.id, name: 'Acme Member One', role: UserRole.MEMBER },
    { organizationId: acmeOrg.id, name: 'Acme Member Two', role: UserRole.MEMBER },
  ]);

  const globexManager = await userRepository.save({ organizationId: globexOrg.id, name: 'Globex Manager', role: UserRole.MANAGER });
  const globexMembers = await userRepository.save([
    { organizationId: globexOrg.id, name: 'Globex Member One', role: UserRole.MEMBER },
  ]);

  const acmeSurvey = await surveyRepository.save({
    organizationId: acmeOrg.id,
    title: 'Acme Weekly Pulse (e2e)',
    isActive: true,
    questions: [
      { text: 'How satisfied are you this week?', type: QuestionType.RATING, orderIndex: 0 },
      { text: 'Did you feel supported?', type: QuestionType.YES_NO, orderIndex: 1 },
    ] as Survey['questions'],
  });

  const globexSurvey = await surveyRepository.save({
    organizationId: globexOrg.id,
    title: 'Globex Weekly Pulse (e2e)',
    isActive: true,
    questions: [{ text: 'How was your week?', type: QuestionType.RATING, orderIndex: 0 }] as Survey['questions'],
  });

  return {
    acme: {
      organizationId: acmeOrg.id,
      managerId: acmeManager.id,
      memberIds: acmeMembers.map((member) => member.id),
      surveyId: acmeSurvey.id,
      questionIds: acmeSurvey.questions.map((question) => question.id),
    },
    globex: {
      organizationId: globexOrg.id,
      managerId: globexManager.id,
      memberIds: globexMembers.map((member) => member.id),
      surveyId: globexSurvey.id,
    },
  };
}
