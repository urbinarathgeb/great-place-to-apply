ALTER TABLE "companies" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "role" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "recommends" boolean NOT NULL;