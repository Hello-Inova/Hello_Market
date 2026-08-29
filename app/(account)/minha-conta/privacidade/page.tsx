import type { Metadata } from "next";
import { PrivacyPanel } from "@/components/account/privacy-panel";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacyPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Privacidade e proteção de dados</h1>
      <PrivacyPanel />
    </div>
  );
}
