import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { CreateSurveyDto } from '../../shared/dto/create-survey.dto';
import { SurveyDto } from '../../shared/dto/survey-response.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async create(organizationId: string, dto: CreateSurveyDto): Promise<SurveyDto> {
    const survey = this.surveyRepository.create({
      organizationId,
      title: dto.title,
      isActive: true,
      questions: dto.questions.map((question, index) => ({
        text: question.text,
        type: question.type,
        orderIndex: index,
      })) as Survey['questions'],
    });

    const saved = await this.surveyRepository.save(survey);
    return this.toDto(saved);
  }

  async getActiveSurvey(organizationId: string): Promise<SurveyDto> {
    const survey = await this.surveyRepository.findOne({
      where: { organizationId, isActive: true },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
    });

    if (!survey) {
      throw new NotFoundException('No active survey for this organization');
    }

    return this.toDto(survey);
  }

  async getSurveyForOrganization(surveyId: string, organizationId: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId, organizationId },
      relations: ['questions'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  private toDto(survey: Survey): SurveyDto {
    return {
      id: survey.id,
      title: survey.title,
      isActive: survey.isActive,
      questions: [...survey.questions]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((question) => ({
          id: question.id,
          text: question.text,
          type: question.type,
          orderIndex: question.orderIndex,
        })),
    };
  }
}
