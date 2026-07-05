import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { audit, actorOf } from "@/lib/audit";

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

  audit(req, {
    action: "MENU_ITEM_UPDATE",
    entityType: "MenuItem",
    entityId: item.id,
    actor: actorOf(session),
    metadata: { changes: body },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.menuItem.findUnique({ where: { id }, select: { name: true, imageUrl: true } });
  await prisma.menuItem.delete({ where: { id } });
  if (item?.imageUrl) await deleteFile(item.imageUrl);

  audit(req, {
    action: "MENU_ITEM_DELETE",
    entityType: "MenuItem",
    entityId: id,
    actor: actorOf(session),
    metadata: { name: item?.name ?? null },
  });

  return NextResponse.json({ success: true });
}
