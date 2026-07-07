import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsPositive,
  ArrayMinSize
} from "class-validator";
import { Type } from "class-transformer";
import { ProductType, ProductPublishState, ProductStatus, ProductShippingClass } from "../../entity/Product";

// ─── Nested DTOs ──────────────────────────────────────────────────────────────

export class ProductImageDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ProductPricingDto {
  @IsNumber()
  @Min(0)
  mrp!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  offerPrice?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  hsnCode?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class ProductInventoryDto {
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQty?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockAlert?: number;

  @IsBoolean()
  @IsOptional()
  allowBackOrders?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxOrderQty?: number;

  @IsString()
  @IsOptional()
  shelfLife?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;
}

export class ProductShippingDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  length?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  width?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  height?: number;

  @IsEnum(ProductShippingClass)
  @IsOptional()
  shippingClass?: ProductShippingClass;

  @IsNumber()
  @Min(1)
  @IsOptional()
  deliveryDays?: number;

  @IsBoolean()
  @IsOptional()
  isFragile?: boolean;

  @IsBoolean()
  @IsOptional()
  isTemperatureControlled?: boolean;
}

export class ProductSEODto {
  @IsString()
  @MaxLength(60)
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metaKeywords?: string[];

  @IsString()
  @IsOptional()
  canonicalUrl?: string;
}

export class ProductAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  attributeId!: string;

  @IsString()
  @IsNotEmpty()
  attributeName!: string;

  @IsArray()
  @IsString({ each: true })
  values!: string[];
}

export class ProductVariantDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsNotEmpty()
  combination!: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  mrp!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQty?: number;

  @IsIn(["active", "inactive"])
  @IsOptional()
  status?: "active" | "inactive";

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;
}

// ─── Create Product ───────────────────────────────────────────────────────────

export class CreateProductDto {
  // Basic Info
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  // Categorisation
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @IsString()
  @IsOptional()
  childCategoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  collections?: string[];

  // Media
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  // Pricing
  @ValidateNested()
  @Type(() => ProductPricingDto)
  @IsNotEmpty()
  pricing!: ProductPricingDto;

  // Inventory
  @ValidateNested()
  @Type(() => ProductInventoryDto)
  @IsOptional()
  inventory?: ProductInventoryDto;

  // Attributes
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  @IsOptional()
  selectedAttributes?: ProductAttributeValueDto[];

  // Variants
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  // Shipping
  @ValidateNested()
  @Type(() => ProductShippingDto)
  @IsOptional()
  shipping?: ProductShippingDto;

  // SEO
  @ValidateNested()
  @Type(() => ProductSEODto)
  @IsOptional()
  seo?: ProductSEODto;

  // Related Products
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  crossSellIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  upsellIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  frequentlyBoughtIds?: string[];

  // Publishing
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsEnum(ProductPublishState)
  @IsOptional()
  publishState?: ProductPublishState;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

// ─── Update Product ───────────────────────────────────────────────────────────

export class UpdateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @IsString()
  @IsOptional()
  childCategoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  collections?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  @ValidateNested()
  @Type(() => ProductPricingDto)
  @IsOptional()
  pricing?: Partial<ProductPricingDto>;

  @ValidateNested()
  @Type(() => ProductInventoryDto)
  @IsOptional()
  inventory?: Partial<ProductInventoryDto>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  @IsOptional()
  selectedAttributes?: ProductAttributeValueDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @ValidateNested()
  @Type(() => ProductShippingDto)
  @IsOptional()
  shipping?: Partial<ProductShippingDto>;

  @ValidateNested()
  @Type(() => ProductSEODto)
  @IsOptional()
  seo?: Partial<ProductSEODto>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  crossSellIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  upsellIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  frequentlyBoughtIds?: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsEnum(ProductPublishState)
  @IsOptional()
  publishState?: ProductPublishState;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

// ─── List Query ───────────────────────────────────────────────────────────────

export class ProductListQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subCategoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsEnum(ProductPublishState)
  @IsOptional()
  publishState?: ProductPublishState;

  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @IsString()
  @IsOptional()
  collection?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceFrom?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  priceTo?: number;

  /** "in_stock" | "out_of_stock" | "low_stock" */
  @IsString()
  @IsOptional()
  stockStatus?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(["ASC", "DESC", "asc", "desc"])
  @IsOptional()
  sortOrder?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ─── Status Change ────────────────────────────────────────────────────────────

export class ChangeProductStatusDto {
  @IsEnum(ProductPublishState)
  @IsOptional()
  publishState?: ProductPublishState;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}

// ─── Bulk Operations ──────────────────────────────────────────────────────────

export class BulkDeleteProductDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  ids!: string[];
}

export class BulkStatusProductDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids!: string[];

  @IsEnum(ProductPublishState)
  @IsOptional()
  publishState?: ProductPublishState;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}

export class BulkPriceUpdateDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids!: string[];

  /**
   * Flat amount to adjust (positive = increase, negative = decrease)
   * Mutually exclusive with percentAdjustment.
   */
  @IsNumber()
  @IsOptional()
  flatAdjustment?: number;

  /**
   * Percentage to adjust (e.g. 10 = +10%, -5 = -5%)
   * Applied to sellingPrice.
   */
  @IsNumber()
  @IsOptional()
  percentAdjustment?: number;

  /** Which price field to update: "sellingPrice" | "mrp" | "offerPrice" */
  @IsIn(["sellingPrice", "mrp", "offerPrice"])
  @IsOptional()
  field?: string;
}

export class BulkStockUpdateDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids!: string[];

  /**
   * Delta to add to current stock (positive = add, negative = subtract).
   * The service enforces stock cannot go below 0.
   */
  @IsNumber()
  stockDelta!: number;
}

export class ProductImportItemDto extends CreateProductDto {}

export class ProductImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImportItemDto)
  @ArrayMinSize(1)
  products!: ProductImportItemDto[];
}
