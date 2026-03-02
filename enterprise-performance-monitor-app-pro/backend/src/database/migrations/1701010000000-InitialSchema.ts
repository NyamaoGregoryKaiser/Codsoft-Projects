import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

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
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'applications',
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
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'api_key',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'applications',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'pages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'application_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'path_regex',
            type: 'varchar',
            length: '255',
            isNullable: true, // Regex to match page paths (e.g., /products/:id)
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'pages',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'applications',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'performance_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'application_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'page_id',
            type: 'uuid',
            isNullable: true, // Can be null if metric is app-wide or custom without specific page
          },
          {
            name: 'metric_type', // e.g., 'FCP', 'LCP', 'TTFB', 'CLS', 'custom'
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'value', // Metric value, e.g., milliseconds for FCP, score for CLS
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'user_session_id', // Anonymous session ID for user tracking within app
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'browser',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'os',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'device_type', // 'desktop', 'mobile', 'tablet'
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'country', // Optional: for geo-distribution
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'url', // The actual URL the metric was collected from
            type: 'text',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'performance_metrics',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'applications',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'performance_metrics',
      new TableForeignKey({
        columnNames: ['page_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pages',
        onDelete: 'SET NULL', // If a page is deleted, metrics still exist but are not linked to a specific page
      })
    );

    // Add indexes for query optimization
    await queryRunner.createIndex(
      'performance_metrics',
      {
        columnNames: ['application_id', 'metric_type', 'timestamp'],
      }
    );
    await queryRunner.createIndex(
      'performance_metrics',
      {
        columnNames: ['page_id', 'metric_type', 'timestamp'],
      }
    );
    await queryRunner.createIndex(
      'performance_metrics',
      {
        columnNames: ['timestamp'],
      }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('performance_metrics');
    await queryRunner.dropTable('pages');
    await queryRunner.dropTable('applications');
    await queryRunner.dropTable('users');
  }
}