import { ProductService } from "../modules/products/services/product.service";
import { ProductRepository } from "../modules/products/repository/product.repository";
import {
  ProductStatus,
  ProductPublishState,
  ProductType,
  Product
} from "../entity/Product";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ChangeProductStatusDto,
  BulkPriceUpdateDto,
  BulkStockUpdateDto
} from "../dto/admin/Product.dto";
import { ObjectId } from "mongodb";

// ─── Mock ProductRepository ────────────────────────────────────────────────────
jest.mock("../modules/products/repository/product.repository");

// ─── Mock AppDataSource (categoryRepo, brandRepo, attrRepo) ───────────────────
jest.mock("../data-source", () => ({
  AppDataSource: {
    getMongoRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn()
    }),
    isInitialized: true
  }
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  const p = new Product();
  p._id = new ObjectId();
  p.name = "Test Product";
  p.slug = "test-product";
  p.sku = "TP-001";
  p.categoryId = new ObjectId();
  p.pricing = { mrp: 5999, sellingPrice: 4499, currency: "INR" } as any;
  p.inventory = { trackInventory: true, stockQty: 100, allowBackOrders: false } as any;
  p.status = ProductStatus.ACTIVE;
  p.publishState = ProductPublishState.DRAFT;
  p.productType = ProductType.SIMPLE;
  p.isDeleted = false;
  p.viewCount = 0;
  p.salesCount = 0;
  p.reviewCount = 0;
  p.sortOrder = 0;
  return Object.assign(p, overrides);
}

