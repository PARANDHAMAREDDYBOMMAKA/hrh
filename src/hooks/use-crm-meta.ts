"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/lib/crm-client";

export type CrmMeta = {
  owners: { id: string; name: string; email: string; role: string }[];
  accounts: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string; accountId: string | null }[];
  stages: { value: string; label: string; probability: number; type: string }[];
  leadStatuses: string[];
  leadSources: string[];
  activityTypes: string[];
  taskPriorities: string[];
  isManager: boolean;
  currentUserId: string;
};

export function useCrmMeta() {
  return useQuery<CrmMeta>({
    queryKey: ["crm", "meta"],
    queryFn: () => crmApi.get("/api/crm/meta"),
    staleTime: 60_000,
  });
}
