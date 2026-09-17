import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { OrganizationScopeGuard } from './organization-scope.guard';
import { UserRole } from '../../shared/constants/roles.constant';

function buildContext(headers: Record<string, string>): { context: ExecutionContext; request: { headers: Record<string, string>; context?: unknown } } {
  const request = { headers, context: undefined as unknown };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('OrganizationScopeGuard', () => {
  it('throws when headers are missing', async () => {
    const userRepository = { findOne: jest.fn() };
    const guard = new OrganizationScopeGuard(userRepository as never);
    const { context } = buildContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the user belongs to a different organization than claimed', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-1', organizationId: 'org-A', role: UserRole.MEMBER }),
    };
    const guard = new OrganizationScopeGuard(userRepository as never);
    const { context } = buildContext({ 'x-user-id': 'user-1', 'x-org-id': 'org-B' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches request context and allows access when the user matches the claimed organization', async () => {
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-1', organizationId: 'org-A', role: UserRole.MANAGER }),
    };
    const guard = new OrganizationScopeGuard(userRepository as never);
    const { context, request } = buildContext({ 'x-user-id': 'user-1', 'x-org-id': 'org-A' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.context).toEqual({ userId: 'user-1', organizationId: 'org-A', role: UserRole.MANAGER });
  });
});
