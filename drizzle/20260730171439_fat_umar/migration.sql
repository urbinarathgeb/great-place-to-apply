CREATE INDEX "aspect_rating_stage_review_idx" ON "aspect_rating" ("stage_review_id");--> statement-breakpoint
CREATE INDEX "companies_category_idx" ON "companies" ("category_id");--> statement-breakpoint
CREATE INDEX "reviews_company_created_idx" ON "reviews" ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "stage_reviews_review_idx" ON "stage_reviews" ("review_id");--> statement-breakpoint
CREATE INDEX "stage_reviews_stage_idx" ON "stage_reviews" ("stage_id");