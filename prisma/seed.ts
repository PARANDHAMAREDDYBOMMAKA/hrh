import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hrh.com" },
    update: {},
    create: {
      name: "HRH Admin",
      email: "admin@hrh.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);

  await prisma.timeSlot.upsert({
    where: { slotType: "BREAKFAST" },
    update: {},
    create: {
      name: "Breakfast",
      slotType: "BREAKFAST",
      orderCutoffTime: "07:00",
      deliveryTime: "09:00",
    },
  });

  await prisma.timeSlot.upsert({
    where: { slotType: "DINNER" },
    update: {},
    create: {
      name: "Dinner",
      slotType: "DINNER",
      orderCutoffTime: "17:00",
      deliveryTime: "20:00",
    },
  });

  console.log("Time slots created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
