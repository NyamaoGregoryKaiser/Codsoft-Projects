import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { MinLength, MaxLength, IsString, IsBoolean } from "class-validator";
import { User } from "./User";
import { Category } from "./Category";

export enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}

@Entity("contents")
export class Content {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    @MinLength(5, { message: "Title must be at least 5 characters long" })
    @MaxLength(255, { message: "Title cannot exceed 255 characters" })
    title!: string;

    @Column({ type: "text" })
    @MinLength(20, { message: "Content body must be at least 20 characters long" })
    body!: string;

    @Column({ nullable: true })
    thumbnailUrl?: string;

    @Column({ type: "enum", enum: ContentStatus, default: ContentStatus.DRAFT })
    status!: ContentStatus;

    @Column({ default: false })
    isFeatured!: boolean;

    @ManyToOne(() => User, user => user.contents, { onDelete: "SET NULL" })
    @JoinColumn({ name: "authorId" })
    author!: User;

    @Column({ type: "uuid", nullable: true }) // Explicitly define column for authorId
    authorId!: string;

    @ManyToOne(() => Category, category => category.contents, { onDelete: "SET NULL" })
    @JoinColumn({ name: "categoryId" })
    category!: Category;

    @Column({ type: "uuid", nullable: true }) // Explicitly define column for categoryId
    categoryId!: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}