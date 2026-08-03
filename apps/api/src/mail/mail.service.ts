import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  passwordResetEmailHtml,
  reengagementEmailHtml,
  welcomeEmailHtml,
} from './email-templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private getFrom(): string {
    return (
      this.config.get<string>('RESEND_FROM') ??
      'Maximus Kratos <onboarding@resend.dev>'
    );
  }

  private getWebUrl(): string {
    return (
      this.config.get<string>('WEB_URL') ??
      this.config.get<string>('APP_URL') ??
      'https://maximus-kratos.com'
    );
  }

  private async sendHtml(
    to: string,
    subject: string,
    html: string,
    logLabel: string,
  ): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn(`RESEND_API_KEY not set — ${logLabel} for ${to}`);
      return false;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.getFrom(),
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend ${logLabel} failed (${res.status}): ${body}`);
      return false;
    }

    return true;
  }

  async sendWelcomeEmail(to: string): Promise<boolean> {
    const { subject, html } = welcomeEmailHtml(this.getWebUrl());
    return this.sendHtml(to, subject, html, 'welcome email');
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const { subject, html } = passwordResetEmailHtml(this.getWebUrl(), resetUrl);
    return this.sendHtml(
      to,
      subject,
      html,
      `password reset link: ${resetUrl}`,
    );
  }

  async sendReengagementEmail(
    to: string,
    selfKnowledgePct: number,
    trigger: '24h' | '48h' | '7d',
    resumeUrl: string,
  ): Promise<boolean> {
    const { subject, html } = reengagementEmailHtml(
      this.getWebUrl(),
      selfKnowledgePct,
      trigger,
      resumeUrl,
    );
    return this.sendHtml(
      to,
      subject,
      html,
      `reengagement email (${trigger}): ${resumeUrl}`,
    );
  }
}
