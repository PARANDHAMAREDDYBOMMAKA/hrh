import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MenuClient from "./menu-client";

export default async function MenuPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = await params;

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
