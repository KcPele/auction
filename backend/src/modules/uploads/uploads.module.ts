import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadAsset } from './entities/upload-asset.entity';
import { UploadsController } from './uploads.controller';
import { OpeninaryProvider } from './providers/openinary.provider';
import { UploadsService } from './uploads.service';

@Module({
  imports: [TypeOrmModule.forFeature([UploadAsset])],
  controllers: [UploadsController],
  providers: [UploadsService, OpeninaryProvider],
  exports: [UploadsService],
})
export class UploadsModule {}
