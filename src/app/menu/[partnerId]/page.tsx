import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MenuClient from "./menu-client";

export default async function MenuPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/menu/${partnerId}`)}`);
  }

  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner || !partner.isActive) notFound();

  const breakfastItems = await prisma.menuItem.findMany({
    where: { slotType: "BREAKFAST", isAvailable: true },
    orderBy: { sortOrder: "asc" },
  });

  const dinnerItems = await prisma.menuItem.findMany({
    where: { slotType: "DINNER", isAvailable: true },
    orderBy: { sortOrder: "asc" },
  });

  const timeSlots = await prisma.timeSlot.findMany({ where: { isActive: true } });

  return (
    <MenuClient
      partner={JSON.parse(JSON.stringify(partner))}
      breakfastItems={JSON.parse(JSON.stringify(breakfastItems))}
      dinnerItems={JSON.parse(JSON.stringify(dinnerItems))}
      timeSlots={JSON.parse(JSON.stringify(timeSlots))}
    />
  );
}
