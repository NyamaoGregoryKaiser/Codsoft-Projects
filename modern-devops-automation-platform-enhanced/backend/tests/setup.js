```javascript
// This file is used to setup global variables/mocks for tests if needed.
// For example, mock the logger to prevent test logs polluting console
const logger = require('../src/utils/logger');
logger.transports.forEach((t) => (t.silent = true));
```