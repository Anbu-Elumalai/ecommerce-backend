import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

@Entity("adminusers")
@Index("phone_idx", ["phoneNumber"], { unique: true, partialFilterExpression: { isDeleted: false } } as any)
@Index("email_idx", ["email"], { unique: true, partialFilterExpression: { isDeleted: false } } as any)
export class AdminUser {

  @ObjectIdColumn()
    id!: ObjectId;

  // 🔹 Basic Info
  @Column()
    name!: string;

  @Column()
    userId!: string;

  @Column({ nullable: true })
    email?: string;

  @Column()
    phoneNumber!: string;

  @Column()
    pin!: string; // 🔐 hashed

  @Column({ nullable: true })
    companyName?: string;

  // 🔹 Role
  @Column()
    roleId!: ObjectId;

  // 🔹 Profile Image
  @Column("simple-json", { nullable: true })
    profileImage?: {
    url?: string;
    fileName?: string;
  };

  // 🔹 Status
  @Column({ default: true })
    isActive!: boolean;

  @Column({ default: false })
    isDeleted!: boolean;

  // 🔹 Login / Tracking
  @Column({ nullable: true })
    lastLoginAt?: Date;

  @Column({ nullable: true })
    lastLoginIp?: string;

  @Column({ nullable: true })
    device?: string;

  // 🔹 Audit
  @Column({ nullable: true })
    createdBy?: ObjectId;

  @Column({ nullable: true })
    updatedBy?: ObjectId;

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
