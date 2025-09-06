// Global type declarations for auth types
// These types are automatically available throughout the app

declare global {
  type LoginData = {
    access_token: string;
    user: User;
  };

  type LoginResponse = ApiResponse<LoginData>;

  enum UserRoles {
    USER = 'user',
    MANAGER = 'manager',
    ADMIN = 'admin'
  }

  interface AccessOptions {
    owner?: boolean;      // check if user is owner
    roles?: UserRoles[];  // check if user role is in this list
  }
}

// This export is required for the global declaration to work
export {};
