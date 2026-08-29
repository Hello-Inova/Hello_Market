import crypto from "crypto";
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentGateway,
  WebhookParseResult,
} from "./types";

/**
 * Development/demo gateway. Simulates PIX/Boleto/Cartão charges without
 * contacting any external provider. Swap PAYMENT_PROVIDER env var and
 * implement the PaymentGateway interface (see mercadopago-gateway.ts.example
 * pattern) to go live with a real processor.
 */
export class MockGateway implements PaymentGateway {
  provider = "MOCK";

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const externalId = `mock_${crypto.randomUUID()}`;

    if (input.method === "PIX") {
      const copyPaste = `00020126580014BR.GOV.BCB.PIX0136${externalId}5204000053039865406${input.amount.toFixed(2)}5802BR5913HELLO MARKET6009SAO PAULO62070503***6304`;
      return {
        externalId,
        status: "PENDING",
        pixQrCode: `data:image/svg+xml;base64,${Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#fff"/><text x="10" y="100" font-size="10">PIX QR (mock) ${externalId.slice(0, 12)}</text></svg>`
        ).toString("base64")}`,
        pixCopyPaste: copyPaste,
      };
    }

    if (input.method === "BOLETO") {
      return {
        externalId,
        status: "PENDING",
        boletoUrl: `https://mock-gateway.local/boleto/${externalId}.pdf`,
        boletoBarcode: "23793.38128 60000.000000 00000.000000 1 90000000010000",
      };
    }

    // CREDIT_CARD — simulate approval unless the card number ends in a specific test digit
    const last4 = input.card?.number?.replace(/\D/g, "").slice(-4) ?? "0000";
    const declined = last4 === "0002"; // test card to simulate a decline
    return {
      externalId,
      status: declined ? "DECLINED" : "APPROVED",
      cardLast4: last4,
      cardBrand: guessCardBrand(input.card?.number ?? ""),
    };
  }

  parseWebhook(rawBody: string, signatureHeader: string | null): WebhookParseResult {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "dev-webhook-secret";
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!signatureHeader || signatureHeader !== expected) {
      throw new Error("INVALID_SIGNATURE");
    }
    const payload = JSON.parse(rawBody) as {
      eventId: string;
      externalId: string;
      status: WebhookParseResult["status"];
      eventType: string;
    };
    return payload;
  }
}

function guessCardBrand(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Elo";
  return "Desconhecida";
}
