import { Test } from '@nestjs/testing';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import type { CreateCarListingDto } from './dto/create-car-listing.dto';
import type { UpdateCarListingDto } from './dto/update-car-listing.dto';

describe('CarsController', () => {
  const user: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: UserRole.Mechanic,
    authRole: 'user',
    sessionId: 'session-id',
  };
  let controller: CarsController;
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
      controllers: [CarsController],
      providers: [
        { provide: CarsService, useValue: service },
        { provide: AuthService, useValue: { getAuthenticatedUser: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(CarsController);
  });

  it('creates a draft car listing', async () => {
    const dto = createCarDto();
    service.create.mockResolvedValue({ carListing: dto });

    await expect(controller.create(user, dto)).resolves.toEqual({
      carListing: dto,
    });
    expect(service.create).toHaveBeenCalledWith(user.id, dto);
  });

  it('lists current user car listings', async () => {
    service.listMine.mockResolvedValue({ carListings: [] });

    await expect(controller.listMine(user)).resolves.toEqual({
      carListings: [],
    });
    expect(service.listMine).toHaveBeenCalledWith(user.id);
  });

  it('gets a car listing', async () => {
    service.findOne.mockResolvedValue({ carListing: { id: 'car-id' } });

    await expect(controller.findOne('car-id')).resolves.toEqual({
      carListing: { id: 'car-id' },
    });
    expect(service.findOne).toHaveBeenCalledWith('car-id');
  });

  it('updates a draft car listing', async () => {
    const dto: UpdateCarListingDto = { colour: 'Blue' };
    service.update.mockResolvedValue({ carListing: dto });

    await expect(controller.update(user, 'car-id', dto)).resolves.toEqual({
      carListing: dto,
    });
    expect(service.update).toHaveBeenCalledWith(user.id, 'car-id', dto);
  });

  it('submits a car listing for review', async () => {
    service.submit.mockResolvedValue({ carListing: { id: 'car-id' } });

    await expect(controller.submit(user, 'car-id')).resolves.toEqual({
      carListing: { id: 'car-id' },
    });
    expect(service.submit).toHaveBeenCalledWith(user.id, 'car-id');
  });
});

function createCarDto(): CreateCarListingDto {
  return {
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    colour: 'Black',
    registrationNumber: 'ABC-123-LA',
    mileage: 68000,
    condition: 'Good',
    photoUrls: ['https://cdn.example.com/car.jpg'],
    basePriceKobo: 250000000,
    holdPercent: 10,
    minimumBidIncrementKobo: 5000000,
    startTime: '2026-05-01T12:00:00.000Z',
    durationMinutes: 120,
  };
}
