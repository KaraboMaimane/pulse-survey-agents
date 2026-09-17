import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { SurveySummaryService } from './survey-summary.service';
import { CreateSurveyDto } from '../../shared/dto/create-survey.dto';
import { SurveyDto } from '../../shared/dto/survey-response.dto';
import { SurveySummaryDto } from '../../shared/dto/survey-summary.dto';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequestContext } from '../../shared/interfaces/request-context.interface';
import { UserRole } from '../../shared/constants/roles.constant';

@Controller('surveys')
@UseGuards(OrganizationScopeGuard, RolesGuard)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly surveySummaryService: SurveySummaryService,
  ) {}

  @Post()
  @Roles(UserRole.MANAGER)
  create(@CurrentContext() context: RequestContext, @Body() dto: CreateSurveyDto): Promise<SurveyDto> {
    return this.surveysService.create(context.organizationId, dto);
  }

  @Get('active')
  getActive(@CurrentContext() context: RequestContext): Promise<SurveyDto> {
    return this.surveysService.getActiveSurvey(context.organizationId);
  }

  @Get(':id/summary')
  @Roles(UserRole.MANAGER)
  getSummary(
    @CurrentContext() context: RequestContext,
    @Param('id') surveyId: string,
  ): Promise<SurveySummaryDto> {
    return this.surveySummaryService.getSummary(surveyId, context.organizationId);
  }
}
