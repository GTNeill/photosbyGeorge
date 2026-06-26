import { relations } from "drizzle-orm/relations";
import { categories, photos, user, account, session, subcategories } from "./schema";

export const photosRelations = relations(photos, ({one}) => ({
	category: one(categories, {
		fields: [photos.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	photos: many(photos),
	subcategories: many(subcategories),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const subcategoriesRelations = relations(subcategories, ({one}) => ({
	category: one(categories, {
		fields: [subcategories.categoryId],
		references: [categories.id]
	}),
}));