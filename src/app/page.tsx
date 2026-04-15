"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ChefHat,
  QrCode,
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  Star,
  Utensils,
  Building2,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Check,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/logo";


const ease = [0.25, 1, 0.5, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const staggerContainerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = ["Features", "How it Works", "Pricing", "Testimonials"];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-white/90 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.04)] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size="sm" className="group-hover:scale-105 transition-transform duration-500" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            HRH
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[13px] text-foreground/45 hover:text-foreground transition-colors duration-400 font-medium"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] text-foreground/50 hover:text-foreground transition-colors duration-400 px-4 py-2 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/login?mode=register"
            className="text-[13px] bg-foreground text-background px-5 py-2.5 rounded-full font-medium hover:opacity-80 transition-all duration-400 btn-smooth"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden text-foreground/60"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>



      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="md:hidden bg-white/95 backdrop-blur-2xl mt-2 mx-4 rounded-2xl p-6 shadow-soft-lg"
        >
          <div className="flex flex-col gap-3">
            {links.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="text-foreground/50 hover:text-foreground py-2 font-medium text-sm"
              >
                {item}
              </a>
            ))}
            <hr className="border-border/50 my-1" />
            <Link href="/login" className="text-foreground/50 py-2 text-sm font-medium">
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className="bg-foreground text-background py-3 rounded-xl text-center font-medium text-sm"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-50/60 via-white to-white" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50/80 border border-orange-100/60 mb-10 text-[13px] text-orange-600/80 font-medium"
        >
          <Zap className="w-3.5 h-3.5" />
          The smartest way to serve hostel residents
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="text-5xl md:text-6xl lg:text-[5rem] font-extrabold tracking-tight leading-[1.05] text-foreground"
        >
          Where{" "}
          <span className="bg-linear-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            Hotels
          </span>{" "}
          Meet
          <br />
          <span className="bg-linear-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            Restaurants
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="text-base md:text-lg text-foreground/40 max-w-xl mx-auto mt-8 mb-12 leading-relaxed"
        >
          Connect your restaurant with hostels and hotels. Residents scan a QR,
          order meals, and you cook exactly what&apos;s needed. Zero waste.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login?mode=register"
            className="group flex items-center gap-2.5 bg-foreground text-background px-8 py-4 rounded-full text-sm font-semibold btn-smooth hover:shadow-soft-lg"
          >
            Start Free Today
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-400" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 text-foreground/40 hover:text-foreground px-6 py-4 rounded-full text-sm font-medium transition-colors duration-400"
          >
            See How it Works
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease }}
          className="mt-24 grid grid-cols-3 gap-12 max-w-md mx-auto"
        >
          {[
            { value: "500+", label: "Daily Orders" },
            { value: "50+", label: "Partner Hotels" },
            { value: "4.9", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] text-foreground/30 mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: QrCode, title: "QR Code Ordering", description: "Guests scan a QR at their hostel to instantly access your menu. No app download needed.", number: "01" },
    { icon: Clock, title: "Batch Cooking", description: "Orders close by 7 AM for breakfast, 5 PM for dinner. Cook exactly what's ordered.", number: "02" },
    { icon: TrendingUp, title: "Revenue Analytics", description: "Track orders, revenue, and commissions across all partner hotels in real-time.", number: "03" },
    { icon: Shield, title: "Secure Platform", description: "Enterprise-grade security with encrypted data and role-based access.", number: "04" },
    { icon: ChefHat, title: "Smart Kitchen", description: "Aggregated order summaries tell you exactly what to cook, grouped by hostel.", number: "05" },
  ];

  return (
    <RevealSection className="py-32 relative" >
      <div className="max-w-6xl mx-auto px-6" id="features">
        <motion.div variants={fadeUp} className="text-center mb-20">
          <span className="text-[11px] text-orange-500 font-bold tracking-[0.2em] uppercase">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight text-foreground">
            Everything You Need
          </h2>
          <p className="text-foreground/35 mt-4 max-w-md mx-auto leading-relaxed text-sm">
            Built specifically for restaurants partnering with hostels and hotels.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainerFast}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.number}
              variants={fadeIn}
              className="group relative p-8 rounded-3xl bg-white shadow-soft card-hover"
            >
              <span className="absolute top-6 right-6 text-5xl font-black text-foreground/2 group-hover:text-orange-500/6 transition-colors duration-700">
                {feature.number}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors duration-500">
                <feature.icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-foreground/40 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Partner Onboards", description: "Hotel or hostel signs up. You generate a unique QR code for their lobby.", icon: Building2 },
    { step: "02", title: "Guests Scan QR", description: "Residents scan the QR code. Menu loads instantly in their browser.", icon: QrCode },
    { step: "03", title: "Orders Flow In", description: "Guests browse the menu and place orders before the cutoff time.", icon: Utensils },
    { step: "04", title: "Cook & Deliver", description: "Get aggregated order summary. Cook in batch. Deliver by hostel.", icon: ChefHat },
  ];

  return (
    <RevealSection
      className="py-32 bg-linear-to-b from-accent/30 to-white relative"
    >
      <div className="max-w-6xl mx-auto px-6" id="how-it-works">
        <motion.div variants={fadeUp} className="text-center mb-20">
          <span className="text-[11px] text-orange-500 font-bold tracking-[0.2em] uppercase">
            Process
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight text-foreground">
            How It Works
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-4 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.div key={step.step} variants={fadeUp} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-px bg-linear-to-r from-border to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="w-28 h-28 rounded-3xl bg-white shadow-soft flex items-center justify-center mx-auto mb-8 card-hover">
                  <step.icon className="w-11 h-11 text-orange-500" />
                </div>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background text-[10px] font-bold mb-3">
                  {step.step}
                </span>
                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-foreground/35 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}

