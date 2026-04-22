import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class InitialSchema1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'username', type: 'varchar', length: '255', isUnique: true },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'roles', type: 'jsonb', default: "'[\"user\"]'" },
          { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'isCompleted', type: 'boolean', default: false },
          { name: 'ownerId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '50', isUnique: true },
          { name: 'color', type: 'varchar', length: '7', isNullable: true },
          { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'status', type: 'enum', enum: ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'], default: 'TODO' },
          { name: 'dueDate', type: 'timestamp with time zone', isNullable: true },
          { name: 'projectId', type: 'uuid' },
          { name: 'assigneeId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['projectId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['assigneeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_tags',
        columns: [
          { name: 'taskId', type: 'uuid', isPrimary: true },
          { name: 'tagId', type: 'uuid', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'task_tags',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'task_tags',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'content', type: 'text' },
          { name: 'authorId', type: 'uuid' },
          { name: 'taskId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('comments', 'FK_comments_authorId');
    await queryRunner.dropForeignKey('comments', 'FK_comments_taskId');
    await queryRunner.dropTable('comments');

    await queryRunner.dropForeignKey('task_tags', 'FK_task_tags_taskId');
    await queryRunner.dropForeignKey('task_tags', 'FK_task_tags_tagId');
    await queryRunner.dropTable('task_tags');

    await queryRunner.dropForeignKey('tasks', 'FK_tasks_projectId');
    await queryRunner.dropForeignKey('tasks', 'FK_tasks_assigneeId');
    await queryRunner.dropTable('tasks');

    await queryRunner.dropTable('tags');

    await queryRunner.dropForeignKey('projects', 'FK_projects_ownerId');
    await queryRunner.dropTable('projects');

    await queryRunner.dropTable('users');
  }
}