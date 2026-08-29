import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

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
