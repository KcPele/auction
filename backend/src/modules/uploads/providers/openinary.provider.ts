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
    prewarmedUrls?: string[];
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
      sizeBytes: result.size ?? file.buffer.length,
    };
  }

  private async uploadFile(file: ValidatedUploadFile, folder: string) {
    const form = new FormData();
    const filename = this.safeFilename(file.originalName);

    form.append(
      'files',
      new Blob([this.toArrayBuffer(file.buffer)], { type: file.mimeType }),
      filename,
    );
    form.append('folder', this.safePath(folder));

    if (file.mimeType.startsWith('image/')) {
      form.append(
        'transformations',
        JSON.stringify(['w_800,f_webp,q_85', 'w_400,c_fill,f_avif,q_80']),
      );
    }

    let response: Response;
    try {
      response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: form,
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        'Failed to connect to Openinary upload service',
      );
    }

    const data = await this.parseUploadResponse(response);

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

  private get uploadUrl() {
    return `${this.baseUrl}/api/upload`;
  }

  private async parseUploadResponse(response: Response) {
    const text = await response.text();

    try {
      return JSON.parse(text) as OpeninaryUploadResponse;
    } catch {
      throw new ServiceUnavailableException(
        `Openinary upload returned a non-JSON response (${response.status}). Check OPENINARY_URL and API key configuration.`,
      );
    }
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
