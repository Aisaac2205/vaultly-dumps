import { registerAs } from '@nestjs/config';

export const R2_BUCKET_TOKEN = 'R2_BUCKET';

export default registerAs('r2', () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  // Derive S3-compatible endpoint from account ID
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    endpoint,
    accessKey: accessKeyId,
    secretKey: secretAccessKey,
    bucket: bucketName,
    publicBaseUrl,
  };
});
