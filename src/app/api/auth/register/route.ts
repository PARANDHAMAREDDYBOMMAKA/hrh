import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    if (phoneDigits) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: phoneDigits } });
      if (phoneExists) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }
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

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[Register Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email or phone number already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
