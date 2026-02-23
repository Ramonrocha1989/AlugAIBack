import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Só envia para Sentry erros 500+ ou erros não-HTTP
        if (!(error instanceof HttpException) || error.getStatus() >= 500) {
          const request = context.switchToHttp().getRequest();
          
          Sentry.withScope((scope) => {
            // Adicionar contexto do usuário
            if (request.user) {
              scope.setUser({
                id: request.user.id,
                email: request.user.email,
                username: request.user.name,
              });
            }
            
            // Adicionar contexto da requisição
            scope.setContext('request', {
              method: request.method,
              url: request.url,
              headers: this.sanitizeHeaders(request.headers),
              query: request.query,
              body: this.sanitizeBody(request.body),
            });

            // Adicionar tags úteis
            scope.setTag('endpoint', `${request.method} ${request.url}`);
            scope.setTag('status_code', error.status || 500);

            // Capturar exceção
            Sentry.captureException(error);
          });
        }
        
        return throwError(() => error);
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    // Remove informações sensíveis
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    // Remove informações sensíveis
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.creditCard;
    return sanitized;
  }
}
