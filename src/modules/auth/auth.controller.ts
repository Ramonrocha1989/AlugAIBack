import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Res, Req, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterSchema, LoginSchema, UpgradePlanDto, UpgradePlanSchema } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto, ForgotPasswordSchema, ResetPasswordSchema } from './dto/password-reset.dto';
import { VerifyEmailDto, VerifyEmailSchema } from './dto/verify-email.dto';
import { UpdateProfileDto, UpdateProfileSchema } from './dto/update-profile.dto';
import { RequestDeleteDto, ConfirmDeleteDto, RequestDeleteSchema, ConfirmDeleteSchema } from './dto/delete-account.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public, CurrentUser, Roles } from './decorators/auth.decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 3600000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register new company and user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or document already exists' })
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    const { phone, company, ...userWithoutSensitive } = result.user;
    const { document, ...companyWithoutDocument } = company || {};

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: {
        ...userWithoutSensitive,
        company: company ? companyWithoutDocument : null,
      },
      message: result.message,
      ...(process.env.NODE_ENV !== 'production' && {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.login(dto);

      const { phone, company, ...userWithoutSensitive } = result.user;
      const { document, ...companyWithoutDocument } = company || {};

      this.setAuthCookies(res, result.accessToken, result.refreshToken);

      return {
        user: {
          ...userWithoutSensitive,
          company: company ? companyWithoutDocument : null,
        },
        ...(process.env.NODE_ENV !== 'production' && {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      };
    } catch (error) {
      if (error.status === 403 && error.message.includes('marcada para exclusão')) {
        res.status(403);
        return {
          message: error.message,
          accountDeleted: true,
        };
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    await this.authService.logout(user.userId, refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logout realizado com sucesso' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body?: { refreshToken?: string }) {
    const refreshToken = req.cookies?.refreshToken || body?.refreshToken;

    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Refresh token ausente' };
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    const { phone, company, ...userWithoutSensitive } = result.user;
    const { document, ...companyWithoutDocument } = company || {};

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: {
        ...userWithoutSensitive,
        company: company ? companyWithoutDocument : null,
      },
      ...(process.env.NODE_ENV !== 'production' && {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) return;
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // cross-domain requer none + secure
      domain: '.baitabriq.com.br', // compartilhado entre baitabriq.com.br e api.baitabriq.com.br
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.baitabriq.com.br',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('upgrade-plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade user plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  async upgradePlan(@CurrentUser() user: any, @Body(new ZodValidationPipe(UpgradePlanSchema)) body: UpgradePlanDto) {
    return this.authService.upgradePlan(body.userId ?? user.userId, body.plan);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('request-delete')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request account deletion' })
  @ApiResponse({ status: 200, description: 'Confirmation email sent' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async requestDelete(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(RequestDeleteSchema)) dto: RequestDeleteDto
  ) {
    return this.authService.requestDelete(user.userId, dto);
  }

  @Public()
  @Post('confirm-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm account deletion with token' })
  @ApiResponse({ status: 200, description: 'Account marked for deletion' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmDelete(
    @Body(new ZodValidationPipe(ConfirmDeleteSchema)) dto: ConfirmDeleteDto
  ) {
    return this.authService.confirmDelete(dto);
  }
}
