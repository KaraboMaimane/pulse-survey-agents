import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../../shared/interfaces/request-context.interface';

export const CurrentContext = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestContext => {
  const request = ctx.switchToHttp().getRequest();
  return request.context as RequestContext;
});
