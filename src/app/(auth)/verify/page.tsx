"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

const ease = [0.25, 1, 0.5, 1] as const;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Verification failed");
      setLoading(false);
      return;
    }

    router.push("/login?verified=true");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-orange-50/30 via-white to-white" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 w-full max-w-105 px-6"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <Logo size="md" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              HRH
            </span>
          </Link>
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Verify your email
          </h1>
          <p className="text-foreground/35 mt-2 text-sm">
            We sent a 6-digit code to{" "}
            <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleVerify}
          className="bg-white rounded-3xl shadow-soft-md p-8 space-y-5"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 rounded-2xl px-4 py-3.5 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-foreground/50 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              inputMode="numeric"
              maxLength={6}
              className="w-full px-4 py-4 rounded-2xl bg-accent/40 border-0 text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder-foreground/15 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400"
              placeholder="000000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 rounded-2xl bg-foreground text-background text-sm font-semibold btn-smooth hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>

          <p className="text-center text-foreground/25 text-xs">
            Check your email inbox and spam folder for the code.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-foreground/20" />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
