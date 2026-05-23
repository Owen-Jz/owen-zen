"use client";
import { useEffect, useState } from "react";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import { Client } from "@/types";

interface Project { _id: string; name: string; status: string; }

interface Props { client: Client; }

export function ClientProjectsTab({ client }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!client.projects?.length) return;
    fetch(`/api/clients/${client._id}/projects`)
      .then(r => r.json())
      .then(j => { if (j.success) setProjects(j.data); });
  }, [client._id, client.projects]);

  if (!client.projects?.length) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No projects linked. Connect a project from the Projects tab.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map(project => (
        <div key={project._id}
          onClick={() => router.push(`/projects?open=${project._id}`)}
          className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
        >
          <span className="text-sm font-medium">{project.name}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              project.status === "active" ? "bg-emerald-500/15 text-emerald-400" :
              project.status === "completed" ? "bg-blue-500/15 text-blue-400" :
              "bg-gray-500/15 text-gray-400"
            }`}>{project.status}</span>
            <Link size={12} className="text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
}