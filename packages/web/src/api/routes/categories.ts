import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

export const categoriesRouter = new Hono()
  .get("/", async (c) => {
    const cats = await db.select().from(schema.categories).orderBy(schema.categories.name);
    return c.json({ categories: cats }, 200);
  })
  .post("/", requireAdmin, async (c) => {
    const { name, slug } = await c.req.json();
    if (!name || !slug) return c.json({ message: "name and slug required" }, 400);
    const [cat] = await db.insert(schema.categories).values({ name, slug }).returning();
    return c.json({ category: cat }, 201);
  })
  .delete("/:id", requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return c.json({ success: true }, 200);
  })
  .get("/:slug/photos", async (c) => {
    const slug = c.req.param("slug");
    const cat = await db.select().from(schema.categories).where(eq(schema.categories.slug, slug)).get();
    if (!cat) return c.json({ message: "Not found" }, 404);
    const photosList = await db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.categoryId, cat.id))
      .orderBy(schema.photos.sortOrder, schema.photos.createdAt);
    return c.json({ category: cat, photos: photosList }, 200);
  });
