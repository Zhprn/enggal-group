import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  meta?: unknown;
}

function formatImageUrl(value: any): any {
  if (!value) return value;

  if (Array.isArray(value)) {
    return value.map((item) => formatImageUrl(item));
  }

  if (typeof value === 'object' && value !== null) {
    if (value instanceof Date || Buffer.isBuffer(value)) {
      return value;
    }
    const formattedObj: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      formattedObj[key] = formatImageUrl(value[key]);
    }
    return formattedObj;
  }

  if (typeof value === 'string') {
    const isImageFile = /\.(png|jpe?g|webp|gif|svg)$/i.test(value);
    const isUploadPath = value.startsWith('/uploads/') || value.startsWith('uploads/');

    if (isImageFile || isUploadPath) {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
      }

      const cleanFilename = value.replace(/^\/?(uploads\/)?/, '');
      const baseUrl = (process.env.R2_PUBLIC_URL).replace(/\/+$/, '');

      return `${baseUrl}/uploads/${cleanFilename}`;
    }
  }

  return value;
}

@Injectable()
export class TransformInterceptor
  implements NestInterceptor<unknown, Response<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<unknown>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          const {
            data: innerData,
            meta,
            message,
          } = data as {
            data: unknown;
            meta: unknown;
            message?: string;
          };

          return {
            statusCode: response.statusCode,
            message: message ?? 'Success',
            data: formatImageUrl(innerData),
            meta,
          };
        }

        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: formatImageUrl(data),
        };
      }),
    );
  }
}