-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingPhone" TEXT,
ADD COLUMN     "cedula" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingPhone" TEXT,
ADD COLUMN     "cedula" TEXT;
