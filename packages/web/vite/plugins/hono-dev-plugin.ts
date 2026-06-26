import type { Plugin, ViteDevServer } from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load root .env into process.env so SSR modules (API routes) have access
function loadRootEnv() {
  const envPath = resolve(__dirname, "../../../../.env");
  try {
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env not present — no-op
  }
}

loadRootEnv();

export default function honoDevPlugin(): Plugin {
  return {
    name: "hono-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) return next();

        try {
          const request = await toWebRequest(req);
          const app = await loadApp(server);
          const response = await app.fetch(request);

          res.statusCode = response.status;
          response.headers.forEach((value: string, key: string) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          console.error("[hono-dev]", err);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    },
  };
}

async function loadApp(server: ViteDevServer) {
  const mod = await server.ssrLoadModule("/src/api/index.ts");
  return mod.default;
}

function toWebRequest(req: import("http").IncomingMessage): Request {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val) headers.set(key, Array.isArray(val) ? val.join(", ") : val);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (req as unknown as ReadableStream) : undefined,
    // @ts-expect-error duplex needed for streaming request bodies
    duplex: hasBody ? "half" : undefined,
  });
}
