"use client";
import { useParams, useRouter } from "next/navigation";
import { ClientProfileView } from "@/components/clients/ClientProfileView";

export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  return (
    <div className="p-6 max-w-3xl">
      <ClientProfileView clientId={params.id as string} onBack={() => router.push("/clients")} />
    </div>
  );
}