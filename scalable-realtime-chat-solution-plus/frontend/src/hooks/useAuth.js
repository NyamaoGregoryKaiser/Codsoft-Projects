```javascript
/**
 * @file Custom React hook for accessing authentication context.
 * @module hooks/useAuth
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * A custom hook to easily access the authentication context.
 * @returns {object} The authentication context object.
 * @throws {Error} If `useAuth` is used outside of an `AuthProvider`.
 */
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;
```