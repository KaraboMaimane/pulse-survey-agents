import { ArgumentsHost, ConflictException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function buildHost(request: Record<string, unknown>, response: { status: jest.Mock; json: jest.Mock }): ArgumentsHost {
  return {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  function buildResponse() {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    return response;
  }

  it('logs a known HttpException at warn level and returns its status/body', () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const filter = new AllExceptionsFilter(logger as never);
    const response = buildResponse();
    const request = { method: 'POST', originalUrl: '/surveys/1/responses', context: { organizationId: 'org-1' } };

    filter.catch(new ConflictException('duplicate response'), buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, message: 'duplicate response' }),
    );
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an unexpected error at error level with its stack and returns a generic 500 body', () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const filter = new AllExceptionsFilter(logger as never);
    const response = buildResponse();
    const request = { method: 'GET', originalUrl: '/surveys/active' };

    filter.catch(new Error('unexpected failure'), buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Internal server error'),
      expect.objectContaining({ stack: expect.stringContaining('unexpected failure') }),
    );
  });
});
