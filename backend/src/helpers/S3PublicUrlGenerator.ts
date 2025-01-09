import { AwsPublicUrlGenerator, AwsPublicUrlOptions } from "@flystorage/aws-s3";

export class S3PublicUrlGenerator implements AwsPublicUrlGenerator {
  private defaultAwsPublicUrlGenerator: AwsPublicUrlGenerator;

  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async publicUrl(path: string, options: AwsPublicUrlOptions): Promise<string> {
    return `${this.endpoint}/${options.bucket}/${path}`;
  }
}
