import { db } from "./src/api/database/index.ts";
import { photos } from "./src/api/database/schema.ts";

const result = await db.delete(photos);
console.log("Photos table cleared:", JSON.stringify(result));
process.exit(0);
