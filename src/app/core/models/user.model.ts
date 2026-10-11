import { RoleEnum } from '../constants/role.enum';

export interface User {
  id: string;
  username: string;
  roles: RoleEnum[];
  token: string;
  refreshToken: string;
}
