/**
 * Hello Market — database seed script.
 *
 * Populates a freshly migrated database with realistic demo data so the
 * storefront and admin panel are never empty: categories, brands, products
 * (with images, variants, promotions and an out-of-stock item), coupons,
 * banners, institutional CMS pages, store settings, demo customers with
 * addresses and orders (in different statuses, with reviews on delivered
 * items), and admin users covering every RBAC role.
 *
 * Run with: npm run db:seed  (uses tsx, see package.json "prisma.seed")
 */
import { PrismaClient, type OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding Hello Market...");

  // -------------------------------------------------------------------
  // Admin users (RBAC — one per role)
  // -------------------------------------------------------------------
  const adminPasswordHash = await hash("Admin@123");
  await prisma.adminUser.createMany({
    data: [
      { name: "Ana Superadmin", email: "admin@hellomarket.com.br", passwordHash: adminPasswordHash, role: "SUPER_ADMIN" },
      { name: "Bruno Gerente", email: "gerente@hellomarket.com.br", passwordHash: adminPasswordHash, role: "GERENTE" },
      { name: "Carla Operadora", email: "operador@hellomarket.com.br", passwordHash: adminPasswordHash, role: "OPERADOR" },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ Admin users");

  // -------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------
  const categoryDefs = [
    { name: "Eletrônicos", slug: "eletronicos", description: "Smartphones, notebooks, fones e acessórios de tecnologia.", imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800" },
    { name: "Moda", slug: "moda", description: "Roupas, calçados e acessórios para todos os estilos.", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800" },
    { name: "Casa e Decoração", slug: "casa-e-decoracao", description: "Tudo para deixar sua casa mais bonita e funcional.", imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800" },
    { name: "Esporte e Lazer", slug: "esporte-e-lazer", description: "Equipamentos e roupas para sua rotina ativa.", imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800" },
    { name: "Beleza e Cuidados", slug: "beleza-e-cuidados", description: "Cosméticos, perfumes e itens de cuidado pessoal.", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800" },
  ];
  const categories = new Map<string, string>();
  for (const [i, c] of categoryDefs.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, order: i },
    });
    categories.set(c.slug, created.id);
  }
  console.log("  ✓ Categories");

  // -------------------------------------------------------------------
  // Brands
  // -------------------------------------------------------------------
  const brandDefs = [
    { name: "Nord", slug: "nord", description: "Eletrônicos com design escandinavo minimalista.", logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200" },
    { name: "Aurora", slug: "aurora", description: "Moda contemporânea e sustentável.", logoUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200" },
    { name: "Vetra", slug: "vetra", description: "Casa, esporte e bem-estar para o dia a dia.", logoUrl: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=200" },
  ];
  const brands = new Map<string, string>();
  for (const b of brandDefs) {
    const created = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
    brands.set(b.slug, created.id);
  }
  console.log("  ✓ Brands");

  // -------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------
  interface ProductDef {
    name: string;
    slug: string;
    sku: string;
    shortDescription: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    categorySlug: string;
    brandSlug: string;
    featured?: boolean;
    tags: string[];
    images: string[];
    variants?: { sku: string; name: string; options: Record<string, string>; stock: number; price?: number }[];
  }

  const productDefs: ProductDef[] = [
    { name: "Smartphone Nord X12 128GB", slug: "smartphone-nord-x12-128gb", sku: "ELE-001", shortDescription: "Tela AMOLED 6.5\", câmera tripla 64MP, 128GB.", description: "O Nord X12 traz desempenho de sobra para o dia a dia, com bateria de longa duração e câmera tripla de 64MP para fotos profissionais direto do bolso.", price: 1899.9, compareAtPrice: 2199.9, stock: 42, categorySlug: "eletronicos", brandSlug: "nord", featured: true, tags: ["smartphone", "celular", "5g"], images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000", "https://images.unsplash.com/photo-1592286927505-1def25115558?w=1000"], variants: [
      { sku: "ELE-001-PRETO", name: "Preto", options: { Cor: "Preto" }, stock: 20 },
      { sku: "ELE-001-AZUL", name: "Azul", options: { Cor: "Azul" }, stock: 22 },
    ] },
    { name: "Notebook Nord Slim 14\" i5 16GB", slug: "notebook-nord-slim-14-i5-16gb", sku: "ELE-002", shortDescription: "Intel i5, 16GB RAM, SSD 512GB, tela Full HD.", description: "Leve, rápido e silencioso — ideal para trabalho, estudo e streaming, com bateria para o dia inteiro.", price: 3799.0, stock: 15, categorySlug: "eletronicos", brandSlug: "nord", featured: true, tags: ["notebook", "computador"], images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1000"] },
    { name: "Fone de Ouvido Bluetooth Nord Air", slug: "fone-bluetooth-nord-air", sku: "ELE-003", shortDescription: "Cancelamento de ruído ativo, 30h de bateria.", description: "Som imersivo com cancelamento ativo de ruído e case de carregamento compacto.", price: 349.9, compareAtPrice: 429.9, stock: 80, categorySlug: "eletronicos", brandSlug: "nord", tags: ["fone", "audio", "bluetooth"], images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000"] },
    { name: "Smartwatch Nord Fit 2", slug: "smartwatch-nord-fit-2", sku: "ELE-004", shortDescription: "Monitor cardíaco, GPS integrado, à prova d'água.", description: "Acompanhe seus treinos, sono e saúde com o Nord Fit 2, resistente à água até 50 metros.", price: 599.0, stock: 0, categorySlug: "eletronicos", brandSlug: "nord", tags: ["smartwatch", "fitness"], images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000"] },
    { name: "Caixa de Som Portátil Nord Boom", slug: "caixa-de-som-nord-boom", sku: "ELE-005", shortDescription: "Bluetooth, 20W RMS, resistente a respingos.", description: "Leve para qualquer lugar: som potente e grave forte em um design compacto e resistente.", price: 259.9, stock: 55, categorySlug: "eletronicos", brandSlug: "nord", tags: ["caixa de som", "bluetooth"], images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1000"] },

    { name: "Camiseta Aurora Essential", slug: "camiseta-aurora-essential", sku: "MOD-001", shortDescription: "100% algodão orgânico, corte unissex.", description: "Básica atemporal feita com algodão de origem sustentável e caimento confortável.", price: 89.9, stock: 120, categorySlug: "moda", brandSlug: "aurora", tags: ["camiseta", "basico"], images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000"], variants: [
      { sku: "MOD-001-P", name: "P", options: { Tamanho: "P" }, stock: 30 },
      { sku: "MOD-001-M", name: "M", options: { Tamanho: "M" }, stock: 40 },
      { sku: "MOD-001-G", name: "G", options: { Tamanho: "G" }, stock: 50 },
    ] },
    { name: "Calça Jeans Aurora Slim", slug: "calca-jeans-aurora-slim", sku: "MOD-002", shortDescription: "Modelagem slim, jeans premium com elastano.", description: "Conforto e estilo em uma peça essencial para o guarda-roupa, com lavagem exclusiva Aurora.", price: 219.9, compareAtPrice: 259.9, stock: 60, categorySlug: "moda", brandSlug: "aurora", featured: true, tags: ["calça", "jeans"], images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000"] },
    { name: "Jaqueta Corta-Vento Aurora", slug: "jaqueta-corta-vento-aurora", sku: "MOD-003", shortDescription: "Impermeável, leve e dobrável.", description: "Proteção contra vento e chuva leve sem abrir mão do estilo — dobra e cabe em qualquer mochila.", price: 279.0, stock: 34, categorySlug: "moda", brandSlug: "aurora", tags: ["jaqueta", "corta-vento"], images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1000"] },
    { name: "Tênis Aurora Runner", slug: "tenis-aurora-runner", sku: "MOD-004", shortDescription: "Amortecimento responsivo, cabedal respirável.", description: "Desenvolvido para o dia a dia urbano e corridas leves, com solado de alta durabilidade.", price: 349.9, stock: 48, categorySlug: "moda", brandSlug: "aurora", tags: ["tenis", "calçado"], images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000"], variants: [
      { sku: "MOD-004-38", name: "38", options: { Tamanho: "38" }, stock: 12 },
      { sku: "MOD-004-40", name: "40", options: { Tamanho: "40" }, stock: 18 },
      { sku: "MOD-004-42", name: "42", options: { Tamanho: "42" }, stock: 18 },
    ] },
    { name: "Bolsa Tote Aurora Canvas", slug: "bolsa-tote-aurora-canvas", sku: "MOD-005", shortDescription: "Lona resistente, alças reforçadas.", description: "Espaço de sobra para o dia a dia com um design minimalista que combina com tudo.", price: 129.9, stock: 70, categorySlug: "moda", brandSlug: "aurora", tags: ["bolsa", "acessorio"], images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000"] },

    { name: "Jogo de Panelas Vetra Inox 5 Peças", slug: "jogo-panelas-vetra-inox-5-pecas", sku: "CAS-001", shortDescription: "Aço inox, fundo triplo, vai ao forno.", description: "Distribuição uniforme de calor e acabamento antiaderente durável para o dia a dia na cozinha.", price: 449.0, compareAtPrice: 549.0, stock: 25, categorySlug: "casa-e-decoracao", brandSlug: "vetra", featured: true, tags: ["panela", "cozinha"], images: ["https://images.unsplash.com/photo-1584990347449-a7f6a44a8daf?w=1000"] },
    { name: "Luminária de Mesa Vetra Wood", slug: "luminaria-mesa-vetra-wood", sku: "CAS-002", shortDescription: "Base em madeira, luz regulável, USB.", description: "Design escandinavo com três temperaturas de luz e porta USB integrada para carregar o celular.", price: 159.9, stock: 40, categorySlug: "casa-e-decoracao", brandSlug: "vetra", tags: ["luminaria", "decoracao"], images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000"] },
    { name: "Jogo de Cama Vetra Percal 200 Fios", slug: "jogo-de-cama-vetra-percal-200-fios", sku: "CAS-003", shortDescription: "100% algodão percal, queen size, 4 peças.", description: "Toque macio e durabilidade para noites de sono mais confortáveis.", price: 219.9, stock: 38, categorySlug: "casa-e-decoracao", brandSlug: "vetra", tags: ["cama", "quarto"], images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000"] },
    { name: "Aspirador de Pó Vertical Vetra Clean", slug: "aspirador-vertical-vetra-clean", sku: "CAS-004", shortDescription: "Sem fio, 2 em 1, bateria 40min.", description: "Praticidade para limpar a casa toda sem se preocupar com fio ou tomada.", price: 599.0, stock: 18, categorySlug: "casa-e-decoracao", brandSlug: "vetra", tags: ["aspirador", "limpeza"], images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1000"] },
    { name: "Conjunto de Toalhas Vetra Spa 4 Peças", slug: "conjunto-toalhas-vetra-spa", sku: "CAS-005", shortDescription: "Algodão egípcio, alta absorção.", description: "Toque macio e absorção superior para transformar o banho em um momento spa.", price: 149.9, stock: 55, categorySlug: "casa-e-decoracao", brandSlug: "vetra", tags: ["toalha", "banheiro"], images: ["https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1000"] },

    { name: "Bicicleta Vetra Trail 21 Marchas", slug: "bicicleta-vetra-trail-21-marchas", sku: "ESP-001", shortDescription: "Aro 29, quadro alumínio, freio a disco.", description: "Pronta para trilhas leves e cidade, com câmbio de 21 marchas e freios a disco hidráulicos.", price: 1699.0, compareAtPrice: 1899.0, stock: 12, categorySlug: "esporte-e-lazer", brandSlug: "vetra", featured: true, tags: ["bicicleta", "trilha"], images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1000"] },
    { name: "Kit Halteres Vetra Ajustáveis 20kg", slug: "kit-halteres-vetra-ajustaveis-20kg", sku: "ESP-002", shortDescription: "Par de halteres reguláveis de 2 a 20kg.", description: "Treine em casa com um único par de halteres que substitui um jogo completo.", price: 389.9, stock: 30, categorySlug: "esporte-e-lazer", brandSlug: "vetra", tags: ["musculação", "halteres"], images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000"] },
    { name: "Tapete de Yoga Vetra Grip", slug: "tapete-de-yoga-vetra-grip", sku: "ESP-003", shortDescription: "Antiderrapante, 6mm, com bolsa.", description: "Conforto e estabilidade para práticas de yoga e pilates, com aderência mesmo em treinos intensos.", price: 99.9, stock: 90, categorySlug: "esporte-e-lazer", brandSlug: "vetra", tags: ["yoga", "pilates"], images: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000"] },

    { name: "Perfume Aurora Bloom 100ml", slug: "perfume-aurora-bloom-100ml", sku: "BEL-001", shortDescription: "Fragrância floral amadeirada, longa fixação.", description: "Notas de jasmim e sândalo em uma fragrância marcante para o dia a dia.", price: 229.9, stock: 45, categorySlug: "beleza-e-cuidados", brandSlug: "aurora", featured: true, tags: ["perfume", "fragrancia"], images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=1000"] },
    { name: "Kit Skincare Vetra Hidratação Profunda", slug: "kit-skincare-vetra-hidratacao", sku: "BEL-002", shortDescription: "Sérum, hidratante e protetor solar.", description: "Rotina completa de 3 passos para uma pele hidratada e protegida todos os dias.", price: 189.9, compareAtPrice: 229.9, stock: 50, categorySlug: "beleza-e-cuidados", brandSlug: "vetra", tags: ["skincare", "hidratante"], images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1000"] },
  ];

  const productIds = new Map<string, string>();
  for (const [i, p] of productDefs.entries()) {
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        minStock: 5,
        categoryId: categories.get(p.categorySlug),
        brandId: brands.get(p.brandSlug),
        tags: p.tags,
        featured: p.featured ?? false,
        status: "ACTIVE",
        soldCount: Math.floor(Math.random() * 150),
        viewCount: Math.floor(Math.random() * 800),
        images: { create: p.images.map((url, idx) => ({ url, order: idx, altText: p.name })) },
        variants: p.variants
          ? { create: p.variants.map((v) => ({ sku: v.sku, name: v.name, options: v.options, stock: v.stock, price: v.price ?? null })) }
          : undefined,
      },
    });
    productIds.set(p.slug, created.id);
    if ((i + 1) % 5 === 0) console.log(`  ✓ Products ${i + 1}/${productDefs.length}`);
  }
  console.log("  ✓ Products");

  // -------------------------------------------------------------------
  // Coupons
  // -------------------------------------------------------------------
  await prisma.coupon.createMany({
    data: [
      { code: "BEMVINDO10", description: "10% de desconto na primeira compra", type: "PERCENTAGE", value: 10, minOrderValue: 100, usageLimitPerUser: 1, status: "ACTIVE" },
      { code: "FRETEGRATIS", description: "Frete grátis em compras acima de R$150", type: "FREE_SHIPPING", value: 0, minOrderValue: 150, usageLimitPerUser: 2, status: "ACTIVE" },
      { code: "HM50OFF", description: "R$50 de desconto acima de R$400", type: "FIXED", value: 50, minOrderValue: 400, maxDiscountValue: 50, usageLimitPerUser: 1, status: "ACTIVE" },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ Coupons");

  // -------------------------------------------------------------------
  // Banners
  // -------------------------------------------------------------------
  await prisma.banner.createMany({
    data: [
      { title: "Ofertas de Eletrônicos", subtitle: "Até 20% OFF em smartphones e notebooks", imageUrlDesktop: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600", buttonText: "Ver ofertas", link: "/produtos?categoria=eletronicos", position: "home_hero", order: 0, active: true },
      { title: "Nova Coleção Aurora", subtitle: "Moda sustentável para todas as estações", imageUrlDesktop: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600", buttonText: "Conferir", link: "/produtos?categoria=moda", position: "home_hero", order: 1, active: true },
      { title: "Sua casa mais bonita", subtitle: "Decoração com até 15% OFF", imageUrlDesktop: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600", buttonText: "Explorar", link: "/produtos?categoria=casa-e-decoracao", position: "home_secondary", order: 0, active: true },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ Banners");

  // -------------------------------------------------------------------
  // CMS Pages
  // -------------------------------------------------------------------
  const pageDefs = [
    { slug: "sobre", title: "Sobre nós", content: "<p>A Hello Market nasceu para simplificar a forma como você compra online: catálogo selecionado, entrega rápida e um atendimento que resolve de verdade.</p><p>Somos uma equipe apaixonada por tecnologia e experiência do cliente, sempre buscando o melhor custo-benefício para você.</p>" },
    { slug: "contato", title: "Contato", content: "<p>Fale com a gente pelo e-mail <strong>contato@hellomarket.com.br</strong> ou pelo WhatsApp (11) 90000-0000.</p><p>Horário de atendimento: segunda a sexta, das 9h às 18h.</p>" },
    { slug: "trocas", title: "Trocas e devoluções", content: "<h2>Como funciona</h2><p>Você tem até 7 dias corridos após o recebimento para solicitar a troca ou devolução, conforme o Código de Defesa do Consumidor.</p><ul><li>Acesse Meus Pedidos e solicite o cancelamento ou troca</li><li>Nossa equipe entrará em contato para os próximos passos</li><li>O reembolso é processado após a confirmação do produto</li></ul>" },
    { slug: "entregas", title: "Entregas", content: "<p>Trabalhamos com múltiplas transportadoras para garantir o melhor prazo e custo de entrega para sua região.</p><p>O prazo estimado é calculado no carrinho a partir do seu CEP, e frete grátis é aplicado automaticamente acima do valor mínimo vigente.</p>" },
    { slug: "faq", title: "Perguntas frequentes", content: "<h2>Formas de pagamento</h2><p>Aceitamos PIX, boleto e cartão de crédito em até 12x.</p><h2>Como acompanho meu pedido?</h2><p>Acesse Meus Pedidos na sua conta para ver o status e o código de rastreamento.</p>" },
    { slug: "termos", title: "Termos de uso", content: "<p>Ao utilizar o site da Hello Market, você concorda com nossos termos de uso, que regulam o cadastro, as compras e a utilização da plataforma.</p><p>Reservamo-nos o direito de atualizar estes termos periodicamente.</p>" },
    { slug: "privacidade", title: "Política de privacidade", content: "<p>Respeitamos sua privacidade e tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p><p>Você pode solicitar a exportação ou exclusão dos seus dados a qualquer momento pela sua conta.</p>" },
  ];
  for (const p of pageDefs) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, published: true } });
  }
  console.log("  ✓ CMS pages");

  // -------------------------------------------------------------------
  // Store settings
  // -------------------------------------------------------------------
  await prisma.setting.createMany({
    data: [
      { key: "store.name", value: "Hello Market", group: "store" },
      { key: "store.email", value: "contato@hellomarket.com.br", group: "store" },
      { key: "store.phone", value: "(11) 4000-0000", group: "store" },
      { key: "store.whatsapp", value: "(11) 90000-0000", group: "store" },
      { key: "store.address", value: "Av. Paulista, 1000 — São Paulo, SP", group: "store" },
      { key: "store.social", value: { instagram: "https://instagram.com/hellomarket", facebook: "https://facebook.com/hellomarket" }, group: "social" },
      { key: "store.checkout", value: { guestCheckout: false, minOrderValue: 0, freeShippingThreshold: 299 }, group: "checkout" },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ Store settings");

  // -------------------------------------------------------------------
  // Demo customers
  // -------------------------------------------------------------------
  const customerPasswordHash = await hash("Cliente@123");
  const customerDefs = [
    { firstName: "Mariana", lastName: "Souza", email: "mariana.souza@example.com", phone: "(11) 98888-1111", document: "111.111.111-11" },
    { firstName: "Rafael", lastName: "Lima", email: "rafael.lima@example.com", phone: "(21) 97777-2222", document: "222.222.222-22" },
    { firstName: "Juliana", lastName: "Costa", email: "juliana.costa@example.com", phone: "(31) 96666-3333", document: "333.333.333-33" },
  ];

  const customers: { id: string; fullName: string }[] = [];
  for (const c of customerDefs) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        document: c.document,
        passwordHash: customerPasswordHash,
        emailVerifiedAt: new Date(),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        marketingOptIn: true,
      },
    });
    customers.push({ id: user.id, fullName: user.fullName });

    await prisma.address.upsert({
      where: { id: `seed-addr-${user.id}` },
      update: {},
      create: {
        id: `seed-addr-${user.id}`,
        userId: user.id,
        label: "Casa",
        type: "RESIDENTIAL",
        recipient: user.fullName,
        zipCode: "01310-100",
        street: "Av. Paulista",
        number: String(100 + customers.length),
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        isDefault: true,
      },
    });

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }
  console.log("  ✓ Demo customers");

  // -------------------------------------------------------------------
  // Demo orders (with items, payment, status history) + reviews
  // -------------------------------------------------------------------
  const allProductSlugs = Array.from(productIds.keys());

  async function createDemoOrder(
    customerId: string,
    recipientName: string,
    productSlugs: string[],
    status: "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED",
    orderSuffix: string
  ) {
    const address = await prisma.address.findFirst({ where: { userId: customerId } });
    if (!address) return null;

    const items = await Promise.all(
      productSlugs.map(async (slug) => {
        const product = await prisma.product.findUniqueOrThrow({ where: { id: productIds.get(slug) } });
        const quantity = 1 + Math.floor(Math.random() * 2);
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          imageUrl: null,
          unitPrice: product.price,
          quantity,
          totalPrice: Number(product.price) * quantity,
        };
      })
    );

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingCost = subtotal >= 299 ? 0 : 19.9;
    const total = subtotal + shippingCost;

    const order = await prisma.order.create({
      data: {
        orderNumber: `HM26${orderSuffix}`,
        userId: customerId,
        addressId: address.id,
        addressSnapshot: {
          recipient: recipientName,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        status,
        subtotal,
        discount: 0,
        shippingCost,
        total,
        shippingMethod: "Entrega Econômica",
        shippingDays: 5,
        carrier: status === "SHIPPED" || status === "DELIVERED" ? "Hello Log" : null,
        trackingCode: status === "SHIPPED" || status === "DELIVERED" ? `BR${orderSuffix}HM` : null,
        paidAt: new Date(),
        shippedAt: status === "SHIPPED" || status === "DELIVERED" ? new Date() : null,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
        items: { create: items },
        payments: {
          create: {
            method: "PIX",
            provider: "MOCK",
            status: "APPROVED",
            amount: total,
            paidAt: new Date(),
          },
        },
        statusHistory: {
          create: (() => {
            const history: { status: OrderStatus; note: string }[] = [
              { status: "PENDING", note: "Pedido criado" },
              { status: "PAID", note: "Pagamento aprovado" },
            ];
            if (status === "PROCESSING" || status === "SHIPPED" || status === "DELIVERED") {
              history.push({ status: "PROCESSING", note: "Em preparação" });
            }
            if (status === "SHIPPED" || status === "DELIVERED") {
              history.push({ status: "SHIPPED", note: "Pedido enviado" });
            }
            if (status === "DELIVERED") {
              history.push({ status: "DELIVERED", note: "Pedido entregue" });
            }
            return history;
          })(),
        },
      },
      include: { items: true },
    });

    // Bump soldCount for realism
    for (const item of items) {
      await prisma.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.quantity } } });
    }

    return order;
  }

  const orderPlan: { customerIdx: number; slugs: string[]; status: "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" }[] = [
    { customerIdx: 0, slugs: [allProductSlugs[0], allProductSlugs[5]], status: "DELIVERED" },
    { customerIdx: 0, slugs: [allProductSlugs[2]], status: "SHIPPED" },
    { customerIdx: 1, slugs: [allProductSlugs[9], allProductSlugs[10]], status: "DELIVERED" },
    { customerIdx: 1, slugs: [allProductSlugs[15]], status: "PROCESSING" },
    { customerIdx: 2, slugs: [allProductSlugs[18], allProductSlugs[19]], status: "DELIVERED" },
    { customerIdx: 2, slugs: [allProductSlugs[6]], status: "PAID" },
  ];

  const deliveredOrders: { customerId: string; productId: string; orderId: string }[] = [];

  for (const [idx, plan] of orderPlan.entries()) {
    const customer = customers[plan.customerIdx];
    const order = await createDemoOrder(customer.id, customer.fullName, plan.slugs, plan.status, String(1000 + idx));
    if (order && plan.status === "DELIVERED") {
      for (const item of order.items) {
        deliveredOrders.push({ customerId: customer.id, productId: item.productId, orderId: order.id });
      }
    }
  }
  console.log("  ✓ Demo orders");

  // -------------------------------------------------------------------
  // Reviews on delivered items
  // -------------------------------------------------------------------
  const reviewTexts = [
    { rating: 5, title: "Excelente!", comment: "Produto chegou rápido e é exatamente como descrito. Recomendo muito." },
    { rating: 4, title: "Muito bom", comment: "Qualidade acima da média, só achei o prazo de entrega um pouco longo." },
    { rating: 5, title: "Superou expectativas", comment: "Já é o segundo que compro, sempre ótima experiência." },
  ];

  for (const [i, d] of deliveredOrders.entries()) {
    const review = reviewTexts[i % reviewTexts.length];
    await prisma.review.upsert({
      where: { productId_userId_orderId: { productId: d.productId, userId: d.customerId, orderId: d.orderId } },
      update: {},
      create: {
        productId: d.productId,
        userId: d.customerId,
        orderId: d.orderId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        status: "APPROVED",
      },
    });
  }

  // Recalculate avgRating/reviewCount for every product that received a review
  const reviewedProductIds = Array.from(new Set(deliveredOrders.map((d) => d.productId)));
  for (const productId of reviewedProductIds) {
    const agg = await prisma.review.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: productId },
      data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
    });
  }
  console.log("  ✓ Reviews");

  console.log("✅ Seed completed successfully.");
  console.log("\nDemo logins:");
  console.log("  Admin (Super Admin): admin@hellomarket.com.br / Admin@123");
  console.log("  Admin (Gerente):     gerente@hellomarket.com.br / Admin@123");
  console.log("  Admin (Operador):    operador@hellomarket.com.br / Admin@123");
  console.log("  Cliente:             mariana.souza@example.com / Cliente@123");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
