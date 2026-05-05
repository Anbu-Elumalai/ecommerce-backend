import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

export enum AttributeDisplayType {
  DROPDOWN = "dropdown",
  COLOR = "color",
  RADIO = "radio",
  MULTISELECT = "multiselect",
  TEXT = "text"
}

export enum AttributeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

// 🔹 Better than interface (optional but recommended)
export class AttributeValue {
  @Column()
    label!: string;

  @Column()
    value!: string;

  @Column({ nullable: true })
    color?: string;

  @Column({ default: 0 })
    sortOrder!: number;
}

@Entity("attributes")
@Index(["slug"], { unique: true })
@Index(["status"])
export class Attribute {
  @ObjectIdColumn()
    _id!: ObjectId;

  // 🔹 Identity
  @Column()
    name!: string;

  @Column()
    slug!: string;

  // 🔹 Display
  @Column({
    type: "enum",
    enum: AttributeDisplayType,
    default: AttributeDisplayType.DROPDOWN
  })
    displayType!: AttributeDisplayType;

  // 🔹 Values
  @Column()
    values!: AttributeValue[];

  // 🔹 Behavior
  @Column({ default: true })
    usedForVariants!: boolean;

  @Column({ default: false })
    isRequired!: boolean;

  @Column({ default: true })
    isVisible!: boolean;

  // 🔹 Status
  @Column({
    type: "enum",
    enum: AttributeStatus,
    default: AttributeStatus.ACTIVE
  })
    status!: AttributeStatus;

  // 🔹 Sorting
  @Column({ default: 0 })
    sortOrder!: number;

  // 🔹 Soft delete
  @Column({ default: false })
    isDeleted!: boolean;

  // 🔹 Timestamps
  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
