import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccessEnvelope, ResponseMeta } from '@remotehask/shared-types';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessEnvelope<T>> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const requestId = request.headers['x-request-id'] ?? crypto.randomUUID();

    return next.handle().pipe(
      map((data) => {
        const meta: ResponseMeta = {
          requestId,
          timestamp: new Date().toISOString(),
        };
        return {
          success: true as const,
          data,
          meta,
        };
      }),
    );
  }
}
