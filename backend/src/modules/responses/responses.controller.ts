import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { SubmitResponseDto } from '../../shared/dto/submit-response.dto';
import { ResponseDto } from '../../shared/dto/response.dto';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { RequestContext } from '../../shared/interfaces/request-context.interface';
import { UserRole } from '../../shared/constants/roles.constant';

@Controller('surveys/:surveyId/responses')
@UseGuards(OrganizationScopeGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @Roles(UserRole.MEMBER)
  submit(
    @CurrentContext() context: RequestContext,
    @Param('surveyId') surveyId: string,
    @Body() dto: SubmitResponseDto,
  ): Promise<ResponseDto> {
    return this.responsesService.submit(surveyId, context.organizationId, context.userId, dto);
  }
}
