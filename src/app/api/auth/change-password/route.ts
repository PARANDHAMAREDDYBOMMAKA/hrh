import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email, newPassword, totalRooms } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      audit(req, {
        action: "PASSWORD_CHANGE",
        status: "FAILURE",
        actor: { email: email.toLowerCase().trim() },
        metadata: { reason: "user_not_found" },
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.mustChangePassword) {
      audit(req, {
        action: "PASSWORD_CHANGE",
        status: "FAILURE",
        actor: { id: user.id, email: user.email, role: user.role },
        metadata: { reason: "not_required" },
      });
      return NextResponse.json({ error: "Password change not required" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    if (user.role === "PARTNER" && user.partnerId && totalRooms !== undefined) {
      const rooms = Math.max(0, parseInt(totalRooms) || 0);
      await prisma.partner.update({ where: { id: user.partnerId }, data: { totalRooms: rooms } });
    }

    audit(req, {
      action: "PASSWORD_CHANGE",
      entityType: "User",
      entityId: user.id,
      actor: { id: user.id, email: user.email, role: user.role },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
