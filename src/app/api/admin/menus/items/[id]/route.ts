import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  const { id } = await params;
  const body = await req.json();

  if (body.price !== undefined) {
    body.price = parseFloat(body.price);
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
