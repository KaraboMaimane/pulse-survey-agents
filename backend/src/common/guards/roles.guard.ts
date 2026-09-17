import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../shared/constants/roles.constant';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestContext } from '../../shared/interfaces/request-context.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const requestContext: RequestContext | undefined = request.context;

    if (!requestContext || !requiredRoles.includes(requestContext.role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }

    return true;
  }
}
