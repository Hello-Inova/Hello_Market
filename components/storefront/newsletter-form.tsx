"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/actions/newsletter.actions";

export function NewsletterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await subscribeNewsletter(formData);
          if (result.success) {
            toast.success(result.message);
            formRef.current?.reset();
          } else {
            toast.error(result.message);
          }
        });
      }}
      className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row"
    >
      <Input type="email" name="email" placeholder="seu@email.com" required className="rounded-full bg-background" />
      <Button type="submit" disabled={isPending} className="rounded-full">
        {isPending ? "Enviando..." : "Inscrever"}
      </Button>
    </form>
  );
}
