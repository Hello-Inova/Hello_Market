import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <ProfileForm
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            document: user.document,
            phone: user.phone,
            birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
            avatarUrl: user.avatarUrl,
          }}
        />
      </CardContent>
    </Card>
  );
}
