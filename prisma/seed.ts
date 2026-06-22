import { randomBytes, scrypt } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../generated/prisma/client.js";

function isLocalDatabaseUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed production database");
}

if (!isLocalDatabaseUrl(process.env.DATABASE_URL || "")) {
  throw new Error("Seed can only run against a local database (localhost or 127.0.0.1)");
}

const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
const seedUserPassword = process.env.SEED_USER_PASSWORD ?? seedAdminPassword;

if (!seedAdminPassword || seedAdminPassword.length < 12) {
  throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
}

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
  async function seedUser(email: string, name: string, role: UserRole, plainPassword: string) {
    const password = await hashPassword(plainPassword);

    const user = await prisma.user.upsert({
      where: { email },
      update: { emailVerified: true },
      create: {
        email,
        name,
        role,
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

  const admin = await seedUser("admin@projman.dev", "Admin", UserRole.SUPER_ADMIN, seedAdminPassword);
  const user = await seedUser("user@projman.dev", "User", UserRole.USER, seedUserPassword!);

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: { name: "Manage Development" },
    create: {
      id: "seed-project",
      name: "Manage Development",
      description: "Main project for developing Manage app",
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: { role: "OWNER" },
    create: { projectId: project.id, userId: admin.id, role: "OWNER" },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    update: { role: "MEMBER" },
    create: { projectId: project.id, userId: user.id, role: "MEMBER" },
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
