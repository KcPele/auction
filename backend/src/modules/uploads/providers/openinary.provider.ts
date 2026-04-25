import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StoredUpload, ValidatedUploadFile } from '../types/upload-file';

type OpeninaryUploadResponse = {
  success: boolean;
  files: Array<{
    filename: string;
    path: string;
    size: number;
    url: string;
  }>;
  message?: string;
  error?: string;
};

@Injectable()
export class OpeninaryProvider {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async upload(file: ValidatedUploadFile, folder: string): Promise<StoredUpload> {
    const result = await this.uploadFile(file, folder);

    return {
      provider: 'openinary',
      providerPublicId: result.path,
      url: this.toAbsoluteUrl(result.url),
      sizeBytes: result.size,
    };
  }

  private async uploadFile(file: ValidatedUploadFile, folder: string) {
    const form = new FormData();
    const filename = this.safeFilename(file.originalName);
    const path = `${this.safePath(folder)}/${filename}`;

    form.append(
      'files',
      new Blob([this.toArrayBuffer(file.buffer)], { type: file.mimeType }),
      filename,
    );
    form.append('names', path);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    const data = (await response.json()) as OpeninaryUploadResponse;

    if (!response.ok || !data.success || !data.files[0]) {
      throw new ServiceUnavailableException(
        data.message ?? data.error ?? 'Openinary upload failed',
      );
    }

    return data.files[0];
  }

  private get baseUrl() {
    const url = this.config.get<string>('OPENINARY_URL');

    if (!url) {
      throw new ServiceUnavailableException(
        'Openinary upload provider is not configured',
      );
    }

    return url.replace(/\/$/, '');
  }

  private get apiKey() {
    const apiKey = this.config.get<string>('OPENINARY_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Openinary upload provider is not configured',
      );
    }

    return apiKey;
  }

  private toAbsoluteUrl(url: string) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private toArrayBuffer(buffer: Buffer) {
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  }

  private safePath(path: string) {
    return path
      .split('/')
      .map((part) => this.slug(part))
      .filter(Boolean)
      .join('/');
  }

  private safeFilename(filename: string) {
    const extension = filename.includes('.')
      ? filename.slice(filename.lastIndexOf('.')).toLowerCase()
      : '';
    const name = extension ? filename.slice(0, -extension.length) : filename;

    return `${this.slug(name) || 'file'}-${Date.now()}${extension}`;
  }

  private slug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
