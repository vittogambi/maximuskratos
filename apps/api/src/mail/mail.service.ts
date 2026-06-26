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

  async sendReengagementEmail(
    to: string,
    selfKnowledgePct: number,
    trigger: '24h' | '48h' | '7d',
    resumeUrl: string,
  ): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('RESEND_FROM') ??
      'Maximus Kratos <onboarding@resend.dev>';

    const subjects: Record<string, string> = {
      '24h': 'Dejaste algo sin terminar.',
      '48h': `${selfKnowledgePct}% de tu Perfil te está esperando.`,
      '7d': 'Tu diagnóstico sigue ahí.',
    };

    const bodies: Record<string, string> = {
      '24h': `
        <p>Iniciaste tu Diagnóstico Maestro MK pero no lo terminaste.</p>
        <p>Tu progreso está guardado exactamente donde lo dejaste.</p>
        <p><a href="${resumeUrl}">Retomar diagnóstico →</a></p>
        <p style="color:#888;font-size:14px;">Solo necesitas 10-15 minutos para completar la siguiente etapa.</p>
      `,
      '48h': `
        <p>El ${selfKnowledgePct}% de tu Perfil Maestro MK está construido y esperándote.</p>
        <p>El resto del perfil — tu arquetipo, fortalezas y cuello de botella — se revela al completarlo.</p>
        <p><a href="${resumeUrl}">Continuar donde lo dejé →</a></p>
      `,
      '7d': `
        <p>Tu diagnóstico MK sigue ahí, guardado.</p>
        <p>Ya sabes algo sobre ti mismo que la mayoría nunca descubre. El resto del mapa te espera.</p>
        <p><a href="${resumeUrl}">Retomar diagnóstico →</a></p>
        <p style="color:#888;font-size:14px;">Tu progreso nunca se pierde. Puedes continuar en cualquier momento.</p>
      `,
    };

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not set — reengagement email (${trigger}) for ${to}: ${resumeUrl}`,
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
        subject: subjects[trigger],
        html: bodies[trigger],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend reengagement failed (${res.status}): ${body}`);
      return false;
    }

    return true;
  }
}
