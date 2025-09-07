// Global type declarations for auth types
// These types are automatically available throughout the app

export enum UserRoles {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

declare global {
  type LoginData = {
    access_token: string;
    user: User;
  };

  type LoginResponse = ApiResponse<LoginData>;

  interface AccessOptions {
    owner?: boolean;      // check if user is owner
    roles?: UserRoles[];  // check if user role is in this list
  }
}
