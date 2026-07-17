import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";
import { ObjectId } from "mongodb";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ProductType {
  SIMPLE   = "simple",
  VARIABLE = "variable",
  DIGITAL  = "digital",
  SERVICE  = "service"
}

export enum ProductStatus {
  ACTIVE   = "active",
  INACTIVE = "inactive"
}

export enum ProductPublishState {
  DRAFT     = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED  = "archived"
}

export enum ProductShippingClass {
  STANDARD    = "standard",
  EXPRESS     = "express",
  FRAGILE     = "fragile",
  BULKY       = "bulky"
}

// ─── Embedded Sub-Documents ───────────────────────────────────────────────────

export class ProductImage {
  @Column()
    id!: string;

  @Column()
    url!: string;

  @Column({ nullable: true })
    thumbnailUrl?: string;

  @Column({ nullable: true })
    altText?: string;

  @Column({ default: false })
    isPrimary!: boolean;

  @Column({ default: 0 })
    sortOrder!: number;

  @Column({ nullable: true })
    fileName?: string;

  @Column({ nullable: true })
    size?: number;

  @Column({ nullable: true })
    mimetype?: string;
}

export class ProductPricing {
  /** Maximum Retail Price */
  @Column({ default: 0 })
    mrp!: number;

  /** Actual selling price (≤ MRP) */
  @Column({ default: 0 })
    sellingPrice!: number;

  /** Landed/cost price for margin calculation */
  @Column({ nullable: true })
    costPrice?: number;

  /** Promotional offer price (≤ sellingPrice) */
  @Column({ nullable: true })
    offerPrice?: number;

  /** GST percentage (0, 5, 12, 18, 28) */
  @Column({ nullable: true })
    taxRate?: number;

  /** Harmonized System Nomenclature code for GST */
  @Column({ nullable: true })
    hsnCode?: string;

  @Column({ default: "INR" })
    currency!: string;
}

export class ProductInventory {
  @Column({ default: true })
    trackInventory!: boolean;

  @Column({ default: 0 })
    stockQty!: number;

  /** Alert threshold: notify when stock falls below this */
  @Column({ nullable: true })
    lowStockAlert?: number;

  @Column({ default: false })
    allowBackOrders!: boolean;

  @Column({ nullable: true })
    minOrderQty?: number;

  @Column({ nullable: true })
    maxOrderQty?: number;

  /** e.g. "24 months" */
  @Column({ nullable: true })
    shelfLife?: string;

  @Column({ nullable: true })
    expiryDate?: string;
}

export class ProductShipping {
  /** Weight in kilograms */
  @Column({ nullable: true })
    weight?: number;

  /** Length in centimeters */
  @Column({ nullable: true })
    length?: number;

  /** Width in centimeters */
  @Column({ nullable: true })
    width?: number;

  /** Height in centimeters */
  @Column({ nullable: true })
    height?: number;

  @Column({ nullable: true })
    shippingClass?: ProductShippingClass;

  /** Estimated delivery in days */
  @Column({ nullable: true })
    deliveryDays?: number;

  @Column({ default: false })
    isFragile!: boolean;

  @Column({ default: false })
    isTemperatureControlled!: boolean;
}

export class ProductSEO {
  @Column({ nullable: true })
    metaTitle?: string;

  @Column({ nullable: true })
    metaDescription?: string;

  @Column("simple-array", { nullable: true })
    metaKeywords?: string[];

  @Column({ nullable: true })
    canonicalUrl?: string;
}

export class ProductAttributeValue {
  @Column()
    attributeId!: ObjectId;

  @Column()
    attributeName!: string;

  /** Selected value labels/slugs for this product */
  @Column()
    values!: string[];
}

export class ProductVariant {
  @Column()
    id!: string;

  /**
   * Axis combination, e.g. { Weight: "1kg", Flavor: "Chocolate" }
   * Key = attribute name, Value = selected value label
   */
  @Column()
    combination!: Record<string, string>;

  @Column()
    sku!: string;

  @Column({ nullable: true })
    barcode?: string;

  @Column({ default: 0 })
    mrp!: number;

  @Column({ default: 0 })
    sellingPrice!: number;

