import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(partners);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, address, city, contactPerson, phone, email, commissionRate } = body;

    if (!name || !address || !contactPerson || !phone || !email) {
      return NextResponse.json({ error: "All fields including email are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const rawPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const partner = await prisma.partner.create({
      data: {
        name,
        address,
        city: city || "",
        contactPerson,
        phone,
        email: email.toLowerCase().trim(),
        commissionRate: Math.max(0, parseFloat(commissionRate) || 10),
        users: {
          create: {
            name: contactPerson,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone.replace(/[^0-9]/g, "") || undefined,
            role: "PARTNER",
            isVerified: true,
            mustChangePassword: true,
          },
        },
      },
    });

    return NextResponse.json(
      { ...partner, credentials: { email: email.toLowerCase().trim(), password: rawPassword } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Partner creation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
