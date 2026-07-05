import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase().trim(),
        token: code.trim(),
      },
    });

    
    if (!token) {
      audit(req, {
        action: "EMAIL_VERIFY",
        status: "FAILURE",
        actor: { email: email.toLowerCase().trim() },
        metadata: { reason: "invalid_code" },
      });
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (token.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: token.identifier, token: token.token } },
      });
      audit(req, {
        action: "EMAIL_VERIFY",
        status: "FAILURE",
        actor: { email: email.toLowerCase().trim() },
        metadata: { reason: "code_expired" },
      });
      return NextResponse.json({ error: "Verification code has expired. Please register again." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { isVerified: true, emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: token.identifier, token: token.token } },
    });

    audit(req, {
      action: "EMAIL_VERIFY",
      actor: { email: email.toLowerCase().trim() },
    });

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
