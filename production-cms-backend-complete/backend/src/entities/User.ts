import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { IsEmail, MinLength } from "class-validator";
import { Content } from "./Content";
import bcrypt from "bcryptjs";

export enum UserRole {
    ADMIN = "ADMIN",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    @IsEmail({}, { message: "Invalid email format" })
    email!: string;

    @Column()
    @MinLength(6, { message: "Password must be at least 6 characters long" })
    password!: string;

    @Column({ type: "enum", enum: UserRole, default: UserRole.VIEWER })
    role!: UserRole;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @OneToMany(() => Content, content => content.author)
    contents!: Content[];

    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}