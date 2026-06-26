import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET, getPublicUrl } from "../lib/s3";
import { google } from "googleapis";

export const driveImportRouter = new Hono()

  /** GET /api/drive-import/config */
  .get("/config", requireAdmin, async (c) => {
    return c.json({
      hasFolderId: !!process.env.DRIVE_FOLDER_ID,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    }, 200);
  })

  /**
   * POST /api/drive-import/run
   * Drive folder structure:
   *   root/
   *     <Category>/          → creates/reuses category
   *       image.jpg          → photo assigned to category
   *       <Subcategory>/     → creates/reuses subcategory under parent category
   *         image.jpg        → photo assigned to both category + subcategory
   */
  .get("/status", requireAdmin, (c) => {
    return c.json(importStatus);
  })

  .post("/run", requireAdmin, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const folderId: string = body.folderId ?? process.env.DRIVE_FOLDER_ID ?? "";

    if (!folderId) return c.json({ ok: false, error: "folderId is required" }, 400);

    const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!saJson) return c.json({ ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON env var is missing." }, 500);

    if (importStatus.running) {
      return c.json({ ok: false, error: "Import already in progress", status: importStatus }, 409);
    }

    // Fire and forget — respond immediately, run in background
    importStatus = { running: true, imported: 0, skipped: 0, failed: 0, log: [], startedAt: new Date().toISOString(), finishedAt: null };
    runImport(folderId, saJson).catch((err) => {
      importStatus.log.push(`FATAL: ${err?.message ?? err}`);
      importStatus.running = false;
      importStatus.finishedAt = new Date().toISOString();
    });
    return c.json({ ok: true, message: "Import started. Poll /api/drive-import/status for progress." }, 202);
  });

// ── import state (in-memory, single process) ──────────────────────────────────
let importStatus: {
  running: boolean;
  imported: number;
  skipped: number;
  failed: number;
  log: string[];
  startedAt: string | null;
  finishedAt: string | null;
} = { running: false, imported: 0, skipped: 0, failed: 0, log: [], startedAt: null, finishedAt: null };

