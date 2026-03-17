import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { MinLength, MaxLength } from "class-validator";
import { Content } from "./Content";

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    @MinLength(3, { message: "Category name must be at least 3 characters long" })
    @MaxLength(50, { message: "Category name cannot exceed 50 characters" })
    name!: string;

    @Column({ nullable: true })
    description?: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;

    @OneToMany(() => Content, content => content.category)
    contents!: Content[];
}