import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { UploadResourceType } from '../../../common/enums/upload-resource-type.enum';
import type { StoredUpload, ValidatedUploadFile } from '../types/upload-file';

@Injectable()
export class OpeninaryProvider {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async upload(file: ValidatedUploadFile, folder: string): Promise<StoredUpload> {
    this.ensureConfigured();
    const result = await this.uploadBuffer(file, folder);

    return {
      provider: 'openinary',
      providerPublicId: result.public_id,
      url: result.secure_url,
      sizeBytes: result.bytes,
    };
  }

  private uploadBuffer(file: ValidatedUploadFile, folder: string) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: this.toCloudinaryResourceType(file.resourceType),
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Upload provider returned no result'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }

  private ensureConfigured() {
    const cloudName = this.config.get<string>('OPENINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('OPENINARY_API_KEY');
    const apiSecret = this.config.get<string>('OPENINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Openinary upload provider is not configured',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private toCloudinaryResourceType(resourceType: UploadResourceType) {
    if (resourceType === UploadResourceType.Video) {
      return 'video';
    }

    if (resourceType === UploadResourceType.Document) {
      return 'raw';
    }

    return 'image';
  }
}
