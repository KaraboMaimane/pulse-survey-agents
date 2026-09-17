import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { UserRole } from '../../shared/constants/roles.constant';

function buildContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RequestLoggingInterceptor', () => {
  it('logs a successful request with organization/user context at info level', (done) => {
    const logger = { log: jest.fn() };
    const interceptor = new RequestLoggingInterceptor(logger as never);
    const request = {
      method: 'GET',
      originalUrl: '/surveys/active',
      context: { organizationId: 'org-1', userId: 'user-1', role: UserRole.MEMBER },
    };
    const handler: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(buildContext(request), handler).subscribe(() => {
      expect(logger.log).toHaveBeenCalledWith(
        'info',
        'GET /surveys/active',
        expect.objectContaining({ organizationId: 'org-1', userId: 'user-1', role: UserRole.MEMBER }),
      );
      done();
    });
  });

  it('logs a failed request at error level without crashing when there is no request context', (done) => {
    const logger = { log: jest.fn() };
    const interceptor = new RequestLoggingInterceptor(logger as never);
    const request = { method: 'GET', originalUrl: '/auth/identities' };
    const handler: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    interceptor.intercept(buildContext(request), handler).subscribe({
      error: () => {
        expect(logger.log).toHaveBeenCalledWith(
          'error',
          'GET /auth/identities',
          expect.objectContaining({ errorMessage: 'boom', organizationId: undefined }),
        );
        done();
      },
    });
  });
});
