import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

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

  if (body.imageUrl !== undefined) {
    const existing = await prisma.menuItem.findUnique({ where: { id }, select: { imageUrl: true } });
    if (existing?.imageUrl && existing.imageUrl !== body.imageUrl) {
      await deleteFile(existing.imageUrl);
    }
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
  const item = await prisma.menuItem.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.menuItem.delete({ where: { id } });
  if (item?.imageUrl) await deleteFile(item.imageUrl);
  return NextResponse.json({ success: true });
}
