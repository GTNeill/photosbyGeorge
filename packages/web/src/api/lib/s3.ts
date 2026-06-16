import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.S3_BUCKET!;
export const S3_ENDPOINT = process.env.S3_ENDPOINT!;

// Proxy URL — served through our own API to avoid CORS issues
export function getPublicUrl(key: string): string {
  return `/api/photos/image/${key.split("/").map(encodeURIComponent).join("/")}`;
}
