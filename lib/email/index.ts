export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<{ id: string }>;
}

/**
 * Console provider — logs the email instead of sending it. This is the
 * default so the whole system runs end-to-end without any email credentials.
 * Set EMAIL_PROVIDER=resend (or sendgrid/ses) plus the matching API key in
 * .env to send real emails; implement that branch using the provider's SDK.
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(input: SendEmailInput) {
    const id = `console_${Date.now()}`;
    console.log(
      `\n📧 [email:console] Para: ${input.to} | Assunto: ${input.subject}\n${input.text ?? stripHtml(input.html)}\n`
    );
    return { id };
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

function getProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  switch (provider) {
    case "resend":
      if (!process.env.RESEND_API_KEY) {
        console.warn("[email] EMAIL_PROVIDER=resend mas RESEND_API_KEY não definido. Usando console.");
        return new ConsoleEmailProvider();
      }
      throw new Error(
        "Integração com Resend pronta para ativação: instale a lib `resend` e implemente o envio em lib/email/index.ts."
      );
    case "sendgrid":
      if (!process.env.SENDGRID_API_KEY) {
        console.warn("[email] EMAIL_PROVIDER=sendgrid mas SENDGRID_API_KEY não definido. Usando console.");
        return new ConsoleEmailProvider();
      }
      throw new Error(
        "Integração com SendGrid pronta para ativação: instale @sendgrid/mail e implemente o envio em lib/email/index.ts."
      );
    case "ses":
      throw new Error(
        "Integração com Amazon SES pronta para ativação: instale @aws-sdk/client-ses e implemente o envio em lib/email/index.ts."
      );
    default:
      return new ConsoleEmailProvider();
  }
}

export async function sendEmail(input: SendEmailInput) {
  const provider = getProvider();
  return provider.send(input);
}