async function runImport(folderId: string, saJson: string) {
    // Service account auth — works on private Drive files shared with the SA email
    const credentials = JSON.parse(saJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });
    const totals = importStatus;
    const log = (msg: string) => { totals.log.push(msg); console.log("[drive-import]", msg); };

    // ── helpers ──────────────────────────────────────────────────────────────

    async function ensureCategory(name: string): Promise<typeof schema.categories.$inferSelect> {
      const slug = slugify(name);
      let cat = await db.select().from(schema.categories).where(eq(schema.categories.slug, slug)).get();
      if (!cat) {
        const [created] = await db.insert(schema.categories).values({ name, slug }).returning();
        cat = created;
        log(`Created category: ${name}`);
      }
      return cat;
    }

    async function ensureSubcategory(name: string, categoryId: number): Promise<typeof schema.subcategories.$inferSelect> {
      const slug = slugify(name);
      let sub = await db.select().from(schema.subcategories)
        .where(and(eq(schema.subcategories.slug, slug), eq(schema.subcategories.categoryId, categoryId)))
        .get();
      if (!sub) {
        const [created] = await db.insert(schema.subcategories).values({ name, slug, categoryId }).returning();
        sub = created;
        log(`Created subcategory: ${name} (under category id ${categoryId})`);
      }
      return sub;
    }

    async function importFile(
      file: { id: string; name: string; mimeType: string },
      categoryId: number,
      subcategoryId: number | null,
      pathLabel: string,
    ) {
      const s3Key = `photos/drive-${file.id}-${file.name.replace(/\s+/g, "-").replace(/%/g, "")}`;

      const existing = await db.select().from(schema.photos).where(eq(schema.photos.key, s3Key)).get();
      if (existing) {
        log(`Skipped (already imported) [${pathLabel}] ${file.name}`);
        totals.skipped++;
        return;
      }

      let imageBytes: Buffer;
      try {
        const res = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
        imageBytes = Buffer.from(res.data as ArrayBuffer);
      } catch (err: any) {
        log(`FAILED downloading [${pathLabel}] ${file.name}: ${err?.message}`);
        totals.failed++;
        return;
      }

      try {
        await s3.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: imageBytes,
          ContentType: file.mimeType,
        }));
      } catch (err: any) {
        log(`FAILED uploading to S3 [${pathLabel}] ${file.name}: ${err?.message}`);
        totals.failed++;
        return;
      }

      const url = getPublicUrl(s3Key);
      const title = captionFromFilename(file.name);
      const isFavorite = isFeaturedFilename(file.name);

      await db.insert(schema.photos).values({
        key: s3Key,
        url,
        title,
        categoryId,
        subcategoryId,
        isFavorite,
        sortOrder: 0,
      });

      log(`Imported [${pathLabel}] ${file.name}${isFavorite ? " ★" : ""}`);
      totals.imported++;
    }

    async function listFolders(parentId: string): Promise<{ id: string; name: string }[]> {
      const res = await drive.files.list({
        q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id,name)",
        pageSize: 100,
      });
      return (res.data.files ?? []) as { id: string; name: string }[];
    }

    async function listImages(parentId: string): Promise<{ id: string; name: string; mimeType: string }[]> {
      const res = await drive.files.list({
        q: `'${parentId}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: "files(id,name,mimeType,createdTime)",
        pageSize: 1000,
      });
      return (res.data.files ?? []) as { id: string; name: string; mimeType: string }[];
    }

    // ── walk root → category folders ─────────────────────────────────────────

    let categoryFolders: { id: string; name: string }[] = [];
    try {
      categoryFolders = await listFolders(folderId);
    } catch (err: any) {
      return c.json({ ok: false, error: `Failed to list category folders: ${err?.message}` }, 500);
    }

    if (categoryFolders.length === 0) {
      // Flat root — no subfolders, import everything as Uncategorised
      categoryFolders = [{ id: folderId, name: "Uncategorised" }];
      log("No subfolders found — importing root folder as 'Uncategorised'");
    }

    for (const catFolder of categoryFolders) {
      let category: typeof schema.categories.$inferSelect;
      try {
        category = await ensureCategory(catFolder.name);
      } catch (err: any) {
        log(`FAILED creating category [${catFolder.name}]: ${err?.message}`);
        totals.failed++;
        continue;
      }

      // Images directly in the category folder (no subcategory)
      let catImages: { id: string; name: string; mimeType: string }[] = [];
      try {
        catImages = await listImages(catFolder.id);
      } catch (err: any) {
        log(`FAILED listing images in [${catFolder.name}]: ${err?.message}`);
        totals.failed++;
      }
      for (const file of catImages) {
        await importFile(file, category.id, null, catFolder.name);
      }

      // Subcategory folders
      let subFolders: { id: string; name: string }[] = [];
      try {
        subFolders = await listFolders(catFolder.id);
      } catch (err: any) {
        log(`FAILED listing subcategory folders in [${catFolder.name}]: ${err?.message}`);
        totals.failed++;
        continue;
      }

      for (const subFolder of subFolders) {
        let subcategory: typeof schema.subcategories.$inferSelect;
        try {
          subcategory = await ensureSubcategory(subFolder.name, category.id);
        } catch (err: any) {
          log(`FAILED creating subcategory [${catFolder.name}/${subFolder.name}]: ${err?.message}`);
          totals.failed++;
          continue;
        }

        let subImages: { id: string; name: string; mimeType: string }[] = [];
        try {
          subImages = await listImages(subFolder.id);
        } catch (err: any) {
          log(`FAILED listing images in [${catFolder.name}/${subFolder.name}]: ${err?.message}`);
          totals.failed++;
          continue;
        }

        for (const file of subImages) {
          await importFile(file, category.id, subcategory.id, `${catFolder.name}/${subFolder.name}`);
        }
      }
    }

    importStatus.running = false;
    importStatus.finishedAt = new Date().toISOString();
    log(`Import complete: ${totals.imported} imported, ${totals.skipped} skipped, ${totals.failed} failed`);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function captionFromFilename(fileName: string) {
  return String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/\[featured\]/gi, "")
    .replace(/^(featured|hero)\s*--\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFeaturedFilename(fileName: string) {
  return /\[featured\]/i.test(fileName) || /^(featured|hero)\s*--/i.test(fileName);
}
