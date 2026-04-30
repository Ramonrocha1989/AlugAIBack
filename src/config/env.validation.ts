import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // App
  PORT: z.coerce.number().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  ENABLE_SWAGGER: z.coerce.boolean().default(false),

  // Frontend
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  AUTH_COOKIE_SAMESITE: z.enum(['lax', 'none']).default('lax'),

  // Email
  RESEND_API_KEY: z
    .string()
    .startsWith('re_', 'RESEND_API_KEY must start with "re_"'),

  // Payment
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, 'MERCADOPAGO_ACCESS_TOKEN is required'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1, 'MERCADOPAGO_WEBHOOK_SECRET is required'),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
    .regex(/^[0-9a-f]+$/i, 'ENCRYPTION_KEY must be a valid hex string'),

  // Observability (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  BETTERSTACK_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error('');
      
      error.errors.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('');
      console.error('💡 Check your .env file or Railway environment variables');
      console.error('📖 See .env.example for reference');
    }
    
    process.exit(1);
  }
}
