-- Remove SUPER_ADMIN from UserRole enum
UPDATE "user" SET "role" = 'USER' WHERE "role" = 'SUPER_ADMIN';
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('USER');
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "UserRole_old";
