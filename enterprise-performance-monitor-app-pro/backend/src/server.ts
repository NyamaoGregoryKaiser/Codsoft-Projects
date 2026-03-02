import app from './app';
import { env } from './config/env';
import { Logger } from './config/winston';

const PORT = env.PORT;

app.listen(PORT, () => {
  Logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});