function makeCreateDto(overrides: Partial<CreateProductDto> = {}): CreateProductDto {
  return {
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    sku: "SKU-WH-001",
    categoryId: new ObjectId().toString(),
    pricing: {
      mrp: 5999,
      sellingPrice: 4499,
      costPrice: 2500,
      offerPrice: 3999,
      taxRate: 18,
      hsnCode: "8518300000",
      currency: "INR"
    },
    inventory: {
      trackInventory: true,
      stockQty: 150,
      lowStockAlert: 10,
      allowBackOrders: false,
      minOrderQty: 1,
      maxOrderQty: 5
    },
    shortDescription: "Crystal clear audio with 40hrs battery life",
    productType: ProductType.SIMPLE,
    status: ProductStatus.ACTIVE,
    publishState: ProductPublishState.PUBLISHED,
    tags: ["wireless", "audio", "headphones"],
    collections: ["best-sellers", "electronics"],
    images: [
      {
        url: "https://example.com/images/headphones-main.jpg",
        thumbnailUrl: "https://example.com/images/headphones-thumb.jpg",
        altText: "Wireless Headphones Front View",
        isPrimary: true,
        sortOrder: 0
      }
    ],
    shipping: {
      weight: 0.35,
      length: 20,
      width: 18,
      height: 10,
      deliveryDays: 3,
      isFragile: false,
      isTemperatureControlled: false
    },
    seo: {
      metaTitle: "Buy Premium Wireless Headphones Online",
      metaDescription: "Shop the best wireless headphones with 40hrs battery life.",
      metaKeywords: ["wireless headphones", "bluetooth headphones"],
      canonicalUrl: "https://yourstore.com/products/premium-wireless-headphones"
    },
    ...overrides
  } as CreateProductDto;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("ProductService — Unit Tests", () => {
  let service: ProductService;
  let mockRepo: jest.Mocked<ProductRepository>;
  const userId = "user-abc-123";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
    mockRepo = (service as any).productRepo as jest.Mocked<ProductRepository>;

    // Default: category + brand + attr validations pass
    (service as any).validateCategory = jest.fn().mockResolvedValue(undefined);
    (service as any).validateBrand = jest.fn().mockResolvedValue(undefined);
    (service as any).resolveAttributes = jest.fn().mockResolvedValue([]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("create()", () => {
    it("should create a simple product successfully with all fields", async () => {
      const dto = makeCreateDto();
      const product = makeProduct({ name: dto.name, sku: dto.sku! });

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe("Premium Wireless Headphones");
      expect(result.sku).toBe("SKU-WH-001");
      expect(mockRepo.findBySlug).toHaveBeenCalledTimes(1);
      expect(mockRepo.findBySku).toHaveBeenCalledTimes(1);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should auto-generate SKU when none is provided", async () => {
      const dto = makeCreateDto({ sku: undefined });
      const product = makeProduct();

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      const result = await service.create(dto, userId);
      expect(result).toBeDefined();
      // uniqueness is still checked even for auto-generated SKU
      expect(mockRepo.findBySku).toHaveBeenCalledTimes(1);
    });

    it("should auto-generate slug from name when none is provided", async () => {
      const dto = makeCreateDto({ slug: undefined, name: "My Awesome Product" });
      const product = makeProduct({ slug: "my-awesome-product" });

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      await service.create(dto, userId);
      expect(mockRepo.findBySlug).toHaveBeenCalledWith("my-awesome-product");
    });

    it("should throw 400 if slug already exists", async () => {
      const dto = makeCreateDto();
      mockRepo.findBySlug.mockResolvedValue(makeProduct());

      await expect(service.create(dto, userId)).rejects.toThrow(
        "A product with slug 'premium-wireless-headphones' already exists"
      );
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should throw 400 if SKU already exists", async () => {
      const dto = makeCreateDto();
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(makeProduct()); // SKU conflict

      await expect(service.create(dto, userId)).rejects.toThrow(
        "A product with SKU 'SKU-WH-001' already exists"
      );
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should throw 400 when categoryId validation fails", async () => {
      const dto = makeCreateDto({ categoryId: "not-an-object-id" });
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);

      (service as any).validateCategory = jest
        .fn()
        .mockRejectedValue(new Error("Invalid category ID: not-an-object-id"));

      await expect(service.create(dto, userId)).rejects.toThrow("Invalid category ID");
    });

    it("should throw 400 when category does not exist", async () => {
      const dto = makeCreateDto();
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      (service as any).validateCategory = jest
        .fn()
        .mockRejectedValue(new Error(`Category '${dto.categoryId}' not found`));

      await expect(service.create(dto, userId)).rejects.toThrow("not found");
    });

    it("should throw 400 when brandId is provided but does not exist", async () => {
      const brandId = new ObjectId().toString();
      const dto = makeCreateDto({ brandId });
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      (service as any).validateBrand = jest
        .fn()
        .mockRejectedValue(new Error(`Brand '${brandId}' not found`));

      await expect(service.create(dto, userId)).rejects.toThrow("not found");
    });

    it("should create a variable product with explicit variants", async () => {
      const dto = makeCreateDto({
        productType: ProductType.VARIABLE,
        variants: [
          {
            combination: { Color: "Black" },
            sku: "SKU-WH-001-BLK",
            mrp: 5999,
            sellingPrice: 4499,
            stockQty: 80,
            status: "active",
            weight: 0.3
          },
          {
            combination: { Color: "White" },
            sku: "SKU-WH-001-WHT",
            mrp: 5999,
            sellingPrice: 4499,
            stockQty: 70,
            status: "active",
            weight: 0.3
          }
        ]
      });
      const product = makeProduct({ productType: ProductType.VARIABLE });

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      const result = await service.create(dto, userId);
      expect(result).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should throw 400 for duplicate variant SKUs in the same request", async () => {
      const dto = makeCreateDto({
        productType: ProductType.VARIABLE,
        variants: [
          { combination: { Color: "Black" }, sku: "DUPE-SKU", mrp: 100, sellingPrice: 90 },
          { combination: { Color: "White" }, sku: "DUPE-SKU", mrp: 100, sellingPrice: 90 }
        ]
      });
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow("Duplicate variant SKU");
    });

    it("should set createdBy to the provided userId", async () => {
      const dto = makeCreateDto();
      const product = makeProduct({ createdBy: new ObjectId(userId) });

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      const result = await service.create(dto, userId);
      expect(result.createdBy?.toString()).toBe(userId);
    });

    it("should default publishState to DRAFT when not provided", async () => {
      const dto = makeCreateDto({ publishState: undefined });
      const product = makeProduct({ publishState: ProductPublishState.DRAFT });

      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(product);
      mockRepo.save.mockResolvedValue(product);

      const result = await service.create(dto, userId);
      expect(result.publishState).toBe(ProductPublishState.DRAFT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST
  // ═══════════════════════════════════════════════════════════════════════════

  describe("list()", () => {
    const buildListResult = (products: Product[], total: number) => [
      { metadata: [{ total }], data: products }
    ];

    it("should return paginated products with default page=0, limit=10", async () => {
      const products = [makeProduct(), makeProduct()];
      mockRepo.aggregate.mockResolvedValue(buildListResult(products, 2));

      const result = await service.list({} as ProductListQueryDto);

      expect(result.total).toBe(2);
      expect(result.products).toHaveLength(2);
    });

    it("should apply full-text search filter in $match stage", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ search: "wireless" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage.$or).toBeDefined();
      expect(matchStage.$or.length).toBeGreaterThan(0);
    });

    it("should apply categoryId filter in $match stage", async () => {
      const categoryId = new ObjectId().toString();
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ categoryId } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage.categoryId).toBe(categoryId);
    });

    it("should apply status filter", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ status: ProductStatus.ACTIVE } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage.status).toBe(ProductStatus.ACTIVE);
    });

    it("should apply priceFrom and priceTo as $gte / $lte on sellingPrice", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ priceFrom: 1000, priceTo: 5000 } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage["pricing.sellingPrice"].$gte).toBe(1000);
      expect(matchStage["pricing.sellingPrice"].$lte).toBe(5000);
    });

    it("should filter out_of_stock with stockQty $lte 0", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ stockStatus: "out_of_stock" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage["inventory.stockQty"].$lte).toBe(0);
    });

    it("should filter in_stock with stockQty $gt 0", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ stockStatus: "in_stock" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage["inventory.stockQty"].$gt).toBe(0);
    });

    it("should filter low_stock using $expr", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ stockStatus: "low_stock" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const matchStage = pipeline.find((s: any) => s.$match)?.$match;
      expect(matchStage.$expr).toBeDefined();
    });

    it("should calculate skip = page * limit correctly (page=2, limit=5 → skip=10)", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ page: 2, limit: 5 } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const facetStage = pipeline.find((s: any) => s.$facet)?.$facet;
      const skipStage = facetStage?.data?.find((s: any) => s.$skip);
      expect(skipStage?.$skip).toBe(10);
    });

    it("should return zero total when no products match", async () => {
      mockRepo.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

      const result = await service.list({} as any);
      expect(result.total).toBe(0);
      expect(result.products).toHaveLength(0);
    });

    it("should sort by name ASC when sortBy=name, sortOrder=ASC", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ sortBy: "name", sortOrder: "ASC" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const sortStage = pipeline.find((s: any) => s.$sort)?.$sort;
      expect(sortStage?.name).toBe(1);
    });

    it("should sort by sellingPrice DESC by default when sortBy=price", async () => {
      mockRepo.aggregate.mockResolvedValue(buildListResult([], 0));

      await service.list({ sortBy: "price", sortOrder: "DESC" } as any);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const sortStage = pipeline.find((s: any) => s.$sort)?.$sort;
      expect(sortStage?.["pricing.sellingPrice"]).toBe(-1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET BY ID
  // ═══════════════════════════════════════════════════════════════════════════

  describe("getById()", () => {
    it("should return a product when found", async () => {
      const id = new ObjectId().toString();
      const product = makeProduct({ _id: new ObjectId(id) });
      mockRepo.findById.mockResolvedValue(product);

      const result = await service.getById(id);

      expect(result._id.toString()).toBe(id);
      expect(result.name).toBe("Test Product");
    });

    it("should throw NotFoundError when product does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById(new ObjectId().toString())).rejects.toThrow("Product not found");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("update()", () => {
    it("should update scalar fields on the product", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: UpdateProductDto = { shortDescription: "Updated desc", tags: ["sale"] };
      const result = await service.update(product._id.toString(), dto, userId);

      expect(result.shortDescription).toBe("Updated desc");
      expect(result.tags).toEqual(["sale"]);
    });

    it("should generate new slug when name is changed", async () => {
      const product = makeProduct({ name: "Old Name", slug: "old-name" });
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.save.mockImplementation(async (p: any) => p);

      await service.update(product._id.toString(), { name: "New Name" }, userId);

      expect(mockRepo.findBySlug).toHaveBeenCalledWith("new-name", product._id.toString());
      expect(product.slug).toBe("new-name");
    });

    it("should throw 400 when new slug already belongs to another product", async () => {
      const product = makeProduct();
      const conflicting = makeProduct({ _id: new ObjectId() });
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.findBySlug.mockResolvedValue(conflicting);

      await expect(
        service.update(product._id.toString(), { name: "Conflicting Name" }, userId)
      ).rejects.toThrow("already exists");
    });

    it("should throw 400 when new SKU already belongs to another product", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.findBySku.mockResolvedValue(makeProduct({ _id: new ObjectId() }));

      await expect(
        service.update(product._id.toString(), { sku: "TAKEN-SKU" }, userId)
      ).rejects.toThrow("already exists");
    });

    it("should deep-merge partial pricing update (preserving unchanged fields)", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      await service.update(product._id.toString(), { pricing: { sellingPrice: 3999 } as any }, userId);

      expect(product.pricing.mrp).toBe(5999);         // unchanged
      expect(product.pricing.sellingPrice).toBe(3999); // updated
    });

    it("should deep-merge partial inventory update", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      await service.update(product._id.toString(), { inventory: { stockQty: 200 } as any }, userId);

      expect(product.inventory.stockQty).toBe(200);
      expect(product.inventory.trackInventory).toBe(true); // unchanged
    });

    it("should set updatedBy to userId", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      await service.update(product._id.toString(), { tags: ["sale"] }, userId);

      expect(product.updatedBy?.toString()).toBe(userId);
    });

    it("should throw NotFoundError when product to update does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update(new ObjectId().toString(), {}, userId)).rejects.toThrow(
        "Product not found"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SOFT DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("softDelete()", () => {
    it("should mark product as deleted with full audit trail", async () => {
      const product = makeProduct({ isDeleted: false });
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockResolvedValue(product);

      await service.softDelete(product._id.toString(), userId);

      expect(product.isDeleted).toBe(true);
      expect(product.deletedBy?.toString()).toBe(userId);
      expect(product.updatedBy?.toString()).toBe(userId);
      expect(product.deletedAt).toBeInstanceOf(Date);
      expect(mockRepo.save).toHaveBeenCalledWith(product);
    });

    it("should throw NotFoundError if product is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete(new ObjectId().toString(), userId)).rejects.toThrow(
        "Product not found"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTORE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("restore()", () => {
    it("should restore a soft-deleted product and clear deletion fields", async () => {
      const product = makeProduct({ isDeleted: true, deletedBy: new ObjectId(userId) });
      mockRepo.findByIdIncludeDeleted.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      await service.restore(product._id.toString(), userId);

      expect(product.isDeleted).toBe(false);
      expect(product.deletedAt).toBeUndefined();
      expect(product.deletedBy).toBeUndefined();
      expect(product.updatedBy?.toString()).toBe(userId);
    });

    it("should throw NotFoundError when product does not exist at all", async () => {
      mockRepo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(service.restore(new ObjectId().toString(), userId)).rejects.toThrow(
        "Product not found"
      );
    });

    it("should throw 400 when trying to restore a product that is not deleted", async () => {
      const product = makeProduct({ isDeleted: false });
      mockRepo.findByIdIncludeDeleted.mockResolvedValue(product);

      await expect(service.restore(product._id.toString(), userId)).rejects.toThrow(
        "Product is not deleted"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANGE STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("changeStatus()", () => {
    it("should update publishState to PUBLISHED", async () => {
      const product = makeProduct({ publishState: ProductPublishState.DRAFT });
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: ChangeProductStatusDto = { publishState: ProductPublishState.PUBLISHED };
      const result = await service.changeStatus(product._id.toString(), dto, userId);

      expect(result.publishState).toBe(ProductPublishState.PUBLISHED);
    });

    it("should update status to INACTIVE", async () => {
      const product = makeProduct({ status: ProductStatus.ACTIVE });
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: ChangeProductStatusDto = { status: ProductStatus.INACTIVE };
      const result = await service.changeStatus(product._id.toString(), dto, userId);

      expect(result.status).toBe(ProductStatus.INACTIVE);
    });

    it("should update publishState to ARCHIVED and status to INACTIVE simultaneously", async () => {
      const product = makeProduct();
      mockRepo.findById.mockResolvedValue(product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: ChangeProductStatusDto = {
        publishState: ProductPublishState.ARCHIVED,
        status: ProductStatus.INACTIVE
      };
      const result = await service.changeStatus(product._id.toString(), dto, userId);

      expect(result.publishState).toBe(ProductPublishState.ARCHIVED);
      expect(result.status).toBe(ProductStatus.INACTIVE);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DUPLICATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("duplicate()", () => {
    it("should create a clone in DRAFT + INACTIVE state", async () => {
      const source = makeProduct({
        name: "Headphones",
        slug: "headphones",
        sku: "HP-001",
        status: ProductStatus.ACTIVE,
        publishState: ProductPublishState.PUBLISHED
      });
      const cloned = makeProduct({
        name: "Headphones (Copy)",
        publishState: ProductPublishState.DRAFT,
        status: ProductStatus.INACTIVE
      });

      mockRepo.findById.mockResolvedValue(source);
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(cloned);
      mockRepo.save.mockResolvedValue(cloned);

      const result = await service.duplicate(source._id.toString(), userId);

      expect(result.publishState).toBe(ProductPublishState.DRAFT);
      expect(result.status).toBe(ProductStatus.INACTIVE);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should regenerate variant SKUs with a timestamp suffix", async () => {
      const source = makeProduct({
        productType: ProductType.VARIABLE,
        variants: [{ id: "v1", sku: "HP-001-BLK", combination: { Color: "Black" } }] as any
      });

      mockRepo.findById.mockResolvedValue(source);
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockImplementation((data: any) => data as Product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const result = await service.duplicate(source._id.toString(), userId) as any;

      const variantSku: string = result.variants?.[0]?.sku;
      expect(variantSku).toBeDefined();
      expect(variantSku).toContain("HP-001-BLK-");
    });

    it("should reset analytics counters (viewCount, salesCount) to 0 on clone", async () => {
      const source = makeProduct({ viewCount: 150, salesCount: 30 });

      mockRepo.findById.mockResolvedValue(source);
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.findBySku.mockResolvedValue(null);
      mockRepo.create.mockImplementation((data: any) => data as Product);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const result = await service.duplicate(source._id.toString(), userId) as any;

      expect(result.viewCount).toBe(0);
      expect(result.salesCount).toBe(0);
    });

    it("should throw 400 when the generated clone slug is already taken", async () => {
      const source = makeProduct({ slug: "headphones" });
      mockRepo.findById.mockResolvedValue(source);
      mockRepo.findBySlug.mockResolvedValue(makeProduct()); // conflict

      await expect(service.duplicate(source._id.toString(), userId)).rejects.toThrow(
        "Could not generate a unique slug"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("bulkDelete()", () => {
    it("should soft-delete multiple products in one call", async () => {
      const ids = [new ObjectId().toString(), new ObjectId().toString()];
      mockRepo.bulkUpdate.mockResolvedValue(2);

      const result = await service.bulkDelete(ids, userId);

      expect(result.deleted).toBe(2);
      expect(mockRepo.bulkUpdate).toHaveBeenCalledWith(
        ids,
        expect.objectContaining({ isDeleted: true, deletedBy: userId, updatedBy: userId })
      );
    });

    it("should return 0 deleted when empty ids array is passed", async () => {
      mockRepo.bulkUpdate.mockResolvedValue(0);
      const result = await service.bulkDelete([], userId);
      expect(result.deleted).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("bulkStatus()", () => {
    it("should update publishState for multiple products", async () => {
      const ids = [new ObjectId().toString()];
      mockRepo.bulkUpdate.mockResolvedValue(1);

      const result = await service.bulkStatus(
        ids,
        ProductPublishState.PUBLISHED,
        undefined,
        userId
      );

      expect(result.updated).toBe(1);
      expect(mockRepo.bulkUpdate).toHaveBeenCalledWith(
        ids,
        expect.objectContaining({ publishState: ProductPublishState.PUBLISHED })
      );
    });

    it("should update status for multiple products", async () => {
      const ids = [new ObjectId().toString()];
      mockRepo.bulkUpdate.mockResolvedValue(1);

      const result = await service.bulkStatus(ids, undefined, ProductStatus.INACTIVE, userId);

      expect(result.updated).toBe(1);
      expect(mockRepo.bulkUpdate).toHaveBeenCalledWith(
        ids,
        expect.objectContaining({ status: ProductStatus.INACTIVE })
      );
    });

    it("should throw 400 when neither publishState nor status is provided", async () => {
      await expect(
        service.bulkStatus([new ObjectId().toString()], undefined, undefined, userId)
      ).rejects.toThrow("Provide at least one");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK PRICE UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("bulkPriceUpdate()", () => {
    it("should increase sellingPrice by flat amount", async () => {
      const product = makeProduct();
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: BulkPriceUpdateDto = {
        ids: [product._id.toString()],
        flatAdjustment: 500,
        field: "sellingPrice"
      };
      const result = await service.bulkPriceUpdate(dto, userId);

      expect(result.updated).toBe(1);
      expect(result.failed).toHaveLength(0);
      expect(product.pricing.sellingPrice).toBe(4999); // 4499 + 500
    });

    it("should clamp sellingPrice to 0 when flat decrease exceeds current price", async () => {
      const product = makeProduct({
        pricing: { mrp: 100, sellingPrice: 50, currency: "INR" } as any
      });
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: BulkPriceUpdateDto = {
        ids: [product._id.toString()],
        flatAdjustment: -200,
        field: "sellingPrice"
      };
      await service.bulkPriceUpdate(dto, userId);

      expect(product.pricing.sellingPrice).toBe(0);
    });

    it("should apply percentage discount to sellingPrice", async () => {
      const product = makeProduct();
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      // -10% of 4499 = 4049.10
      const dto: BulkPriceUpdateDto = {
        ids: [product._id.toString()],
        percentAdjustment: -10,
        field: "sellingPrice"
      };
      await service.bulkPriceUpdate(dto, userId);

      expect(product.pricing.sellingPrice).toBeCloseTo(4049.1);
    });

    it("should apply percentage increase to MRP", async () => {
      const product = makeProduct();
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      // +5% of 5999 = 6298.95
      const dto: BulkPriceUpdateDto = {
        ids: [product._id.toString()],
        percentAdjustment: 5,
        field: "mrp"
      };
      await service.bulkPriceUpdate(dto, userId);

      expect(product.pricing.mrp).toBeCloseTo(6298.95);
    });

    it("should throw 400 when neither flat nor percent adjustment is provided", async () => {
      const dto: BulkPriceUpdateDto = { ids: [new ObjectId().toString()] };

      await expect(service.bulkPriceUpdate(dto, userId)).rejects.toThrow(
        "Provide flatAdjustment or percentAdjustment"
      );
    });

    it("should track failed product IDs when save throws", async () => {
      const product = makeProduct();
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockRejectedValue(new Error("DB write error"));

      const dto: BulkPriceUpdateDto = {
        ids: [product._id.toString()],
        flatAdjustment: 100,
        field: "sellingPrice"
      };
      const result = await service.bulkPriceUpdate(dto, userId);

      expect(result.updated).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toBe(product._id.toString());
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK STOCK UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("bulkStockUpdate()", () => {
    it("should add stock delta to multiple products", async () => {
      const p1 = makeProduct({
        inventory: { stockQty: 100, trackInventory: true, allowBackOrders: false } as any
      });
      const p2 = makeProduct({
        inventory: { stockQty: 50, trackInventory: true, allowBackOrders: false } as any
      });
      mockRepo.findByIds.mockResolvedValue([p1, p2]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: BulkStockUpdateDto = {
        ids: [p1._id.toString(), p2._id.toString()],
        stockDelta: 20
      };
      const result = await service.bulkStockUpdate(dto, userId);

      expect(result.updated).toBe(2);
      expect(p1.inventory.stockQty).toBe(120);
      expect(p2.inventory.stockQty).toBe(70);
    });

    it("should deduct stock and clamp to 0 (never go negative)", async () => {
      const product = makeProduct({
        inventory: { stockQty: 5, trackInventory: true, allowBackOrders: false } as any
      });
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockImplementation(async (p: any) => p);

      const dto: BulkStockUpdateDto = { ids: [product._id.toString()], stockDelta: -100 };
      await service.bulkStockUpdate(dto, userId);

      expect(product.inventory.stockQty).toBe(0);
    });

    it("should track failed product IDs when save throws", async () => {
      const product = makeProduct();
      mockRepo.findByIds.mockResolvedValue([product]);
      mockRepo.save.mockRejectedValue(new Error("DB write error"));

      const dto: BulkStockUpdateDto = { ids: [product._id.toString()], stockDelta: 10 };
      const result = await service.bulkStockUpdate(dto, userId);

      expect(result.updated).toBe(0);
      expect(result.failed).toContain(product._id.toString());
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  describe("exportProducts()", () => {
    it("should return all matching products using a 10000 limit (no pagination cap)", async () => {
      const products = Array.from({ length: 50 }, () => makeProduct());
      mockRepo.aggregate.mockResolvedValue([{ metadata: [{ total: 50 }], data: products }]);

      const result = await service.exportProducts({} as any);

      expect(result).toHaveLength(50);

      const pipeline = mockRepo.aggregate.mock.calls[0][0] as any[];
      const facetStage = pipeline.find((s: any) => s.$facet)?.$facet;
      const limitStage = facetStage?.data?.find((s: any) => s.$limit);
      expect(limitStage?.$limit).toBe(10000);
    });
  });
});
