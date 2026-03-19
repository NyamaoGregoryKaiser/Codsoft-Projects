import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialSchema1703080000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'firstName', type: 'varchar', length: '255' },
          { name: 'lastName', type: 'varchar', length: '255' },
          { name: 'role', type: 'enum', enum: ['user', 'admin'], default: "'user'" },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'stock', type: 'int', default: '0' },
          { name: 'imageUrl', type: 'varchar', isNullable: true },
          { name: 'isActive', type: 'boolean', default: 'true' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'product_categories',
        columns: [
          { name: 'productId', type: 'uuid', isPrimary: true },
          { name: 'categoryId', type: 'uuid', isPrimary: true },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'product_categories',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'product_categories',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'carts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid', isUnique: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'carts',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'cart_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'cartId', type: 'uuid' },
          { name: 'productId', type: 'uuid' },
          { name: 'quantity', type: 'int', default: '1' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        columnNames: ['cartId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'carts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );
    
    // Add Orders and OrderItems as well for a complete e-commerce schema
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid' },
          { name: 'totalAmount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'status', type: 'enum', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: "'pending'" },
          { name: 'shippingAddress', type: 'text' },
          { name: 'paymentMethod', type: 'varchar', length: '255' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'orderId', type: 'uuid' },
          { name: 'productId', type: 'uuid' },
          { name: 'quantity', type: 'int' },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 }, // Price at the time of order
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT', // Don't delete product if part of an order
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('order_items', 'FK_ORDERITEM_PRODUCT');
    await queryRunner.dropForeignKey('order_items', 'FK_ORDERITEM_ORDER');
    await queryRunner.dropTable('order_items');

    await queryRunner.dropForeignKey('orders', 'FK_ORDER_USER');
    await queryRunner.dropTable('orders');

    await queryRunner.dropForeignKey('cart_items', 'FK_CARTITEM_PRODUCT');
    await queryRunner.dropForeignKey('cart_items', 'FK_CARTITEM_CART');
    await queryRunner.dropTable('cart_items');

    await queryRunner.dropForeignKey('carts', 'FK_CART_USER');
    await queryRunner.dropTable('carts');

    await queryRunner.dropForeignKey('product_categories', 'FK_PRODUCTCATEGORY_CATEGORY');
    await queryRunner.dropForeignKey('product_categories', 'FK_PRODUCTCATEGORY_PRODUCT');
    await queryRunner.dropTable('product_categories');

    await queryRunner.dropTable('products');
    await queryRunner.dropTable('categories');
    await queryRunner.dropTable('users');
  }
}