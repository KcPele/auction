import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UploadPurpose } from '../../common/enums/upload-purpose.enum';
import { UploadResourceType } from '../../common/enums/upload-resource-type.enum';
import type { OpeninaryProvider } from './providers/openinary.provider';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let repository: { create: jest.Mock; save: jest.Mock };
  let provider: { upload: jest.Mock };
  let service: UploadsService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'upload-id', ...value })),
    };
    provider = {
      upload: jest.fn(async () => ({
        provider: 'openinary',
        providerPublicId: 'auction/file',
        url: 'https://cdn.example.com/file.jpg',
        sizeBytes: 4,
      })),
    };
    service = new UploadsService(
      repository as never,
      provider as unknown as OpeninaryProvider,
      { get: jest.fn().mockReturnValue('auction') } as unknown as ConfigService,
    );
  });

  it('validates, uploads, and stores file metadata', async () => {
    await expect(
      service.uploadOne(
        'user-id',
        {
          originalName: 'car.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('file'),
        },
        UploadPurpose.ListingPhoto,
        ListingCategory.Car,
      ),
    ).resolves.toEqual({
      uploadAsset: expect.objectContaining({
        id: 'upload-id',
        resourceType: UploadResourceType.Image,
        url: 'https://cdn.example.com/file.jpg',
      }),
    });
    expect(provider.upload).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: UploadResourceType.Image }),
      'auction/car/listing_photo/user-id',
    );
  });

  it('rejects files with a disallowed mime type', async () => {
    await expect(
      service.uploadOne(
        'user-id',
        {
          originalName: 'script.js',
          mimeType: 'application/javascript',
          buffer: Buffer.from('file'),
        },
        UploadPurpose.ListingPhoto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects files above the purpose size limit', async () => {
    await expect(
      service.uploadOne(
        'user-id',
        {
          originalName: 'large.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
        },
        UploadPurpose.ListingPhoto,
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
});
