import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const DEFAULTS: Record<string, string> = {
  contact_name: "George Neill",
  contact_address: "",
  contact_email: "",
  contact_phone: "",
};

export const settingsRouter = new Hono()
  // GET all settings (public — used by contact page)
  .get("/", async (c) => {
    const rows = await db.select().from(schema.siteSettings);
    const map: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) map[row.key] = row.value;
    return c.json({ settings: map }, 200);
  })

  // PATCH one or many keys (admin only)
  .patch("/", requireAdmin, async (c) => {
    const body = await c.req.json() as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(schema.siteSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value, updatedAt: new Date() } });
    }
    return c.json({ success: true }, 200);
  });
