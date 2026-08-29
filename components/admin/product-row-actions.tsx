"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  deleteProductAction,
  duplicateProductAction,
  toggleProductStatusAction,
} from "@/actions/admin/product.actions";

export function ProductRowActions({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateProductAction(productId);
              if (result.success) {
                toast.success("Produto duplicado.");
                router.refresh();
              }
            })
          }
        >
          Duplicar
        </DropdownMenuItem>
        {status === "ACTIVE" ? (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await toggleProductStatusAction(productId, "INACTIVE");
                router.refresh();
              })
            }
          >
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await toggleProductStatusAction(productId, "ACTIVE");
                router.refresh();
              })
            }
          >
            Ativar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive"
          onClick={() =>
            startTransition(async () => {
              if (!confirm("Arquivar este produto? Ele deixará de aparecer na loja.")) return;
              await deleteProductAction(productId);
              router.refresh();
            })
          }
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
