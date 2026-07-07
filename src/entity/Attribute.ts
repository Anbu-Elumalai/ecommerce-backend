import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

export enum AttributeType {
  SELECT = "select",
  MULTISELECT = "multiselect",
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date"
}

export enum AttributeDisplayType {
  DROPDOWN = "dropdown",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  COLOR = "color",
  IMAGE = "image",
  TEXT = "text"
}

export enum AttributeGroup {
  GENERAL = "general",
  VARIANTS = "variants",
  DIMENSIONS = "dimensions",
  SPECIFICATIONS = "specifications",
  SHIPPING = "shipping",
  NUTRITION = "nutrition"
}

export enum AttributeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export class AttributeValue {
  @Column()
  label!: string;

  @Column()
  value!: string;

  // Used only when displayType = COLOR
  @Column({ nullable: true })
  color?: string;

  // Used only when displayType = IMAGE
  @Column({ nullable: true })
  image?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;
}

@Entity("attributes")
@Index(["slug"], { unique: true })
@Index(["status"])
@Index(["group"])
export class Attribute {

  @ObjectIdColumn()
  _id!: ObjectId;

  // ===========================
  // Basic Information
  // ===========================

  @Column()
  name!: string;

  @Column()
  slug!: string;

  @Column({ nullable: true })
  description?: string;

  // ===========================
  // Organization
  // ===========================

  @Column({
    type: "enum",
    enum: AttributeGroup,
    default: AttributeGroup.GENERAL
  })
  group!: AttributeGroup;

  // ===========================
  // Attribute Configuration
  // ===========================

  @Column({
    type: "enum",
    enum: AttributeType,
    default: AttributeType.SELECT
  })
  type!: AttributeType;

  @Column({
    type: "enum",
    enum: AttributeDisplayType,
    default: AttributeDisplayType.DROPDOWN
  })
  displayType!: AttributeDisplayType;

  // ===========================
  // Values
  // ===========================

  @Column()
  values!: AttributeValue[];

  // ===========================
  // Behaviour
  // ===========================

  // Used to generate product variants
  @Column({ default: false })
  usedForVariants!: boolean;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ default: true })
  isVisible!: boolean;

  // Show in category/product filters
  @Column({ default: true })
  isFilterable!: boolean;

  // Show on product details page
  @Column({ default: true })
  showOnProductPage!: boolean;

  // ===========================
  // Status
  // ===========================

  @Column({
    type: "enum",
    enum: AttributeStatus,
    default: AttributeStatus.ACTIVE
  })
  status!: AttributeStatus;

  // ===========================
  // Sorting
  // ===========================

  @Column({ default: 0 })
  sortOrder!: number;

  // ===========================
  // Soft Delete
  // ===========================
  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}