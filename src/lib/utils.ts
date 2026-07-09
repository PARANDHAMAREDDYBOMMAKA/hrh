import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function homeForRole(role?: string | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "PARTNER":
      return "/partner/dashboard";
    case "CRM_OWNER":
    case "SALES_MANAGER":
    case "SALES_REP":
      return "/crm/dashboard";
    default:
      return "/customer/dashboard";
  }
}
