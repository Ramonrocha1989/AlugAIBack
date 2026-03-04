import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} ${duration}ms`,
          'HTTP'
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        const statusCode = error.status || 500;
        
        const errorDetails = error.response 
          ? JSON.stringify(error.response) 
          : error.message;
        
        this.logger.error(
          `${method} ${url} ${statusCode} ${duration}ms - ${errorDetails}`,
          error.stack,
          'HTTP'
        );

        return throwError(() => error);
      })
    );
  }
}
