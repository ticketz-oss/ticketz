export const s3FormSchema = [
  {
    name: "accessKeyId",
    title: "Access Key",
    description: "The access key for the S3 service",
    type: "text",
    lgWidth: 6,
    required: true
  },
  {
    name: "secretAccessKey",
    title: "Secret Key",
    description: "The secret key for the S3 service",
    type: "text",
    lgWidth: 6,
    required: true
  },
  null,
  {
    name: "region",
    title: "Region",
    description: "The region of the S3 service",
    type: "text",
    lgWidth: 3,
    required: false
  },
  {
    name: "bucket",
    title: "Bucket",
    description: "The bucket to use for storing files",
    type: "text",
    lgWidth: 3,
    required: true
  },
  {
    name: "endpoint",
    title: "S3 Endpoint",
    description: "The endpoint of the S3 service",
    type: "text",
    lgWidth: 6,
    required: false
  },
]
