import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

export const categoriesRouter = new Hono()
  // List all categories
  .get("/", async (c) => {
    const cats = await db.select().from(schema.categories).orderBy(schema.categories.name);
    return c.json({ categories: cats }, 200);
  })

  // Create category
  .post("/", requireAdmin, async (c) => {
    const { name, slug } = await c.req.json();
    if (!name || !slug) return c.json({ message: "name and slug required" }, 400);
    const [cat] = await db.insert(schema.categories).values({ name, slug }).returning();
    return c.json({ category: cat }, 201);
  })

  // Update (rename) category
  .patch("/:id", requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const { name, slug } = await c.req.json();
    if (!name && !slug) return c.json({ message: "name or slug required" }, 400);
    const updates: Partial<typeof schema.categories.$inferInsert> = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    const [cat] = await db
      .update(schema.categories)
      .set(updates)
      .where(eq(schema.categories.id, id))
      .returning();
    return c.json({ category: cat }, 200);
  })

  // Delete category
  .delete("/:id", requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return c.json({ success: true }, 200);
  })

  // List subcategories for a category
  .get("/:id/subcategories", async (c) => {
    const id = Number(c.req.param("id"));
    const subs = await db
      .select()
      .from(schema.subcategories)
      .where(eq(schema.subcategories.categoryId, id))
      .orderBy(schema.subcategories.name);
    return c.json({ subcategories: subs }, 200);
  })

  // Create subcategory
  .post("/:id/subcategories", requireAdmin, async (c) => {
    const categoryId = Number(c.req.param("id"));
    const { name, slug } = await c.req.json();
    if (!name || !slug) return c.json({ message: "name and slug required" }, 400);
    const [sub] = await db
      .insert(schema.subcategories)
      .values({ name, slug, categoryId })
      .returning();
    return c.json({ subcategory: sub }, 201);
  })

  // Update (rename) subcategory
  .patch("/:id/subcategories/:subId", requireAdmin, async (c) => {
    const subId = Number(c.req.param("subId"));
    const { name, slug } = await c.req.json();
    if (!name && !slug) return c.json({ message: "name or slug required" }, 400);
    const updates: Partial<typeof schema.subcategories.$inferInsert> = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    const [sub] = await db
      .update(schema.subcategories)
      .set(updates)
      .where(eq(schema.subcategories.id, subId))
      .returning();
    return c.json({ subcategory: sub }, 200);
  })

  // Delete subcategory
  .delete("/:id/subcategories/:subId", requireAdmin, async (c) => {
    const subId = Number(c.req.param("subId"));
    await db.delete(schema.subcategories).where(eq(schema.subcategories.id, subId));
    return c.json({ success: true }, 200);
  })

  // Photos by category slug (public)
  .get("/:slug/photos", async (c) => {
    const slug = c.req.param("slug");
    const cat = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .get();
    if (!cat) return c.json({ message: "Not found" }, 404);
    const photosList = await db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.categoryId, cat.id))
      .orderBy(schema.photos.sortOrder, schema.photos.createdAt);
    return c.json({ category: cat, photos: photosList }, 200);
  });
