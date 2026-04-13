"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { Logo } from "@/components/logo";

const ease = [0.25, 1, 0.5, 1];

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to set password");
      setLoading(false);
      return;
    }

    router.push("/login?passwordChanged=true");
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-2xl bg-accent/40 border-0 text-foreground placeholder-foreground/25 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-400 text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-50/40 via-white to-white" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 w-full max-w-[420px] px-6"
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
            <KeyRound className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Set your password
          </h1>
          <p className="text-foreground/35 mt-2 text-sm">
            Choose a new password to get started
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-soft-md p-8 space-y-4"
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

          <div className="bg-accent/40 rounded-2xl px-4 py-3.5 text-sm">
            <span className="text-foreground/40">Setting password for: </span>
            <span className="font-semibold text-foreground">{email}</span>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-foreground/50 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={`${inputClass} pr-12`}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/50 transition-colors duration-400"
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-foreground/50 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="Confirm your password"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-foreground text-background text-sm font-semibold btn-smooth hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting password...
                </>
              ) : (
                "Set Password & Continue"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-foreground/20" />
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
