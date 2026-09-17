import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { RequestContext } from '../../shared/interfaces/request-context.interface';

const USER_ID_HEADER = 'x-user-id';
const ORG_ID_HEADER = 'x-org-id';

@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers[USER_ID_HEADER];
    const organizationId = request.headers[ORG_ID_HEADER];

    if (!userId || !organizationId) {
      throw new UnauthorizedException('Missing X-User-Id or X-Org-Id header');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.organizationId !== organizationId) {
      throw new UnauthorizedException('Invalid user or organization context');
    }

    const requestContext: RequestContext = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
    request.context = requestContext;

    return true;
  }
}