function PricingSection() {
  return (
    <RevealSection className="py-32 relative">
      <div className="max-w-5xl mx-auto px-6" id="pricing">
        <motion.div variants={fadeUp} className="text-center mb-20">
          <span className="text-[11px] text-orange-500 font-bold tracking-[0.2em] uppercase">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight">
            Simple, Transparent
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          <motion.div
            variants={fadeIn}
            className="p-9 rounded-3xl bg-white shadow-soft card-hover"
          >
            <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-1">
              For Restaurants
            </h3>
            <div className="text-4xl font-extrabold tracking-tight mt-3">Free</div>
            <p className="text-foreground/35 text-sm mt-1 mb-8">
              Commission on orders only
            </p>
            <ul className="space-y-3.5">
              {[
                "Unlimited partners",
                "QR code generation",
                "Menu management",
                "Order tracking",
                "Basic analytics",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-sm text-foreground/50"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login?mode=register"
              className="mt-10 block text-center py-3.5 rounded-xl border-2 border-foreground text-foreground text-sm font-semibold hover:bg-foreground hover:text-background transition-all duration-500"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="p-9 rounded-3xl bg-foreground text-background relative overflow-hidden shadow-soft-lg card-hover"
          >
            <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-sm font-bold text-background/50 uppercase tracking-wider mb-1">
              Pro
            </h3>
            <div className="text-4xl font-extrabold tracking-tight mt-3">
              ₹999
              <span className="text-lg font-normal text-background/50">/mo</span>
            </div>
            <p className="text-background/40 text-sm mt-1 mb-8">
              Everything you need to grow
            </p>
            <ul className="space-y-3.5">
              {[
                "Everything in Free",
                "Partner payouts",
                "Advanced analytics",
                "Priority support",
                "Revenue reports",
                "Custom branding",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-sm text-background/60"
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-background/70" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login?mode=register"
              className="mt-10 block text-center py-3.5 rounded-xl bg-white text-foreground text-sm font-semibold hover:opacity-90 transition-all duration-500"
            >
              Start 14-day Trial
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </RevealSection>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Rahul Sharma", role: "Hostel Owner, Hyderabad", content: "HRH transformed how our residents eat. No more kitchen hassles — quality food delivered on time, every single day." },
    { name: "Priya Reddy", role: "PG Resident, Bangalore", content: "Scanning the QR and ordering breakfast takes 30 seconds. The food arrives hot by 9 AM. Absolutely love it!" },
    { name: "Vijay Kumar", role: "Hotel Manager, Chennai", content: "The commission model is transparent. We earn without any kitchen investment. The CRM keeps everything organized." },
  ];

  return (
    <RevealSection className="py-32 bg-linear-to-b from-white to-accent/20 relative">
      <div className="max-w-6xl mx-auto px-6" id="testimonials">
        <motion.div variants={fadeUp} className="text-center mb-20">
          <span className="text-[11px] text-orange-500 font-bold tracking-[0.2em] uppercase">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-4 tracking-tight text-foreground">
            Loved by Everyone
          </h2>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeIn}
              className="p-8 rounded-3xl bg-white shadow-soft card-hover"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-foreground/45 leading-relaxed text-sm mb-8">
                &quot;{t.content}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-foreground/35">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-32 relative" ref={ref}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease }}
          className="p-14 md:p-20 rounded-4xl bg-foreground text-background relative overflow-hidden shadow-soft-lg"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/4 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/3 rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to Transform
              <br />
              Your Business?
            </h2>
            <p className="text-background/40 max-w-md mx-auto mt-6 mb-10 text-sm leading-relaxed">
              Join the platform that&apos;s changing how restaurants serve hostel
              and hotel residents.
            </p>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2.5 bg-white text-foreground px-8 py-4 rounded-full text-sm font-bold btn-smooth hover:shadow-soft-lg"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size="sm" />
              <span className="text-xl font-bold text-foreground tracking-tight">
                HRH
              </span>
            </div>
            <p className="text-foreground/30 max-w-sm leading-relaxed text-sm">
              Hotels & Restaurants Hub — connecting restaurants with hostels and
              hotels through a seamless food ordering platform.
            </p>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-bold mb-5">
              Quick Links
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Pricing", href: "#pricing" },
                { label: "Sign In", href: "/login" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-foreground/30 hover:text-foreground transition-colors duration-400 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-foreground text-sm font-bold mb-5">Contact</h3>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5 text-foreground/30 text-sm">
                <Mail className="w-4 h-4" /> hello@hrh.com
              </div>
              <div className="flex items-center gap-2.5 text-foreground/30 text-sm">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </div>
              <div className="flex items-center gap-2.5 text-foreground/30 text-sm">
                <MapPin className="w-4 h-4" /> Hyderabad, India
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-14 pt-8 text-center text-[12px] text-foreground/20 font-medium">
          &copy; {new Date().getFullYear()} HRH. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
