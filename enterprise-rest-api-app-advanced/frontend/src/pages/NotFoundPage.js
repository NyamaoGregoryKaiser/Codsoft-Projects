import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center bg-gray-100">
      <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
      <p className="text-2xl text-gray-800 mt-4 mb-8">Page Not Found</p>
      <p className="text-lg text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="button-primary mt-8">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
```

***

### 2. Database Layer

**`backend/src/main/resources/db/schema.sql`**
```sql