import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialSchema1701000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Roles Table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
        ],
      }),
      true
    );

    // Users Table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true, isNullable: false },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          { name: 'firstName', type: 'varchar', length: '100', default: "'Anonymous'" },
          { name: 'lastName', type: 'varchar', length: '100', default: "'User'" },
          { name: 'roleId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Foreign Key for Users to Roles
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'RESTRICT', // Prevent deleting roles that have users
      })
    );

    // Categories Table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '100', isUnique: true, isNullable: false },
          { name: 'slug', type: 'varchar', length: '100', isUnique: true, isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Tags Table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'slug', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Content Table
    await queryRunner.createTable(
      new Table({
        name: 'content',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'slug', type: 'varchar', length: '255', isUnique: true, isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'status', type: 'enum', enum: ['draft', 'published', 'archived'], default: "'draft'" },
          { name: 'publishedAt', type: 'timestamp', isNullable: true },
          { name: 'authorId', type: 'uuid', isNullable: false },
          { name: 'categoryId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Foreign Keys for Content
    await queryRunner.createForeignKey(
      'content',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE', // Delete content if author is deleted
      })
    );
    await queryRunner.createForeignKey(
      'content',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL', // Set categoryId to NULL if category is deleted
      })
    );

    // Content-Tags Many-to-Many Table
    await queryRunner.createTable(
      new Table({
        name: 'content_tags',
        columns: [
          { name: 'contentId', type: 'uuid', isPrimary: true },
          { name: 'tagId', type: 'uuid', isPrimary: true },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'content_tags',
      new TableForeignKey({
        columnNames: ['contentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'content',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'content_tags',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      })
    );

    // Media Table
    await queryRunner.createTable(
      new Table({
        name: 'media',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'fileName', type: 'varchar', length: '255', isNullable: false },
          { name: 'originalName', type: 'varchar', length: '255', isNullable: false },
          { name: 'mimeType', type: 'varchar', length: '100', isNullable: false },
          { name: 'url', type: 'varchar', length: '500', isNullable: false },
          { name: 'size', type: 'int', isNullable: true },
          { name: 'ownerId', type: 'uuid', isNullable: true },
          { name: 'uploadedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Foreign Key for Media to Users
    await queryRunner.createForeignKey(
      'media',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL', // Set ownerId to NULL if user is deleted
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('media', 'FK_media_users');
    await queryRunner.dropTable('media');

    await queryRunner.dropForeignKey('content_tags', 'FK_content_tags_tagId');
    await queryRunner.dropForeignKey('content_tags', 'FK_content_tags_contentId');
    await queryRunner.dropTable('content_tags');

    await queryRunner.dropForeignKey('content', 'FK_content_categoryId');
    await queryRunner.dropForeignKey('content', 'FK_content_authorId');
    await queryRunner.dropTable('content');

    await queryRunner.dropTable('tags');
    await queryRunner.dropTable('categories');

    await queryRunner.dropForeignKey('users', 'FK_users_roleId');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('roles');
  }
}