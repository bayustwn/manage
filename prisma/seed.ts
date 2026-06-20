import { randomBytes, scrypt } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64, maxmem: 128 * 16384 * 16 * 2 };

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, SCRYPT_CONFIG.dkLen, SCRYPT_CONFIG, (err, key) =>
      err ? reject(err) : resolve(key as Buffer),
    );
  });
  return `${salt}:${key.toString("hex")}`;
}

async function main() {
  const password = await hashPassword("password123");

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
      where: { userId: user.id, providerId: "credential" },
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
          accountId: user.id,
          providerId: "credential",
          password,
        },
      });
    }

    return user;
  }

  const admin = await seedUser("admin@projman.dev", "Admin", "SUPER_ADMIN");
  const user = await seedUser("user@projman.dev", "User", "USER");

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: { name: "Manage Development" },
    create: {
      id: "seed-project",
      name: "Manage Development",
      description: "Main project for developing Manage app",
      ownerId: admin.id,
      members: {
        create: { userId: user.id, role: "MEMBER" },
      },
    },
  });

  const backlog = await prisma.board.upsert({
    where: { id: "seed-backlog" },
    update: { name: "Backlog" },
    create: {
      id: "seed-backlog",
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
        await prisma.task.upsert({
          where: { id: `seed-task-${list.id}-${i}` },
          update: { title: titles[i] },
          create: {
            id: `seed-task-${list.id}-${i}`,
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
