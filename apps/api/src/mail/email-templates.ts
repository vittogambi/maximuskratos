/** Brand tokens aligned with DESIGN.md / apps/web globals. */
const C = {
  bg: '#070707',
  surface: '#111111',
  border: '#2a2a2a',
  hairline: 'rgba(255,255,255,0.08)',
  crimson: '#ff0000',
  blood: '#8b0000',
  marble: '#f5f5f5',
  soft: 'rgba(245,245,245,0.72)',
  muted: '#8a8a8a',
  dim: '#555555',
} as const;

const FONT_DISPLAY =
  "'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_BODY =
  "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Public site for email assets (Gmail cannot load localhost images). */
const ASSET_BASE = 'https://maximus-kratos.com';

export type EmailContent = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  footnote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (p, i) => `
      <tr>
        <td style="padding:0 0 ${i === paragraphs.length - 1 ? '28' : '14'}px 0;font-family:${FONT_BODY};font-size:16px;line-height:26px;color:${C.soft};">
          ${escapeHtml(p)}
        </td>
      </tr>`,
    )
    .join('');
}

function renderCta(cta: { label: string; href: string } | undefined): string {
  if (!cta) return '';
  return `
    <tr>
      <td style="padding:4px 0 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="background-color:${C.crimson};">
              <a href="${escapeHtml(cta.href)}"
                 style="display:block;background-color:${C.crimson};color:#ffffff;font-family:${FONT_BODY};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:16px 24px;border:0;">
                ${escapeHtml(cta.label)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderFootnote(footnote: string | undefined): string {
  if (!footnote) return '';
  return `
    <tr>
      <td style="padding:0 0 8px 0;font-family:${FONT_BODY};font-size:13px;line-height:21px;color:${C.muted};">
        ${escapeHtml(footnote)}
      </td>
    </tr>`;
}

/** Shared dark MK shell: logo, crimson accent, marble type. */
export function renderBrandedEmail(
  webUrl: string,
  content: EmailContent,
): string {
  const logoUrl = `${ASSET_BASE}/brand/mk-shield.png`;
  const siteUrl = webUrl.replace(/\/$/, '') || ASSET_BASE;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Maximus Kratos</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
    a { color: ${C.crimson}; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;">
    ${escapeHtml(content.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:${C.surface};border:1px solid ${C.border};">
          <!-- Crimson edge -->
          <tr>
            <td style="height:2px;background-color:${C.crimson};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height:1px;background-color:${C.blood};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Brand lockup -->
          <tr>
            <td align="center" style="padding:40px 40px 32px 40px;">
              <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
                <img src="${escapeHtml(logoUrl)}" width="48" height="45" alt="Maximus Kratos" style="width:48px;height:45px;margin:0 auto;" />
              </a>
              <p style="margin:18px 0 0 0;font-family:${FONT_DISPLAY};font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${C.marble};">
                Maximus Kratos
              </p>
              <p style="margin:14px 0 0 0;font-family:${FONT_BODY};font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};">
                Descúbrete&nbsp;&nbsp;·&nbsp;&nbsp;Alíneate&nbsp;&nbsp;·&nbsp;&nbsp;Construye
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;background-color:${C.hairline};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 12px 0;font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${C.crimson};">
                    ${escapeHtml(content.eyebrow)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 22px 0;font-family:${FONT_DISPLAY};font-size:30px;font-weight:700;line-height:36px;letter-spacing:0.01em;color:${C.marble};">
                    ${escapeHtml(content.title)}
                  </td>
                </tr>
                ${renderParagraphs(content.paragraphs)}
                ${renderCta(content.cta)}
                ${renderFootnote(content.footnote)}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px 36px 40px;border-top:1px solid ${C.border};">
              <p style="margin:0;font-family:${FONT_BODY};font-size:12px;line-height:18px;color:${C.dim};text-align:center;">
                <a href="${escapeHtml(siteUrl)}" style="color:${C.muted};text-decoration:none;">maximus-kratos.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:contacto@maximus-kratos.com" style="color:${C.muted};text-decoration:none;">contacto@maximus-kratos.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeEmailHtml(webUrl: string): {
  subject: string;
  html: string;
} {
  const site = webUrl.replace(/\/$/, '');
  return {
    subject: 'Tu lugar de fundador está reservado',
    html: renderBrandedEmail(webUrl, {
      preheader:
        'Tu cuenta Maximus Kratos está lista. Explora el sistema mientras preparamos el lanzamiento.',
      eyebrow: 'Programa fundador',
      title: 'Bienvenido.',
      paragraphs: [
        'Tu cuenta está lista y tu lugar de fundador quedó reservado.',
        'El diagnóstico, el Perfil Maestro y la Ruta se activan cuando lancemos la webapp y la app móvil juntas. Serás de los primeros en entrar.',
        'Mientras tanto, puedes explorar el sistema y el Marco Central.',
      ],
      cta: {
        label: 'Entrar a tu cuenta',
        href: `${site}/panel`,
      },
      footnote: 'Si no creaste esta cuenta, ignora este correo.',
    }),
  };
}

export function passwordResetEmailHtml(
  webUrl: string,
  resetUrl: string,
): { subject: string; html: string } {
  return {
    subject: 'Restablece tu contraseña',
    html: renderBrandedEmail(webUrl, {
      preheader: 'Enlace válido por 1 hora. Si no fuiste tú, ignora este correo.',
      eyebrow: 'Seguridad de cuenta',
      title: 'Restablecer contraseña',
      paragraphs: [
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Maximus Kratos.',
        'El enlace caduca en 1 hora.',
      ],
      cta: {
        label: 'Restablecer contraseña',
        href: resetUrl,
      },
      footnote:
        'Si no solicitaste este cambio, ignora este correo. Tu contraseña no se modificará.',
    }),
  };
}

export function reengagementEmailHtml(
  webUrl: string,
  selfKnowledgePct: number,
  trigger: '24h' | '48h' | '7d',
  resumeUrl: string,
): { subject: string; html: string } {
  const variants: Record<
    '24h' | '48h' | '7d',
    { subject: string; content: EmailContent }
  > = {
    '24h': {
      subject: 'Tu diagnóstico te espera donde lo dejaste',
      content: {
        preheader: 'Tu progreso está guardado. Retómalo cuando quieras.',
        eyebrow: 'Diagnóstico',
        title: 'Aún no terminaste.',
        paragraphs: [
          'Iniciaste tu Diagnóstico Maestro MK pero no lo completaste.',
          'Tu progreso está guardado exactamente donde lo dejaste.',
          'Solo necesitas 10 a 15 minutos para la siguiente etapa.',
        ],
        cta: { label: 'Retomar diagnóstico', href: resumeUrl },
      },
    },
    '48h': {
      subject: `${selfKnowledgePct}% de tu Perfil Maestro está listo`,
      content: {
        preheader: 'El resto del mapa se revela al completar el diagnóstico.',
        eyebrow: 'Perfil Maestro',
        title: `${selfKnowledgePct}% construido.`,
        paragraphs: [
          `El ${selfKnowledgePct}% de tu Perfil Maestro MK ya está construido.`,
          'El resto (arquetipo, fortalezas y cuello de botella) se revela al completarlo.',
        ],
        cta: { label: 'Continuar donde lo dejé', href: resumeUrl },
      },
    },
    '7d': {
      subject: 'Tu diagnóstico MK sigue guardado',
      content: {
        preheader: 'Puedes continuar en cualquier momento. Nada se pierde.',
        eyebrow: 'Diagnóstico',
        title: 'Sigue ahí.',
        paragraphs: [
          'Tu diagnóstico MK sigue guardado.',
          'Ya sabes algo sobre ti mismo que la mayoría nunca descubre. El resto del mapa te espera.',
        ],
        cta: { label: 'Retomar diagnóstico', href: resumeUrl },
      },
    },
  };

  const variant = variants[trigger];
  return {
    subject: variant.subject,
    html: renderBrandedEmail(webUrl, variant.content),
  };
}
