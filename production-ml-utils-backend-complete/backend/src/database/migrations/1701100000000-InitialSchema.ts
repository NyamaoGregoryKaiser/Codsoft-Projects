```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialSchema1701100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'user'",
            isNullable: false,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'datasets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'filePath',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'fileSize',
            type: 'numeric',
            isNullable: false,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'projectId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'datasets',
      new TableForeignKey({
        columnNames: ['projectId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'datasets',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'models',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            default: "'1.0.0'",
            isNullable: false,
          },
          {
            name: 'filePath',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'fileSize',
            type: 'numeric',
            isNullable: false,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'projectId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'models',
      new TableForeignKey({
        columnNames: ['projectId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'models',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'experiments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
          }, // e.g., 'pending', 'running', 'completed', 'failed'
          {
            name: 'parameters',
            type: 'jsonb',
            isNullable: true,
          }, // JSON object for parameters
          {
            name: 'metrics',
            type: 'jsonb',
            isNullable: true,
          }, // JSON object for results/metrics
          {
            name: 'projectId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'modelId',
            type: 'uuid',
            isNullable: true, // A model might not be associated initially or might be a new one.
          },
          {
            name: 'datasetId',
            type: 'uuid',
            isNullable: true, // A dataset might not be associated or might be a new one.
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'startTime',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endTime',
            type: 'timestamp',
            isNullable: true,
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
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'experiments',
      new TableForeignKey({
        columnNames: ['projectId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'experiments',
      new TableForeignKey({
        columnNames: ['modelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'models',
        onDelete: 'SET NULL', // If model is deleted, set to null
      })
    );
    await queryRunner.createForeignKey(
      'experiments',
      new TableForeignKey({
        columnNames: ['datasetId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'datasets',
        onDelete: 'SET NULL', // If dataset is deleted, set to null
      })
    );
    await queryRunner.createForeignKey(
      'experiments',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes for frequently queried columns
    await queryRunner.createIndex('users', {
      columnNames: ['email'],
      isUnique: true
    });
    await queryRunner.createIndex('projects', {
      columnNames: ['ownerId', 'name']
    });
    await queryRunner.createIndex('datasets', {
      columnNames: ['projectId', 'ownerId']
    });
    await queryRunner.createIndex('models', {
      columnNames: ['projectId', 'ownerId']
    });
    await queryRunner.createIndex('experiments', {
      columnNames: ['projectId', 'ownerId', 'status']
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('experiments');
    await queryRunner.dropTable('models');
    await queryRunner.dropTable('datasets');
    await queryRunner.dropTable('projects');
    await queryRunner.dropTable('users');
  }
}
```
*(To create this migration run: `npm run migration:generate --name InitialSchema`)*