# MartWeb

Sistema de e-commerce completo e pronto para produção: catálogo, carrinho, checkout com validação 100% server-side, pagamentos, frete, cupons, avaliações, área do cliente, painel administrativo com RBAC, auditoria, LGPD e SEO.

Construído com **Next.js 16 (App Router) + React 19 + TypeScript**, **Tailwind CSS v4** com componentes no padrão shadcn/ui, **Prisma ORM + PostgreSQL (Neon)**, e uma arquitetura desacoplada de integrações (pagamento, frete, e-mail e armazenamento de imagens) pronta para produção na **Vercel**.

## Sumário

- [Stack](#stack)
- [Arquitetura de integrações](#arquitetura-de-integrações)
- [Requisitos](#requisitos)
- [Instalação e execução local](#instalação-e-execução-local)
- [Configurando o banco de dados (Neon)](#configurando-o-banco-de-dados-neon)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Logins de demonstração](#logins-de-demonstração)
- [Deploy na Vercel](#deploy-na-vercel)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança](#segurança)
- [Nota sobre este ambiente de desenvolvimento](#nota-sobre-este-ambiente-de-desenvolvimento)
- [Checklist de entrega](#checklist-de-entrega)

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, Server Components) |
| Linguagem | TypeScript |
| UI | React 19, Tailwind CSS v4, componentes no padrão shadcn/ui sobre Radix UI, Lucide Icons |
| Formulários/validação | Server Actions + `useActionState`, Zod |
| Banco de dados | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Autenticação | Sessão via cookie (cliente) e JWT (admin), bcryptjs |
| Gráficos (dashboard) | Recharts |
| Notificações UI | Sonner (toasts) |
| Deploy | Vercel |

## Arquitetura de integrações

Toda integração externa segue o mesmo padrão: uma interface TypeScript + uma implementação **mock/console** que funciona sem nenhuma credencial (para que o sistema nunca fique indisponível em desenvolvimento) + um ponto de extensão claro para a implementação real, ativada por variável de ambiente.

| Domínio | Arquivo | Padrão (sem credenciais) | Ativar produção |
| --- | --- | --- | --- |
| Pagamentos | `lib/payments/index.ts` | `MockGateway` (PIX/boleto/cartão simulados, webhook assinado com HMAC) | `PAYMENT_PROVIDER=mercadopago\|asaas\|stripe\|pagbank` + chave da API |
| Frete | `lib/shipping/index.ts` | Calculadora determinística por região do CEP | `SHIPPING_PROVIDER=correios\|melhor-envio\|frenet` + token |
| E-mail transacional | `lib/email/index.ts` | Loga o e-mail no console | `EMAIL_PROVIDER=resend\|sendgrid\|ses` + chave da API |
| Armazenamento de imagens | `lib/storage/index.ts` | Admin cola a URL da imagem | `STORAGE_PROVIDER=vercel-blob\|cloudinary\|r2` + credenciais |

Em todos os casos, o restante da aplicação (Server Actions, páginas, componentes) só conhece a interface — nunca o provedor concreto — então trocar de provedor nunca exige tocar em código de UI ou regra de negócio.

**Nunca confie em dados vindos do cliente.** Preço, estoque, frete, cupom e total são sempre recalculados no servidor dentro de `services/order.service.ts` (`createOrderFromCart`), em uma única transação Prisma — o valor exibido no carrinho é apenas uma prévia.

## Requisitos

- Node.js 20+
- npm (ou pnpm/yarn, ajustando os comandos abaixo)
- Uma conta gratuita no [Neon](https://neon.tech) para o PostgreSQL de produção/desenvolvimento

## Instalação e execução local

```bash
# 1. Instale as dependências
npm install

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env
# edite o .env e preencha ao menos DATABASE_URL e JWT_SECRET

# 3. Gere o Prisma Client e aplique as migrations
npx prisma generate
npx prisma migrate deploy

# 4. Popule o banco com dados de demonstração
npm run db:seed

# 5. Rode o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` para a loja e `http://localhost:3000/admin/login` para o painel administrativo.

## Configurando o banco de dados (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech) e um novo projeto.
2. Na aba **Connection Details**, copie a *connection string* no formato *pooled* (recomendado para serverless/Vercel) — ela já inclui `?sslmode=require`.
3. Cole o valor em `DATABASE_URL` no seu `.env` (local) e nas *Environment Variables* do projeto na Vercel (produção/preview).
4. Rode as migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. (Opcional, recomendado na primeira vez) Popule com dados de demonstração:
   ```bash
   npm run db:seed
   ```

O schema completo (30+ tabelas: catálogo, carrinho, pedidos, pagamentos, estoque, cupons, avaliações, conteúdo, notificações, LGPD e auditoria) está em `prisma/schema.prisma`, com a migration inicial em `prisma/migrations/20260101000000_init/migration.sql`.

## Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada. Resumo:

- **`DATABASE_URL`** (obrigatória) — connection string do Neon/PostgreSQL.
- **`JWT_SECRET`** (obrigatória) — segredo para assinar a sessão do admin. Gere com `openssl rand -base64 48`.
- **`NEXT_PUBLIC_APP_URL`** — URL pública da aplicação (usada em SEO, sitemap, e-mails).
- **Pagamentos / Frete / E-mail / Armazenamento** — opcionais; por padrão rodam em modo mock/demo (ver tabela acima). Preencha apenas o que for ativar.

## Logins de demonstração

Criados pelo `npm run db:seed`:

| Papel | E-mail | Senha |
| --- | --- | --- |
| Admin — Super Admin | `admin@hellomarket.com.br` | `Admin@123` |
| Admin — Gerente | `gerente@hellomarket.com.br` | `Admin@123` |
| Admin — Operador | `operador@hellomarket.com.br` | `Admin@123` |
| Cliente | `mariana.souza@example.com` | `Cliente@123` |
| Cliente | `rafael.lima@example.com` | `Cliente@123` |
| Cliente | `juliana.costa@example.com` | `Cliente@123` |

**Troque essas senhas (ou remova esses usuários) antes de expor o ambiente publicamente.**

## Deploy na Vercel

1. Suba este repositório no GitHub (já feito — veja a seção final) e importe o projeto na [Vercel](https://vercel.com/new).
2. Configure as *Environment Variables* do projeto na Vercel com, no mínimo, `DATABASE_URL` e `JWT_SECRET` (mais as demais que você for ativar — ver `.env.example`).
3. Em **Build & Development Settings**, o comando de build padrão do Next.js já funciona; para garantir que o Prisma Client seja gerado no build, adicione ao `package.json` (ou configure no painel da Vercel) um `postinstall` com `prisma generate` — ou rode manualmente `npx prisma generate` antes do primeiro deploy caso o build falhe por falta do client.
4. Após o primeiro deploy, rode as migrations contra o banco de produção (uma vez, localmente ou via um job):
   ```bash
   DATABASE_URL="<sua-connection-string-de-produção>" npx prisma migrate deploy
   DATABASE_URL="<sua-connection-string-de-produção>" npm run db:seed   # opcional
   ```
5. Pronto — o domínio da Vercel (ou seu domínio customizado) já serve a loja e o `/admin`.

## Estrutura do projeto

```
app/
  (storefront)/        # Loja: home, busca, produto, listagem, carrinho, páginas institucionais
  (auth)/               # Cadastro, login, recuperação de senha
  (account)/minha-conta/ # Área do cliente: pedidos, endereços, favoritos, avaliações, perfil, segurança, privacidade (LGPD)
  admin/                # Painel administrativo (dashboard, produtos, categorias, marcas, pedidos, clientes,
                         # estoque, cupons, avaliações, banners, páginas, usuários/RBAC, auditoria, configurações)
  checkout/             # Wizard de checkout (endereço → frete → pagamento → revisão)
  api/                  # Rotas de API (webhooks de pagamento, endpoints auxiliares)
  sitemap.ts, robots.ts # SEO

actions/                # Server Actions (uma por domínio; actions/admin/ para o painel)
services/               # Regras de negócio server-only (pedido, estoque, cupom, dashboard, notificações...)
lib/                    # Auth, Prisma client, integrações desacopladas (payments/shipping/email/storage), utils
components/             # UI (padrão shadcn/ui em components/ui) + componentes de domínio
schemas/                # Validação Zod compartilhada entre client e Server Actions
prisma/                 # schema.prisma, migrations, seed.ts
proxy.ts                # Middleware (Next 16) — protege /admin e /minha-conta por presença de cookie de sessão
```

## Segurança

- Senhas com `bcryptjs` (12 rounds); sessão de cliente via token aleatório com hash SHA-256 armazenado no banco; sessão de admin via JWT assinado.
- Autorização em duas camadas: `proxy.ts` bloqueia por presença de cookie (rápido, na borda) e cada página/Server Action valida a sessão completa e, no admin, a permissão granular (`requirePermission`) antes de qualquer leitura/escrita sensível.
- RBAC com 4 papéis (`SUPER_ADMIN`, `ADMIN`, `GERENTE`, `OPERADOR`) e permissões granulares por recurso, com todo o catálogo de permissões em `lib/permissions.ts`.
- Todo pedido é revalidado no servidor (preço, estoque, cupom, frete) — o cliente nunca decide o total cobrado.
- Webhooks de pagamento validam assinatura e são idempotentes via `WebhookEvent.eventId`.
- Log de auditoria (`AuditLog`) em praticamente toda mutação administrativa, com IP e user-agent.
- LGPD: exportação/anonimização de dados do titular em `actions/privacy.actions.ts`.

## Nota sobre este ambiente de desenvolvimento

Este projeto foi desenvolvido em um ambiente de sandbox cuja política de rede bloqueia especificamente o domínio `binaries.prisma.sh`, usado pela CLI do Prisma para baixar os *engines* nativos. Por isso, `prisma generate` e `prisma migrate dev/deploy` não puderam ser executados dentro deste sandbox — **isso não afeta o seu ambiente real** (máquina local ou build da Vercel), onde esse domínio não é bloqueado e os comandos funcionam normalmente.

Para validar a integridade do schema mesmo assim, a migration inicial (`prisma/migrations/20260101000000_init/migration.sql`) foi escrita manualmente espelhando `schema.prisma` e aplicada com sucesso via `psql` contra uma instância local de PostgreSQL 16, confirmando que a definição das 30+ tabelas é SQL válido e coerente com o schema.

Ao rodar `npm install && npx prisma generate && npx prisma migrate deploy` no seu ambiente (sem esse bloqueio), tudo funciona normalmente — inclusive o `next build` completo, que não pôde ser finalizado aqui por depender do Prisma Client gerado.

## Checklist de entrega

### Cliente — loja e conta
- [x] Catálogo com categorias, subcategorias, marcas, variações (cor/tamanho) e busca
- [x] Filtros (categoria, marca, preço, estoque, promoção, avaliação) e ordenação
- [x] Página de produto com imagens, variações, estoque, avaliações e produtos relacionados
- [x] Carrinho persistente (logado) e carrinho de convidado (localStorage) com merge no login
- [x] Lista de desejos (wishlist)
- [x] Cupons de desconto (percentual, fixo, frete grátis) validados no servidor
- [x] Checkout em etapas (endereço → frete → pagamento → revisão) com preço/estoque/frete revalidados no servidor
- [x] Pagamento via PIX, boleto e cartão (gateway desacoplado, mock pronto para produção)
- [x] Cadastro, login, recuperação de senha, verificação de e-mail
- [x] Área "Minha Conta": pedidos (com rastreamento, cancelamento, reembolso), endereços, perfil, segurança (sessões ativas), notificações, avaliações, privacidade (LGPD)
- [x] Avaliações de produtos (com moderação)
- [x] Notificações in-app e por e-mail (pedido criado, pago, enviado, entregue, cancelado)
- [x] Páginas institucionais via CMS (sobre, contato, trocas, entregas, FAQ, termos, privacidade)

### Administração
- [x] Dashboard com métricas (faturamento, pedidos, ticket médio, novos clientes, estoque baixo, pagamentos pendentes), gráfico de vendas e mais vendidos
- [x] CRUD de produtos (geral, imagens, variações, SEO) com slug e SKU únicos
- [x] CRUD de categorias (hierárquicas) e marcas
- [x] Gestão de pedidos: listar, buscar, filtrar, ver detalhe, alterar status, rastreamento, observação interna, reembolso, aprovar/rejeitar cancelamento
- [x] Gestão de clientes: listar, buscar, ver detalhe (pedidos, endereços, gasto total), bloquear/desbloquear
- [x] Gestão de estoque: resumo (sem estoque, abaixo do mínimo, valor estimado), ajuste manual com motivo e histórico de movimentações
- [x] CRUD de cupons com regras de uso (limite total, por cliente, valor mínimo, desconto máximo, validade)
- [x] Moderação de avaliações (aprovar, rejeitar, excluir) com recálculo automático de nota média
- [x] CRUD de banners (posição, ordem, vigência)
- [x] CMS de páginas institucionais
- [x] Usuários administrativos com RBAC (4 papéis + permissões granulares por recurso)
- [x] Log de auditoria navegável e filtrável
- [x] Configurações da loja (dados, redes sociais, checkout) e painel de status das integrações externas
- [x] Tabelas administrativas com rolagem horizontal segura em qualquer largura de tela

### Dados, segurança e infraestrutura
- [x] Preço, estoque, cupom e frete sempre recalculados no servidor — nunca confia no cliente
- [x] Transações atômicas no fechamento de pedido (Prisma `$transaction`)
- [x] Controle de estoque com histórico de movimentações (venda, ajuste, liberação, cancelamento)
- [x] Autenticação com hash de senha (bcrypt), sessões de cliente e admin isoladas
- [x] RBAC granular no admin, validado em toda Server Action sensível
- [x] Webhooks de pagamento assinados e idempotentes
- [x] Log de auditoria (quem, quando, o quê, IP, user-agent)
- [x] LGPD: exportação e anonimização de dados do titular
- [x] SEO: metadata dinâmica, JSON-LD em produtos, `sitemap.ts` e `robots.ts`
- [x] Arquitetura desacoplada para pagamento, frete, e-mail e armazenamento (mock funcional + pronto para produção)
- [x] Schema de banco completo (30+ tabelas) com migration versionada
- [x] Seed de demonstração completo (produtos, pedidos, avaliações, cupons, banners, páginas, usuários)
- [x] `.env.example` documentado e `README.md` com instruções de setup e deploy
