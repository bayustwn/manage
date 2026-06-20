import { hashSync } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = hashSync("password123", 10);

  async function seedUser(email: string, name: string, role: string) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { emailVerified: true },
      create: {
        email,
        name,
        role: role as any,
        emailVerified: true,
      },
    });

    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "email" },
    });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: { password },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: email,
          providerId: "email",
          password,
        },
      });
    }

    return user;
  }

  const admin = await seedUser("admin@projman.dev", "Admin", "SUPER_ADMIN");
  const user = await seedUser("user@projman.dev", "User", "USER");

  const project = await prisma.project.create({
    data: {
      name: "Manage Development",
      description: "Main project for developing Manage app",
      ownerId: admin.id,
      members: {
        create: { userId: user.id, role: "MEMBER" },
      },
    },
  });

  const backlog = await prisma.board.create({
    data: {
      name: "Backlog",
      projectId: project.id,
      position: 0,
      lists: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 },
        ],
      },
    },
  });

  const boards = await prisma.board.findMany({
    where: { projectId: project.id },
    include: { lists: { orderBy: { position: "asc" } } },
  });

  for (const board of boards) {
    for (const list of board.lists) {
      const titles =
        list.name === "To Do"
          ? ["Setup CI/CD", "Write documentation", "Add unit tests"]
          : list.name === "In Progress"
            ? ["Implement auth flow"]
            : ["Design database schema"];

      for (let i = 0; i < titles.length; i++) {
        await prisma.task.create({
          data: {
            title: titles[i],
            listId: list.id,
            position: i,
            reporterId: admin.id,
            assigneeId: i === 0 ? user.id : undefined,
          },
        });
      }
    }
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
