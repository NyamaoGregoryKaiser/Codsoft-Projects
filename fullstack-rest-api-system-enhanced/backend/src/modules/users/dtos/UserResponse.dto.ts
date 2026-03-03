import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../../../database/entities/User';

@Exclude()
export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  role!: UserRole;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}