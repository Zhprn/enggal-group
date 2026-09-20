import { StorageEngine } from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Request } from 'express';

class R2StorageEngine implements StorageEngine {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.bucketName = process.env.R2_BUCKET_NAME || 'enggal-storage';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const extension = extname(file.originalname);
    const uniqueName = `${randomUUID()}${extension}`;

    const chunks: Buffer[] = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', (err) => cb(err));

    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: `uploads/${uniqueName}`,
            Body: buffer,
            ContentType: file.mimetype,
          }),
        );

        cb(null, {
          filename: uniqueName,
          path: `/uploads/${uniqueName}`,
          size: buffer.length,
        });
      } catch (error) {
        cb(error);
      }
    });
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ): void {
    cb(null);
  }
}

export const uploadR2Storage = new R2StorageEngine();
export const uploadDiskStorage = uploadR2Storage;
export const uploadMemoryStorage = uploadR2Storage;