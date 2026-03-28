import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create employee user
  const employeePassword = await bcrypt.hash("employee123", 10);
  await prisma.user.upsert({
    where: { email: "jane@acmecorp.com" },
    update: {},
    create: {
      email: "jane@acmecorp.com",
      name: "Jane Cooper",
      passwordHash: employeePassword,
      role: "employee",
      department: "Engineering",
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@acmecorp.com" },
    update: {},
    create: {
      email: "admin@acmecorp.com",
      name: "Mike Johnson",
      passwordHash: adminPassword,
      role: "admin",
      department: "Finance",
    },
  });

  console.log("✅ Seeded successfully!");
  console.log("   Employee: jane@acmecorp.com / employee123");
  console.log("   Admin:    admin@acmecorp.com / admin123");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
