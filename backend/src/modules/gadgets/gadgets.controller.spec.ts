import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { CreateGadgetListingDto } from './dto/create-gadget-listing.dto';
import type { UpdateGadgetListingDto } from './dto/update-gadget-listing.dto';
import { GadgetsController } from './gadgets.controller';
import { GadgetsService } from './gadgets.service';

describe('GadgetsController', () => {
  const user: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.IndividualBidder,
  };
  let controller: GadgetsController;
  let service: {
    create: jest.Mock;
    listMine: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    submit: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      listMine: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      submit: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [GadgetsController],
      providers: [{ provide: GadgetsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(GadgetsController);
  });

  it('creates a draft gadget listing', async () => {
    const dto = createGadgetDto();
    service.create.mockResolvedValue({ gadgetListing: dto });

    await expect(controller.create(user, dto)).resolves.toEqual({
      gadgetListing: dto,
    });
    expect(service.create).toHaveBeenCalledWith(user.id, dto);
  });

  it('lists current user gadget listings', async () => {
    service.listMine.mockResolvedValue({ gadgetListings: [] });

    await expect(controller.listMine(user)).resolves.toEqual({
      gadgetListings: [],
    });
    expect(service.listMine).toHaveBeenCalledWith(user.id);
  });

  it('gets a gadget listing', async () => {
    service.findOne.mockResolvedValue({ gadgetListing: { id: 'gadget-id' } });

    await expect(controller.findOne('gadget-id')).resolves.toEqual({
      gadgetListing: { id: 'gadget-id' },
    });
    expect(service.findOne).toHaveBeenCalledWith('gadget-id');
  });

  it('updates a draft gadget listing', async () => {
    const dto: UpdateGadgetListingDto = { colour: 'Blue' };
    service.update.mockResolvedValue({ gadgetListing: dto });

    await expect(controller.update(user, 'gadget-id', dto)).resolves.toEqual({
      gadgetListing: dto,
    });
    expect(service.update).toHaveBeenCalledWith(user.id, 'gadget-id', dto);
  });

  it('submits a gadget listing for review', async () => {
    service.submit.mockResolvedValue({ gadgetListing: { id: 'gadget-id' } });

    await expect(controller.submit(user, 'gadget-id')).resolves.toEqual({
      gadgetListing: { id: 'gadget-id' },
    });
    expect(service.submit).toHaveBeenCalledWith(user.id, 'gadget-id');
  });
});

function createGadgetDto(): CreateGadgetListingDto {
  return {
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    colour: 'Space Black',
    batteryHealthPercent: 88,
    specs: { ram: '6GB', storage: '256GB' },
    usageHistory: 'Used for one year.',
    proofDocumentUrl: 'https://cdn.example.com/receipt.pdf',
    photoUrls: ['https://cdn.example.com/gadget.jpg'],
    basePriceKobo: 45000000,
    holdPercent: 10,
    minimumBidIncrementKobo: 1000000,
    startTime: '2026-05-01T12:00:00.000Z',
    durationMinutes: 60,
  };
}

