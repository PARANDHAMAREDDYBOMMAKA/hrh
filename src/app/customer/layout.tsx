"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";
import { LayoutDashboard, ShoppingBag, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { href: "/customer/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/customer/orders", label: "Orders", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-black/[0.04]">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/customer/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-[15px] font-bold text-foreground tracking-tight">HRH</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-foreground/35">{session.user.name?.split(" ")[0]}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-2 rounded-lg text-foreground/20 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-black/[0.04] z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all duration-300 ${isActive ? "text-foreground" : "text-foreground/20 hover:text-foreground/40"}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
