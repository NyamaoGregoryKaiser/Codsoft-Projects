import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { UserRole } from '../entities/user.entity';
import { PaymentMethodType } from '../entities/payment-method.entity';
import { TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { WebhookEventType } from '../entities/webhook-subscription.entity';
import { WebhookAttemptStatus } from '../entities/webhook-attempt.entity';

export class InitialSchema1701389800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'merchants',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'contactEmail', type: 'varchar', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'apiKey', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'apiSecret', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'passwordHash', type: 'varchar' },
          {
            name: 'role',
            type: 'enum',
            enum: Object.values(UserRole),
            default: `'${UserRole.MERCHANT_USER}'`,
          },
          { name: 'merchantId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['merchantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'merchantId', type: 'uuid', isNullable: true },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(PaymentMethodType),
          },
          { name: 'gatewayToken', type: 'varchar', isNullable: true },
          { name: 'cardBrand', type: 'varchar', isNullable: true },
          { name: 'last4', type: 'varchar', length: '4', isNullable: true },
          { name: 'expiryMonth', type: 'int', isNullable: true },
          { name: 'expiryYear', type: 'int', isNullable: true },
          { name: 'fingerprint', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'isDefault', type: 'boolean', default: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'payment_methods',
      new TableForeignKey({
        columnNames: ['merchantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'merchantId', type: 'uuid' },
          { name: 'paymentMethodId', type: 'uuid', isNullable: true },
          { name: 'processedById', type: 'uuid', isNullable: true },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'refundedAmount', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'currency', type: 'varchar', length: '3' },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(TransactionType),
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(TransactionStatus),
            default: `'${TransactionStatus.PENDING}'`,
          },
          { name: 'gatewayTransactionId', type: 'varchar', isNullable: true },
          { name: 'customerEmail', type: 'varchar', isNullable: true },
          { name: 'customerName', type: 'varchar', isNullable: true },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['merchantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['paymentMethodId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_methods',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['processedById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'webhook_subscriptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'merchantId', type: 'uuid' },
          { name: 'callbackUrl', type: 'varchar' },
          {
            name: 'eventTypes',
            type: 'enum',
            enum: Object.values(WebhookEventType),
            isArray: true,
            default: `ARRAY['${WebhookEventType.TRANSACTION_UPDATED}']`,
          },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'webhook_subscriptions',
      new TableForeignKey({
        columnNames: ['merchantId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'webhook_attempts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'subscriptionId', type: 'uuid' },
          { name: 'transactionId', type: 'uuid', isNullable: true },
          {
            name: 'eventType',
            type: 'enum',
            enum: Object.values(WebhookEventType),
          },
          { name: 'payload', type: 'jsonb' },
          { name: 'url', type: 'varchar' },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(WebhookAttemptStatus),
            default: `'${WebhookAttemptStatus.PENDING}'`,
          },
          { name: 'statusCode', type: 'int', isNullable: true },
          { name: 'responseBody', type: 'text', isNullable: true },
          { name: 'retries', type: 'int', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'webhook_attempts',
      new TableForeignKey({
        columnNames: ['subscriptionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'webhook_subscriptions',
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'webhook_attempts',
      new TableForeignKey({
        columnNames: ['transactionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'transactions',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('webhook_attempts', 'FK_WEBHOOK_ATTEMPTS_SUBSCRIPTION');
    await queryRunner.dropForeignKey('webhook_attempts', 'FK_WEBHOOK_ATTEMPTS_TRANSACTION');
    await queryRunner.dropTable('webhook_attempts');

    await queryRunner.dropForeignKey('webhook_subscriptions', 'FK_WEBHOOK_SUBSCRIPTIONS_MERCHANT');
    await queryRunner.dropTable('webhook_subscriptions');

    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_MERCHANT');
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_PAYMENT_METHOD');
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_PROCESSED_BY');
    await queryRunner.dropTable('transactions');

    await queryRunner.dropForeignKey('payment_methods', 'FK_PAYMENT_METHODS_MERCHANT');
    await queryRunner.dropTable('payment_methods');

    await queryRunner.dropForeignKey('users', 'FK_USERS_MERCHANT');
    await queryRunner.dropTable('users');

    await queryRunner.dropTable('merchants');
  }
}