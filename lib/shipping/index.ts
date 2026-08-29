import { getCorreiosPrazo, CORREIOS_PRODUTO } from "./correios";

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  days: number;
  carrier: string;
  /** true quando o prazo veio de uma consulta real aos Correios (não da estimativa mock). */
  realEstimate?: boolean;
}

export interface ShippingQuoteInput {
  zipCode: string;
  totalWeightKg: number;
  subtotal: number;
}

/**
 * Shipping calculator abstraction. Ships with a deterministic mock
 * calculator (distance-free, based on region derived from the CEP prefix)
 * so checkout works with zero external credentials. Set SHIPPING_PROVIDER
 * to "correios" | "melhor-envio" | "frenet" and the matching token to wire
 * up a real carrier — implement that branch calling the provider's API and
 * mapping its response into ShippingOption[].
 */
export async function getShippingOptions(
  input: ShippingQuoteInput
): Promise<ShippingOption[]> {
  const provider = (process.env.SHIPPING_PROVIDER || "mock").toLowerCase();

  if (provider === "melhor-envio" && process.env.MELHOR_ENVIO_TOKEN) {
    throw new Error(
      "Integração com Melhor Envio pronta para ativação: implemente a chamada à API em lib/shipping/index.ts."
    );
  }
  if (provider === "frenet" && process.env.FRENET_TOKEN) {
    throw new Error(
      "Integração com Frenet pronta para ativação: implemente a chamada à API em lib/shipping/index.ts."
    );
  }

  const options = mockShippingOptions(input);

  if (provider === "correios") {
    // Consulta o prazo real dos Correios para PAC (entrega econômica) e
    // SEDEX (entrega expressa); sem credenciais configuradas, ou em caso de
    // qualquer falha, cada chamada volta `null` e o prazo estimado (mock)
    // é mantido — o checkout nunca quebra por causa dessa consulta.
    const [pacPrazo, sedexPrazo] = await Promise.all([
      getCorreiosPrazo(input.zipCode, CORREIOS_PRODUTO.PAC),
      getCorreiosPrazo(input.zipCode, CORREIOS_PRODUTO.SEDEX),
    ]);

    const economic = options.find((o) => o.id === "economic");
    if (economic && pacPrazo !== null) {
      economic.days = pacPrazo;
      economic.carrier = "Correios (PAC)";
      economic.realEstimate = true;
    }
    const express = options.find((o) => o.id === "express");
    if (express && sedexPrazo !== null) {
      express.days = sedexPrazo;
      express.carrier = "Correios (SEDEX)";
      express.realEstimate = true;
    }
  }

  return options;
}

function mockShippingOptions(input: ShippingQuoteInput): ShippingOption[] {
  const region = regionFromZip(input.zipCode);
  const weightFactor = Math.max(1, input.totalWeightKg) * 2.5;
  const base = region === "sudeste" ? 14.9 : region === "sul" || region === "centro-oeste" ? 21.9 : 29.9;

  const freeShippingThreshold = 299;
  const economicPrice = input.subtotal >= freeShippingThreshold ? 0 : Math.round((base + weightFactor) * 100) / 100;

  return [
    {
      id: "economic",
      name: "Entrega Econômica",
      price: economicPrice,
      days: region === "sudeste" ? 5 : region === "sul" || region === "centro-oeste" ? 7 : 10,
      carrier: "Hello Log",
    },
    {
      id: "express",
      name: "Entrega Expressa",
      price: Math.round((base * 1.9 + weightFactor) * 100) / 100,
      days: region === "sudeste" ? 2 : 4,
      carrier: "Hello Log Express",
    },
    {
      id: "pickup",
      name: "Retirar em loja",
      price: 0,
      days: 1,
      carrier: "Loja MartWeb",
    },
  ];
}

function regionFromZip(zip: string): string {
  const prefix = parseInt(zip.replace(/\D/g, "").slice(0, 2), 10);
  if (prefix >= 1 && prefix <= 19) return "sudeste"; // SP
  if (prefix >= 20 && prefix <= 28) return "sudeste"; // RJ/ES
  if (prefix >= 29 && prefix <= 29) return "sudeste"; // ES
  if (prefix >= 30 && prefix <= 39) return "sudeste"; // MG
  if (prefix >= 40 && prefix <= 48) return "nordeste"; // BA
  if (prefix >= 80 && prefix <= 87) return "sul"; // PR
  if (prefix >= 88 && prefix <= 89) return "sul"; // SC
  if (prefix >= 90 && prefix <= 99) return "sul"; // RS
  if (prefix >= 70 && prefix <= 73) return "centro-oeste"; // DF
  return "outros";
}
