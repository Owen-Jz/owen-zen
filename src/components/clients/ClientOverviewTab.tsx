"use client";
import { Mail, Phone, Building2, User, Clock, MessageSquare } from "lucide-react";
import { Client } from "@/types";

interface Props {
  client: Client;
}

export function ClientOverviewTab({ client }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Contact Info</h3>
        <div className="space-y-2">
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm hover:text-primary">
              <Mail size={14} className="text-gray-400" /> {client.email}
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm hover:text-primary">
              <Phone size={14} className="text-gray-400" /> {client.phone}
            </a>
          )}
          {client.company && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={14} className="text-gray-400" /> {client.company}
            </div>
          )}
          {client.role && (
            <div className="flex items-center gap-3 text-sm">
              <User size={14} className="text-gray-400" /> {client.role}
            </div>
          )}
        </div>
      </div>

      {client.communicationPrefs && Object.keys(client.communicationPrefs).length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Communication Preferences</h3>
          <div className="space-y-2 text-sm">
            {client.communicationPrefs.preferredContactMethod && (
              <div className="flex items-center gap-3">
                <MessageSquare size={14} className="text-gray-400" />
                {client.communicationPrefs.preferredContactMethod}
              </div>
            )}
            {client.communicationPrefs.bestTimeToContact && (
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-gray-400" />
                {client.communicationPrefs.bestTimeToContact}
              </div>
            )}
            {client.communicationPrefs.timezone && <div className="text-sm text-gray-400 pl-7">{client.communicationPrefs.timezone}</div>}
            {client.communicationPrefs.communicationStyle && <div className="text-sm text-gray-400 pl-7">{client.communicationPrefs.communicationStyle}</div>}
          </div>
        </div>
      )}

      {client.personalNotes && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Personal Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.personalNotes}</p>
        </div>
      )}

      {client.tags?.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {client.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}