import { PipeTransform, Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' && item !== null 
          ? this.sanitizeObject(item) 
          : typeof item === 'string'
          ? sanitizeHtml(item, {
              allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
              allowedAttributes: {},
            })
          : item
      );
    }

    const sanitized = { ...obj };
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeHtml(sanitized[key], {
          allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
          allowedAttributes: {},
        });
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }
    return sanitized;
  }
}
