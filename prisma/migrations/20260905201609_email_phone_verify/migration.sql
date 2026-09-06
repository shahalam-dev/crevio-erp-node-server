-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verify_at" TIMESTAMP(3),
ADD COLUMN     "phone_verify_at" TIMESTAMP(3);
