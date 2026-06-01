```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialMigration1678912345678 implements MigrationInterface {
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
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user'],
            default: "'user'",
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
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'models',
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
            isUnique: true,
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
      true,
    );

    await queryRunner.createForeignKey(
      'models',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'model_versions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'model_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'version_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'artifact_path',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'training_data_info', // JSONB for semi-structured data
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'performance_metrics', // JSONB for semi-structured data
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['staging', 'production', 'archived'],
            default: "'staging'",
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
      true,
    );

    await queryRunner.createForeignKey(
      'model_versions',
      new TableForeignKey({
        columnNames: ['model_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'models',
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint for model_id and version_number
    await queryRunner.createUniqueConstraint(
      'model_versions',
      new Table({
        name: 'model_versions',
        columns: [
          { name: 'model_id', type: 'uuid' },
          { name: 'version_number', type: 'varchar' },
        ],
      }).uniques[0],
    );


    await queryRunner.createTable(
      new Table({
        name: 'experiments',
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
      true,
    );

    await queryRunner.createForeignKey(
      'experiments',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'runs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'experiment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'run_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'parameters', // JSONB for key-value parameters
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'metrics', // JSONB for key-value metrics
            type: 'jsonb',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'artifact_uri',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['running', 'completed', 'failed'],
            default: "'running'",
          },
          {
            name: 'start_time',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: true,
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
      true,
    );

    await queryRunner.createForeignKey(
      'runs',
      new TableForeignKey({
        columnNames: ['experiment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'experiments',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'datasets',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'path',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'1.0.0'",
          },
          {
            name: 'owner_id',
            type: 'uuid',
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
      true,
    );

    await queryRunner.createForeignKey(
      'datasets',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL', // If user deleted, dataset can remain without owner
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'features',
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
            name: 'data_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'source_dataset_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'owner_id',
            type: 'uuid',
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
      true,
    );

    await queryRunner.createForeignKey(
      'features',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'features',
      new TableForeignKey({
        columnNames: ['source_dataset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'datasets',
        onDelete: 'SET NULL',
      }),
    );

    // Query Optimization: Indexes
    await queryRunner.createIndex(
      'users',
      new Table({ name: 'users', indices: [{ columnNames: ['email'], isUnique: true }] }).indices[0],
    );
    await queryRunner.createIndex(
      'models',
      new Table({ name: 'models', indices: [{ columnNames: ['name'], isUnique: true }] }).indices[0],
    );
    await queryRunner.createIndex(
      'model_versions',
      new Table({ name: 'model_versions', indices: [{ columnNames: ['model_id', 'version_number'], isUnique: true }] }).indices[0],
    );
    await queryRunner.createIndex(
      'experiments',
      new Table({ name: 'experiments', indices: [{ columnNames: ['name'] }] }).indices[0],
    );
    await queryRunner.createIndex(
      'runs',
      new Table({ name: 'runs', indices: [{ columnNames: ['experiment_id', 'run_name'], isUnique: true }] }).indices[0],
    );
    await queryRunner.createIndex(
      'datasets',
      new Table({ name: 'datasets', indices: [{ columnNames: ['name'], isUnique: true }] }).indices[0],
    );
    await queryRunner.createIndex(
      'features',
      new Table({ name: 'features', indices: [{ columnNames: ['name'] }] }).indices[0],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('features', 'FK_features_source_dataset_id');
    await queryRunner.dropForeignKey('features', 'FK_features_owner_id');
    await queryRunner.dropForeignKey('datasets', 'FK_datasets_owner_id');
    await queryRunner.dropForeignKey('runs', 'FK_runs_experiment_id');
    await queryRunner.dropForeignKey('experiments', 'FK_experiments_owner_id');
    await queryRunner.dropForeignKey('model_versions', 'FK_model_versions_model_id');
    await queryRunner.dropForeignKey('models', 'FK_models_owner_id');

    await queryRunner.dropTable('features');
    await queryRunner.dropTable('datasets');
    await queryRunner.dropTable('runs');
    await queryRunner.dropTable('experiments');
    await queryRunner.dropTable('model_versions');
    await queryRunner.dropTable('models');
    await queryRunner.dropTable('users');
  }
}
```