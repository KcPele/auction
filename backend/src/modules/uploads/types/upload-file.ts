import type { UploadPurpose } from '../../../common/enums/upload-purpose.enum';
import type { UploadResourceType } from '../../../common/enums/upload-resource-type.enum';

export type UploadFile = {
  originalName: string;
  mimeType: string;
  buffer: Buffer;
};

export type ValidatedUploadFile = UploadFile & {
  purpose: UploadPurpose;
  resourceType: UploadResourceType;
};

export type StoredUpload = {
  provider: string;
  providerPublicId: string;
  url: string;
  sizeBytes: number;
};
