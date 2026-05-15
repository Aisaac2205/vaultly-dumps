import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  _Object,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { R2Object } from './interfaces/r2-object.interface';

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(R2Service.name);

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('r2.endpoint');
    const accessKey = this.configService.get<string>('r2.accessKey');
    const secretKey = this.configService.get<string>('r2.secretKey');
    const bucket = this.configService.get<string>('r2.bucket');

    const isConfigured = !!(endpoint && accessKey && secretKey && bucket);

    if (!isConfigured) {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw new Error('R2 configuration is incomplete');
      }
      this.logger.warn(
        'R2 not configured — backup/restore features will be disabled. ' +
        'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.',
      );
      this.bucket = '';
      this.client = new S3Client({
        region: 'auto',
        endpoint: 'http://localhost:0',
        credentials: { accessKeyId: '', secretAccessKey: '' },
      });
      return;
    }

    this.bucket = bucket;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  /** Returns true if R2 is properly configured and usable. */
  isAvailable(): boolean {
    return this.bucket !== '';
  }

  async upload(
    key: string,
    stream: Readable,
    options?: { metadata?: Record<string, string> },
  ): Promise<void> {
    this.logger.debug(`Uploading to R2: ${key}`);
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        Metadata: options?.metadata,
      },
    });
    await upload.done();
  }

  async download(key: string): Promise<Readable> {
    this.logger.debug(`Downloading from R2: ${key}`);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`No body returned for key: ${key}`);
    }
    return response.Body as Readable;
  }

  async list(prefix?: string): Promise<R2Object[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });
    const response = await this.client.send(command);
    return (response.Contents ?? []).map((obj: _Object) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
      etag: obj.ETag ?? '',
    }));
  }

  async delete(key: string): Promise<void> {
    this.logger.debug(`Deleting from R2: ${key}`);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
