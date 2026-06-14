DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_phone_number_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email") WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_number_idx" ON "users" USING btree ("phone_number") WHERE "users"."deleted_at" is null;