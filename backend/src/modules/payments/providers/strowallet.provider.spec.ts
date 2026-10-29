import { StrowalletProvider } from './strowallet.provider';

describe('StrowalletProvider NIN verification', () => {
  const fetchMock = jest.fn();
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        STROWALLET_BASE_URL: 'https://strowallet.test',
        STROWALLET_PUBLIC_KEY: 'public-key',
        STROWALLET_MODE: 'sandbox',
      };
      return values[key] ?? fallback;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: true }),
    }) as never;
  });

  it('sends mode and normalizes an international Nigerian phone number', async () => {
    const provider = new StrowalletProvider(config as never);

    await provider.verifyNin({
      numberNin: '12345678901',
      surname: 'Okafor',
      firstname: 'Ada',
      birthdate: '04-03-1990',
      telephoneno: '+2348123456789',
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.get('mode')).toBe('sandbox');
    expect(requestUrl.searchParams.get('telephoneno')).toBe('08123456789');
  });
});

describe('StrowalletProvider BVN verification', () => {
  const fetchMock = jest.fn();
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        STROWALLET_BASE_URL: 'https://strowallet.test',
        STROWALLET_PUBLIC_KEY: 'public-key',
        STROWALLET_MODE: 'live',
      };
      return values[key] ?? fallback;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: true, trx: 'trx-id' }),
    }) as never;
  });

  it('sends the phone number in the local format the OTP delivery needs', async () => {
    const provider = new StrowalletProvider(config as never);

    await provider.verifyBvn({
      number: '12345678901',
      firstName: 'Ada',
      lastName: 'Okafor',
      dateOfBirth: '04-03-1990',
      phoneNumber: '+2347019736590',
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.get('phoneNumber')).toBe('07019736590');
    expect(requestUrl.searchParams.get('firstName')).toBe('ADA');
    expect(requestUrl.searchParams.get('mode')).toBe('live');
  });
});