  @Column({ nullable: true })
    costPrice?: number;

  @Column({ default: 0 })
    stockQty!: number;

  @Column({ default: "active" })
    status!: "active" | "inactive";

  @Column({ nullable: true })
    imageUrl?: string;

  @Column({ nullable: true })
    weight?: number;
}

// ─── Root Entity ──────────────────────────────────────────────────────────────

@Entity("products")
@Index(["slug"],   { unique: true })
@Index(["sku"],    { unique: true })
@Index(["status"])
@Index(["publishState"])
@Index(["categoryId"])
@Index(["brandId"])
@Index(["isDeleted"])
@Index(["tags"])
@Index(["createdAt"])
export class Product {

  @ObjectIdColumn()
    _id!: ObjectId;

  // ─── Basic Information ───────────────────────────────────────────────────

  @Column()
    name!: string;

  @Column()
    slug!: string;

  @Column({ nullable: true })
    shortDescription?: string;

  @Column({ nullable: true })
    description?: string;

  @Column({
    type: "enum",
    enum: ProductType,
    default: ProductType.SIMPLE
  })
    productType!: ProductType;

  @Column()
    sku!: string;

  @Column({ nullable: true })
    barcode?: string;

  // ─── Categorisation ──────────────────────────────────────────────────────

  @Column()
    categoryId!: ObjectId;

  @Column({ nullable: true })
    subCategoryId?: ObjectId;

  @Column({ nullable: true })
    childCategoryId?: ObjectId;

  @Column({ nullable: true })
    brandId?: ObjectId;

  @Column("simple-array", { nullable: true })
    tags?: string[];

  @Column("simple-array", { nullable: true })
    collections?: string[];

  // ─── Media ───────────────────────────────────────────────────────────────

  @Column("simple-json", { nullable: true })
    images?: ProductImage[];

  // ─── Pricing ─────────────────────────────────────────────────────────────

  @Column("simple-json")
    pricing!: ProductPricing;

  // ─── Inventory ───────────────────────────────────────────────────────────

  @Column("simple-json")
    inventory!: ProductInventory;

  // ─── Attributes ──────────────────────────────────────────────────────────

  @Column("simple-json", { nullable: true })
    selectedAttributes?: ProductAttributeValue[];

  // ─── Variants (variable products only) ───────────────────────────────────

  @Column("simple-json", { nullable: true })
    variants?: ProductVariant[];

  // ─── Shipping ────────────────────────────────────────────────────────────

  @Column("simple-json", { nullable: true })
    shipping?: ProductShipping;

  // ─── SEO ─────────────────────────────────────────────────────────────────

  @Column("simple-json", { nullable: true })
    seo?: ProductSEO;

  // ─── Related Products ────────────────────────────────────────────────────

  @Column("simple-array", { nullable: true })
    crossSellIds?: ObjectId[];

  @Column("simple-array", { nullable: true })
    upsellIds?: ObjectId[];

  @Column("simple-array", { nullable: true })
    frequentlyBoughtIds?: ObjectId[];

  // ─── Publishing ──────────────────────────────────────────────────────────

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.ACTIVE
  })
    status!: ProductStatus;

  @Column({
    type: "enum",
    enum: ProductPublishState,
    default: ProductPublishState.DRAFT
  })
    publishState!: ProductPublishState;

  @Column({ nullable: true })
    scheduledAt?: Date;

  @Column({ default: 0 })
    sortOrder!: number;

  // ─── Analytics ───────────────────────────────────────────────────────────

  @Column({ default: 0 })
    viewCount!: number;

  @Column({ default: 0 })
    salesCount!: number;

  @Column({ default: 0 })
    reviewCount!: number;

  @Column({ nullable: true })
    averageRating?: number;

  // ─── Audit ───────────────────────────────────────────────────────────────

  @Column({ nullable: true })
    createdBy?: ObjectId;

  @Column({ nullable: true })
    updatedBy?: ObjectId;

  @Column({ nullable: true })
    deletedBy?: ObjectId;

  @Column({ nullable: true })
    deletedAt?: Date;

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  @Column({ default: false })
    isDeleted!: boolean;

  // ─── Timestamps ──────────────────────────────────────────────────────────

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
