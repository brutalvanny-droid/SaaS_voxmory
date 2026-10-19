CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Administrateur' NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"admin_email" text,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"metadata" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message_template" text DEFAULT '' NOT NULL,
	"target_list_id" text,
	"target_list_name" text,
	"status" text DEFAULT 'Brouillon' NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"category" text DEFAULT 'Client' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"date" date PRIMARY KEY NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	"listens" integer DEFAULT 0 NOT NULL,
	"orders" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_songs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"occasion" text DEFAULT '' NOT NULL,
	"style" text DEFAULT '' NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"mood" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"audio_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"client_reaction" text,
	"client_first_name" text,
	"visibility" text DEFAULT 'Private' NOT NULL,
	"start_time" integer DEFAULT 0 NOT NULL,
	"end_time" integer,
	"memory_slug" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"event_title" text NOT NULL,
	"recipient_name" text DEFAULT '' NOT NULL,
	"recipient_photo_url" text,
	"personal_message" text DEFAULT '' NOT NULL,
	"audio_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"song_title" text,
	"sender_name" text,
	"occasion" text,
	"lyrics" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"tracking_token" text NOT NULL,
	"status" text DEFAULT 'Nouvelle' NOT NULL,
	"payment_status" text DEFAULT 'Unpaid' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_city" text DEFAULT '' NOT NULL,
	"customer_country" text DEFAULT '' NOT NULL,
	"customer_email" text,
	"accepts_whatsapp" boolean DEFAULT false NOT NULL,
	"recipient_name" text DEFAULT '' NOT NULL,
	"recipient_relationship" text DEFAULT '' NOT NULL,
	"recipient_age" text,
	"event_date" text,
	"story_option" text DEFAULT 'write' NOT NULL,
	"story_text" text,
	"story_audio_url" text,
	"story_photo_url" text,
	"important_words" text,
	"avoid_words" text,
	"occasion" text,
	"mood" text DEFAULT '' NOT NULL,
	"music_style" text DEFAULT '' NOT NULL,
	"package_id" text,
	"vip_card_selected" boolean DEFAULT false NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"desired_delivery_date" text DEFAULT '' NOT NULL,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"special_instructions" text,
	"admin_notes" text,
	"final_audio_url" text,
	"cover_image_url" text,
	"memory_page_id" text,
	"song_title" text,
	"final_lyrics" text,
	"client_first_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"promise" text DEFAULT '' NOT NULL,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"delivery_time" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"provider" text DEFAULT 'saspay' NOT NULL,
	"provider_ref" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"method" text DEFAULT 'checkout' NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"country" text,
	"network" text,
	"checkout_url" text,
	"customer_phone" text,
	"idempotency_key" text NOT NULL,
	"raw_response" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"event_name" text NOT NULL,
	"event_date" text NOT NULL,
	"relationship" text DEFAULT '' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"client_name" text NOT NULL,
	"occasion" text DEFAULT '' NOT NULL,
	"comment" text NOT NULL,
	"screenshot_url" text,
	"audio_testimonial_url" text,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'saspay' NOT NULL,
	"event_type" text NOT NULL,
	"provider_ref" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "broadcast_contacts" ADD CONSTRAINT "broadcast_contacts_list_id_broadcast_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."broadcast_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_pages" ADD CONSTRAINT "memory_pages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "broadcast_contacts_list_idx" ON "broadcast_contacts" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reference_unique" ON "orders" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_tracking_token_unique" ON "orders" USING btree ("tracking_token");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_provider_ref_idx" ON "payments" USING btree ("provider_ref");--> statement-breakpoint
CREATE INDEX "rate_limit_window_idx" ON "rate_limit_counters" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "webhook_events_provider_ref_idx" ON "webhook_events" USING btree ("provider_ref");--> statement-breakpoint
CREATE INDEX "webhook_events_type_idx" ON "webhook_events" USING btree ("event_type");