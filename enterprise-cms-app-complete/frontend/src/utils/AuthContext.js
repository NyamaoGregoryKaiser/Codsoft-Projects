import { createContext } => 'react';

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
});

export default AuthContext;