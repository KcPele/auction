import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface FastifyReply {
  status(statusCode: number): FastifyReply;
  send(body: unknown): unknown;
}

interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

/**
 * Normalizes every thrown error into a single shape the frontend can rely on.
 * Keeps stack traces and unknown errors out of the response body.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<{ url?: string; raw?: { url?: string } }>();
    const path = request.url ?? request.raw?.url ?? '';

    const { statusCode, code, message, details } = this.normalize(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${code} at ${path}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      code,
      message,
      details,
      path,
      timestamp: new Date().toISOString(),
    };

    reply.status(statusCode).send(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode: status,
          code: this.codeFor(status, exception),
          message: response,
        };
      }

      if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        const message = Array.isArray(r.message)
          ? r.message.join(', ')
          : (typeof r.message === 'string' ? r.message : exception.message);
        const details = Array.isArray(r.message) ? r.message : r.errors ?? undefined;
        return {
          statusCode: status,
          code:
            typeof r.code === 'string'
              ? r.code
              : this.codeFor(status, exception),
          message,
          details,
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Something went wrong. Please try again.',
    };
  }

  private codeFor(status: number, exception: HttpException) {
    if (exception.constructor && exception.constructor.name) {
      // BadRequestException -> bad_request, NotFoundException -> not_found, etc.
      return exception.constructor.name
        .replace(/Exception$/, '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
    }
    return `http_${status}`;
  }
}
