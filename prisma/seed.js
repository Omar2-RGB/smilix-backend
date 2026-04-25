require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = [
    { name: "admin", description: "System Administrator" },
    { name: "doctor", description: "Doctor" },
    { name: "receptionist", description: "Receptionist" },
    { name: "accountant", description: "Accountant" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: "admin" },
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      fullName: "System Admin",
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log("Seed completed successfully.");
  console.log("Admin username: admin");
  console.log("Admin password: 123456");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });