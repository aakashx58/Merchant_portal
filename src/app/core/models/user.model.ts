import { RoleEnum } from '../constants/role.enum';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: RoleEnum[];
  createdAt: string;
  updatedAt: string;
  token?: string;
  refreshToken?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
