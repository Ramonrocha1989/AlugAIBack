import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'BaitaBriq <noreply@baitabriq.com.br>',
        to: email,
        subject: 'Recuperação de Senha - BaitaBriq',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Senha</h2>
            <p>Você solicitou a recuperação de senha.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
            <p style="color: #666; font-size: 14px;">Se você não solicitou, ignore este email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'BaitaBriq <noreply@baitabriq.com.br>',
        to: email,
        subject: 'Verifique seu email - BaitaBriq',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo ao BaitaBriq!</h2>
            <p>Obrigado por se cadastrar. Para ativar sua conta, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verificar Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
            <p style="color: #666; font-size: 14px;">Se você não se cadastrou, ignore este email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de verificação:', err);
    }
  }

  async sendDeleteConfirmationEmail(email: string, userName: string, token: string) {
    const confirmLink = `${process.env.FRONTEND_URL}/confirm-delete?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'BaitaBriq <noreply@baitabriq.com.br>',
        to: email,
        subject: 'Confirme a exclusão da sua conta - BaitaBriq',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá ${userName},</h2>
            <p>Recebemos uma solicitação para excluir sua conta no BaitaBriq.</p>
            <p><strong>⚠️ ATENÇÃO: Esta ação é irreversível!</strong></p>
            <h3>O que será excluído:</h3>
            <ul>
              <li>Seus equipamentos cadastrados</li>
              <li>Suas propostas e negociações</li>
              <li>Seu histórico de avaliações</li>
              <li>Todos os dados da sua conta</li>
            </ul>
            <p>Para confirmar a exclusão, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirmar Exclusão</a>
            </div>
            <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
            <p style="color: #666; font-size: 14px;">Se você não solicitou esta exclusão, ignore este email e sua conta permanecerá ativa.</p>
            <p style="color: #666; font-size: 14px;">Após a confirmação, você terá 30 dias para recuperar sua conta entrando em contato com o suporte.</p>
            <br>
            <p>Atenciosamente,<br>Equipe BaitaBriq</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de confirmação de exclusão:', err);
    }
  }

  async sendDeletedAccountEmail(email: string, userName: string, deletionDate: Date) {
    try {
      await this.resend.emails.send({
        from: 'BaitaBriq <noreply@baitabriq.com.br>',
        to: email,
        subject: 'Sua conta foi marcada para exclusão - BaitaBriq',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá ${userName},</h2>
            <p>Sua conta foi marcada para exclusão e será removida permanentemente em 30 dias.</p>
            <p><strong>Data de exclusão definitiva:</strong> ${deletionDate.toLocaleDateString('pt-BR')}</p>
            <p>Para recuperar sua conta antes desta data, entre em contato:</p>
            <ul>
              <li>Email: suporte@baitabriq.com.br</li>
            </ul>
            <p>Sentiremos sua falta!</p>
            <br>
            <p>Equipe BaitaBriq</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de conta excluída:', err);
    }
  }
}
