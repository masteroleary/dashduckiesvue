CREATE TYPE "public"."registration_type" AS ENUM('StickerValid', 'Promotion', 'PurchasedDuck', 'PurchasedSticker');--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duck_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duck_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duck_sightings" (
	"id" serial PRIMARY KEY NOT NULL,
	"duck_id" uuid NOT NULL,
	"user_id" uuid,
	"claim_token" uuid,
	"sighting_date" timestamp with time zone DEFAULT now() NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"address" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "ducks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qt_code" integer NOT NULL,
	"name" text,
	"description" text,
	"image_url" text,
	"registration_type" "registration_type" DEFAULT 'StickerValid' NOT NULL,
	"registered_by_user_id" uuid,
	"claim_token" uuid,
	"claim_token_issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "email_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"discount_code" text,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone_number" text,
	"name_first" text,
	"name_last" text,
	"profile_image_url" text,
	"address_street1" text,
	"address_street2" text,
	"address_city" text,
	"address_state" text,
	"address_state_abbr" text,
	"address_zip" text,
	"address_country_abbr" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_member" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_or_phone" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duck_likes" ADD CONSTRAINT "duck_likes_duck_id_ducks_id_fk" FOREIGN KEY ("duck_id") REFERENCES "public"."ducks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duck_likes" ADD CONSTRAINT "duck_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duck_sightings" ADD CONSTRAINT "duck_sightings_duck_id_ducks_id_fk" FOREIGN KEY ("duck_id") REFERENCES "public"."ducks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duck_sightings" ADD CONSTRAINT "duck_sightings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ducks" ADD CONSTRAINT "ducks_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_idx" ON "auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "duck_likes_duck_user_idx" ON "duck_likes" USING btree ("duck_id","user_id");--> statement-breakpoint
CREATE INDEX "duck_sightings_duck_id_idx" ON "duck_sightings" USING btree ("duck_id");--> statement-breakpoint
CREATE INDEX "duck_sightings_claim_token_idx" ON "duck_sightings" USING btree ("claim_token");--> statement-breakpoint
CREATE UNIQUE INDEX "ducks_qt_code_idx" ON "ducks" USING btree ("qt_code");--> statement-breakpoint
CREATE INDEX "ducks_claim_token_idx" ON "ducks" USING btree ("claim_token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_number_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "verification_codes_lookup_idx" ON "verification_codes" USING btree ("email_or_phone","code");