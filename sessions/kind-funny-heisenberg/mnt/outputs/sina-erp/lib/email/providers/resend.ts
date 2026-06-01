import type { EmailProvider, EmailMessage, EmailResult } from '../provider';

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  constructor(private apiKey: string) {}
  async send(msg: EmailMessage): Promise<EmailResult> {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: msg.from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      });
      const data = await r.json();
      if (!r.ok) return { ok: false, error: data?.message || r.statusText };
      return { ok: true, id: data?.id };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}
