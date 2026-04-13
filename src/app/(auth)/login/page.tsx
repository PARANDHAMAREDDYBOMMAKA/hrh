"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const field = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2, ease } },
};

function AuthPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pwChanged = sp.get("passwordChanged") === "true";
  const verified = sp.get("verified") === "true";
  const cbUrl = sp.get("callbackUrl");
  const [mode, setMode] = useState<"login" | "register">(sp.get("mode") === "register" ? "register" : "login");
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [loginLoad, setLoginLoad] = useState(false);

  const [reg, setReg] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showRegPw, setShowRegPw] = useState(false);
  const [regErr, setRegErr] = useState("");
  const [regLoad, setRegLoad] = useState(false);

  function upReg(k: string, v: string) {
    if (k === "phone") v = v.replace(/[^0-9+\-\s]/g, "");
    setReg((p) => ({ ...p, [k]: v }));
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginErr(""); setLoginLoad(true);
    const r = await signIn("credentials", { email: email.toLowerCase().trim(), password: pw, redirect: false });
    if (r?.error) {
      if (r.error.includes("MUST_CHANGE_PASSWORD:")) { router.push(`/change-password?email=${encodeURIComponent(r.error.split("MUST_CHANGE_PASSWORD:")[1])}`); return; }
      setLoginErr("Invalid email or password"); setLoginLoad(false); return;
    }
    if (cbUrl) { router.push(cbUrl); return; }
    const s = await fetch("/api/auth/session").then((r) => r.json());
    router.push(s?.user?.role === "ADMIN" ? "/admin/dashboard" : s?.user?.role === "PARTNER" ? "/partner/dashboard" : "/customer/dashboard");
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault(); setRegErr("");
    const ph = reg.phone.replace(/[^0-9]/g, "");
    if (ph.length < 10) { setRegErr("Enter a valid 10-digit phone number"); return; }
    if (reg.password !== reg.confirm) { setRegErr("Passwords do not match"); return; }
    if (reg.password.length < 8) { setRegErr("Password must be at least 8 characters"); return; }
    setRegLoad(true);
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: reg.name.trim(), email: reg.email.toLowerCase().trim(), phone: reg.phone.trim(), password: reg.password }) });
    const d = await r.json();
    if (!r.ok) { setRegErr(d.error || "Registration failed"); setRegLoad(false); return; }
    const signInResult = await signIn("credentials", { email: reg.email.toLowerCase().trim(), password: reg.password, redirect: false });
    if (signInResult?.ok) {
      const s = await fetch("/api/auth/session").then((r) => r.json());
      router.push(cbUrl || (s?.user?.role === "ADMIN" ? "/admin/dashboard" : s?.user?.role === "PARTNER" ? "/partner/dashboard" : "/customer/dashboard"));
    } else {
      router.push("/login?registered=true");
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl bg-[#f5f5f4] border-0 text-foreground placeholder-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all duration-300 text-[13px]";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafaf9]">
      {/* Ambient bg */}
      <div className="absolute inset-0">
        <div className="absolute -top-[30%] -left-[20%] w-[60%] h-[60%] bg-orange-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[50%] h-[50%] bg-amber-100/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mb-8">
          <Link href="/"><LogoFull size="md" /></Link>
        </motion.div>

        {/* ── Desktop ── */}
        <div className="hidden md:block w-full max-w-[880px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease }}
            className="relative rounded-[1.75rem] overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.06)]"
            style={{ minHeight: 540 }}
          >
            <div className="flex min-h-[540px]">
              {/* Left half — always Login */}
              <div className="w-1/2 flex items-center justify-center p-10">
                <form onSubmit={doLogin} className="w-full max-w-[300px] space-y-4">
                  <div>
                    <h1 className="text-[1.6rem] font-bold tracking-tight text-foreground leading-tight">Sign In</h1>
                    <p className="text-foreground/30 text-[13px] mt-1">Enter your credentials</p>
                  </div>
                  {(pwChanged || verified) && <div className="bg-emerald-50 rounded-xl px-3.5 py-2.5 text-emerald-700 text-[13px] flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{pwChanged ? "Password updated." : "Email verified!"}</div>}
                  {loginErr && <div className="bg-red-50 rounded-xl px-3.5 py-2.5 text-red-600 text-[13px]">{loginErr}</div>}
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required className={`${inp} pr-10`} placeholder="Enter your password" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/15 hover:text-foreground/30 transition-colors">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button type="submit" disabled={loginLoad} className="w-full py-3 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                      {loginLoad ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign In"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right half — always Register */}
              <div className="w-1/2 flex items-center justify-center p-10">
                <form onSubmit={doRegister} className="w-full max-w-[300px] space-y-3">
                  <div>
                    <h1 className="text-[1.6rem] font-bold tracking-tight text-foreground leading-tight">Create Account</h1>
                    <p className="text-foreground/30 text-[13px] mt-1">Start ordering in seconds</p>
                  </div>
                  {regErr && <div className="bg-red-50 rounded-xl px-3.5 py-2.5 text-red-600 text-[13px]">{regErr}</div>}
                  {[
                    { k: "name", l: "Full Name", t: "text", p: "John Doe" },
                    { k: "email", l: "Email", t: "email", p: "you@example.com" },
                    { k: "phone", l: "Phone", t: "tel", p: "9876543210" },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block text-[12px] font-medium text-foreground/35 mb-1">{f.l}</label>
                      <input type={f.t} value={reg[f.k as keyof typeof reg]} onChange={(e) => upReg(f.k, e.target.value)} required inputMode={f.t === "tel" ? "numeric" : undefined} maxLength={f.t === "tel" ? 15 : undefined} className={inp} placeholder={f.p} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/35 mb-1">Password</label>
                    <div className="relative">
                      <input type={showRegPw ? "text" : "password"} value={reg.password} onChange={(e) => upReg("password", e.target.value)} required minLength={8} className={`${inp} pr-10`} placeholder="Min 8 characters" />
                      <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/15 hover:text-foreground/30 transition-colors">{showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-foreground/35 mb-1">Confirm Password</label>
                    <input type="password" value={reg.confirm} onChange={(e) => upReg("confirm", e.target.value)} required className={inp} placeholder="Confirm password" />
                  </div>
                  <div className="pt-0.5">
                    <button type="submit" disabled={regLoad} className="w-full py-3 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                      {regLoad ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sliding dark overlay */}
            <motion.div
              className="absolute top-0 w-1/2 h-full z-20"
              animate={{ left: isLogin ? "50%" : "0%" }}
              transition={{ duration: 0.65, ease }}
            >
              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-center px-12 relative overflow-hidden">
                <div className="absolute top-8 right-8 w-28 h-28 border border-white/[0.04] rounded-full" />
                <div className="absolute bottom-8 left-8 w-20 h-20 border border-white/[0.04] rounded-full" />
                <AnimatePresence mode="wait">
                  {isLogin ? (
                    <motion.div key="ov-reg" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4, ease }}>
                      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">New here?</h2>
                      <p className="text-white/30 text-[13px] mb-7 leading-relaxed max-w-[200px] mx-auto">Create an account and start ordering from your hostel</p>
                      <button type="button" onClick={() => setMode("register")} className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white text-[13px] font-medium hover:bg-white/10 transition-all duration-400">
                        Sign Up <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="ov-log" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.4, ease }}>
                      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome back</h2>
                      <p className="text-white/30 text-[13px] mb-7 leading-relaxed max-w-[200px] mx-auto">Sign in to continue ordering your meals</p>
                      <button type="button" onClick={() => setMode("login")} className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white text-[13px] font-medium hover:bg-white/10 transition-all duration-400">
                        Sign In <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden w-full max-w-[400px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="bg-white rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] p-6">
            <div className="flex gap-1 p-1 bg-[#f5f5f4] rounded-xl mb-5">
              {(["login", "register"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${mode === m ? "bg-foreground text-background" : "text-foreground/25"}`}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form key="ml" variants={stagger} initial="hidden" animate="visible" exit="exit" onSubmit={doLogin} className="space-y-4">
                  <motion.div variants={field}><h1 className="text-xl font-bold tracking-tight">Welcome back</h1><p className="text-foreground/25 text-[13px] mt-1">Sign in to your account</p></motion.div>
                  {(pwChanged || verified) && <motion.div variants={field} className="bg-emerald-50 rounded-xl px-3.5 py-2.5 text-emerald-700 text-[13px] flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{pwChanged ? "Password updated." : "Email verified!"}</motion.div>}
                  {loginErr && <motion.div variants={field} className="bg-red-50 rounded-xl px-3.5 py-2.5 text-red-600 text-[13px]">{loginErr}</motion.div>}
                  <motion.div variants={field}><label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="you@example.com" /></motion.div>
                  <motion.div variants={field}><label className="block text-[12px] font-medium text-foreground/35 mb-1.5">Password</label><div className="relative"><input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required className={`${inp} pr-10`} placeholder="Enter your password" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/15 hover:text-foreground/30 transition-colors">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></motion.div>
                  <motion.div variants={field}><button type="submit" disabled={loginLoad} className="w-full py-3 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{loginLoad ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign In"}</button></motion.div>
                </motion.form>
              ) : (
                <motion.form key="mr" variants={stagger} initial="hidden" animate="visible" exit="exit" onSubmit={doRegister} className="space-y-3">
                  <motion.div variants={field}><h1 className="text-xl font-bold tracking-tight">Create Account</h1><p className="text-foreground/25 text-[13px] mt-1">Join HRH and start ordering</p></motion.div>
                  {regErr && <motion.div variants={field} className="bg-red-50 rounded-xl px-3.5 py-2.5 text-red-600 text-[13px]">{regErr}</motion.div>}
                  {[{ k: "name", l: "Full Name", t: "text", p: "John Doe" }, { k: "email", l: "Email", t: "email", p: "you@example.com" }, { k: "phone", l: "Phone", t: "tel", p: "9876543210" }].map((f) => (
                    <motion.div key={f.k} variants={field}><label className="block text-[12px] font-medium text-foreground/35 mb-1">{f.l}</label><input type={f.t} value={reg[f.k as keyof typeof reg]} onChange={(e) => upReg(f.k, e.target.value)} required inputMode={f.t === "tel" ? "numeric" : undefined} maxLength={f.t === "tel" ? 15 : undefined} className={inp} placeholder={f.p} /></motion.div>
                  ))}
                  <motion.div variants={field}><label className="block text-[12px] font-medium text-foreground/35 mb-1">Password</label><div className="relative"><input type={showRegPw ? "text" : "password"} value={reg.password} onChange={(e) => upReg("password", e.target.value)} required minLength={8} className={`${inp} pr-10`} placeholder="Min 8 characters" /><button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/15 hover:text-foreground/30 transition-colors">{showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></motion.div>
                  <motion.div variants={field}><label className="block text-[12px] font-medium text-foreground/35 mb-1">Confirm Password</label><input type="password" value={reg.confirm} onChange={(e) => upReg("confirm", e.target.value)} required className={inp} placeholder="Confirm password" /></motion.div>
                  <motion.div variants={field}><button type="submit" disabled={regLoad} className="w-full py-3 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">{regLoad ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : "Create Account"}</button></motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function LogoFull({ size }: { size: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size as "sm" | "md"} />
      <span className="text-[17px] font-bold text-foreground tracking-tight">HRH</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafaf9]"><Loader2 className="w-5 h-5 animate-spin text-foreground/15" /></div>}>
      <AuthPage />
    </Suspense>
  );
}
