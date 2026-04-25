import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import type { MultipartFile } from '@fastify/multipart';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ListingCategory } from '../../common/enums/listing-category.enum';
import type { UploadPurpose } from '../../common/enums/upload-purpose.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UploadBatchDto, UploadFileDto } from './dto/upload-file.dto';
import { UploadsService } from './uploads.service';
import { getMultipartTextField } from './utils/multipart-fields';

type MultipartRequest = {
  file: (options?: {
    limits?: { fileSize?: number; files?: number };
  }) => Promise<MultipartFile | undefined>;
  files: (options?: {
    limits?: { fileSize?: number; files?: number };
  }) => AsyncIterableIterator<MultipartFile>;
};

@ApiTags('uploads')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload one listing file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiCreatedResponse({ description: 'File uploaded and metadata stored.' })
  async uploadOne(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: MultipartRequest,
  ) {
    const file = await request.file({
      limits: { fileSize: this.uploadsService.maxFileSizeBytes, files: 1 },
    });

    if (!file) {
      throw new BadRequestException('Multipart file is required');
    }

    const purpose = this.uploadsService.parsePurpose(
      getMultipartTextField(file.fields, 'purpose'),
    );
    const category = this.uploadsService.parseCategory(
      getMultipartTextField(file.fields, 'category'),
    );

    return this.uploadsService.uploadOne(
      user.id,
      await this.toUploadFile(file),
      purpose,
      category,
    );
  }

  @Post('batch')
  @ApiOperation({ summary: 'Upload up to 10 listing files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadBatchDto })
  @ApiCreatedResponse({ description: 'Files uploaded and metadata stored.' })
  async uploadBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: MultipartRequest,
  ) {
    return this.uploadMany(user.id, request);
  }

  private async uploadMany(userId: string, request: MultipartRequest) {
    const files: Awaited<ReturnType<typeof this.toUploadFile>>[] = [];
    let purpose: UploadPurpose | undefined;
    let category: ListingCategory | undefined;

    for await (const file of request.files({
      limits: { fileSize: this.uploadsService.maxFileSizeBytes, files: 10 },
    })) {
      purpose ??= this.uploadsService.parsePurpose(
        getMultipartTextField(file.fields, 'purpose'),
      );
      category ??= this.uploadsService.parseCategory(
        getMultipartTextField(file.fields, 'category'),
      );
      files.push(await this.toUploadFile(file));
    }

    if (!purpose) {
      throw new BadRequestException('Valid upload purpose is required');
    }

    return this.uploadsService.uploadBatch(userId, files, purpose, category);
  }

  private async toUploadFile(file: MultipartFile) {
    return {
      originalName: file.filename,
      mimeType: file.mimetype,
      buffer: await file.toBuffer(),
    };
  }
}
