import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisputeStatus } from '../../common/enums/dispute-status.enum';
import { ListDisputesQueryDto } from './dto/list-disputes-query.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { Dispute } from './entities/dispute.entity';

@Injectable()
export class AdminDisputesService {
  constructor(
    @InjectRepository(Dispute) private readonly disputesRepository: Repository<Dispute>,
  ) {}

  async listDisputes(query: ListDisputesQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    const [items, total] = await this.disputesRepository.findAndCount({ where, order: { createdAt: 'DESC' } });
    return { items, total };
  }

  async investigateDispute(disputeId: string) {
    const dispute = await this.findDispute(disputeId);
    if (dispute.status !== DisputeStatus.Open) throw new BadRequestException('Dispute is not in open state');
    dispute.status = DisputeStatus.Investigating;
    return { dispute: await this.disputesRepository.save(dispute) };
  }

  async resolveDispute(adminId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.findDispute(disputeId);
    if (dispute.status === DisputeStatus.Resolved) throw new BadRequestException('Dispute is already resolved');
    dispute.status = DisputeStatus.Resolved;
    dispute.resolution = dto.resolution.trim();
    dispute.resolvedById = adminId;
    dispute.resolvedAt = new Date();
    return { dispute: await this.disputesRepository.save(dispute) };
  }

  private async findDispute(disputeId: string) {
    const dispute = await this.disputesRepository.findOneBy({ id: disputeId });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }
}
