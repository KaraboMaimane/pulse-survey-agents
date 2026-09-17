import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { Organization } from '../modules/organizations/organization.entity';
import { User } from '../modules/users/user.entity';
import { Survey } from '../modules/surveys/survey.entity';
import { Question } from '../modules/surveys/question.entity';
import { UserRole } from '../shared/constants/roles.constant';
import { QuestionType } from '../shared/constants/question-type.constant';

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const organizationRepository = AppDataSource.getRepository(Organization);
  const userRepository = AppDataSource.getRepository(User);
  const surveyRepository = AppDataSource.getRepository(Survey);

  await AppDataSource.query('TRUNCATE "answers", "responses", "questions", "surveys", "users", "organizations" CASCADE');

  const acme = await organizationRepository.save({ name: 'Acme Co' });
  const globex = await organizationRepository.save({ name: 'Globex Corp' });

  const acmeManager = await userRepository.save({ organizationId: acme.id, name: 'Ava Manager', role: UserRole.MANAGER });
  await userRepository.save([
    { organizationId: acme.id, name: 'Ben Member', role: UserRole.MEMBER },
    { organizationId: acme.id, name: 'Cleo Member', role: UserRole.MEMBER },
    { organizationId: acme.id, name: 'Dax Member', role: UserRole.MEMBER },
  ]);

  const globexManager = await userRepository.save({ organizationId: globex.id, name: 'Gina Manager', role: UserRole.MANAGER });
  await userRepository.save([
    { organizationId: globex.id, name: 'Hank Member', role: UserRole.MEMBER },
    { organizationId: globex.id, name: 'Ivy Member', role: UserRole.MEMBER },
  ]);

  await surveyRepository.save({
    organizationId: acme.id,
    title: 'Weekly Pulse — Acme',
    isActive: true,
    questions: [
      { text: 'How satisfied are you with your workload this week?', type: QuestionType.RATING, orderIndex: 0 },
      { text: 'Did you feel supported by your manager this week?', type: QuestionType.YES_NO, orderIndex: 1 },
      { text: 'How would you rate team collaboration this week?', type: QuestionType.RATING, orderIndex: 2 },
    ] as Question[],
  });

  await surveyRepository.save({
    organizationId: globex.id,
    title: 'Weekly Pulse — Globex',
    isActive: true,
    questions: [
      { text: 'How manageable was your workload this week?', type: QuestionType.RATING, orderIndex: 0 },
      { text: 'Did you achieve your top priority this week?', type: QuestionType.YES_NO, orderIndex: 1 },
    ] as Question[],
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`Acme manager: ${acmeManager.id} (org ${acme.id})`);
  // eslint-disable-next-line no-console
  console.log(`Globex manager: ${globexManager.id} (org ${globex.id})`);

  await AppDataSource.destroy();
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});
