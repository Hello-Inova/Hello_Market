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
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  social?: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string };
}

export function Footer({ storeName, email, phone, address, social }: FooterProps) {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
    <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
  <div>
  <h3 className="mb-3 text-lg font-bold text-primary">{storeName}</h3>
  <p className="text-sm text-muted-foreground">
  Sua loja online completa: milhares de produtos, entrega rápida e pagamento seguro.
    </p>
  <div className="mt-4 flex gap-3">
  {social?.instagram && (
    <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
    <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" />
   </a>
   )}
  {social?.facebook && (
    <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
    <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" />
   </a>
   )}
  {social?.youtube && (
    <a href={social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
    <Youtube className="h-5 w-5 text-muted-foreground hover:text-primary" />
   </a>
   )}
  </div>
  </div>

<div>
  <h4 className="mb-3 text-sm font-semibold">Institucional</h4>
  <ul className="space-y-2 text-sm text-muted-foreground">
  <li><Link href="/paginas/sobre" className="hover:text-primary">Sobre nós</Link></li>
  <li><Link href="/paginas/contato" className="hover:text-primary">Contato</Link></li>
  <li><Link href="/paginas/trocas" className="hover:text-primary">Trocas e devoluções</Link></li>
  <li><Link href="/paginas/entregas" className="hover:text-primary">Entregas</Link></li>
  <li><Link href="/paginas/faq" className="hover:text-primary">Perguntas frequentes</Link></li>
  </ul>
  </div>

<div>
  <h4 className="mb-3 text-sm font-semibold">Sua conta</h4>
  <ul className="space-y-2 text-sm text-muted-foreground">
  <li><Link href="/minha-conta/pedidos" className="hover:text-primary">Meus pedidos</Link></li>
  <li><Link href="/minha-conta/favoritos" className="hover:text-primary">Favoritos</Link></li>
  <li><Link href="/paginas/termos" className="hover:text-primary">Termos de uso</Link></li>
  <li><Link href="/paginas/privacidade" className="hover:text-primary">Política de privacidade</Link></li>
  </ul>
  </div>

<div>
  <h4 className="mb-3 text-sm font-semibold">Fale conosco</h4>
  <ul className="space-y-2 text-sm text-muted-foreground">
  {email && (
    <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {email}</li>
   )}
  {phone && (
    <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {phone}</li>
   )}
  {address && (
    <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {address}</li>
   )}
  </ul>
  </div>
  </div>

<div className="border-t py-6 text-center text-xs text-muted-foreground">
  © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
    </div>
  </footer>
  );
}
