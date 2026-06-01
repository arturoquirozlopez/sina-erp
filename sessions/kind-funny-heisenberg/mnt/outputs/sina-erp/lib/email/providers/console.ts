import type { EmailProvider, EmailMessage, EmailResult } from '../provider';

/** Provider de desarrollo: imprime el email en consola del server. */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  async send(msg: EmailMessage): Promise<EmailResult> {
    console.log('\n────── [EMAIL · console provider] ──────');
    console.log(`From:    ${msg.from}`);
    console.log(`To:      ${msg.to}`);
    console.log(`Subject: ${msg.subject}\n`);
    console.log(msg.text);
    console.log('────────────────────────────────────────\n');
    return { ok: true, id: 'console-' + Date.now() };
  }
}
