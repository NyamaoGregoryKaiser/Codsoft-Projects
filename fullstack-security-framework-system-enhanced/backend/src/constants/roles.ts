export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type Role = typeof UserRoles[keyof typeof UserRoles];