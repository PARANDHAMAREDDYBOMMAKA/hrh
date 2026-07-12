import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { SIGNUP_ENABLED } from "@/lib/flags";

export async function POST(req: Request) {
  if (!SIGNUP_ENABLED) {
    return NextResponse.json({ error: "Sign ups are currently disabled" }, { status: 403 });
  }

  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const phoneDigits = phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phoneDigits,
        password: hashedPassword,
        role: "CUSTOMER",
        isVerified: true,
        customerProfile: { create: {} },
      },
    });

    audit(req, {
      action: "USER_REGISTER",
      entityType: "User",
      entityId: user.id,
      actor: { id: user.id, email: user.email, role: user.role },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[Register Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
