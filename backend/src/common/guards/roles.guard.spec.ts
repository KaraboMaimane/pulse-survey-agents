import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../shared/constants/roles.constant';

function buildContext(requestContext: unknown): ExecutionContext {
  const request = { context: requestContext };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext({ role: UserRole.MEMBER }))).toBe(true);
  });

  it('throws when the current user does not have a required role', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([UserRole.MANAGER]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(buildContext({ role: UserRole.MEMBER }))).toThrow(ForbiddenException);
  });

  it('allows access when the current user has a required role', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([UserRole.MANAGER]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext({ role: UserRole.MANAGER }))).toBe(true);
  });
});
