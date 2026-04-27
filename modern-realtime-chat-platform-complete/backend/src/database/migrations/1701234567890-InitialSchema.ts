import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class InitialSchema1701234567890 implements MigrationInterface {
  name = 'InitialSchema1701234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
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
            isNullable: false,
          },
          {
            name: 'avatar',
            type: 'varchar',
            default: "'avatar.png'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Rooms Table
    await queryRunner.createTable(
      new Table({
        name: 'rooms',
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
            name: 'type',
            type: 'enum',
            enum: ['public', 'private', 'direct'],
            default: "'public'",
            isNullable: false,
          },
          {
            name: 'creator_id',
            type: 'uuid',
            isNullable: true, // Creator can be null if user is deleted
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add ForeignKey for creator_id in rooms table
    await queryRunner.createForeignKey(
      'rooms',
      new TableForeignKey({
        columnNames: ['creator_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Messages Table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'sender_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'room_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'file', 'system'],
            default: "'text'",
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add ForeignKeys for sender_id and room_id in messages table
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['room_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rooms',
        onDelete: 'CASCADE',
      }),
    );

    // RoomMembers (Junction table for many-to-many relationship between Users and Rooms)
    await queryRunner.createTable(
      new Table({
        name: 'room_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'room_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'joined_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add ForeignKeys for room_id and user_id in room_members table
    await queryRunner.createForeignKey(
      'room_members',
      new TableForeignKey({
        columnNames: ['room_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rooms',
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'room_members',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint for (room_id, user_id) in room_members
    await queryRunner.createUniqueConstraint(
      'room_members',
      new TableUnique({
        columnNames: ['room_id', 'user_id'],
        name: 'UQ_room_member',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order of creation due to foreign key constraints
    await queryRunner.dropTable('room_members');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('rooms');
    await queryRunner.dropTable('users');
  }
}