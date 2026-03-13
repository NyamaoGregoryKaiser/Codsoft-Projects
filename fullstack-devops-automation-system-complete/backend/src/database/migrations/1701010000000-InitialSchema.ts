```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1701010000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['USER', 'ADMIN'],
            default: "'USER'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0.00,
          },
          {
            name: 'stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: true, // Product can exist without a category
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL', // If a category is deleted, set product's categoryId to NULL
      })
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCT_NAME',
        columnNames: ['name'],
        isUnique: true,
      })
    );
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCT_CATEGORY_ID',
        columnNames: ['categoryId'],
      })
    );
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      })
    );
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USER_USERNAME',
        columnNames: ['username'],
        isUnique: true,
      })
    );
    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORY_NAME',
        columnNames: ['name'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('products', 'FK_products_categoryId_categories'); // Drop foreign key first
    await queryRunner.dropIndex('products', 'IDX_PRODUCT_NAME');
    await queryRunner.dropIndex('products', 'IDX_PRODUCT_CATEGORY_ID');
    await queryRunner.dropIndex('users', 'IDX_USER_EMAIL');
    await queryRunner.dropIndex('users', 'IDX_USER_USERNAME');
    await queryRunner.dropIndex('categories', 'IDX_CATEGORY_NAME');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('users');
  }
}
```