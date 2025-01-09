import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import {
  AwsS3StorageAdapter,
  DefaultAwsPublicUrlGenerator
} from "@flystorage/aws-s3";
import { FileStorage } from "@flystorage/file-storage";
import { logger } from "../utils/logger";
import { GetCompanySetting } from "./CheckSettings";
import { S3PublicUrlGenerator } from "./S3PublicUrlGenerator";

export class S3Storage {
  // eslint-disable-next-line no-use-before-define
  private static instance: S3Storage;

  public storage: FileStorage;

  public failed: boolean;

  private s3Config: any;

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
