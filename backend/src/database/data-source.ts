import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Organization } from '../modules/organizations/organization.entity';
import { User } from '../modules/users/user.entity';
import { Survey } from '../modules/surveys/survey.entity';
import { Question } from '../modules/surveys/question.entity';
import { Response } from '../modules/responses/response.entity';
import { Answer } from '../modules/responses/answer.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'pulse',
  password: process.env.DB_PASSWORD ?? 'pulse',
  database: process.env.DB_NAME ?? 'pulse_surveys',
  entities: [Organization, User, Survey, Question, Response, Answer],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
