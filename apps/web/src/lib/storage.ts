import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where uploaded files live. In development bytes go to a local folder; set
 * FILE_STORAGE=s3 (with S3_BUCKET and friends) to use S3 or any compatible
 * service such as R2 or MinIO. Keys always start with the organization id.
 */
export type StoredObject = { body: Buffer; contentType: string };

type Driver = {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
};

function localDriver(): Driver {
  const root = path.resolve(
    process.env.FILE_STORAGE_DIR ?? path.join(process.cwd(), ".uploads"),
  );
  const resolve = (key: string) => {
    const target = path.resolve(root, key);

    // Never step outside the storage folder.
    if (!target.startsWith(root + path.sep)) throw new Error("Bad file key.");

    return target;
  };

  return {
    async put(key, body) {
      const target = resolve(key);

      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
    },
    async get(key) {
      try {
        return {
          body: await readFile(resolve(key)),
          contentType: "application/octet-stream",
        };
      } catch {
        return null;
      }
    },
    async remove(key) {
      await rm(resolve(key), { force: true });
    },
  };
}

function s3Driver(): Driver {
  const bucket = process.env.S3_BUCKET;

  if (!bucket) throw new Error("FILE_STORAGE=s3 needs S3_BUCKET.");

  let client: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;
  const load = () =>
    (client ??= import("@aws-sdk/client-s3").then(
      ({ S3Client }) =>
        new S3Client({
          region: process.env.S3_REGION ?? "auto",
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: Boolean(process.env.S3_ENDPOINT),
          credentials: process.env.S3_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
              }
            : undefined,
        }),
    ));

  return {
    async put(key, body, contentType) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");

      await (
        await load()
      ).send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async get(key) {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");

      try {
        const result = await (
          await load()
        ).send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const bytes = await result.Body?.transformToByteArray();

        return bytes
          ? {
              body: Buffer.from(bytes),
              contentType: result.ContentType ?? "application/octet-stream",
            }
          : null;
      } catch {
        return null;
      }
    },
    async remove(key) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      await (
        await load()
      ).send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

let driver: Driver | null = null;

export function storage(): Driver {
  return (driver ??=
    process.env.FILE_STORAGE === "s3" ? s3Driver() : localDriver());
}

/** A fresh key inside the organization's folder, keeping a safe extension. */
export function newStorageKey(organizationId: string, name: string) {
  const extension = path
    .extname(name)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");

  return `${organizationId}/${randomUUID()}${extension.slice(0, 12)}`;
}
