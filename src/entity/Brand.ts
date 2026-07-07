import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

@Entity("brands")
@Index(["slug"], { unique: true })
export class Brand {
  @ObjectIdColumn()
    _id!: ObjectId;

  @Column()
    name!: string;

  @Column()
    slug!: string;

  @Column({ nullable: true })
    description?: string;

  @Column("json", { nullable: true })
    logo?: {
      url: string;
      originalName: string;
      path: string;
    } | null;

  @Column("json", { nullable: true })
    banner?: {
      url: string;
      originalName: string;
      path: string;
    } | null;

  @Column({ default: true })
    isActive!: boolean;

  @Column({ default: false })
    isFeatured!: boolean;

  @Column({ default: true })
    showInFilter!: boolean;

  @Column({ nullable: true })
    website?: string;

  @Column({ nullable: true })
    countryOfOrigin?: string;

  @Column({ default: 0 })
    productCount!: number;

  @Column({ default: false })
    isDeleted!: boolean;

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
