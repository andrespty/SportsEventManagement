import { User } from "./models";
import { ApiResponse } from "./common";

export type LoginData = {
  access_token: string;
  user: User;
};

export type LoginResponse = ApiResponse<LoginData>

export enum UserRoles {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface AccessOptions {
  owner?: boolean;      // check if user is owner
  roles?: UserRoles[];     // check if user role is in this list
}
