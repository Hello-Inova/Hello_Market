import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
  );
}

function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
  );
}

function Youtube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
  );
}

interface FooterProps {
  storeName: string;
  companySlug: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  social?: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string };
}

// Fundo escuro fixo (não segue --primary/--secondary da empresa) — o
// contraste com uma cor de marca qualquer é imprevisível, então o rodapé do
// redesign usa um preto neutro sempre, com --primary só como um toque de
// destaque nos links/ícones sociais (ver comentário em storefrontThemeStyle).
export function Footer({ storeName, companySlug, email, phone, address, social }: FooterProps) {
  const base = `/loja/${companySlug}`;
  return (
    <footer className="mt-16 bg-neutral-950 text-white">
      <div className="container-page grid grid-cols-2 gap-10 py-12 md:grid-cols-4 md:py-16">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-serif text-xl font-bold tracking-tight">{storeName}</h3>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
            Sua loja online completa: milhares de produtos, entrega rápida e pagamento seguro.
          </p>
          <div className="mt-5 flex gap-2">
            {social?.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {social?.facebook && (
              <a
                href={social.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {social?.youtube && (
              <a
                href={social.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
              >
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Institucional</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li><Link href={`${base}/paginas/sobre`} className="transition-colors hover:text-white">Sobre nós</Link></li>
            <li><Link href={`${base}/paginas/contato`} className="transition-colors hover:text-white">Contato</Link></li>
            <li><Link href={`${base}/paginas/trocas`} className="transition-colors hover:text-white">Trocas e devoluções</Link></li>
            <li><Link href={`${base}/paginas/entregas`} className="transition-colors hover:text-white">Entregas</Link></li>
            <li><Link href={`${base}/paginas/faq`} className="transition-colors hover:text-white">Perguntas frequentes</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Sua conta</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li><Link href={`${base}/minha-conta/pedidos`} className="transition-colors hover:text-white">Meus pedidos</Link></li>
            <li><Link href={`${base}/minha-conta/favoritos`} className="transition-colors hover:text-white">Favoritos</Link></li>
            <li><Link href={`${base}/paginas/termos`} className="transition-colors hover:text-white">Termos de uso</Link></li>
            <li><Link href={`${base}/paginas/privacidade`} className="transition-colors hover:text-white">Política de privacidade</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Fale conosco</p>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            {email && (
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {email}</li>
            )}
            {phone && (
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {phone}</li>
            )}
            {address && (
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {address}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-page flex flex-col justify-between gap-2 text-xs text-white/45 md:flex-row md:items-center">
          <p>Uma experiência de compra simples e segura.</p>
          <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
