import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RequestContext } from '../../shared/interfaces/request-context.interface';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse();
    const request = httpContext.getRequest();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.buildResponseBody(exception, isHttpException, statusCode);

    // Expected client errors (4xx) are routine and logged at warn without a
    // stack trace; unexpected 5xx failures are logged at error with the full
    // stack, since those are the ones that need investigating.
    const requestContext: RequestContext | undefined = request.context;
    const logMeta = {
      method: request.method,
      path: request.originalUrl,
      statusCode,
      organizationId: requestContext?.organizationId,
      userId: requestContext?.userId,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled exception: ${body.message}`, { ...logMeta, stack });
    } else {
      this.logger.warn(`Request failed: ${body.message}`, logMeta);
    }

    response.status(statusCode).json(body);
  }

  private buildResponseBody(exception: unknown, isHttpException: boolean, statusCode: number): ErrorResponseBody {
    if (isHttpException) {
      const exceptionResponse = (exception as HttpException).getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        return exceptionResponse as ErrorResponseBody;
      }
      return { statusCode, message: String(exceptionResponse), error: (exception as HttpException).name };
    }

    return { statusCode, message: 'Internal server error', error: 'Internal Server Error' };
  }
}
