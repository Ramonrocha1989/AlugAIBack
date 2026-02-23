import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as Logtail from '@logtail/node';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logtail: any;

  constructor() {
    if (process.env.BETTERSTACK_TOKEN) {
      this.logtail = new Logtail.Logtail(process.env.BETTERSTACK_TOKEN);
    }
  }

  log(message: string, context?: string) {
    this.writeLog('info', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.writeLog('error', message, context, { trace });
  }

  warn(message: string, context?: string) {
    this.writeLog('warn', message, context);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('verbose', message, context);
    }
  }

  private writeLog(level: string, message: string, context?: string, extra?: any) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message,
      environment: process.env.NODE_ENV || 'development',
      ...extra,
    };

    // Console output com cores
    const color = this.getColor(level);
    console.log(`${color}[${log.timestamp}] [${log.level.toUpperCase()}] [${log.context}]${this.resetColor()} ${message}`);
    
    if (extra?.trace) {
      console.error(extra.trace);
    }

    // Enviar para BetterStack se configurado
    if (this.logtail) {
      this.logtail[level](message, log);
    }
  }

  private getColor(level: string): string {
    const colors = {
      info: '\x1b[32m',    // Green
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      debug: '\x1b[36m',   // Cyan
      verbose: '\x1b[35m', // Magenta
    };
    return colors[level] || '';
  }

  private resetColor(): string {
    return '\x1b[0m';
  }
}
