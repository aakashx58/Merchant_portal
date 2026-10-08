import { RoleEnum } from '../enums/role.enum';

export interface User {
  id: string;
  username: string;
  roles: RoleEnum[];
  token: string;
  refreshToken: string;
}
