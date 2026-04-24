import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import { Repository } from 'typeorm';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UploadPurpose } from '../../common/enums/upload-purpose.enum';
import { UploadResourceType } from '../../common/enums/upload-resource-type.enum';
import { UploadAsset } from './entities/upload-asset.entity';
import { OpeninaryProvider } from './providers/openinary.provider';
import type { UploadFile, ValidatedUploadFile } from './types/upload-file';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const videoMimeTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const documentMimeTypes = new Set(['application/pdf', ...imageMimeTypes]);

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(UploadAsset)
    private readonly uploadAssetsRepository: Repository<UploadAsset>,
    private readonly provider: OpeninaryProvider,
    private readonly config: ConfigService,
  ) {
  }

  async uploadOne(
    ownerId: string,
    file: UploadFile,
    purpose: UploadPurpose,
    category?: ListingCategory,
  ) {
    const validated = this.validateFile(file, purpose);
    const stored = await this.provider.upload(
      validated,
      this.buildFolder(ownerId, purpose, category),
    );

    const uploadAsset = await this.uploadAssetsRepository.save(
      this.uploadAssetsRepository.create({
        ownerId,
        purpose,
        category: category ?? null,
        resourceType: validated.resourceType,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: stored.sizeBytes,
        provider: stored.provider,
        providerPublicId: stored.providerPublicId,
        url: stored.url,
      }),
    );

    return { uploadAsset };
  }

  async uploadBatch(
    ownerId: string,
    files: UploadFile[],
    purpose: UploadPurpose,
    category?: ListingCategory,
  ) {
    if (!files.length) {
      throw new BadRequestException('At least one file is required');
    }

    if (files.length > 10) {
      throw new BadRequestException('A maximum of 10 files can be uploaded');
    }

    const uploadAssets = [];

    for (const file of files) {
      const result = await this.uploadOne(ownerId, file, purpose, category);
      uploadAssets.push(result.uploadAsset);
    }

    return { uploadAssets };
  }

  parsePurpose(value: string | undefined) {
    if (!value || !Object.values(UploadPurpose).includes(value as UploadPurpose)) {
      throw new BadRequestException('Valid upload purpose is required');
    }

    return value as UploadPurpose;
  }

  parseCategory(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    if (!Object.values(ListingCategory).includes(value as ListingCategory)) {
      throw new BadRequestException('Invalid listing category');
    }

    return value as ListingCategory;
  }

  get maxFileSizeBytes() {
    return MAX_VIDEO_BYTES;
  }

  private validateFile(
    file: UploadFile,
    purpose: UploadPurpose,
  ): ValidatedUploadFile {
    const resourceType = this.getResourceType(file.mimeType, purpose);
    const maxSize = this.getMaxSize(resourceType);

    if (file.buffer.length > maxSize) {
      throw new PayloadTooLargeException('File exceeds upload size limit');
    }

    this.validateExtension(file.originalName);

    return { ...file, purpose, resourceType };
  }

  private getResourceType(mimeType: string, purpose: UploadPurpose) {
    if (purpose === UploadPurpose.ListingVideo) {
      this.requireMimeType(mimeType, videoMimeTypes);
      return UploadResourceType.Video;
    }

    if (purpose === UploadPurpose.ProofDocument) {
      this.requireMimeType(mimeType, documentMimeTypes);
      return mimeType === 'application/pdf'
        ? UploadResourceType.Document
        : UploadResourceType.Image;
    }

    if (purpose === UploadPurpose.InspectionMedia && videoMimeTypes.has(mimeType)) {
      return UploadResourceType.Video;
    }

    this.requireMimeType(mimeType, imageMimeTypes);
    return UploadResourceType.Image;
  }

  private requireMimeType(mimeType: string, allowed: Set<string>) {
    if (!allowed.has(mimeType)) {
      throw new BadRequestException('File type is not allowed for this purpose');
    }
  }

  private getMaxSize(resourceType: UploadResourceType) {
    if (resourceType === UploadResourceType.Video) {
      return MAX_VIDEO_BYTES;
    }

    if (resourceType === UploadResourceType.Document) {
      return MAX_DOCUMENT_BYTES;
    }

    return MAX_IMAGE_BYTES;
  }

  private validateExtension(filename: string) {
    const extension = path.extname(filename).toLowerCase();

    if (!extension || extension.length > 10 || filename.includes('\0')) {
      throw new BadRequestException('Invalid file name');
    }
  }

  private buildFolder(
    ownerId: string,
    purpose: UploadPurpose,
    category?: ListingCategory,
  ) {
    return [
      this.config.get<string>('OPENINARY_FOLDER') ?? 'auction',
      category?.toLowerCase() ?? 'general',
      purpose.toLowerCase(),
      ownerId,
    ].join('/');
  }
}
