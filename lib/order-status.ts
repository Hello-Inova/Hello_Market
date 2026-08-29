export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pedido realizado",
  PAYMENT_PENDING: "Pagamento pendente",
  PAID: "Pagamento aprovado",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING: "outline",
  PAYMENT_PENDING: "warning",
  PAID: "success",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

// Ordered timeline used on the order detail page (section 11)
export const ORDER_TIMELINE_STEPS = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;
