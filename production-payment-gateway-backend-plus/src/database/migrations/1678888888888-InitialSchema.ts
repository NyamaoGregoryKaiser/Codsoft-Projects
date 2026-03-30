```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialSchema1678888888888 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "email", type: "varchar", length: "255", isUnique: true },
                { name: "password", type: "varchar", length: "255" },
                { name: "role", type: "enum", enum: ["ADMIN", "MERCHANT"], default: "'MERCHANT'" },
                // merchantId will be added after merchant table is created, as an FK
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: "merchant",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "name", type: "varchar", length: "255", isUnique: true },
                { name: "apiKey", type: "varchar", length: "255", isUnique: true },
                { name: "isActive", type: "boolean", default: true },
                { name: "contactEmail", type: "varchar", length: "255", isNullable: true },
                { name: "ownerUserId", type: "uuid", isUnique: true } // Foreign key to User
            ]
        }), true);

        await queryRunner.createForeignKey("merchant", new TableForeignKey({
            columnNames: ["ownerUserId"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE" // If a user is deleted, their merchant is also deleted
        }));

        await queryRunner.createTable(new Table({
            name: "payment_account",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "type", type: "enum", enum: ["BANK_ACCOUNT", "CARD"] },
                { name: "accountIdentifier", type: "varchar", length: "255" },
                { name: "bankName", type: "varchar", length: "255", isNullable: true },
                { name: "isDefault", type: "boolean", default: false },
                { name: "merchantId", type: "uuid" }
            ]
        }), true);

        await queryRunner.createForeignKey("payment_account", new TableForeignKey({
            columnNames: ["merchantId"],
            referencedColumnNames: ["id"],
            referencedTableName: "merchant",
            onDelete: "CASCADE"
        }));

        await queryRunner.createTable(new Table({
            name: "transaction",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "amount", type: "decimal", precision: 10, scale: 2 },
                { name: "currency", type: "varchar", length: "3" },
                { name: "description", type: "varchar", length: "255", isNullable: true },
                { name: "status", type: "enum", enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"], default: "'PENDING'" },
                { name: "type", type: "enum", enum: ["SALE", "AUTHORIZATION"], default: "'SALE'" },
                { name: "gatewayReference", type: "varchar", length: "255", isNullable: true },
                { name: "customerIdentifier", type: "varchar", length: "255", isNullable: true },
                { name: "processedAt", type: "timestamp", isNullable: true },
                { name: "callbackUrl", type: "varchar", length: "2048", isNullable: true },
                { name: "merchantId", type: "uuid" }
            ]
        }), true);

        await queryRunner.createForeignKey("transaction", new TableForeignKey({
            columnNames: ["merchantId"],
            referencedColumnNames: ["id"],
            referencedTableName: "merchant",
            onDelete: "CASCADE"
        }));

        await queryRunner.createTable(new Table({
            name: "refund",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "amount", type: "decimal", precision: 10, scale: 2 },
                { name: "currency", type: "varchar", length: "3" },
                { name: "status", type: "enum", enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"], default: "'PENDING'" },
                { name: "gatewayReference", type: "varchar", length: "255", isNullable: true },
                { name: "processedAt", type: "timestamp", isNullable: true },
                { name: "transactionId", type: "uuid" }
            ]
        }), true);

        await queryRunner.createForeignKey("refund", new TableForeignKey({
            columnNames: ["transactionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "transaction",
            onDelete: "CASCADE"
        }));

        await queryRunner.createTable(new Table({
            name: "webhook_event",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, default: "uuid_generate_v4()" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updatedAt", type: "timestamp", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                { name: "eventType", type: "enum", enum: ["payment.succeeded", "payment.failed", "refund.succeeded", "refund.failed"] },
                { name: "targetUrl", type: "varchar", length: "2048" },
                { name: "payload", type: "jsonb" },
                { name: "deliveryStatus", type: "enum", enum: ["PENDING", "SENT", "FAILED", "RETRYING"], default: "'PENDING'" },
                { name: "retryAttempts", type: "int", default: 0 },
                { name: "lastAttemptedAt", type: "timestamp", isNullable: true },
                { name: "nextAttemptAt", type: "timestamp", isNullable: true },
                { name: "responseCode", type: "int", isNullable: true },
                { name: "responseBody", type: "text", isNullable: true },
                { name: "merchantId", type: "uuid" }
            ]
        }), true);

        await queryRunner.createForeignKey("webhook_event", new TableForeignKey({
            columnNames: ["merchantId"],
            referencedColumnNames: ["id"],
            referencedTableName: "merchant",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("webhook_event", "FK_webhook_event_merchantId");
        await queryRunner.dropTable("webhook_event");
        await queryRunner.dropForeignKey("refund", "FK_refund_transactionId");
        await queryRunner.dropTable("refund");
        await queryRunner.dropForeignKey("transaction", "FK_transaction_merchantId");
        await queryRunner.dropTable("transaction");
        await queryRunner.dropForeignKey("payment_account", "FK_payment_account_merchantId");
        await queryRunner.dropTable("payment_account");
        await queryRunner.dropForeignKey("merchant", "FK_merchant_ownerUserId");
        await queryRunner.dropTable("merchant");
        await queryRunner.dropTable("user");
    }
}
```