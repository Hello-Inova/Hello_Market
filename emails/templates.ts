import { formatCurrency } from "@/lib/utils";

const STORE_NAME = "Hello Market";
const BRAND_COLOR = "#16a34a";

function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:${BRAND_COLOR};padding:20px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:700;">${STORE_NAME}</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 32px;background:#fafafa;color:#71717a;font-size:12px;">
            Este é um e-mail automático, não responda. © ${new Date().getFullYear()} ${STORE_NAME}.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: `Bem-vindo(a) à ${STORE_NAME}, ${name}!`,
    html: layout(
      `Olá, ${name}! 👋`,
      `<p>Sua conta foi criada com sucesso. Agora você pode acompanhar pedidos, salvar favoritos e muito mais.</p>`
    ),
  };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  return {
    subject: "Recuperação de senha",
    html: layout(
      `Olá, ${name}`,
      `<p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo (o link expira em 1 hora):</p>
       <p style="text-align:center;margin:24px 0;"><a href="${resetUrl}" style="background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></p>
       <p style="color:#71717a;font-size:13px;">Se você não solicitou isso, ignore este e-mail.</p>`
    ),
  };
}

export function orderReceivedEmail(name: string, orderNumber: string, total: number) {
  return {
    subject: `Pedido ${orderNumber} recebido`,
    html: layout(
      `Recebemos seu pedido, ${name}!`,
      `<p>O pedido <strong>${orderNumber}</strong> foi registrado, no valor de <strong>${formatCurrency(total)}</strong>.</p>
       <p>Assim que o pagamento for confirmado, iniciaremos a preparação.</p>`
    ),
  };
}

export function paymentApprovedEmail(name: string, orderNumber: string) {
  return {
    subject: `Pagamento aprovado — pedido ${orderNumber}`,
    html: layout(
      `Pagamento confirmado! ✅`,
      `<p>Olá, ${name}. O pagamento do pedido <strong>${orderNumber}</strong> foi aprovado e já estamos preparando seu pedido.</p>`
    ),
  };
}

export function orderShippedEmail(name: string, orderNumber: string, trackingCode?: string | null) {
  return {
    subject: `Pedido ${orderNumber} enviado`,
    html: layout(
      `Seu pedido está a caminho! 📦`,
      `<p>Olá, ${name}. O pedido <strong>${orderNumber}</strong> foi enviado.</p>
       ${trackingCode ? `<p>Código de rastreamento: <strong>${trackingCode}</strong></p>` : ""}`
    ),
  };
}

export function orderDeliveredEmail(name: string, orderNumber: string) {
  return {
    subject: `Pedido ${orderNumber} entregue`,
    html: layout(
      `Pedido entregue! 🎉`,
      `<p>Olá, ${name}. O pedido <strong>${orderNumber}</strong> foi entregue. Esperamos que aproveite sua compra — avalie os produtos na sua área "Meus pedidos".</p>`
    ),
  };
}

export function orderCancelledEmail(name: string, orderNumber: string, reason?: string | null) {
  return {
    subject: `Pedido ${orderNumber} cancelado`,
    html: layout(
      `Pedido cancelado`,
      `<p>Olá, ${name}. O pedido <strong>${orderNumber}</strong> foi cancelado.${reason ? ` Motivo: ${reason}` : ""}</p>`
    ),
  };
}
