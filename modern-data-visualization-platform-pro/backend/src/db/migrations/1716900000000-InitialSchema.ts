import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1716900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'username', type: 'varchar', length: 100, isUnique: true, isNullable: false },
          { name: 'email', type: 'varchar', length: 255, isUnique: true, isNullable: false },
          { name: 'password_hash', type: 'varchar', length: 255, isNullable: false }, // Renamed from passwordHash for snake_case
          { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    // Datasets Table
    await queryRunner.createTable(
      new Table({
        name: 'datasets',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'owner_id', type: 'uuid', isNullable: false }, // Foreign key to users
          { name: 'name', type: 'varchar', length: 255, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'data', type: 'jsonb', isNullable: false }, // Store actual data
          { name: 'column_metadata', type: 'jsonb', isNullable: true }, // Store inferred column types
          { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'datasets',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Dashboards Table
    await queryRunner.createTable(
      new Table({
        name: 'dashboards',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'owner_id', type: 'uuid', isNullable: false }, // Foreign key to users
          { name: 'name', type: 'varchar', length: 255, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'dashboards',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Visualizations Table
    await queryRunner.createTable(
      new Table({
        name: 'visualizations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'owner_id', type: 'uuid', isNullable: false }, // Foreign key to users
          { name: 'name', type: 'varchar', length: 255, isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'type', type: 'enum', enum: ['bar', 'line', 'pie', 'table'], isNullable: false },
          { name: 'config', type: 'jsonb', isNullable: false, default: '{}' },
          { name: 'dataset_id', type: 'uuid', isNullable: false }, // Foreign key to datasets
          { name: 'dashboard_id', type: 'uuid', isNullable: true }, // Foreign key to dashboards (can be null for standalone viz)
          { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'visualizations',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'visualizations',
      new TableForeignKey({
        columnNames: ['dataset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'datasets',
        onDelete: 'CASCADE', // If dataset is deleted, visualization should be deleted
      })
    );

    await queryRunner.createForeignKey(
      'visualizations',
      new TableForeignKey({
        columnNames: ['dashboard_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dashboards',
        onDelete: 'CASCADE', // If dashboard is deleted, visualization should be deleted
      })
    );

    // Add indexes for performance
    await queryRunner.createIndex(
      'datasets',
      new TableIndex({ columnNames: ['owner_id'] })
    );
    await queryRunner.createIndex(
      'dashboards',
      new TableIndex({ columnNames: ['owner_id'] })
    );
    await queryRunner.createIndex(
      'visualizations',
      new TableIndex({ columnNames: ['owner_id'] })
    );
    await queryRunner.createIndex(
      'visualizations',
      new TableIndex({ columnNames: ['dataset_id'] })
    );
    await queryRunner.createIndex(
      'visualizations',
      new TableIndex({ columnNames: ['dashboard_id'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Order of dropping tables must be reversed due to foreign key constraints
    await queryRunner.dropTable('visualizations');
    await queryRunner.dropTable('dashboards');
    await queryRunner.dropTable('datasets');
    await queryRunner.dropTable('users');
  }
}