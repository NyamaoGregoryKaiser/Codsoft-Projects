```typescript
import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Merchant } from "./Merchant";

export enum UserRole {
  ADMIN = "ADMIN",
  MERCHANT = "MERCHANT",
}

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string; // Hashed password

  @Column({ type: "enum", enum: UserRole, default: UserRole.MERCHANT })
  role!: UserRole;

  // A user can be associated with one merchant (e.g., the owner of the merchant account)
  // Or multiple users could belong to one merchant (e.g., employees, admin users) - this assumes one-to-one for simplicity
  @OneToOne(() => Merchant, merchant => merchant.ownerUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  merchant!: Merchant; // Represents the merchant owned by this user
}
```