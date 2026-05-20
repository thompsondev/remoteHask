import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorCode, type ApiErrorEnvelope } from '@remotehask/shared-types';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ headers: Record<string, string> }>();

    const requestId = request.headers['x-request-id'] ?? crypto.randomUUID();
    const traceId = crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';
    const details: ApiErrorEnvelope['error']['details'] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object') {
        const record = body as Record<string, unknown>;
        code = typeof record.code === 'string' ? record.code : code;
        message = typeof record.message === 'string' ? record.message : exception.message;
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(exception);
    }

    const envelope: ApiErrorEnvelope = {
      success: false,
      data: null,
      error: { code, message, details, traceId },
      meta: { requestId, timestamp: new Date().toISOString() },
    };

    response.status(status).json(envelope);
  }
}
