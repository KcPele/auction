import { Test } from '@nestjs/testing';
import type { MultipartFile } from '@fastify/multipart';
import { ListingCategory } from '../../common/enums/listing-category.enum';
import { UploadPurpose } from '../../common/enums/upload-purpose.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  const currentUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'INDIVIDUAL_BIDDER' as AuthenticatedUser['role'],
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: UploadsController;
  let service: {
    maxFileSizeBytes: number;
    parsePurpose: jest.Mock;
    parseCategory: jest.Mock;
    uploadOne: jest.Mock;
    uploadBatch: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      maxFileSizeBytes: 1024,
      parsePurpose: jest.fn().mockReturnValue(UploadPurpose.ListingPhoto),
      parseCategory: jest.fn().mockReturnValue(ListingCategory.Car),
      uploadOne: jest.fn(),
      uploadBatch: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: UploadsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(UploadsController);
  });

  it('uploads one multipart file', async () => {
    const file = createMultipartFile();
    service.uploadOne.mockResolvedValue({ uploadAsset: { id: 'upload-id' } });

    await expect(
      controller.uploadOne(currentUser, {
        file: jest.fn().mockResolvedValue(file),
        files: jest.fn(),
      }),
    ).resolves.toEqual({ uploadAsset: { id: 'upload-id' } });

    expect(service.parsePurpose).toHaveBeenCalledWith('LISTING_PHOTO');
    expect(service.parseCategory).toHaveBeenCalledWith('CAR');
    expect(service.uploadOne).toHaveBeenCalledWith(
      currentUser.id,
      {
        originalName: 'car.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('file'),
      },
      UploadPurpose.ListingPhoto,
      ListingCategory.Car,
    );
  });

  it('uploads a batch of multipart files', async () => {
    service.uploadBatch.mockResolvedValue({ uploadAssets: [] });

    await expect(
      controller.uploadBatch(currentUser, {
        file: jest.fn(),
        files: async function* () {
          yield createMultipartFile();
          yield createMultipartFile('car-2.jpg');
        },
      }),
    ).resolves.toEqual({ uploadAssets: [] });

    expect(service.uploadBatch).toHaveBeenCalledWith(
      currentUser.id,
      [
        {
          originalName: 'car.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('file'),
        },
        {
          originalName: 'car-2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('file'),
        },
      ],
      UploadPurpose.ListingPhoto,
      ListingCategory.Car,
    );
  });
});

function createMultipartFile(filename = 'car.jpg') {
  return {
    filename,
    mimetype: 'image/jpeg',
    fields: {
      purpose: { value: UploadPurpose.ListingPhoto },
      category: { value: ListingCategory.Car },
    },
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('file')),
  } as unknown as MultipartFile;
}
