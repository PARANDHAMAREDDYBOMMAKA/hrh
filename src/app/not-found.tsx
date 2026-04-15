"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  Utensils,
  ChefHat,
  QrCode,
  Search,
  Coffee,
  Pizza,
  Soup,
} from "lucide-react";
import { Logo } from "@/components/logo";

const ease = [0.25, 1, 0.5, 1] as const;

const floatingIcons = [
  { Icon: ChefHat, x: "8%", y: "18%", delay: 0, size: 28, rotate: -12 },
  { Icon: QrCode, x: "88%", y: "22%", delay: 0.3, size: 32, rotate: 8 },
  { Icon: Coffee, x: "12%", y: "72%", delay: 0.6, size: 26, rotate: 15 },
  { Icon: Pizza, x: "85%", y: "70%", delay: 0.9, size: 34, rotate: -10 },
  { Icon: Soup, x: "50%", y: "12%", delay: 1.2, size: 24, rotate: 6 },
  { Icon: Utensils, x: "48%", y: "85%", delay: 1.5, size: 22, rotate: -5 },
];

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-300/40 to-amber-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-orange-400/30 to-rose-200/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, size, rotate }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: 0.18,
            scale: 1,
            rotate,
            y: [0, -14, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay },
            scale: { duration: 0.8, delay, ease },
            rotate: { duration: 0.8, delay, ease },
            y: {
              duration: 4 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay + 0.5,
            },
          }}
          className="absolute text-foreground pointer-events-none hidden md:block"
          style={{ left: x, top: y }}
        >
          <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* Header */}
      <header className="relative z-10 px-6 py-6 md:px-10">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            className="relative"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-orange-100 shadow-sm text-[13px] text-orange-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                Order status: Not Found
              </div>
            </motion.div>

            {/* 404 with creative treatment */}
            <div className="relative flex items-center justify-center mb-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="text-[14rem] md:text-[22rem] font-black tracking-tighter text-orange-500/5 select-none leading-none">
                  404
                </div>
              </motion.div>

              <div className="relative flex items-end justify-center gap-2 md:gap-4">
                <motion.span
                  initial={{ opacity: 0, y: 60, rotate: -20 }}
                  animate={{ opacity: 1, y: 0, rotate: -6 }}
                  transition={{ duration: 0.8, delay: 0.3, ease }}
                  className="text-[6rem] md:text-[10rem] font-black tracking-tighter bg-gradient-to-br from-orange-500 to-amber-400 bg-clip-text text-transparent leading-none drop-shadow-sm"
                >
                  4
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: [0, 8, -8, 0],
                  }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.5 },
                    scale: { duration: 0.6, delay: 0.5, ease },
                    rotate: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.2,
                    },
                  }}
                  className="relative"
                >
                  <div className="w-[5rem] h-[5rem] md:w-[8rem] md:h-[8rem] rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-xl">
                    <Search
                      className="w-10 h-10 md:w-16 md:h-16 text-orange-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-7 md:h-7 rounded-full bg-orange-500 border-4 border-background" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 60, rotate: 20 }}
                  animate={{ opacity: 1, y: 0, rotate: 6 }}
                  transition={{ duration: 0.8, delay: 0.4, ease }}
                  className="text-[6rem] md:text-[10rem] font-black tracking-tighter bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent leading-none drop-shadow-sm"
                >
                  4
                </motion.span>
              </div>
            </div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease }}
              className="text-center text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mt-6"
            >
              This dish isn&apos;t on the menu
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease }}
              className="text-center text-base md:text-lg text-foreground/50 max-w-xl mx-auto mt-5 leading-relaxed"
            >
              The page you ordered couldn&apos;t be found in our kitchen.
              It may have been moved, renamed, or never existed. Let&apos;s get
              you back to something delicious.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
            >
              <Link
                href="/"
                className="group flex items-center gap-2.5 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-foreground/20 hover:-translate-y-0.5 transition-all duration-400"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                href="/login"
                className="group flex items-center gap-2 text-foreground/60 hover:text-foreground px-6 py-3.5 rounded-full text-sm font-medium transition-colors duration-400 border border-foreground/10 hover:border-foreground/20 hover:bg-white/40 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-400" />
                Sign In
              </Link>
            </motion.div>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05, ease }}
              className="mt-14 pt-8 border-t border-foreground/5"
            >
              <p className="text-center text-xs uppercase tracking-widest text-foreground/40 mb-5 font-semibold">
                Or try one of these
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: "Features", href: "/#features" },
                  { label: "How it Works", href: "/#how-it-works" },
                  { label: "Pricing", href: "/#pricing" },
                  { label: "Get Started", href: "/login?mode=register" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground bg-white/50 hover:bg-white border border-foreground/5 hover:border-foreground/10 rounded-full backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
