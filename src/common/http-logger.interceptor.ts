import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers, user, ip } = request;
    const now = Date.now();
    
    const requestLog = {
      method,
      url,
      query,
      params,
      userId: user?.id,
      userEmail: user?.email,
      ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
      userAgent: headers['user-agent'],
    };

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} ${duration}ms`,
          'HTTP',
          { ...requestLog, statusCode, duration }
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        const statusCode = error.status || 500;
        
        const errorLog = {
          ...requestLog,
          statusCode,
          duration,
          errorName: error.name,
          errorResponse: error.response,
          body: this.sanitizeBody(body),
        };
        
        this.logger.error(
          `${method} ${url} ${statusCode} ${duration}ms - ${error.message}`,
          error.stack,
          'HTTP',
          errorLog
        );

        return throwError(() => error);
      })
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
}
