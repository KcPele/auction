import { apiClient } from "@/app/lib/api/client";
import type { Me, MeDto, SignInInput, SignUpInput } from "../types/auth.types";

const toMe = (dto: MeDto): Me => ({
  id: dto.user.id,
  email: dto.user.email,
  phone: dto.user.phone,
  firstName: dto.user.firstName,
  lastName: dto.user.lastName,
  fullName: `${dto.user.firstName} ${dto.user.lastName}`.trim(),
  role: dto.user.role,
  appRole: dto.user.role,
  nin: dto.user.nin,
  ninVerified: Boolean(dto.user.nin),
  isActive: dto.user.isActive,
  notificationPreferences: dto.notificationPreferences,
  listingPermissions: dto.listingPermissions,
});

export const getMe = async (): Promise<Me> => {
  const dto = await apiClient<MeDto>("/users/me");
  return toMe(dto);
};

// Better Auth's React client `signUp.email` accepts only `name + email + password`.
// Backend's SignUpEmailDto adds firstName/lastName/phone/appRole/nin/referralCode —
// Better Auth forwards the extra fields through to the user table when listed in
// `additionalFields`. We hit Better Auth's HTTP route directly to keep that simple.
export const signUpEmail = async (input: SignUpInput) => {
  const name = `${input.firstName} ${input.lastName}`.trim();
  return apiClient<{ user: { id: string }; token: string | null }>(
    "/auth/sign-up/email",
    {
      method: "POST",
      body: {
        name,
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        appRole: input.appRole,
        ...(input.nin ? { nin: input.nin } : {}),
        ...(input.referralCode ? { referralCode: input.referralCode } : {}),
      },
    },
  );
};

export const signInEmail = async (input: SignInInput) =>
  apiClient<{ user: { id: string }; token: string | null }>(
    "/auth/sign-in/email",
    {
      method: "POST",
      body: { email: input.email, password: input.password },
    },
  );

export const signOutCall = async () =>
  apiClient<{ success: boolean }>("/auth/sign-out", { method: "POST" });

export const requestPasswordReset = (input: {
  email: string;
  callbackURL?: string;
}) =>
  apiClient<{ status: boolean }>("/auth/forget-password", {
    method: "POST",
    body: input,
  });

export const resetPassword = (input: { token: string; newPassword: string }) =>
  apiClient<{ status: boolean }>("/auth/reset-password", {
    method: "POST",
    body: input,
  });

export const verifyNin = (nin: string) =>
  apiClient<{ verified: boolean; data?: unknown }>("/auth/verify-nin", {
    method: "POST",
    body: { nin },
  });

// Email verification OTP (Better Auth email-otp plugin).
// Backend forwards /auth/* to Better Auth via the catch-all controller.
export const sendVerificationOtp = (email: string) =>
  apiClient<{ status: boolean }>("/auth/email-otp/send-verification-otp", {
    method: "POST",
    body: { email, type: "email-verification" },
  });

export const verifyEmailOtp = (input: { email: string; otp: string }) =>
  apiClient<{ status: boolean }>("/auth/email-otp/verify-email", {
    method: "POST",
    body: input,
  });
