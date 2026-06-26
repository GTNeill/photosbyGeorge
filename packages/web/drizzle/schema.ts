import { sqliteTable, AnySQLiteColumn, uniqueIndex, integer, text, foreignKey, index } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const categories = sqliteTable("categories", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	coverPhotoId: integer("cover_photo_id"),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("categories_slug_unique").on(table.slug),
]);

export const photos = sqliteTable("photos", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	key: text().notNull(),
	url: text().notNull(),
	title: text(),
	categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" } ),
	isFavorite: integer("is_favorite").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: integer("created_at").notNull(),
});

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("account_userId_idx").on(table.userId),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	index("session_userId_idx").on(table.userId),
	uniqueIndex("session_token_unique").on(table.token),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").default(false).notNull(),
	image: text(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
},
(table) => [
	uniqueIndex("user_email_unique").on(table.email),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
},
(table) => [
	index("verification_identifier_idx").on(table.identifier),
]);

export const subcategories = sqliteTable("subcategories", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	updatedAt: integer("updated_at").notNull(),
});

