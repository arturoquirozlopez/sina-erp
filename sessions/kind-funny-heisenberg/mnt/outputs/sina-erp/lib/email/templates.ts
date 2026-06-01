import type { EmailMessage } from './provider';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'Sina';
const FROM  = process.env.EMAIL_FROM || `${BRAND} ERP <no-reply@gruposina.cl>`;
const APP   = process.env.NEXT_PUBLIC_APP_URL || 'https://app.gruposina.cl';

function wrap(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F7F8FA;font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;color:#111827">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
    <div style="padding:24px;border-bottom:1px solid #E5E7EB">
      <span style="font-weight:800;font-size:20px;letter-spacing:0.11em;color:#0F2747">${BRAND.toUpperCase()}</span>
    </div>
    <div style="padding:32px 24px">
      <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#111827">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:11px">${BRAND} Pinturas SpA · Av. Vicuña Mackenna 4860, Macul</div>
  </div></body></html>`;
}

export function buildInviteEmail(opts: {
  to: string; firstName: string; lastName: string; roleName: string; token: string; invitedByName: string;
}): EmailMessage {
  const link = `${APP}/activate?token=${opts.token}`;
  const text = `Hola ${opts.firstName},

${opts.invitedByName} te invitó a ${BRAND} ERP con el rol ${opts.roleName}.

Para activar tu cuenta haz clic en el siguiente enlace:
${link}

La invitación expira en 7 días. Si no solicitaste esta invitación puedes ignorar este correo.

Saludos,
Equipo ${BRAND}`;
  const html = wrap('Has sido invitado a ' + BRAND + ' ERP', `
    <p style="margin:0 0 12px 0;color:#374151;line-height:1.5">Hola ${opts.firstName},</p>
    <p style="margin:0 0 16px 0;color:#374151;line-height:1.5">${opts.invitedByName} te invitó a ${BRAND} ERP con el rol <b>${opts.roleName}</b>.</p>
    <p style="margin:0 0 24px 0;color:#374151;line-height:1.5">Para activar tu cuenta haz clic en el botón:</p>
    <a href="${link}" style="display:inline-block;background:#0F2747;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">Activar cuenta</a>
    <p style="margin:24px 0 0 0;color:#6B7280;font-size:12px;line-height:1.5">La invitación expira en 7 días. Si no solicitaste esta invitación puedes ignorar este correo.</p>
  `);
  return { to: opts.to, from: FROM, subject: `Has sido invitado a ${BRAND} ERP`, text, html };
}

export function buildPasswordResetEmail(opts: { to: string; firstName: string; token: string; }): EmailMessage {
  const link = `${APP}/reset?token=${opts.token}`;
  const text = `Hola ${opts.firstName},

Recibimos una solicitud para restablecer tu contraseña.
Usa el siguiente enlace (válido por 1 hora):
${link}

Si no fuiste tú puedes ignorar este correo.

Saludos,
Equipo ${BRAND}`;
  const html = wrap('Restablece tu contraseña', `
    <p style="color:#374151;line-height:1.5">Recibimos una solicitud para restablecer tu contraseña.</p>
    <a href="${link}" style="display:inline-block;background:#0F2747;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Restablecer contraseña</a>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">El enlace es válido por 1 hora.</p>
  `);
  return { to: opts.to, from: FROM, subject: `Restablecer tu contraseña en ${BRAND} ERP`, text, html };
}
