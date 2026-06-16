import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET, getPublicUrl } from "../lib/s3";

export const photosRouter = new Hono()
  // Image proxy — serves S3 images same-origin to avoid CORS issues
  .get("/image/*", async (c) => {
    const key = decodeURIComponent(c.req.path.replace(/^\/api\/photos\/image\//, ""));
    if (!key) return c.text("Not found", 404);
    try {
      const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
      const res = await s3.send(cmd);
      const stream = res.Body as ReadableStream;
      const contentType = res.ContentType ?? "image/jpeg";
      return new Response(stream, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return c.text("Not found", 404);
    }
  })
  // Get all favorites for hero slideshow
  .get("/favorites", async (c) => {
    const favs = await db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.isFavorite, true))
      .orderBy(schema.photos.sortOrder, schema.photos.createdAt);
    return c.json({ photos: favs }, 200);
  })
  // Get all photos (admin)
  .get("/", requireAdmin, async (c) => {
    const allPhotos = await db
      .select()
      .from(schema.photos)
      .orderBy(desc(schema.photos.createdAt));
    return c.json({ photos: allPhotos }, 200);
  })
  // Presign upload URL
  .post("/presign", requireAdmin, async (c) => {
    const { filename, contentType } = await c.req.json();
    const key = `photos/${Date.now()}-${filename.replace(/\s+/g, "-").replace(/%/g, "")}`;
    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );
    const publicUrl = getPublicUrl(key);
    return c.json({ url, key, publicUrl }, 200);
  })
  // Save photo record after upload
  .post("/", requireAdmin, async (c) => {
    const { key, url, title, categoryId } = await c.req.json();
    const [photo] = await db
      .insert(schema.photos)
      .values({ key, url, title: title ?? null, categoryId: categoryId ?? null, isFavorite: false, sortOrder: 0 })
      .returning();
    return c.json({ photo }, 201);
  })
  // Update photo (title, category, favorite, order)
  .patch("/:id", requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Partial<typeof schema.photos.$inferInsert> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.isFavorite !== undefined) updates.isFavorite = body.isFavorite;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;
    const [photo] = await db.update(schema.photos).set(updates).where(eq(schema.photos.id, id)).returning();
    return c.json({ photo }, 200);
  })
  // Delete photo
  .delete("/:id", requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const [photo] = await db.select().from(schema.photos).where(eq(schema.photos.id, id));
    if (!photo) return c.json({ message: "Not found" }, 404);
    // Delete from S3
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: photo.key }));
    await db.delete(schema.photos).where(eq(schema.photos.id, id));
    return c.json({ success: true }, 200);
  });
