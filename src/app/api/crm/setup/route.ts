import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const secret = body.secret ?? new URL(req.url).searchParams.get("secret");

  if (!process.env.NEXTAUTH_SECRET || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Invalid setup secret" }, { status: 401 });
  }

  const existingOwner = await prisma.user.findFirst({ where: { role: "CRM_OWNER" } });
  if (existingOwner) {
    return NextResponse.json(
      { error: "A CRM owner already exists. This endpoint is disabled." },
      { status: 409 }
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").toLowerCase().trim();
  if (!name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "Name and a valid email are required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const rawPassword = crypto.randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const owner = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "CRM_OWNER",
      isVerified: true,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  audit(req, {
    action: "CRM_OWNER_SETUP",
    entityType: "User",
    entityId: owner.id,
  });

  return NextResponse.json(
    {
      message: "CRM owner created. Save these credentials, then delete this route.",
      owner,
      credentials: { email, password: rawPassword },
    },
    { status: 201 }
  );
}
