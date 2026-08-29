"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MapPin, Truck, CreditCard, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency, cn } from "@/lib/utils";
import { createAddressAction } from "@/actions/address.actions";
import {
  quoteShippingAction,
  previewCouponAction,
  submitOrderAction,
} from "@/actions/checkout.actions";
import type { ShippingOption } from "@/lib/shipping";

interface Address {
  id: string;
  label: string;
  recipient: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface CartLine {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

const STEPS = ["Endereço", "Entrega", "Pagamento", "Revisão"] as const;

export function CheckoutWizard({
  addresses: initialAddresses,
  items,
  appliedCouponCode,
}: {
  addresses: Address[];
  items: CartLine[];
  appliedCouponCode: string | null;
}) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses.find((a) => a.isDefault)?.id ?? initialAddresses[0]?.id ?? "");
  const [showNewAddress, setShowNewAddress] = useState(initialAddresses.length === 0);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "BOLETO">("PIX");
  const [installments, setInstallments] = useState(1);
  const [card, setCard] = useState({ number: "", holderName: "", expiry: "", cvv: "" });
  const [couponCode, setCouponCode] = useState(appliedCouponCode ?? "");
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ orderNumber: string } | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const selectedShipping = shippingOptions.find((o) => o.id === shippingMethodId);
  const shippingCost = freeShipping ? 0 : selectedShipping?.price ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === addressId), [addresses, addressId]);

  function handleAddressSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createAddressAction(formData);
      if (result.success && result.addressId) {
        toast.success("Endereço adicionado");
        const created = await fetch(`/api/addresses/${result.addressId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (created?.address) {
          setAddresses((prev) => [...prev, created.address]);
        }
        setAddressId(result.addressId);
        setShowNewAddress(false);
      } else {
        toast.error(result.message || "Não foi possível salvar o endereço.");
      }
    });
  }

  function goToShipping() {
    if (!selectedAddress) {
      toast.error("Selecione ou cadastre um endereço.");
      return;
    }
    startTransition(async () => {
      const result = await quoteShippingAction(selectedAddress.zipCode);
      if (result.success && result.options) {
        setShippingOptions(result.options);
        setShippingMethodId(result.options[0]?.id ?? "");
        setStep(1);
      } else {
        toast.error(result.message || "Não foi possível calcular o frete.");
      }
    });
  }

  function applyCoupon() {
    if (!couponCode.trim()) return;
    startTransition(async () => {
      const result = await previewCouponAction(couponCode.trim());
      if (result.success) {
        setDiscount(result.discount ?? 0);
        setFreeShipping(!!result.freeShipping);
        toast.success("Cupom aplicado!");
      } else {
        toast.error(result.message);
        setDiscount(0);
        setFreeShipping(false);
      }
    });
  }

  function handleSubmitOrder() {
    startTransition(async () => {
      const response = await submitOrderAction({
        addressId,
        shippingMethodId,
        paymentMethod,
        installments,
        couponCode: couponCode || undefined,
        card: paymentMethod === "CREDIT_CARD" ? card : undefined,
      });

      if (response.success) {
        setResult({ orderNumber: response.orderNumber! });
        toast.success("Pedido realizado com sucesso!");
        setTimeout(() => router.push(`/loja/${companySlug}/minha-conta/pedidos/${response.orderId}`), 1500);
      } else {
        toast.error(response.message || "Não foi possível concluir o pedido.");
      }
    });
  }

  if (result) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-green-700" />
        </div>
        <h2 className="text-xl font-bold">Pedido confirmado!</h2>
        <p className="mt-2 text-muted-foreground">Número do pedido: {result.orderNumber}</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecionando para os detalhes do pedido...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <ol className="mb-8 flex items-center gap-2 text-xs sm:text-sm">
          {STEPS.map((label, idx) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold",
                  idx === step ? "border-primary bg-primary text-white" : idx < step ? "border-primary text-primary" : "text-muted-foreground"
                )}
              >
                {idx < step ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span className={idx === step ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {idx < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" /> Endereço de entrega</h2>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4",
                    addressId === addr.id && "border-primary bg-primary/5"
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === addr.id}
                    onChange={() => setAddressId(addr.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium">{addr.label} {addr.isDefault && <span className="text-xs text-primary">(padrão)</span>}</p>
                    <p className="text-muted-foreground">
                      {addr.recipient} — {addr.street}, {addr.number}
                      {addr.complement ? `, ${addr.complement}` : ""} — {addr.neighborhood}, {addr.city}/{addr.state} — {addr.zipCode}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {!showNewAddress ? (
              <Button variant="outline" onClick={() => setShowNewAddress(true)}>
                + Adicionar novo endereço
              </Button>
            ) : (
              <form action={handleAddressSubmit} className="space-y-3 rounded-xl border p-4">
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Nome do endereço" name="label" required placeholder="Casa, Trabalho..." />
                  <TextField label="Destinatário" name="recipient" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="CEP" name="zipCode" required placeholder="00000-000" />
                  <TextField label="Número" name="number" required />
                </div>
                <TextField label="Rua" name="street" required />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Bairro" name="neighborhood" required />
                  <TextField label="Complemento" name="complement" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Cidade" name="city" required />
                  <TextField label="Estado (UF)" name="state" required maxLength={2} placeholder="SP" />
                </div>
                <input type="hidden" name="country" value="Brasil" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isDefault" /> Definir como endereço padrão
                </label>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar endereço"}
                </Button>
              </form>
            )}

            <Button size="lg" onClick={goToShipping} disabled={isPending || !addressId}>
              Continuar para entrega
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Truck className="h-5 w-5" /> Forma de entrega</h2>
            <RadioGroup value={shippingMethodId} onValueChange={setShippingMethodId} className="space-y-3">
              {shippingOptions.map((opt) => (
                <label key={opt.id} className={cn("flex items-center justify-between rounded-xl border p-4", shippingMethodId === opt.id && "border-primary bg-primary/5")}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={opt.id} />
                    <div>
                      <p className="font-medium">{opt.name}</p>
                      <p className="text-xs text-muted-foreground">{opt.carrier} — até {opt.days} dias úteis</p>
                    </div>
                  </div>
                  <span className="font-semibold">{opt.price === 0 ? "Grátis" : formatCurrency(opt.price)}</span>
                </label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
              <Button onClick={() => setStep(2)} disabled={!shippingMethodId}>Continuar para pagamento</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard className="h-5 w-5" /> Pagamento</h2>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as never)} className="space-y-3">
              {[
                { id: "PIX", label: "PIX", desc: "Aprovação imediata" },
                { id: "CREDIT_CARD", label: "Cartão de crédito", desc: "Em até 12x" },
                { id: "BOLETO", label: "Boleto bancário", desc: "Compensação em até 3 dias úteis" },
              ].map((m) => (
                <label key={m.id} className={cn("flex items-center gap-3 rounded-xl border p-4", paymentMethod === m.id && "border-primary bg-primary/5")}>
                  <RadioGroupItem value={m.id} />
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>

            {paymentMethod === "CREDIT_CARD" && (
              <div className="space-y-3 rounded-xl border p-4">
                <TextField label="Número do cartão" value={card.number} onChange={(v) => setCard((c) => ({ ...c, number: v }))} placeholder="0000 0000 0000 0000" />
                <TextField label="Nome impresso no cartão" value={card.holderName} onChange={(v) => setCard((c) => ({ ...c, holderName: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Validade (MM/AA)" value={card.expiry} onChange={(v) => setCard((c) => ({ ...c, expiry: v }))} placeholder="12/28" />
                  <TextField label="CVV" value={card.cvv} onChange={(v) => setCard((c) => ({ ...c, cvv: v }))} placeholder="123" />
                </div>
                <div className="space-y-1.5">
                  <Label>Parcelas</Label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatCurrency(total / n)} {n === 1 ? "à vista" : "sem juros"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ambiente de demonstração: use qualquer número de cartão. Terminado em 0002 simula recusa.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)}>Revisar pedido</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardList className="h-5 w-5" /> Revisão do pedido</h2>
            <div className="space-y-3 rounded-xl border p-4 text-sm">
              <p><strong>Endereço:</strong> {selectedAddress?.street}, {selectedAddress?.number} — {selectedAddress?.city}/{selectedAddress?.state}</p>
              <p><strong>Entrega:</strong> {selectedShipping?.name} ({selectedShipping?.days} dias)</p>
              <p><strong>Pagamento:</strong> {paymentMethod === "PIX" ? "PIX" : paymentMethod === "BOLETO" ? "Boleto" : `Cartão em ${installments}x`}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleSubmitOrder} disabled={isPending} size="lg">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="h-fit space-y-4 rounded-xl border p-5">
        <h2 className="font-semibold">Resumo</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ""}
              </span>
              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t pt-3">
          <Input placeholder="Cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
          <Button variant="outline" onClick={applyCoupon} disabled={isPending}>Aplicar</Button>
        </div>

        <div className="space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shippingCost === 0 ? "Grátis" : formatCurrency(shippingCost)}</span></div>
        </div>
        <div className="flex justify-between border-t pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  required,
  placeholder,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        name={name}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
