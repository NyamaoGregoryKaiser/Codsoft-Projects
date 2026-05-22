```typescript
import morgan from 'morgan';
import logger from '../utils/logger';
import { config } from '../config/config';

// Custom stream for Winston logger
const stream = {
  write: (message: string) => logger.http(message.trim()),
};

// Morgan format string based on environment
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';

// Morgan middleware setup
const morganMiddleware = morgan(morganFormat, { stream });

export default morganMiddleware;
```