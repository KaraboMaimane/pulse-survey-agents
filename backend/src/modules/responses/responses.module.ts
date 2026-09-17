import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from './response.entity';
import { Answer } from './answer.entity';
import { User } from '../users/user.entity';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
  imports: [TypeOrmModule.forFeature([Response, Answer, User]), SurveysModule],
  providers: [ResponsesService],
  controllers: [ResponsesController],
})
export class ResponsesModule {}
