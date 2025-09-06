// Global type declarations for common types
// These types are automatically available throughout the app

declare global {
  interface BaseEntity {
    id: number;
    createdAt: string;
    updatedAt: string;
  }

  // Success response has data
  type ApiSuccess<T> = {
    success: true;
    data: T;
  };

  // Error response has error
  type ApiError = {
    success: false;
    error: {
      message: string;
      code?: string | number;
    };
  };

  // Union type = either success or error
  type ApiResponse<T> = ApiSuccess<T> | ApiError;

  interface LoadingState {
    isLoading: boolean;
    error: string | null;
  }
}

// This export is required for the global declaration to work
export {};
