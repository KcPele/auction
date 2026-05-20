// Wire types — match backend Better Auth + /users/me response.
export type SessionUserDto = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionDto = {
  user: SessionUserDto;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
  };
};

// /users/me — domain user record + prefs + permissions.
export type MeUserDto = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  nin: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferencesDto = {
  whatsappEnabled: boolean;
  readyToBid: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
};

export type ListingPermissionDto = {
  category: "CAR" | "GADGET";
  grantedAt: string;
};

export type MeDto = {
  user: MeUserDto;
  notificationPreferences: NotificationPreferencesDto;
  listingPermissions: ListingPermissionDto[];
};

export type Me = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  appRole: string;
  nin: string | null;
  ninVerified: boolean;
  isActive: boolean;
  notificationPreferences: NotificationPreferencesDto;
  listingPermissions: ListingPermissionDto[];
};

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  appRole: string;
  nin?: string;
  referralCode?: string;
};

export type SignInInput = {
  email: string;
  password: string;
};
