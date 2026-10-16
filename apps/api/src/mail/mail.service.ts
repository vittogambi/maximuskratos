import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  newRegistrationNotifyEmailHtml,
  passwordResetEmailHtml,
  reengagementEmailHtml,
  welcomeEmailHtml,
} from './email-templates';
import { configuredWebUrl } from './public-web-url';

const DEFAULT_CONTACT_EMAIL = 'contacto@maximus-kratos.com';

/** Fixture accounts must never receive real mail. */
export function isFixtureAddress(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@fixtures.mk.invalid');
}

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
    return configuredWebUrl();
  }

  private getContactEmail(): string {
    const raw = this.config.get<string>('CONTACT_EMAIL')?.trim();
    return raw || DEFAULT_CONTACT_EMAIL;
  }

  private async sendHtml(
    to: string,
    subject: string,
    html: string,
    logLabel: string,
    replyTo?: string,
  ): Promise<boolean> {
    if (isFixtureAddress(to)) {
      this.logger.warn(`Skipped ${logLabel}: fixture address`);
      return false;
    }

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
        ...(replyTo ? { reply_to: replyTo } : {}),
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

  async sendNewRegistrationNotify(
    userEmail: string,
    createdAt: Date,
  ): Promise<boolean> {
    // The recipient is the team, so the fixture guard in sendHtml never sees the fixture account.
    if (isFixtureAddress(userEmail)) {
      this.logger.warn('Skipped registration notify: fixture account');
      return false;
    }
    const to = this.getContactEmail();
    const { subject, html } = newRegistrationNotifyEmailHtml(
      this.getWebUrl(),
      userEmail,
      createdAt,
    );
    return this.sendHtml(
      to,
      subject,
      html,
      `registration notify: ${userEmail}`,
      userEmail,
    );
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
