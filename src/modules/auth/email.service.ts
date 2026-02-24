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
        from: 'Mercado Máquina <noreply@mercadomaquina.online>',
        to: email,
        subject: 'Recuperação de Senha - Mercado Máquina',
        html: `
          <h2>Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha.</p>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou, ignore este email.</p>
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
        from: 'Mercado Máquina <noreply@mercadomaquina.online>',
        to: email,
        subject: 'Verifique seu email - Mercado Máquina',
        html: `
          <h2>Bem-vindo ao Mercado Máquina!</h2>
          <p>Obrigado por se cadastrar. Para ativar sua conta, clique no link abaixo:</p>
          <a href="${verifyLink}">${verifyLink}</a>
          <p>Este link expira em 24 horas.</p>
          <p>Se você não se cadastrou, ignore este email.</p>
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
        from: 'Mercado Máquina <noreply@mercadomaquina.online>',
        to: email,
        subject: 'Confirme a exclusão da sua conta - Mercado Máquina',
        html: `
          <h2>Olá ${userName},</h2>
          <p>Recebemos uma solicitação para excluir sua conta no Mercado Máquina.</p>
          <p><strong>⚠️ ATENÇÃO: Esta ação é irreversível!</strong></p>
          <h3>O que será excluído:</h3>
          <ul>
            <li>Seus equipamentos cadastrados</li>
            <li>Suas propostas e negociações</li>
            <li>Seu histórico de avaliações</li>
            <li>Todos os dados da sua conta</li>
          </ul>
          <p>Para confirmar a exclusão, clique no link abaixo:</p>
          <a href="${confirmLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirmar Exclusão</a>
          <p>Este link expira em 24 horas.</p>
          <p>Se você não solicitou esta exclusão, ignore este email e sua conta permanecerá ativa.</p>
          <p>Após a confirmação, você terá 30 dias para recuperar sua conta entrando em contato com o suporte.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Mercado Máquina</p>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de confirmação de exclusão:', err);
    }
  }

  async sendDeletedAccountEmail(email: string, userName: string, deletionDate: Date) {
    try {
      await this.resend.emails.send({
        from: 'Mercado Máquina <noreply@mercadomaquina.online>',
        to: email,
        subject: 'Sua conta foi marcada para exclusão - Mercado Máquina',
        html: `
          <h2>Olá ${userName},</h2>
          <p>Sua conta foi marcada para exclusão e será removida permanentemente em 30 dias.</p>
          <p><strong>Data de exclusão definitiva:</strong> ${deletionDate.toLocaleDateString('pt-BR')}</p>
          <p>Para recuperar sua conta antes desta data, entre em contato:</p>
          <ul>
            <li>Email: suporte@mercadomaquina.online</li>
          </ul>
          <p>Sentiremos sua falta!</p>
          <br>
          <p>Equipe Mercado Máquina</p>
        `,
      });
    } catch (err) {
      console.error('Erro ao enviar email de conta excluída:', err);
    }
  }
}
