export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}
// Success response has data
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

// Error response has error
export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string | number;
  };
};

// Union type = either success or error
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}