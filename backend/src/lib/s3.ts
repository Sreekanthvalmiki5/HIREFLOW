import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

// Credentials are NOT read from .env: the SDK picks them up from `aws configure`
// locally, or from the EC2 instance's IAM role in production.
const s3 = new S3Client({ region: env.AWS_REGION });
const Bucket = env.S3_BUCKET;

export const isS3Configured = Boolean(Bucket);

export const uploadFile = (Key: string, Body: Buffer, ContentType: string) =>
  s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));

export const deleteFile = (Key: string) => s3.send(new DeleteObjectCommand({ Bucket, Key }));

// Short-lived link to a private object. The bucket itself stays private.
export const getViewUrl = (Key: string, expiresInSeconds = 300) =>
  getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket, Key, ResponseContentDisposition: "inline" }),
    { expiresIn: expiresInSeconds },
  );
