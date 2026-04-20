import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly from = 'BaitaBriq <noreply@baitabriq.com.br>';
  private readonly replyTo = 'suporte@baitabriq.com.br';
  private readonly headers = {
    'List-Unsubscribe': '<mailto:suporte@baitabriq.com.br?subject=unsubscribe>',
  };

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private footer(email: string) {
    const year = new Date().getFullYear();
    return {
      text: `\nBaitaBriq - Marketplace de Máquinas e Equipamentos\nEste email foi enviado para ${email}\n© ${year} BaitaBriq. Todos os direitos reservados.`,
      html: `
            <div style="border-top:1px solid #eee;padding:20px;text-align:center;color:#999;font-size:12px;">
              <p>BaitaBriq - Marketplace de Máquinas e Equipamentos</p>
              <p>Este email foi enviado para ${email}</p>
              <p>&copy; ${year} BaitaBriq. Todos os direitos reservados.</p>
            </div>`,
    };
  }

  private wrap(content: string, email: string) {
    const { html: footerHtml } = this.footer(email);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:20px;">
${content}
${footerHtml}
  </div>
</body>
</html>`;
  }

  private header(title: string, color: string) {
    return `
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid ${color};">
      <h1 style="color:${color};margin:0;">BaitaBriq</h1>
    </div>`;
  }

  private button(label: string, href: string, color: string) {
    return `
      <div style="text-align:center;margin:30px 0;">
        <a href="${href}" style="background-color:${color};color:white;padding:14px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;font-size:16px;">${label}</a>
      </div>
      <p style="color:#888;font-size:13px;">Ou copie e cole este link no navegador:</p>
      <p style="color:#2563eb;font-size:13px;word-break:break-all;">${href}</p>`;
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const { text: footerText } = this.footer(email);

    try {
      await this.resend.emails.send({
        from: this.from,
        replyTo: this.replyTo,
        to: email,
        subject: 'BaitaBriq - Confirme seu cadastro',
        headers: this.headers,
        text: `Bem-vindo ao BaitaBriq! Para ativar sua conta, acesse: ${verifyLink} - Este link expira em 24 horas.${footerText}`,
        html: this.wrap(`
    ${this.header('BaitaBriq', '#16a34a')}
    <div style="padding:30px 20px;">
      <h2 style="color:#333;">Bem-vindo ao BaitaBriq!</h2>
      <p style="color:#555;line-height:1.6;">Obrigado por se cadastrar. Para ativar sua conta, clique no botão abaixo:</p>
      ${this.button('Confirmar meu cadastro', verifyLink, '#16a34a')}
      <p style="color:#888;font-size:13px;">Este link expira em 24 horas.</p>
      <p style="color:#888;font-size:13px;">Se você não se cadastrou, ignore este email.</p>
    </div>`, email),
      });
    } catch (err) {
      console.error('Erro ao enviar email de verificação:', err);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const { text: footerText } = this.footer(email);

    try {
      await this.resend.emails.send({
        from: this.from,
        replyTo: this.replyTo,
        to: email,
        subject: 'BaitaBriq - Redefinição de senha',
        headers: this.headers,
        text: `Você solicitou a recuperação de senha. Acesse: ${resetLink} - Este link expira em 1 hora. Se você não solicitou, ignore este email.${footerText}`,
        html: this.wrap(`
    ${this.header('BaitaBriq', '#2563eb')}
    <div style="padding:30px 20px;">
      <h2 style="color:#333;">Redefinição de Senha</h2>
      <p style="color:#555;line-height:1.6;">Você solicitou a recuperação de senha. Clique no botão abaixo para redefinir:</p>
      ${this.button('Redefinir Senha', resetLink, '#2563eb')}
      <p style="color:#888;font-size:13px;">Este link expira em 1 hora.</p>
      <p style="color:#888;font-size:13px;">Se você não solicitou, ignore este email.</p>
    </div>`, email),
      });
    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err);
    }
  }

  async sendDeleteConfirmationEmail(email: string, userName: string, token: string) {
    const confirmLink = `${process.env.FRONTEND_URL}/confirm-delete?token=${token}`;
    const { text: footerText } = this.footer(email);

    try {
      await this.resend.emails.send({
        from: this.from,
        replyTo: this.replyTo,
        to: email,
        subject: 'BaitaBriq - Confirmação de exclusão de conta',
        headers: this.headers,
        text: `Olá ${userName}, recebemos uma solicitação para excluir sua conta no BaitaBriq. ATENÇÃO: Esta ação é irreversível! Para confirmar, acesse: ${confirmLink} - Este link expira em 24 horas. Se você não solicitou, ignore este email.${footerText}`,
        html: this.wrap(`
    ${this.header('BaitaBriq', '#dc2626')}
    <div style="padding:30px 20px;">
      <h2 style="color:#333;">Olá ${userName},</h2>
      <p style="color:#555;line-height:1.6;">Recebemos uma solicitação para excluir sua conta no BaitaBriq.</p>
      <p style="color:#dc2626;font-weight:bold;">⚠️ ATENÇÃO: Esta ação é irreversível!</p>
      <h3 style="color:#333;">O que será excluído:</h3>
      <ul style="color:#555;line-height:1.8;">
        <li>Seus equipamentos cadastrados</li>
        <li>Suas propostas e negociações</li>
        <li>Seu histórico de avaliações</li>
        <li>Todos os dados da sua conta</li>
      </ul>
      <p style="color:#555;line-height:1.6;">Para confirmar a exclusão, clique no botão abaixo:</p>
      ${this.button('Confirmar Exclusão', confirmLink, '#dc2626')}
      <p style="color:#888;font-size:13px;">Este link expira em 24 horas.</p>
      <p style="color:#888;font-size:13px;">Se você não solicitou esta exclusão, ignore este email e sua conta permanecerá ativa.</p>
      <p style="color:#888;font-size:13px;">Após a confirmação, você terá 30 dias para recuperar sua conta entrando em contato com o suporte.</p>
    </div>`, email),
      });
    } catch (err) {
      console.error('Erro ao enviar email de confirmação de exclusão:', err);
    }
  }

  async sendDeletedAccountEmail(email: string, userName: string, deletionDate: Date) {
    const { text: footerText } = this.footer(email);
    const formattedDate = deletionDate.toLocaleDateString('pt-BR');

    try {
      await this.resend.emails.send({
        from: this.from,
        replyTo: this.replyTo,
        to: email,
        subject: 'BaitaBriq - Informações sobre sua conta',
        headers: this.headers,
        text: `Olá ${userName}, sua conta foi marcada para exclusão e será removida permanentemente em 30 dias. Data de exclusão definitiva: ${formattedDate}. Para recuperar sua conta, entre em contato: suporte@baitabriq.com.br${footerText}`,
        html: this.wrap(`
    ${this.header('BaitaBriq', '#f59e0b')}
    <div style="padding:30px 20px;">
      <h2 style="color:#333;">Olá ${userName},</h2>
      <p style="color:#555;line-height:1.6;">Sua conta foi marcada para exclusão e será removida permanentemente em 30 dias.</p>
      <p style="color:#555;line-height:1.6;"><strong>Data de exclusão definitiva:</strong> ${formattedDate}</p>
      <p style="color:#555;line-height:1.6;">Para recuperar sua conta antes desta data, entre em contato:</p>
      <ul style="color:#555;line-height:1.8;">
        <li>Email: suporte@baitabriq.com.br</li>
      </ul>
      <p style="color:#555;line-height:1.6;">Sentiremos sua falta!</p>
      <br>
      <p style="color:#555;">Equipe BaitaBriq</p>
    </div>`, email),
      });
    } catch (err) {
      console.error('Erro ao enviar email de conta excluída:', err);
    }
  }
}
