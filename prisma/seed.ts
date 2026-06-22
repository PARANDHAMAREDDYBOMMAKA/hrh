import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@hrh.com" },
    update: { password: await bcrypt.hash("admin123", 12) },
    create: {
      name: "HRH Admin",
      email: "admin@hrh.com",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log("Admin:", admin.email, "/ admin123");

  const partner = await prisma.partner.upsert({
    where: { id: "seed-partner-sunrise" },
    update: {},
    create: {
      id: "seed-partner-sunrise",
      name: "Sunrise Hostel",
      address: "12 MG Road",
      city: "Bengaluru",
      contactPerson: "Ravi Kumar",
      phone: "9876543210",
      email: "contact@sunrisehostel.com",
      commissionRate: 10,
      totalRooms: 40,
      isActive: true,
    },
  });
  console.log("Partner:", partner.name);

  const partnerUser = await prisma.user.upsert({
    where: { email: "partner@hrh.com" },
    update: { password: await bcrypt.hash("partner123", 12), partnerId: partner.id },
    create: {
      name: "Sunrise Manager",
      email: "partner@hrh.com",
      phone: "9876500000",
      password: await bcrypt.hash("partner123", 12),
      role: "PARTNER",
      partnerId: partner.id,
      isVerified: true,
    },
  });
  console.log("Partner user:", partnerUser.email, "/ partner123");

  const customer = await prisma.user.upsert({
    where: { email: "customer@hrh.com" },
    update: { password: await bcrypt.hash("customer123", 12) },
    create: {
      name: "Sample Customer",
      email: "customer@hrh.com",
      phone: "9123456780",
      password: await bcrypt.hash("customer123", 12),
      role: "CUSTOMER",
      isVerified: true,
      customerProfile: {
        create: { defaultPartnerId: partner.id, defaultRoomNumber: "101" },
      },
    },
  });
  console.log("Customer:", customer.email, "/ customer123");

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
  console.log("Time slots ready");

  const menuCount = await prisma.menuItem.count();
  if (menuCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        { name: "Masala Dosa", description: "Crispy dosa with potato filling", price: 60, isVeg: true, slotType: "BREAKFAST", sortOrder: 0 },
        { name: "Idli Vada", description: "Steamed idli with vada and chutney", price: 50, isVeg: true, slotType: "BREAKFAST", sortOrder: 1 },
        { name: "Egg Bhurji", description: "Spiced scrambled eggs", price: 70, isVeg: false, slotType: "BREAKFAST", sortOrder: 2 },
        { name: "Veg Thali", description: "Rice, dal, sabzi, roti, curd", price: 120, isVeg: true, slotType: "DINNER", sortOrder: 0 },
        { name: "Chicken Biryani", description: "Hyderabadi style biryani", price: 180, isVeg: false, slotType: "DINNER", sortOrder: 1 },
        { name: "Paneer Butter Masala", description: "With 2 butter rotis", price: 150, isVeg: true, slotType: "DINNER", sortOrder: 2 },
      ],
    });
    console.log("Sample menu items created");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
