import { BadRequestException } from '@nestjs/common';

export function assertHoldPercent(value: number) {
  if (value < 10 || value > 20) {
    throw new BadRequestException('Hold percent must be between 10 and 20');
  }
}

export function assertFutureStartTime(startTime: Date) {
  if (startTime.getTime() <= Date.now()) {
    throw new BadRequestException('Auction start time must be in the future');
  }
}

