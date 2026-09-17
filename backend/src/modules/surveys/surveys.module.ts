import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from './survey.entity';
import { Question } from './question.entity';
import { Response } from '../responses/response.entity';
import { User } from '../users/user.entity';
import { SurveysService } from './surveys.service';
import { SurveySummaryService } from './survey-summary.service';
import { SurveysController } from './surveys.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, Question, Response, User])],
  providers: [SurveysService, SurveySummaryService],
  controllers: [SurveysController],
  exports: [SurveysService, TypeOrmModule],
})
export class SurveysModule {}
