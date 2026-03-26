export type LocalUser = {
  username: string;
  password: string;
  createdAt: number;
};

export type SessionUser = {
  username: string;
  loggedInAt: number;
};

export type AccountProfile = {
  username: string;
  displayName: string;
  avatarUrl: string;
  faction: string;
  subfaction: string;
  homeland: string;
  tags: string[];
  bio: string;
  favoriteRealm: string;
};

export const USERS_KEY = "wh_users_v1";
export const SESSION_KEY = "wh_session_v1";
export const ACCOUNT_PROFILES_KEY = "wh_account_profiles_v1";
