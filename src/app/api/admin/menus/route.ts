import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}


export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slotType = searchParams.get("slotType");

  const items = await prisma.menuItem.findMany({
    where: slotType ? { slotType: slotType as "BREAKFAST" | "DINNER" } : {},
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, description, price, isVeg, slotType } = await req.json();

    if (!name || price === undefined || !slotType) {
      return NextResponse.json({ error: "Name, price, and slot type are required" }, { status: 400 });
    }

    if (!["BREAKFAST", "DINNER"].includes(slotType)) {
      return NextResponse.json({ error: "Invalid slot type" }, { status: 400 });
    }

    const maxOrder = await prisma.menuItem.findFirst({
      where: { slotType },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        isVeg: isVeg ?? true,
        slotType,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
