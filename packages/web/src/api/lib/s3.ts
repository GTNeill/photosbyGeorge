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

// Tigris requires subdomain-style URLs for public access
// e.g. https://BUCKET.t3.storage.dev/key (not https://t3.storage.dev/BUCKET/key)
export function getPublicUrl(key: string): string {
  const endpointUrl = new URL(S3_ENDPOINT);
  return `${endpointUrl.protocol}//${S3_BUCKET}.${endpointUrl.host}/${key}`;
}
