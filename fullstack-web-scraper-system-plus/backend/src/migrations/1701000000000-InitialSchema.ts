import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { UserRole, ScrapeJobStatus, LogLevel } from '../types/enums';

export class InitialSchema1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true, isNullable: false },
          { name: 'passwordHash', type: 'varchar', length: '255', isNullable: false },
          { name: 'role', type: 'enum', enum: Object.values(UserRole), default: `'${UserRole.USER}'`, isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updatedAt', type: 'timestamp', default: 'now()', onUpdate: 'now()', isNullable: false },
        ],
      }),
      true
    );

    // Scrape Jobs Table
    await queryRunner.createTable(
      new Table({
        name: 'scrape_jobs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'url', type: 'varchar', length: '2048', isNullable: false },
          { name: 'cssSelector', type: 'varchar', length: '512', isNullable: false },
          { name: 'schedule', type: 'varchar', length: '128', isNullable: true },
          { name: 'status', type: 'enum', enum: Object.values(ScrapeJobStatus), default: `'${ScrapeJobStatus.ACTIVE}'`, isNullable: false },
          { name: 'lastRun', type: 'timestamp', isNullable: true },
          { name: 'nextRun', type: 'timestamp', isNullable: true },
          { name: 'isDeleted', type: 'boolean', default: false, isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()', isNullable: false },
          { name: 'updatedAt', type: 'timestamp', default: 'now()', onUpdate: 'now()', isNullable: false },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'scrape_jobs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createIndex(
      'scrape_jobs',
      new TableIndex({
        name: 'IDX_SCRAPE_JOB_USER_STATUS',
        columnNames: ['userId', 'status', 'isDeleted'],
      })
    );

    // Scraped Data Table
    await queryRunner.createTable(
      new Table({
        name: 'scraped_data',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'jobId', type: 'uuid', isNullable: false },
          { name: 'data', type: 'jsonb', isNullable: false },
          { name: 'urlUsed', type: 'varchar', length: '2048', isNullable: false },
          { name: 'success', type: 'boolean', default: true, isNullable: false },
          { name: 'errorMessage', type: 'text', isNullable: true },
          { name: 'scrapedAt', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'scraped_data',
      new TableForeignKey({
        columnNames: ['jobId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'scrape_jobs',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createIndex(
      'scraped_data',
      new TableIndex({
        name: 'IDX_SCARDED_DATA_JOBID_SCAPEDAT',
        columnNames: ['jobId', 'scrapedAt'],
      })
    );

    // Scrape Logs Table
    await queryRunner.createTable(
      new Table({
        name: 'scrape_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'jobId', type: 'uuid', isNullable: false },
          { name: 'message', type: 'text', isNullable: false },
          { name: 'level', type: 'enum', enum: Object.values(LogLevel), default: `'${LogLevel.INFO}'`, isNullable: false },
          { name: 'timestamp', type: 'timestamp', default: 'now()', isNullable: false },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'scrape_logs',
      new TableForeignKey({
        columnNames: ['jobId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'scrape_jobs',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createIndex(
      'scrape_logs',
      new TableIndex({
        name: 'IDX_SCRAPE_LOG_JOBID_TIMESTAMP',
        columnNames: ['jobId', 'timestamp'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scrape_logs');
    await queryRunner.dropTable('scraped_data');
    await queryRunner.dropTable('scrape_jobs');
    await queryRunner.dropTable('users');
  }
}