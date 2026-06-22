import { randomBytes, scrypt } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../generated/prisma/client.js";

// --- Guard: only run against localhost ---
function isLocalDatabaseUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("100.")
    );
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

// --- Prisma setup ---
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// --- Scrypt config (must match better-auth) ---
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

async function upsertUser(email: string, name: string, plainPassword: string) {
  const password = await hashPassword(plainPassword);

  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true },
    create: { email, name, role: UserRole.USER, emailVerified: true },
  });

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password } });
  } else {
    await prisma.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password },
    });
  }

  return user;
}

async function upsertProjectMember(projectId: string, userId: string, role: "OWNER" | "MEMBER" | "VIEWER") {
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: { role },
    create: { projectId, userId, role },
  });
}

async function upsertBoard(projectId: string, name: string, position: number, lists: string[]) {
  await prisma.board.upsert({
    where: { id: `seed-board-${name.toLowerCase().replace(/\s+/g, "-")}` },
    update: { name },
    create: {
      id: `seed-board-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      projectId,
      position,
      lists: {
        create: lists.map((listName, i) => ({ name: listName, position: i })),
      },
    },
  });
}

async function upsertTask(listId: string, index: number, title: string, reporterId: string, assigneeId?: string) {
  await prisma.task.upsert({
    where: { id: `seed-task-${listId}-${index}` },
    update: { title },
    create: {
      id: `seed-task-${listId}-${index}`,
      title,
      listId,
      position: index,
      reporterId,
      ...(assigneeId ? { assigneeId } : {}),
    },
  });
}

// ===== Main =====
async function main() {
  // Cleanup old "email" accounts from previous seed (better-auth uses "credential")
  await prisma.account.deleteMany({ where: { providerId: "email" } });

  // ── Users ─────────────────────────────────────────────────
  const admin = await upsertUser("admin@projman.dev", "Admin", seedAdminPassword);
  const user = await upsertUser("user@projman.dev", "User", seedUserPassword!);
  const viewer = await upsertUser("viewer@projman.dev", "Viewer", seedUserPassword!);

  // ── Projects ───────────────────────────────────────────────
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

  // Project members
  await upsertProjectMember(project.id, admin.id, "OWNER");
  await upsertProjectMember(project.id, user.id, "MEMBER");
  await upsertProjectMember(project.id, viewer.id, "VIEWER");

  // Second project owned by User
  const project2 = await prisma.project.upsert({
    where: { id: "seed-project-2" },
    update: { name: "Marketing Site" },
    create: {
      id: "seed-project-2",
      name: "Marketing Site",
      description: "Company landing page redesign",
      ownerId: user.id,
    },
  });

  await upsertProjectMember(project2.id, user.id, "OWNER");
  await upsertProjectMember(project2.id, admin.id, "MEMBER");

  // ── Boards & Lists ─────────────────────────────────────────
  await upsertBoard(project.id, "Backlog", 0, ["To Do", "In Progress", "Done"]);

  // ── Tasks ──────────────────────────────────────────────────
  const boards = await prisma.board.findMany({
    where: { projectId: project.id },
    include: { lists: { orderBy: { position: "asc" } } },
  });

  for (const board of boards) {
    for (const list of board.lists) {
      const titles: Record<string, string[]> = {
        "To Do": ["Setup CI/CD pipeline", "Write onboarding docs", "Add unit tests for auth"],
        "In Progress": ["Implement task drag & drop", "Design system audit"],
        Done: ["Database schema design", "Auth flow implementation"],
      };

      const items = titles[list.name] ?? [];

      for (let i = 0; i < items.length; i++) {
        await upsertTask(list.id, i, items[i], admin.id, i === 0 ? user.id : undefined);
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
