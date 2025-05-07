import {
  S3Client,
  HeadBucketCommand,
  S3ClientConfig
} from "@aws-sdk/client-s3";
import {
  AwsS3StorageAdapter,
  DefaultAwsPublicUrlGenerator
} from "@flystorage/aws-s3";
import { FileStorage } from "@flystorage/file-storage";
import { createHash } from "crypto";
import { logger } from "../utils/logger";
import { GetCompanySetting } from "./CheckSettings";
import { S3PublicUrlGenerator } from "./S3PublicUrlGenerator";

export class S3Storage {
  // eslint-disable-next-line no-use-before-define
  private static instance: S3Storage;

  public storage: FileStorage;

  public failed: boolean;

  private s3Config: S3ClientConfig;

  private bucket: string;

  private activeData: string;

  private async initialize(s3Options: string): Promise<void> {
    try {
      const s3ConfigData = JSON.parse(s3Options);

      this.activeData = s3Options;
      this.storage = null;
      this.failed = false;

      if (!s3ConfigData.accessKeyId || !s3ConfigData.secretAccessKey) {
        this.failed = true;
        return;
      }

      const credentials = {
        accessKeyId: s3ConfigData.accessKeyId,
        secretAccessKey: s3ConfigData.secretAccessKey
      };

      this.s3Config = {
        region: s3ConfigData.region || undefined,
        endpoint: s3ConfigData.endpoint || undefined,
        forcePathStyle: !!s3ConfigData.endpoint,
        credentials
      };

      this.bucket = s3ConfigData.bucket;

      const client = new S3Client(this.s3Config);

      try {
        await client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        if (error.name !== "NotFound") {
          logger.error({ error }, "Error checking bucket");
          this.failed = true;
          return;
        }
        logger.error({ error }, "Bucket not found");
        this.failed = true;
        // force recheck on next request
        this.activeData = null;
        return;

        /* * /
        await client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
            ACL: "public-read"
          })
        );
        /* */
      }

      const adapter = new AwsS3StorageAdapter(
        client,
        {
          bucket: s3ConfigData.bucket,
          prefix: s3ConfigData.prefix || ""
        },
        s3ConfigData.endpoint
          ? new S3PublicUrlGenerator(s3ConfigData.endpoint)
          : new DefaultAwsPublicUrlGenerator()
      );

      // Middleware to compute and add Content-MD5 automatically
      client.middlewareStack.add(
        (next, _context) => async (args: any) => {
          if (args.input.Delete && args.input.Delete.Objects) {
            // add Content-MD5 header for delete requests
            const md5Hash = createHash("md5")
              .update(args.request.body)
              .digest("base64");
            args.request.headers["Content-MD5"] = md5Hash;
          }

          return next(args);
        },
        { step: "build" }
      );

      // Add middleware to strip checksum headers for backblaze
      if (s3ConfigData.endpoint.endsWith("backblazeb2.com")) {
        client.middlewareStack.addRelativeTo(
          (next, _context) => async (args: any) => {
            // Strip problematic headers
            if (args.request.headers) {
              delete args.request.headers["x-amz-sdk-checksum-algorithm"];
              delete args.request.headers["x-amz-checksum-crc32"];
              delete args.request.headers["x-amz-checksum-crc32c"];
              delete args.request.headers["x-amz-checksum-sha1"];
              delete args.request.headers["x-amz-checksum-sha256"];
              delete args.request.headers["x-amz-checksum-algorithm"];
              delete args.request.headers["x-amz-checksum-mode"];
            }
            return next(args);
          },
          {
            relation: "before",
            toMiddleware: "retryMiddleware",
            name: "removeChecksumHeadersMiddleware",
            override: true
          }
        );
      }

      this.storage = new FileStorage(adapter);
    } catch (error) {
      this.failed = true;
    }
  }

  public static getInstance(): S3Storage {
    try {
      if (!S3Storage.instance || S3Storage.instance.failed) {
        S3Storage.instance = new S3Storage();
      }
      return S3Storage.instance;
    } catch (error) {
      logger.error(`Error initializing S3Storage: ${error}`);
      return null;
    }
  }

  public async prepare(): Promise<void> {
    const s3Options = await GetCompanySetting(1, "s3ConfigData", "{}");

    if (s3Options === this.activeData) {
      return;
    }

    await this.initialize(s3Options);
  }
}
