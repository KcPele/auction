import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    const database = this.dataSource.isInitialized ? 'up' : 'down';

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      services: {
        database,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

