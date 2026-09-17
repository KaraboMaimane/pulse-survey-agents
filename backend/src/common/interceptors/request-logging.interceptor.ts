import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable, tap } from 'rxjs';
import { Logger } from 'winston';
import { RequestContext } from '../../shared/interfaces/request-context.interface';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logCompletion(request, method, originalUrl, startedAt, 'info'),
        error: (error: Error) => this.logCompletion(request, method, originalUrl, startedAt, 'error', error),
      }),
    );
  }

  private logCompletion(
    request: { context?: RequestContext },
    method: string,
    path: string,
    startedAt: number,
    level: 'info' | 'error',
    error?: Error,
  ): void {
    const durationMs = Date.now() - startedAt;
    const requestContext = request.context;

    this.logger.log(level, `${method} ${path}`, {
      method,
      path,
      durationMs,
      organizationId: requestContext?.organizationId,
      userId: requestContext?.userId,
      role: requestContext?.role,
      ...(error ? { errorMessage: error.message, errorName: error.name } : {}),
    });
  }
}
