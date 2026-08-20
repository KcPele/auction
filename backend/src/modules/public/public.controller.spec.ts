import { Test } from '@nestjs/testing';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('PublicController', () => {
  it('returns the verified mechanic directory', async () => {
    const service = {
      listVerifiedMechanics: jest.fn().mockResolvedValue({
        items: [{ id: 'mechanic-id', name: 'Tunde Mechanic' }],
      }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [{ provide: PublicService, useValue: service }],
    }).compile();

    await expect(
      moduleRef.get(PublicController).listVerifiedMechanics(),
    ).resolves.toEqual({
      items: [{ id: 'mechanic-id', name: 'Tunde Mechanic' }],
    });
  });
});
