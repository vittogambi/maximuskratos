import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('RESEND_FROM') ??
      'Maximus Kratos <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`,
      );
      return false;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Restablecer contraseña — Maximus Kratos',
        html: `
          <p>Recibimos una solicitud para restablecer tu contraseña en Maximus Kratos.</p>
          <p><a href="${resetUrl}">Restablecer contraseña</a></p>
          <p>Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend failed (${res.status}): ${body}`);
      return false;
    }

    return true;
  }
}
