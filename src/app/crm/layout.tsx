"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UserPlus,
  KanbanSquare,
  Building2,
  Contact,
  CheckSquare,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";

const CRM_ROLES = ["CRM_OWNER", "SALES_MANAGER", "SALES_REP"];

const navItems = [
  { href: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/leads", label: "Leads", icon: UserPlus },
  { href: "/crm/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/crm/accounts", label: "Accounts", icon: Building2 },
  { href: "/crm/contacts", label: "Contacts", icon: Contact },
  { href: "/crm/tasks", label: "Tasks", icon: CheckSquare },
];

const managerNav = [{ href: "/crm/team", label: "Team", icon: Users }];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session?.user?.role;
  const isManager = role === "CRM_OWNER" || role === "SALES_MANAGER";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !CRM_ROLES.includes(role as string))
      router.push("/");
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !CRM_ROLES.includes(role as string)) return null;

  const items = isManager ? [...navItems, ...managerNav] : navItems;

  return (
    <div className="min-h-screen flex bg-[#fafaf9]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-65 bg-white border-r border-black/4 transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-7 pb-5">
          <Link href="/crm/dashboard" className="flex items-center gap-2.5 group">
            <Logo size="sm" />
            <div>
              <span className="text-[15px] font-bold text-foreground tracking-tight">HRH</span>
              <span className="block text-[10px] text-foreground/30 font-semibold tracking-widest uppercase">
                CRM
              </span>
            </div>
          </Link>
        </div>

        <nav className="px-4 mt-2 space-y-0.5">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] transition-all duration-300 ${
                  isActive
                    ? "bg-foreground text-background font-semibold"
                    : "text-foreground/40 hover:text-foreground hover:bg-black/3 font-medium"
                }`}
              >
                <item.icon className="w-[17px] h-[17px]" />
                {item.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-3.5 rounded-xl bg-black/2 mb-2">
            <div className="text-[13px] font-semibold text-foreground truncate">
              {session.user.name}
            </div>
            <div className="text-[11px] text-foreground/30 truncate mt-0.5">
              {role === "CRM_OWNER" ? "Owner" : role === "SALES_MANAGER" ? "Sales Manager" : "Sales Rep"}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] text-foreground/30 hover:text-red-500 transition-colors duration-300 w-full rounded-xl hover:bg-red-50/50"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 lg:ml-[260px]">
        <header className="sticky top-0 z-30 bg-[#fafaf9]/80 backdrop-blur-2xl py-4">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <button
              className="lg:hidden text-foreground/40 hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-[15px] font-semibold text-foreground/70 capitalize tracking-tight">
              {pathname.split("/").pop()?.replace(/-/g, " ")}
            </h1>
          </div>
        </header>
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
