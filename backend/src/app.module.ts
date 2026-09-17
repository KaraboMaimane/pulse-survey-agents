import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
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
import { winstonModuleOptions } from './common/logging/winston.config';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(winstonModuleOptions),
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
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
