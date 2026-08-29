import { MockGateway } from "./mock-gateway";
import type { PaymentGateway } from "./types";

export * from "./types";

/**
 * Payment gateway factory. Reads PAYMENT_PROVIDER from the environment.
 *
 * Supported values: "mock" (default), "mercadopago", "asaas", "stripe", "pagbank".
 * Real providers are stubbed here — they throw a descriptive error until the
 * corresponding API keys are set, so the checkout flow keeps working in
 * development/demo mode without any external credentials. To activate a real
 * gateway in production: set PAYMENT_PROVIDER and the provider's API key
 * env vars (see .env.example), then implement the PaymentGateway interface
 * for that provider following the same shape as MockGateway.
 */
export function getPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();

  switch (provider) {
    case "mock":
      return new MockGateway();
    case "mercadopago":
    case "asaas":
    case "stripe":
    case "pagbank":
      if (!hasCredentialsFor(provider)) {
        console.warn(
          `[payments] PAYMENT_PROVIDER=${provider} mas as credenciais não foram configuradas. Usando MockGateway como fallback.`
        );
        return new MockGateway();
      }
      throw new Error(
        `Gateway "${provider}" está configurado mas a implementação real ainda não foi conectada. Implemente lib/payments/${provider}-gateway.ts seguindo a interface PaymentGateway.`
      );
    default:
      return new MockGateway();
  }
}

function hasCredentialsFor(provider: string): boolean {
  switch (provider) {
    case "mercadopago":
      return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
    case "asaas":
      return !!process.env.ASAAS_API_KEY;
    case "stripe":
      return !!process.env.STRIPE_SECRET_KEY;
    case "pagbank":
      return !!process.env.PAGBANK_TOKEN;
    default:
      return false;
  }
}
