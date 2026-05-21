import { HttpException, type HttpStatus } from '@nestjs/common';
import type { ApiErrorDetail } from '@remotehask/shared-types';

export class ApiHttpException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super({ code, message, details }, status);
  }
}
