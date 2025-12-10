// src/types/user.ts
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  phone: string;
}

export interface User {
  id: string;
  profile: UserProfile;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
  };
  theme: 'light' | 'dark';
}
