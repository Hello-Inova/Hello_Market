/**
 * Cliente da API dos Correios (https://api.correios.com.br) para consulta de
 * PRAZO de entrega — não de preço (o preço da entrega continua calculado
 * pelo estimador mock em lib/shipping/index.ts, já que isso depende de um
 * contrato comercial ativo de postagem, que não faz parte desta integração).
 *
 * Segue o mesmo padrão de "provider pronto pra conectar" usado no restante
 * do projeto (Asaas, storage etc.): sem as credenciais configuradas, toda
 * função aqui retorna `null` silenciosamente (nunca lança erro), e quem
 * chama cai de volta no cálculo mock. Isso mantém o checkout funcionando
 * mesmo sem contrato ativo com os Correios.
 *
 * Credenciais necessárias (variáveis de ambiente):
 * - CORREIOS_USUARIO: usuário do contrato (CNPJ ou login do Meu Correios).
 * - CORREIOS_CODIGO_ACESSO: código de acesso à API, gerado no portal dos
 *   Correios (Meu Correios > Meus Cartões de Postagem > API).
 * - CORREIOS_CARTAO_POSTAGEM: número do cartão de postagem vinculado ao
 *   contrato, exigido para autenticação.
 * - CORREIOS_ORIGIN_ZIP: CEP de origem dos envios (o CEP do depósito/loja).
 *
 * Importante: a Rede dos Correios exige um contrato de postagem ativo (não
 * existe modo sandbox público). O contrato exato de autenticação e dos
 * endpoints abaixo segue a documentação pública da API dos Correios vigente
 * na época da implementação — vale revalidar contra a documentação atual
 * (https://cws.correios.com.br) antes de ativar em produção com credenciais
 * reais, caso os Correios tenham alterado o formato.
 */

const TOKEN_URL = "https://api.correios.com.br/token/v1/autentica/cartaopostagem";
const PRAZO_URL = "https://api.correios.com.br/prazo/v1/nacional";

// PAC e SEDEX — códigos de produto usados pela API de prazo dos Correios.
export const CORREIOS_PRODUTO = {
  PAC: "04510",
  SEDEX: "04014",
} as const;

let cachedToken: { value: string; expiresAt: number } | null = null;

function hasCredentials() {
  return !!(
    process.env.CORREIOS_USUARIO &&
    process.env.CORREIOS_CODIGO_ACESSO &&
    process.env.CORREIOS_CARTAO_POSTAGEM
  );
}

async function getCorreiosToken(): Promise<string | null> {
  if (!hasCredentials()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  try {
    const basicAuth = Buffer.from(
      `${process.env.CORREIOS_USUARIO}:${process.env.CORREIOS_CODIGO_ACESSO}`
    ).toString("base64");

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ numero: process.env.CORREIOS_CARTAO_POSTAGEM }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[correios] falha ao autenticar (HTTP ${res.status}); usando estimativa local.`);
      return null;
    }

    const data = (await res.json()) as { token?: string; expiraEm?: string };
    if (!data.token) return null;

    cachedToken = {
      value: data.token,
      // Renova com uma margem de segurança de 1 minuto antes da expiração
      // informada, ou usa um TTL curto (30 min) se a API não informar.
      expiresAt: data.expiraEm ? new Date(data.expiraEm).getTime() - 60_000 : Date.now() + 30 * 60_000,
    };
    return cachedToken.value;
  } catch (err) {
    console.warn("[correios] erro de rede ao autenticar; usando estimativa local.", err);
    return null;
  }
}

/**
 * Consulta o prazo de entrega (em dias úteis) para um produto dos Correios
 * (PAC ou SEDEX) entre a origem configurada e o CEP de destino informado.
 * Retorna `null` sempre que a integração não estiver disponível (sem
 * credenciais, erro de rede, resposta inesperada) — nunca lança.
 */
export async function getCorreiosPrazo(
  cepDestino: string,
  coProduto: string
): Promise<number | null> {
  const cepOrigem = process.env.CORREIOS_ORIGIN_ZIP;
  if (!cepOrigem) return null;

  const token = await getCorreiosToken();
  if (!token) return null;

  try {
    const destino = cepDestino.replace(/\D/g, "");
    const origem = cepOrigem.replace(/\D/g, "");
    const url = `${PRAZO_URL}/${coProduto}?cepOrigem=${origem}&cepDestino=${destino}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[correios] falha ao consultar prazo (HTTP ${res.status}); usando estimativa local.`);
      return null;
    }

    const data = (await res.json()) as { prazoEntrega?: number };
    return typeof data.prazoEntrega === "number" ? data.prazoEntrega : null;
  } catch (err) {
    console.warn("[correios] erro de rede ao consultar prazo; usando estimativa local.", err);
    return null;
  }
}
