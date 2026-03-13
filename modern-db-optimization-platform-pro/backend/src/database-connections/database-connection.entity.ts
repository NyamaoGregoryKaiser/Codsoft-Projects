```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('database_connections')
export class DatabaseConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  host!: string;

  @Column({ type: 'int' })
  port!: number;

  @Column()
  dbName!: string;

  @Column()
  dbUser!: string;

  @Column({ select: false }) // Encrypted password won't be selected by default
  dbPasswordEncrypted!: string; // Storing encrypted password

  @ManyToOne(() => User, (user) => user.databaseConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```