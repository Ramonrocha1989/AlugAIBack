import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterSchema, LoginSchema } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto, ForgotPasswordSchema, ResetPasswordSchema } from './dto/password-reset.dto';
import { VerifyEmailDto, VerifyEmailSchema } from './dto/verify-email.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public, CurrentUser } from './decorators/auth.decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token' })
  @ApiResponse({ status: 200, description: 'CSRF token retrieved' })
  getCsrfToken(@Req() req: Request) {
    return {
      csrfToken: req.csrfToken(),
    };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 registros por hora
  @Post('register')
  @ApiOperation({ summary: 'Register new company and user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or document already exists' })
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    
    // Definir cookie httpOnly
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
    });
    
    // Remover dados sensíveis antes de retornar
    const { phone, company, ...userWithoutSensitive } = result.user;
    const { document, ...companyWithoutDocument } = company || {};
    
    return {
      user: {
        ...userWithoutSensitive,
        company: company ? companyWithoutDocument : null,
      },
      message: result.message,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 tentativas a cada 15 minutos
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    
    // Definir cookie httpOnly
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
    });
    
    // Remover dados sensíveis antes de retornar
    const { phone, company, ...userWithoutSensitive } = result.user;
    const { document, ...companyWithoutDocument } = company || {};
    
    return {
      user: {
        ...userWithoutSensitive,
        company: company ? companyWithoutDocument : null,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    
    return { message: 'Logout realizado com sucesso' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  async forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body(new ZodValidationPipe(VerifyEmailSchema)) dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info with plan limits' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  async upgradePlan(@CurrentUser() user: any, @Body() body: { plan: string }) {
    return this.authService.upgradePlan(user.userId, body.plan);
  }
}
