import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'stream';
import type { StoredUpload, ValidatedUploadFile } from '../types/upload-file';

@Injectable()
export class MinioProvider {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const endpoint = this.parseEndpoint();

    this.client = new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port,
      useSSL: endpoint.useSSL,
      accessKey: this.requireConfig('MINIO_ACCESS_KEY'),
      secretKey: this.requireConfig('MINIO_SECRET_KEY'),
      region: this.config.get<string>('MINIO_REGION') ?? 'us-east-1',
    });

    this.bucket = this.requireConfig('MINIO_BUCKET');

    // Public URL base: https://endpoint/bucket
    const endpointRaw = this.requireConfig('MINIO_ENDPOINT').replace(/\/$/, '');
    this.publicBaseUrl = `${endpointRaw}/${this.bucket}`;
  }

  async upload(file: ValidatedUploadFile, folder: string): Promise<StoredUpload> {
    await this.ensureBucketExists();

    const objectKey = this.buildObjectKey(folder, file.originalName);
    const stream = Readable.from(file.buffer);

    await this.client.putObject(this.bucket, objectKey, stream, file.buffer.length, {
      'Content-Type': file.mimeType,
    });

    return {
      provider: 'minio',
      providerPublicId: objectKey,
      url: `${this.publicBaseUrl}/${objectKey}`,
      sizeBytes: file.buffer.length,
    };
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.client.bucketExists(this.bucket);

      if (!exists) {
        const region = this.config.get<string>('MINIO_REGION') ?? 'us-east-1';
        await this.client.makeBucket(this.bucket, region);
      }
    } catch {
      throw new ServiceUnavailableException(
        'Failed to connect to MinIO storage service',
      );
    }
  }

  private buildObjectKey(folder: string, originalName: string): string {
    const filename = this.safeFilename(originalName);
    const safeFolderPath = folder
      .split('/')
      .map((part) => this.slug(part))
      .filter(Boolean)
      .join('/');

    return `${safeFolderPath}/${filename}`;
  }

  private safeFilename(filename: string): string {
    const extension = filename.includes('.')
      ? filename.slice(filename.lastIndexOf('.')).toLowerCase()
      : '';
    const name = extension ? filename.slice(0, -extension.length) : filename;

    return `${this.slug(name) || 'file'}-${Date.now()}${extension}`;
  }

  private slug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseEndpoint() {
    const raw = this.requireConfig('MINIO_ENDPOINT');

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(`MINIO_ENDPOINT is not a valid URL: "${raw}"`);
    }

    const useSSL = parsed.protocol === 'https:';
    const port = parsed.port ? Number(parsed.port) : useSSL ? 443 : 80;

    return { hostname: parsed.hostname, port, useSSL };
  }

  private requireConfig(key: string): string {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new ServiceUnavailableException(
        `MinIO is not configured: missing ${key}`,
      );
    }

    return value;
  }
}
