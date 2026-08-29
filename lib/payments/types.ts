export type PaymentMethodType = "PIX" | "CREDIT_CARD" | "BOLETO";

export interface CreateChargeInput {
  orderId: string;
  orderNumber: string;
  amount: number; // BRL, in reais (not cents)
  method: PaymentMethodType;
  installments?: number;
  customer: {
    id: string;
    name: string;
    email: string;
    document?: string | null;
  };
  card?: {
    number: string;
    holderName: string;
    expiry: string; // MM/YY
    cvv: string;
  };
}

export interface ChargeResult {
  externalId: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "DECLINED";
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  cardLast4?: string;
  cardBrand?: string;
  raw?: Record<string, unknown>;
}

export interface WebhookParseResult {
  eventId: string;
  externalId: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "DECLINED" | "REFUNDED" | "CANCELLED";
  eventType: string;
}

export interface PaymentGateway {
  provider: string;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  /** Validates the webhook signature and normalizes the payload. Throws on invalid signature. */
  parseWebhook(rawBody: string, signatureHeader: string | null): WebhookParseResult;
}
