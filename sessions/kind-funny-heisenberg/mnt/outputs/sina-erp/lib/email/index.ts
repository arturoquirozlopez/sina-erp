import type { EmailProvider, EmailMessage } from './provider';
import { ResendEmailProvider } from './providers/resend';
import { ConsoleEmailProvider } from './providers/console';
import { createAdminClient } from '@/lib/supabase/admin';

let _instance: EmailProvider | null = null;
export function getEmailProvider(): EmailProvider {
  if (_instance) return _instance;
  const name = process.env.SINA_EMAIL_PROVIDER || 'console';
  switch (name) {
    case 'resend':
      if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurado');
      _instance = new ResendEmailProvider(process.env.RESEND_API_KEY);
      break;
    default:
      _instance = new ConsoleEmailProvider();
  }
  return _instance;
}

/** Envía y registra en email_outbox para auditoría. */
export async function sendEmail(msg: EmailMessage, kind: string) {
  const provider = getEmailProvider();
  const result = await provider.send(msg);
  try {
    const admin = createAdminClient();
    await admin.from('email_outbox').insert({
      provider: provider.name, kind,
      to_addr: msg.to, from_addr: msg.from, subject: msg.subject,
      body_text: msg.text, body_html: msg.html,
      status: result.ok ? 'sent' : 'error',
      provider_message_id: result.id ?? null,
      error_message: result.error ?? null,
      sent_at: result.ok ? new Date().toISOString() : null,
    });
  } catch (e) { console.error('email_outbox log failed', e); }
  return result;
}

export type { EmailMessage, EmailProvider } from './provider';
