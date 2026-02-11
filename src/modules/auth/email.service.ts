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

    this.resend.emails.send({
      from: 'EquipRent <noreply@mercadomaquina.online>',
      to: email,
      subject: 'Recuperação de Senha - EquipRent',
      html: `
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou, ignore este email.</p>
      `,
    }).catch(err => console.error('Erro ao enviar email:', err));
  }
}
