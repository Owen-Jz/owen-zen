"use client";
import { useRouter } from "next/navigation";
import { ClientListView } from "@/components/clients/ClientListView";

export default function ClientsPage() {
  const router = useRouter();
  return (
    <div className="p-6">
      <ClientListView onSelectClient={id => router.push(`/clients/${id}`)} />
    </div>
  );
}