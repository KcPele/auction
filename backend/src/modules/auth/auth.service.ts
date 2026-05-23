import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { IncomingHttpHeaders } from 'http';
import { Pool } from 'pg';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/email/email.service';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { NotificationPreference } from '../users/entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';

type BetterAuthModule = {
  betterAuth: (options: Record<string, unknown>) => BetterAuthInstance;
};
type BetterAuthNodeModule = {
  fromNodeHeaders: (headers: IncomingHttpHeaders) => Headers;
};
type BetterAuthPluginsModule = {
  admin: (options: Record<string, unknown>) => unknown;
};

type BetterAuthInstance = {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (context: { headers: Headers }) => Promise<{
      user: {
        id: string;
        role?: string | string[] | null;
      };
      session: { id: string };
    } | null>;
    signInEmail: (context: { body: Record<string, unknown>; headers: Headers }) => Promise<Response>;
  };
};

type BetterAuthUser = {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  appRole?: string;
  nin?: string | null;
  referralCode?: string;
  name?: string;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private auth: BetterAuthInstance | null = null;
  private authInit: Promise<BetterAuthInstance> | null = null;
  private nodeHelpers: Promise<BetterAuthNodeModule> | null = null;
  private pool: Pool | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
    private readonly emailService: EmailService,
  ) {}

  async handleRequest(request: {
    method: string;
    url: string;
    body?: unknown;
    headers: IncomingHttpHeaders;
  }) {
    const auth = await this.getAuth();
    const { fromNodeHeaders } = await this.getNodeHelpers();
    const url = new URL(request.url, this.getOrigin(request.headers));
    const body = this.shouldForwardBody(request.method, request.body)
      ? JSON.stringify(request.body)
      : undefined;

    return auth.handler(
      new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body,
      }),
    );
  }

  async signInWithPhone(phone: string, password: string, headers: IncomingHttpHeaders) {
    const user = await this.usersRepository.findOneBy({ phone });
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    const auth = await this.getAuth();
    const { fromNodeHeaders } = await this.getNodeHelpers();

    const authApi = auth.api as Record<string, unknown>;
    const signIn = authApi.signInEmail as (context: {
      body: Record<string, unknown>;
      headers: Headers;
    }) => Promise<Response>;

    return signIn({
      body: { email: user.email, password },
      headers: fromNodeHeaders(headers),
    });
  }

  async verifyNin(nin: string) {
    const existing = await this.usersRepository.findOneBy({ nin });
    if (existing) {
      return { verified: true, name: `${existing.firstName} ${existing.lastName}` };
    }

    return { verified: true, name: null };
  }

  async getAuthenticatedUser(
    headers: IncomingHttpHeaders,
  ): Promise<AuthenticatedUser> {
    const auth = await this.getAuth();
    const { fromNodeHeaders } = await this.getNodeHelpers();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    const appUser = await this.usersRepository.findOneBy({
      id: session.user.id,
      isActive: true,
    });

    return {
      id: session.user.id,
      role: this.getEffectiveRole(session.user.role, appUser?.role),
      authRole: this.getAuthRole(session.user.role),
      sessionId: session.session.id,
    };
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  private async getAuth() {
    if (this.auth) {
      return this.auth;
    }

    this.authInit ??= this.createAuth();
    this.auth = await this.authInit;

    return this.auth;
  }

  private async createAuth(): Promise<BetterAuthInstance> {
    const [{ betterAuth }, { admin }] = await Promise.all([
      this.importEsm<BetterAuthModule>('better-auth'),
      this.importEsm<BetterAuthPluginsModule>('better-auth/plugins'),
    ]);

    this.pool = new Pool({
      connectionString: this.databaseUrl,
      keepAlive: true,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      max: 10,
    });
    // node-postgres emits `error` on idle clients when the socket dies; if
    // nothing listens, the event escalates to an unhandled exception and
    // crashes the process. Log + drop so the pool can reconnect on next use.
    this.pool.on('error', (err: Error) => {
      console.error('[auth pg pool] idle client error:', err.message);
    });

    return betterAuth({
      appName: this.config.getOrThrow<string>('APP_NAME'),
      baseURL: this.config.getOrThrow<string>('BETTER_AUTH_URL'),
      basePath: '/api/v1/auth',
      secret: this.config.getOrThrow<string>('BETTER_AUTH_SECRET'),
      database: this.pool,
      trustedOrigins: this.config
        .getOrThrow<string>('CORS_ORIGINS')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        sendResetPassword: async (data: {
          url: string;
          token: string;
          user: { email?: string; name?: string };
        }) => {
          if (!data.user.email) return;
          await this.emailService.send({
            to: data.user.email,
            subject: 'Reset your BidNaija password',
            html: `<p>Hi${data.user.name ? ' ' + data.user.name : ''},</p>
              <p>Click the link below to reset your BidNaija password. The link expires in 1 hour.</p>
              <p><a href="${data.url}">${data.url}</a></p>
              <p>If you didn't ask for this, you can safely ignore this email.</p>`,
            text: `Reset your BidNaija password: ${data.url}`,
          });
        },
      },
      emailVerification: {
        sendOnSignUp: false,
        sendVerificationEmail: async (data: {
          url: string;
          token: string;
          user: { email?: string; name?: string };
        }) => {
          if (!data.user.email) return;
          await this.emailService.send({
            to: data.user.email,
            subject: 'Verify your BidNaija email',
            html: `<p>Hi${data.user.name ? ' ' + data.user.name : ''},</p>
              <p>Confirm your email so we can keep your account secure.</p>
              <p><a href="${data.url}">${data.url}</a></p>`,
            text: `Verify your BidNaija email: ${data.url}`,
          });
        },
      },
      advanced: { database: { generateId: 'uuid' } },
      user: this.userSchema,
      session: this.sessionSchema,
      account: this.accountSchema,
      verification: this.verificationSchema,
      plugins: [admin({ defaultRole: 'user', adminRoles: ['admin'] })],
      databaseHooks: {
        user: {
          create: {
            before: async (user: BetterAuthUser) => ({
              data: {
                ...user,
                name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                role: 'user',
              },
            }),
            after: async (user: BetterAuthUser) => {
              await this.createAppProfile(user as BetterAuthUser);
            },
          },
        },
      },
    }) as BetterAuthInstance;
  }

  private async createAppProfile(authUser: BetterAuthUser) {
    const appRole = this.toAppRole(authUser.appRole);

    if (appRole === UserRole.Admin) {
      throw new BadRequestException('Admin users cannot self-register');
    }

    await this.usersRepository.save(
      this.usersRepository.create({
        id: authUser.id,
        email: authUser.email.toLowerCase().trim(),
        phone: this.requiredField(authUser.phone, 'phone'),
        passwordHash: null,
        firstName: this.requiredField(authUser.firstName, 'firstName'),
        lastName: this.requiredField(authUser.lastName, 'lastName'),
        role: appRole,
        nin: authUser.nin ?? null,
      }),
    );

    await this.preferencesRepository.save(
      this.preferencesRepository.create({ userId: authUser.id }),
    );
  }

  private getNodeHelpers() {
    this.nodeHelpers ??= this.importEsm<BetterAuthNodeModule>(
      'better-auth/node',
    );

    return this.nodeHelpers;
  }

  private get databaseUrl() {
    const host = this.config.getOrThrow<string>('DATABASE_HOST');
    const port = this.config.getOrThrow<number>('DATABASE_PORT');
    const user = this.config.getOrThrow<string>('DATABASE_USER');
    const password = this.config.getOrThrow<string>('DATABASE_PASSWORD');
    const name = this.config.getOrThrow<string>('DATABASE_NAME');

    return `postgres://${user}:${password}@${host}:${port}/${name}`;
  }

  private getOrigin(headers: IncomingHttpHeaders) {
    const protocol = headers['x-forwarded-proto'] ?? 'http';
    const host = headers['x-forwarded-host'] ?? headers.host ?? 'localhost';

    return `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`;
  }

  private getEffectiveRole(
    authRole: string | string[] | null | undefined,
    appRole?: UserRole,
  ) {
    return this.getAuthRole(authRole) === 'admin'
      ? UserRole.Admin
      : (appRole ?? UserRole.IndividualBidder);
  }

  private getAuthRole(role: string | string[] | null | undefined) {
    const roles = Array.isArray(role) ? role : String(role ?? '').split(',');

    return roles.map((value) => value.trim().toLowerCase()).includes('admin')
      ? 'admin'
      : 'user';
  }

  private toAppRole(role: string | undefined) {
    if (!role) {
      return UserRole.IndividualBidder;
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid account role');
    }

    return role as UserRole;
  }

  private requiredField(value: string | undefined, field: string) {
    if (!value?.trim()) {
      throw new BadRequestException(`${field} is required`);
    }

    return value.trim();
  }

  private shouldForwardBody(method: string, body: unknown) {
    return !['GET', 'HEAD'].includes(method.toUpperCase()) && body != null;
  }

  private async importEsm<T>(specifier: string): Promise<T> {
    const importer = new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<T>;

    return importer(specifier);
  }

  private readonly userSchema = {
    modelName: 'auth_users',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      phone: { type: 'string', required: true, unique: true },
      firstName: { type: 'string', required: true, fieldName: 'first_name' },
      lastName: { type: 'string', required: true, fieldName: 'last_name' },
      appRole: {
        type: 'string',
        required: false,
        fieldName: 'app_role',
        defaultValue: UserRole.IndividualBidder,
      },
      nin: { type: 'string', required: false },
      referralCode: { type: 'string', required: false, fieldName: 'referral_code' },
    },
  } as const;

  private readonly sessionSchema = {
    modelName: 'auth_sessions',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  } as const;

  private readonly accountSchema = {
    modelName: 'auth_accounts',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  } as const;

  private readonly verificationSchema = {
    modelName: 'auth_verifications',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  } as const;
}
