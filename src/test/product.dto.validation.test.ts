import "reflect-metadata";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ProductPricingDto,
  ProductInventoryDto,
  ProductSEODto,
  ProductVariantDto,
  ProductShippingDto,
  BulkDeleteProductDto,
  BulkStatusProductDto,
  BulkPriceUpdateDto,
  BulkStockUpdateDto
} from "../dto/admin/Product.dto";
import {
  ProductType,
  ProductStatus,
  ProductPublishState,
  ProductShippingClass
} from "../entity/Product";
import { ObjectId } from "mongodb";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function validateDto<T extends object>(
  cls: new () => T,
  plain: Partial<T>
): Promise<string[]> {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance as object);
  return errors.map((e) => Object.values(e.constraints || {}).join(", ")).flat();
}

const validPricing = {
  mrp: 5999,
  sellingPrice: 4499,
  costPrice: 2500,
  taxRate: 18,
  currency: "INR"
};

const validCategoryId = new ObjectId().toString();

// ═══════════════════════════════════════════════════════════════════════════════
// CreateProductDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("CreateProductDto — DTO Validation", () => {
  it("should pass validation for a fully valid product payload", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Premium Wireless Headphones",
      slug: "premium-wireless-headphones",
      sku: "SKU-WH-001",
      categoryId: validCategoryId,
      shortDescription: "Crystal clear audio with 40hrs battery life",
      description: "<p>Full HTML description of the product...</p>",
      productType: ProductType.SIMPLE,
      tags: ["wireless", "audio", "headphones"],
      collections: ["best-sellers", "electronics"],
      pricing: validPricing as any,
      inventory: {
        trackInventory: true,
        stockQty: 150,
        lowStockAlert: 10,
        allowBackOrders: false,
        minOrderQty: 1,
        maxOrderQty: 5
      } as any,
      shipping: {
        weight: 0.35,
        length: 20,
        width: 18,
        height: 10,
        deliveryDays: 3,
        isFragile: false,
        isTemperatureControlled: false
      } as any,
      seo: {
        metaTitle: "Buy Premium Wireless Headphones Online",
        metaDescription: "Shop the best wireless headphones with 40hrs battery life.",
        metaKeywords: ["wireless headphones"],
        canonicalUrl: "https://yourstore.com/products/premium-wireless-headphones"
      } as any,
      status: ProductStatus.ACTIVE,
      publishState: ProductPublishState.PUBLISHED,
      sortOrder: 0
    } as any);

    expect(errors).toHaveLength(0);
  });

  it("should fail when name is missing", async () => {
    const errors = await validateDto(CreateProductDto, {
      categoryId: validCategoryId,
      pricing: validPricing as any
    } as any);

    expect(errors.some((e) => e.includes("name") || e.toLowerCase().includes("empty"))).toBe(true);
  });

  it("should fail when name is too short (< 3 chars)", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "AB",
      categoryId: validCategoryId,
      pricing: validPricing as any
    } as any);

    // class-validator minLength message: "name must be longer than or equal to 3 characters"
    expect(errors.some((e) => e.includes("3") || e.toLowerCase().includes("longer") || e.toLowerCase().includes("min"))).toBe(true);
  });

  it("should fail when name exceeds 200 characters", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "A".repeat(201),
      categoryId: validCategoryId,
      pricing: validPricing as any
    } as any);

    // class-validator maxLength: "must be shorter than or equal to 200 characters"
    expect(errors.some((e) => e.includes("200") || e.toLowerCase().includes("shorter"))).toBe(true);
  });

  it("should fail when categoryId is missing", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product Name",
      pricing: validPricing as any
    } as any);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when pricing is missing entirely", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product Name",
      categoryId: validCategoryId
    } as any);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when productType has an invalid enum value", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      productType: "INVALID_TYPE" as any
    });

    // class-validator IsEnum message varies: "must be a valid enum value" or "must be one of..."
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when status has an invalid enum value", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      status: "INVALID_STATUS" as any
    });

    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when publishState has an invalid enum value", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      publishState: "live" as any
    });

    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when shortDescription exceeds 300 characters", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      shortDescription: "X".repeat(301)
    } as any);

    expect(errors.some((e) => e.includes("300") || e.toLowerCase().includes("shorter"))).toBe(true);
  });

  it("should pass when optional fields are omitted", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Minimal Product",
      categoryId: validCategoryId,
      pricing: validPricing as any
    } as any);

    expect(errors).toHaveLength(0);
  });

  it("should fail when tags is not an array of strings", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      tags: [123, true] as any
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when sortOrder is negative", async () => {
    const errors = await validateDto(CreateProductDto, {
      name: "Valid Product",
      categoryId: validCategoryId,
      pricing: validPricing as any,
      sortOrder: -1
    } as any);

    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductPricingDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductPricingDto — DTO Validation", () => {
  it("should pass with valid mrp and sellingPrice", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 5999,
      sellingPrice: 4499
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when mrp is negative", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: -100,
      sellingPrice: 100
    });
    // class-validator @Min(0): 'mrp must not be less than 0'
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should fail when sellingPrice is negative", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: -50
    });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should fail when taxRate is negative", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: 80,
      taxRate: -5
    });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should fail when taxRate exceeds 100", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: 80,
      taxRate: 150
    });
    // class-validator @Max(100): 'taxRate must not be greater than 100'
    expect(errors.some((e) => e.toLowerCase().includes("greater") || e.toLowerCase().includes("max") || e.includes("100"))).toBe(true);
  });

  it("should pass when taxRate is exactly 0", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: 80,
      taxRate: 0
    });
    expect(errors).toHaveLength(0);
  });

  it("should pass when taxRate is exactly 100", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: 80,
      taxRate: 100
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when offerPrice is negative", async () => {
    const errors = await validateDto(ProductPricingDto, {
      mrp: 100,
      sellingPrice: 80,
      offerPrice: -10
    });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductInventoryDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductInventoryDto — DTO Validation", () => {
  it("should pass with all valid inventory fields", async () => {
    const errors = await validateDto(ProductInventoryDto, {
      trackInventory: true,
      stockQty: 150,
      lowStockAlert: 10,
      allowBackOrders: false,
      minOrderQty: 1,
      maxOrderQty: 5,
      shelfLife: "2 years",
      expiryDate: "2027-12-31"
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when stockQty is negative", async () => {
    const errors = await validateDto(ProductInventoryDto, { stockQty: -1 });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should fail when minOrderQty is less than 1", async () => {
    const errors = await validateDto(ProductInventoryDto, { minOrderQty: 0 });
    expect(errors.some((e) => e.toLowerCase().includes("min"))).toBe(true);
  });

  it("should pass when all fields are omitted (all optional)", async () => {
    const errors = await validateDto(ProductInventoryDto, {});
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductSEODto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductSEODto — DTO Validation", () => {
  it("should pass with all valid SEO fields", async () => {
    const errors = await validateDto(ProductSEODto, {
      metaTitle: "Buy Premium Wireless Headphones Online",
      metaDescription: "Shop the best wireless headphones.",
      metaKeywords: ["wireless headphones", "bluetooth"],
      canonicalUrl: "https://yourstore.com/products/headphones"
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when metaTitle exceeds 60 characters", async () => {
    const errors = await validateDto(ProductSEODto, {
      metaTitle: "A".repeat(61)
    });
    expect(errors.some((e) => e.toLowerCase().includes("60"))).toBe(true);
  });

  it("should fail when metaDescription exceeds 160 characters", async () => {
    const errors = await validateDto(ProductSEODto, {
      metaDescription: "B".repeat(161)
    });
    expect(errors.some((e) => e.toLowerCase().includes("160"))).toBe(true);
  });

  it("should pass when metaTitle is exactly 60 characters", async () => {
    const errors = await validateDto(ProductSEODto, {
      metaTitle: "A".repeat(60)
    });
    expect(errors).toHaveLength(0);
  });

  it("should pass when metaDescription is exactly 160 characters", async () => {
    const errors = await validateDto(ProductSEODto, {
      metaDescription: "B".repeat(160)
    });
    expect(errors).toHaveLength(0);
  });

  it("should pass when all SEO fields are omitted (all optional)", async () => {
    const errors = await validateDto(ProductSEODto, {});
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductVariantDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductVariantDto — DTO Validation", () => {
  it("should pass with a valid variant payload", async () => {
    const errors = await validateDto(ProductVariantDto, {
      combination: { Color: "Black" },
      sku: "SKU-WH-001-BLK",
      mrp: 5999,
      sellingPrice: 4499,
      stockQty: 80,
      status: "active",
      weight: 0.3
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when combination is missing", async () => {
    const errors = await validateDto(ProductVariantDto, {
      sku: "SKU-WH-001-BLK",
      mrp: 5999,
      sellingPrice: 4499
    } as any);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when sku is missing", async () => {
    const errors = await validateDto(ProductVariantDto, {
      combination: { Color: "Black" },
      mrp: 5999,
      sellingPrice: 4499
    } as any);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when mrp is negative", async () => {
    const errors = await validateDto(ProductVariantDto, {
      combination: { Color: "Black" },
      sku: "SKU-001-BLK",
      mrp: -1,
      sellingPrice: 100
    });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should fail when status is not 'active' or 'inactive'", async () => {
    const errors = await validateDto(ProductVariantDto, {
      combination: { Color: "Black" },
      sku: "SKU-001-BLK",
      mrp: 100,
      sellingPrice: 90,
      status: "sold-out" as any
    });
    // @IsIn produces: 'status must be one of the following values: active, inactive'
    expect(errors.some((e) => e.toLowerCase().includes("must be one of") || e.toLowerCase().includes("in"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductShippingDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductShippingDto — DTO Validation", () => {
  it("should pass with all valid shipping fields", async () => {
    const errors = await validateDto(ProductShippingDto, {
      weight: 0.35,
      length: 20,
      width: 18,
      height: 10,
      shippingClass: ProductShippingClass.STANDARD,
      deliveryDays: 3,
      isFragile: false,
      isTemperatureControlled: false
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when shippingClass is an invalid enum value", async () => {
    const errors = await validateDto(ProductShippingDto, {
      shippingClass: "overnight" as any
    });
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when deliveryDays is less than 1", async () => {
    const errors = await validateDto(ProductShippingDto, { deliveryDays: 0 });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("1"))).toBe(true);
  });

  it("should fail when weight is negative", async () => {
    const errors = await validateDto(ProductShippingDto, { weight: -0.5 });
    expect(errors.some((e) => e.toLowerCase().includes("less") || e.toLowerCase().includes("min") || e.includes("0"))).toBe(true);
  });

  it("should pass when all fields are omitted (all optional)", async () => {
    const errors = await validateDto(ProductShippingDto, {});
    expect(errors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ProductListQueryDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductListQueryDto — DTO Validation", () => {
  it("should pass with no query parameters (all optional)", async () => {
    const errors = await validateDto(ProductListQueryDto, {});
    expect(errors).toHaveLength(0);
  });

  it("should fail when status is an invalid enum value", async () => {
    const errors = await validateDto(ProductListQueryDto, { status: "sold" as any });
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when publishState is an invalid enum value", async () => {
    const errors = await validateDto(ProductListQueryDto, { publishState: "live" as any });
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when sortOrder has an invalid value", async () => {
    const errors = await validateDto(ProductListQueryDto, { sortOrder: "random" as any });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass when sortOrder is 'ASC'", async () => {
    const errors = await validateDto(ProductListQueryDto, { sortOrder: "ASC" });
    expect(errors).toHaveLength(0);
  });

  it("should pass when sortOrder is 'desc' (lowercase)", async () => {
    const errors = await validateDto(ProductListQueryDto, { sortOrder: "desc" });
    expect(errors).toHaveLength(0);
  });

  // NOTE: page/limit use @Type(() => Number) which only transforms in plainToInstance pipeline;
  // since we already pass numbers directly, @Min validation fires as expected.
  it("should fail when page is a negative number", async () => {
    const errors = await validateDto(ProductListQueryDto, { page: -1 } as any);
    // @Min(0) message: 'page must not be less than 0'
    expect(errors.some((e) => e.toLowerCase().includes("0") || e.toLowerCase().includes("less") || e.toLowerCase().includes("min"))).toBe(true);
  });

  it("should fail when limit is 0", async () => {
    const errors = await validateDto(ProductListQueryDto, { limit: 0 } as any);
    // @Min(1) message: 'limit must not be less than 1'
    expect(errors.some((e) => e.toLowerCase().includes("1") || e.toLowerCase().includes("less") || e.toLowerCase().includes("min"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UpdateProductDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("UpdateProductDto — DTO Validation", () => {
  it("should pass with no fields (partial update with empty body)", async () => {
    const errors = await validateDto(UpdateProductDto, {});
    expect(errors).toHaveLength(0);
  });

  it("should fail when provided name is too short (< 3 chars)", async () => {
    const errors = await validateDto(UpdateProductDto, { name: "AB" });
    // class-validator minLength: 'name must be longer than or equal to 3 characters'
    expect(errors.some((e) => e.includes("3") || e.toLowerCase().includes("longer") || e.toLowerCase().includes("min"))).toBe(true);
  });

  it("should fail when provided name exceeds 200 characters", async () => {
    const errors = await validateDto(UpdateProductDto, { name: "X".repeat(201) });
    expect(errors.some((e) => e.toLowerCase().includes("200"))).toBe(true);
  });

  it("should fail when status is an invalid enum value", async () => {
    const errors = await validateDto(UpdateProductDto, { status: "pending" as any });
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BulkDeleteProductDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("BulkDeleteProductDto — DTO Validation", () => {
  it("should pass with a valid array of IDs", async () => {
    const errors = await validateDto(BulkDeleteProductDto, {
      ids: [new ObjectId().toString(), new ObjectId().toString()]
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when ids is empty array", async () => {
    const errors = await validateDto(BulkDeleteProductDto, { ids: [] });
    expect(errors.some((e) => e.toLowerCase().includes("at least 1"))).toBe(true);
  });

  it("should fail when ids is missing", async () => {
    const errors = await validateDto(BulkDeleteProductDto, {} as any);
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BulkStatusProductDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("BulkStatusProductDto — DTO Validation", () => {
  it("should pass with valid ids and publishState", async () => {
    const errors = await validateDto(BulkStatusProductDto, {
      ids: [new ObjectId().toString()],
      publishState: ProductPublishState.PUBLISHED
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when publishState has invalid enum value", async () => {
    const errors = await validateDto(BulkStatusProductDto, {
      ids: [new ObjectId().toString()],
      publishState: "live" as any
    });
    expect(errors.some((e) => e.toLowerCase().includes("enum") || e.toLowerCase().includes("must be one of"))).toBe(true);
  });

  it("should fail when ids is empty", async () => {
    const errors = await validateDto(BulkStatusProductDto, { ids: [] });
    expect(errors.some((e) => e.toLowerCase().includes("at least 1"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BulkPriceUpdateDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("BulkPriceUpdateDto — DTO Validation", () => {
  it("should pass with valid ids and flatAdjustment", async () => {
    const errors = await validateDto(BulkPriceUpdateDto, {
      ids: [new ObjectId().toString()],
      flatAdjustment: 100
    });
    expect(errors).toHaveLength(0);
  });

  it("should pass with valid ids and percentAdjustment", async () => {
    const errors = await validateDto(BulkPriceUpdateDto, {
      ids: [new ObjectId().toString()],
      percentAdjustment: -10
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when field has invalid value", async () => {
    const errors = await validateDto(BulkPriceUpdateDto, {
      ids: [new ObjectId().toString()],
      flatAdjustment: 50,
      field: "basePrice" as any
    });
    // @IsIn produces: 'field must be one of the following values: ...'
    expect(errors.some((e) => e.toLowerCase().includes("must be one of") || e.toLowerCase().includes("in"))).toBe(true);
  });

  it("should fail when ids is empty", async () => {
    const errors = await validateDto(BulkPriceUpdateDto, { ids: [] });
    expect(errors.some((e) => e.toLowerCase().includes("at least 1"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BulkStockUpdateDto
// ═══════════════════════════════════════════════════════════════════════════════

describe("BulkStockUpdateDto — DTO Validation", () => {
  it("should pass with valid ids and positive stockDelta", async () => {
    const errors = await validateDto(BulkStockUpdateDto, {
      ids: [new ObjectId().toString()],
      stockDelta: 50
    });
    expect(errors).toHaveLength(0);
  });

  it("should pass with a negative stockDelta (deduction)", async () => {
    const errors = await validateDto(BulkStockUpdateDto, {
      ids: [new ObjectId().toString()],
      stockDelta: -20
    });
    expect(errors).toHaveLength(0);
  });

  it("should fail when stockDelta is missing", async () => {
    const errors = await validateDto(BulkStockUpdateDto, {
      ids: [new ObjectId().toString()]
    } as any);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when ids is empty", async () => {
    const errors = await validateDto(BulkStockUpdateDto, { ids: [], stockDelta: 10 });
    expect(errors.some((e) => e.toLowerCase().includes("at least 1"))).toBe(true);
  });
});
