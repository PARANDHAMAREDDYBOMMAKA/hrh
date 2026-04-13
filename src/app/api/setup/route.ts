import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: "admin@hrh.com" } });
    if (existing) {
      return NextResponse.json({ message: "Admin already exists. Delete this route." });
    }

    const hash = await bcrypt.hash("admin123", 12);

    await prisma.user.create({
      data: {
        name: "HRH Admin",
        email: "admin@hrh.com",
        password: hash,
        role: "ADMIN",
      },
    });

    await prisma.timeSlot.upsert({
      where: { slotType: "BREAKFAST" },
      update: {},
      create: { name: "Breakfast", slotType: "BREAKFAST", orderCutoffTime: "07:00", deliveryTime: "09:00" },
    });

    await prisma.timeSlot.upsert({
      where: { slotType: "DINNER" },
      update: {},
      create: { name: "Dinner", slotType: "DINNER", orderCutoffTime: "17:00", deliveryTime: "20:00" },
    });

    return NextResponse.json({ message: "Admin created. Email: admin@hrh.com, Password: admin123. DELETE THIS ROUTE NOW." });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
