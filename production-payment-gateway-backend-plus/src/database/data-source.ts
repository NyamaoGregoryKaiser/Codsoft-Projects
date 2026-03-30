```typescript
import { DataSource } from "typeorm";
import config from "../config";
import { User } from "../entities/User";
import { Merchant } from "../entities/Merchant";
import { Transaction } from "../entities/Transaction";
import { Refund } from "../entities/Refund";
import { WebhookEvent } from "../entities/WebhookEvent";
import { PaymentAccount } from "../entities/PaymentAccount";
import path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: config.NODE_ENV === "development", // Set to false in production, use migrations
  logging: config.NODE_ENV === "development" ? ["query", "error"] : false,
  entities: [User, Merchant, Transaction, Refund, WebhookEvent, PaymentAccount],
  migrations: [path.join(__dirname, "migrations/*.ts")],
  subscribers: [],
  extra: {
    max: 10, // Max number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  }
});
```