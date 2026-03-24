export interface UserToken {
  accessToken: string;
  tokenType: string;
  role: string;
  userId: number;
  username: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserToken | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, username: string, email: string, password: string) => Promise<string>;
  logout: () => void;
}