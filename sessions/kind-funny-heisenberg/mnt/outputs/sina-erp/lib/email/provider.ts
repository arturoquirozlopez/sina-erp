export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};
export type EmailResult = { ok: boolean; id?: string; error?: string };

export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<EmailResult>;
}
