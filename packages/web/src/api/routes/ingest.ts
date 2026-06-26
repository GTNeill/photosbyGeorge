import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET, getPublicUrl } from "../lib/s3";

export const ingestRouter = new Hono()

  /**
   * POST /api/integrations/google-drive/ingest
   *
   * Accepts a single photo payload from the Google Apps Script importer.
   * Auth: x-drive-ingest-token header must match DRIVE_INGEST_TOKEN env var.
   *
   * Body:
   *   fileId      — Drive file ID (used as dedup key)
   *   fileName    — original filename
   *   mimeType    — e.g. image/jpeg
   *   sectionName — subfolder name → category name
   *   sectionSlug — slugified category slug
   *   caption     — display title (derived from filename by script)
   *   featured    — boolean — marks photo as a homepage favorite
   *   dataBase64  — base64-encoded file bytes
   */
  .post("/google-drive/ingest", async (c) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const expectedToken = process.env.DRIVE_INGEST_TOKEN;
    if (!expectedToken) {
      return c.json({ ok: false, stage: "config", detail: "DRIVE_INGEST_TOKEN not configured on server" }, 500);
    }
    const providedToken = c.req.header("x-drive-ingest-token");
    if (!providedToken || providedToken !== expectedToken) {
      return c.json({ ok: false, stage: "auth", detail: "Invalid or missing x-drive-ingest-token" }, 401);
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: {
      fileId: string;
      fileName: string;
      mimeType: string;
      sectionName: string;
      sectionSlug: string;
      caption?: string;
      featured?: boolean;
      dataBase64: string;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, stage: "parse", detail: "Invalid JSON body" }, 400);
    }

    const { fileId, fileName, mimeType, sectionName, sectionSlug, caption, featured, dataBase64 } = body;
    if (!fileId || !fileName || !mimeType || !sectionName || !sectionSlug || !dataBase64) {
      return c.json({ ok: false, stage: "validate", detail: "Missing required fields" }, 400);
    }

    // ── Deduplicate — skip if this Drive fileId was already imported ──────────
    // We store the Drive fileId as the photo title prefix: "driveId:<id>|<caption>"
    // so we can find it. Alternatively we use a simple key prefix check.
    const s3Key = `photos/drive-${fileId}-${fileName.replace(/\s+/g, "-").replace(/%/g, "")}`;
    const existing = await db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.key, s3Key))
      .get();
    if (existing) {
      return c.json({ ok: true, skipped: true, reason: "already imported" }, 200);
    }

    // ── Ensure category exists (create if not) ────────────────────────────────
    let category = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, sectionSlug))
      .get();

    if (!category) {
      const [created] = await db
        .insert(schema.categories)
        .values({ name: sectionName, slug: sectionSlug })
        .returning();
      category = created;
    }

    // ── Upload to S3 ──────────────────────────────────────────────────────────
    let imageBytes: Uint8Array;
    try {
      const binaryStr = atob(dataBase64);
      imageBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imageBytes[i] = binaryStr.charCodeAt(i);
      }
    } catch {
      return c.json({ ok: false, stage: "decode", detail: "Failed to decode base64 image data" }, 400);
    }

    try {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: imageBytes,
        ContentType: mimeType,
      }));
    } catch (err: any) {
      return c.json({ ok: false, stage: "s3", detail: err?.message ?? "S3 upload failed" }, 500);
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    const url = getPublicUrl(s3Key);
    const title = caption || fileName.replace(/\.[^.]+$/, "");

    const [photo] = await db
      .insert(schema.photos)
      .values({
        key: s3Key,
        url,
        title,
        categoryId: category.id,
        isFavorite: featured ? true : false,
        sortOrder: 0,
      })
      .returning();

    return c.json({ ok: true, skipped: false, photoId: photo.id, categoryId: category.id }, 200);
  });
