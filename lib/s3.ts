import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from './env';

const PUT_EXPIRES_IN = 3600;
const GET_EXPIRES_IN = 3600;

function getClient() {
  const env = getEnv();
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

export function objectKey(dropId: string, fileId: string, fileName: string) {
  const safeName = fileName.replace(/[/\\]/g, '_').slice(0, 180) || 'file';
  return `drops/${dropId}/${fileId}/${safeName}`;
}

export async function presignPut(params: { key: string; contentType: string }) {
  const env = getEnv();
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: params.key,
      ContentType: params.contentType,
    }),
    { expiresIn: PUT_EXPIRES_IN },
  );
}

export async function presignGet(params: { key: string; fileName: string }) {
  const env = getEnv();
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: params.key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(params.fileName)}"`,
    }),
    { expiresIn: GET_EXPIRES_IN },
  );
}
