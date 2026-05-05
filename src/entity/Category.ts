import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

export enum CategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

@Entity("categories")
@Index(["slug"], { unique: true })
@Index(["parentId"])
export class Category {
  @ObjectIdColumn()
    _id!: ObjectId;

  // 🔹 Basic Info
  @Column()
    name!: string;

  @Column()
    slug!: string;

  @Column({ nullable: true })
    description?: string;

  // 🔹 Hierarchy
  @Column({ nullable: true })
    parentId?: ObjectId | null;

  @Column({ default: 0 })
    level!: number;

  @Column({ default: "" })
    path!: string;
  // Example: "home-living/kitchen"

  // 🔹 Media
  @Column({ nullable: true })
    image?: string;

  @Column({ nullable: true })
    banner?: string;

  // 🔹 Settings
  @Column({
    type: "enum",
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE
  })
    status!: CategoryStatus;

  @Column({ default: true })
    showInMenu!: boolean;

  @Column({ default: false })
    isFeatured!: boolean;

  @Column({ default: 0 })
    sortOrder!: number;

  // 🔹 SEO
  @Column({ nullable: true })
    metaTitle?: string;

  @Column({ nullable: true })
    metaDescription?: string;

  @Column("simple-array", { nullable: true })
    metaKeywords?: string[];

  // 🔹 Analytics
  @Column({ default: 0 })
    productCount!: number;

  // 🔹 Soft Delete
  @Column({ default: false })
    isDeleted!: boolean;

  // 🔹 Timestamps
  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
