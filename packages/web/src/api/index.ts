import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { categoriesRouter } from "./routes/categories";
import { photosRouter } from "./routes/photos";
import { settingsRouter } from "./routes/settings";
import { ingestRouter } from "./routes/ingest";
import { driveImportRouter } from "./routes/drive-import";
import { db } from "./database";
import * as schema from "./database/schema";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/categories", categoriesRouter)
  .route("/photos", photosRouter)
  .route("/settings", settingsRouter)
  .route("/integrations", ingestRouter)
  .route("/drive-import", driveImportRouter)
  .post("/seed", async (c) => {
    const existing = await db.select().from(schema.categories);
    if (existing.length > 0) return c.json({ message: "Already seeded" }, 200);
    const defaults = [
      { name: "Portraits", slug: "portraits" },
      { name: "Family", slug: "family" },
      { name: "Street", slug: "street" },
      { name: "Travel", slug: "travel" },
      { name: "Seniors", slug: "seniors" },
    ];
    await db.insert(schema.categories).values(defaults);
    return c.json({ message: "Seeded" }, 200);
  });

export type AppType = typeof app;
export default app;
