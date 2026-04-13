"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { CartProvider } from "@/hooks/use-cart";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </CartProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
