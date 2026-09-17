import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './modules/organizations/organization.entity';
import { User } from './modules/users/user.entity';
import { Survey } from './modules/surveys/survey.entity';
import { Question } from './modules/surveys/question.entity';
import { Response } from './modules/responses/response.entity';
import { Answer } from './modules/responses/answer.entity';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { ResponsesModule } from './modules/responses/responses.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'pulse',
      password: process.env.DB_PASSWORD ?? 'pulse',
      database: process.env.DB_NAME ?? 'pulse_surveys',
      entities: [Organization, User, Survey, Question, Response, Answer],
      synchronize: false,
    }),
    OrganizationsModule,
    UsersModule,
    AuthModule,
    SurveysModule,
    ResponsesModule,
  ],
})
export class AppModule {}
