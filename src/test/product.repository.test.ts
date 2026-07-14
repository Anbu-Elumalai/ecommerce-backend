import "reflect-metadata";
import { ObjectId } from "mongodb";
import { Product } from "../entity/Product";

// ─── Build a fresh mock repo object per test ─────────────────────────────────

function buildMockMongoRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  };
}

// We need to intercept the ProductRepository constructor before it touches AppDataSource.
// The cleanest approach: mock the entire module and inject a controllable repo instance.
jest.mock("../data-source", () => ({
  AppDataSource: {
    getMongoRepository: jest.fn(),
    isInitialized: true
  }
}));

import { AppDataSource } from "../data-source";
import { ProductRepository } from "../modules/products/repository/product.repository";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  const p = new Product();
  p._id = new ObjectId();
  p.name = "Test Product";
  p.slug = "test-product";
  p.sku = "TP-001";
  p.isDeleted = false;
  return Object.assign(p, overrides);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ProductRepository Unit Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("ProductRepository — Unit Tests", () => {
  let repo: ProductRepository;
  let mockMongoRepo: ReturnType<typeof buildMockMongoRepo>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoRepo = buildMockMongoRepo();
    // Each new ProductRepository() calls getMongoRepository(Product) once
    (AppDataSource.getMongoRepository as jest.Mock).mockReturnValue(mockMongoRepo);
    repo = new ProductRepository();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findById
  // ═══════════════════════════════════════════════════════════════════════════

  describe("findById()", () => {
    it("should return a product when found with a valid ObjectId", async () => {
      const id = new ObjectId().toString();
      const product = makeProduct({ _id: new ObjectId(id) });
      mockMongoRepo.findOne.mockResolvedValue(product);

      const result = await repo.findById(id);

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(id);
      expect(mockMongoRepo.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({ isDeleted: false })
      });
    });

    it("should return null when product is not found", async () => {
      mockMongoRepo.findOne.mockResolvedValue(null);
      const result = await repo.findById(new ObjectId().toString());
      expect(result).toBeNull();
    });

    it("should throw BadRequestError for an invalid ObjectId format", async () => {
      await expect(repo.findById("not-a-valid-objectid")).rejects.toThrow(
        "Invalid product ID format"
      );
      expect(mockMongoRepo.findOne).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError for an empty string ID", async () => {
      await expect(repo.findById("")).rejects.toThrow("Invalid product ID format");
    });

    it("should query with isDeleted: false to exclude soft-deleted products", async () => {
      const id = new ObjectId().toString();
      mockMongoRepo.findOne.mockResolvedValue(null);

      await repo.findById(id);

      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where.isDeleted).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findByIdIncludeDeleted
  // ═══════════════════════════════════════════════════════════════════════════

  describe("findByIdIncludeDeleted()", () => {
    it("should return a product even if it is soft-deleted", async () => {
      const id = new ObjectId().toString();
      const product = makeProduct({ _id: new ObjectId(id), isDeleted: true });
      mockMongoRepo.findOne.mockResolvedValue(product);

      const result = await repo.findByIdIncludeDeleted(id);

      expect(result).toBeDefined();
      expect(result?.isDeleted).toBe(true);
      // Query should NOT filter by isDeleted
      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where.isDeleted).toBeUndefined();
    });

    it("should throw BadRequestError for invalid ObjectId", async () => {
      await expect(repo.findByIdIncludeDeleted("bad-id")).rejects.toThrow(
        "Invalid product ID format"
      );
    });

    it("should return null when product does not exist", async () => {
      mockMongoRepo.findOne.mockResolvedValue(null);
      const result = await repo.findByIdIncludeDeleted(new ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findBySlug
  // ═══════════════════════════════════════════════════════════════════════════

  describe("findBySlug()", () => {
    it("should return a product matching the slug", async () => {
      const product = makeProduct({ slug: "my-product" });
      mockMongoRepo.findOne.mockResolvedValue(product);

      const result = await repo.findBySlug("my-product");

      expect(result?.slug).toBe("my-product");
      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where.slug).toBe("my-product");
      expect(callArgs.where.isDeleted).toBe(false);
    });

    it("should return null when no product has the given slug", async () => {
      mockMongoRepo.findOne.mockResolvedValue(null);
      const result = await repo.findBySlug("non-existent-slug");
      expect(result).toBeNull();
    });

    it("should exclude a specific product ID when excludeId is provided", async () => {
      const excludeId = new ObjectId().toString();
      mockMongoRepo.findOne.mockResolvedValue(null);

      await repo.findBySlug("my-product", excludeId);

      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where._id).toEqual({ $ne: new ObjectId(excludeId) });
    });

    it("should not add _id exclusion when excludeId is not a valid ObjectId", async () => {
      mockMongoRepo.findOne.mockResolvedValue(null);

      await repo.findBySlug("my-product", "invalid-id");

      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where._id).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findBySku
  // ═══════════════════════════════════════════════════════════════════════════

  describe("findBySku()", () => {
    it("should return a product matching the SKU", async () => {
      const product = makeProduct({ sku: "SKU-001" });
      mockMongoRepo.findOne.mockResolvedValue(product);

      const result = await repo.findBySku("SKU-001");

      expect(result?.sku).toBe("SKU-001");
      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where.sku).toBe("SKU-001");
      expect(callArgs.where.isDeleted).toBe(false);
    });

    it("should return null when no product has the given SKU", async () => {
      mockMongoRepo.findOne.mockResolvedValue(null);
      const result = await repo.findBySku("NON-EXISTENT-SKU");
      expect(result).toBeNull();
    });

    it("should exclude a specific product ID when excludeId is provided", async () => {
      const excludeId = new ObjectId().toString();
      mockMongoRepo.findOne.mockResolvedValue(null);

      await repo.findBySku("SKU-001", excludeId);

      const callArgs = mockMongoRepo.findOne.mock.calls[0][0];
      expect(callArgs.where._id).toEqual({ $ne: new ObjectId(excludeId) });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findByIds
  // ═══════════════════════════════════════════════════════════════════════════

  describe("findByIds()", () => {
    it("should return products matching the given ids", async () => {
      const id1 = new ObjectId().toString();
      const id2 = new ObjectId().toString();
      const products = [
        makeProduct({ _id: new ObjectId(id1) }),
        makeProduct({ _id: new ObjectId(id2) })
      ];
      mockMongoRepo.find.mockResolvedValue(products);

      const result = await repo.findByIds([id1, id2]);

      expect(result).toHaveLength(2);
      expect(mockMongoRepo.find).toHaveBeenCalledTimes(1);
    });

    it("should silently skip invalid ObjectId strings and only query valid ones", async () => {
      const validId = new ObjectId().toString();
      mockMongoRepo.find.mockResolvedValue([makeProduct()]);

      await repo.findByIds([validId, "invalid-id", "also-bad"]);

      const callArgs = mockMongoRepo.find.mock.calls[0][0];
      expect(callArgs.where._id.$in).toHaveLength(1);
    });

    it("should return empty array when all ids are invalid ObjectIds", async () => {
      mockMongoRepo.find.mockResolvedValue([]);
      const result = await repo.findByIds(["bad-id-1", "bad-id-2"]);
      expect(result).toHaveLength(0);
    });

    it("should return empty array when ids array is empty", async () => {
      mockMongoRepo.find.mockResolvedValue([]);
      const result = await repo.findByIds([]);
      expect(result).toHaveLength(0);
    });

    it("should query with isDeleted: false to exclude soft-deleted products", async () => {
      const id = new ObjectId().toString();
      mockMongoRepo.find.mockResolvedValue([]);

      await repo.findByIds([id]);

      const callArgs = mockMongoRepo.find.mock.calls[0][0];
      expect(callArgs.where.isDeleted).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // aggregate
  // ═══════════════════════════════════════════════════════════════════════════

  describe("aggregate()", () => {
    it("should run the aggregation pipeline and return results as an array", async () => {
      const mockCursor = { toArray: jest.fn().mockResolvedValue([{ total: 5 }]) };
      mockMongoRepo.aggregate.mockReturnValue(mockCursor);

      const pipeline = [{ $match: { isDeleted: false } }, { $count: "total" }];
      const result = await repo.aggregate(pipeline);

      expect(mockMongoRepo.aggregate).toHaveBeenCalledWith(pipeline);
      expect(mockCursor.toArray).toHaveBeenCalled();
      expect(result).toEqual([{ total: 5 }]);
    });

    it("should return empty array when pipeline matches nothing", async () => {
      const mockCursor = { toArray: jest.fn().mockResolvedValue([]) };
      mockMongoRepo.aggregate.mockReturnValue(mockCursor);

      const result = await repo.aggregate([{ $match: { name: "nonexistent" } }]);

      expect(result).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // save
  // ═══════════════════════════════════════════════════════════════════════════

  describe("save()", () => {
    it("should delegate to the underlying MongoRepository.save", async () => {
      const product = makeProduct();
      mockMongoRepo.save.mockResolvedValue(product);

      const result = await repo.save(product);

      expect(mockMongoRepo.save).toHaveBeenCalledWith(product);
      expect(result).toBe(product);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════════════════

  describe("create()", () => {
    it("should delegate to the underlying MongoRepository.create", () => {
      const data: Partial<Product> = { name: "New Product", slug: "new-product" };
      const product = makeProduct(data);
      mockMongoRepo.create.mockReturnValue(product);

      const result = repo.create(data);

      expect(mockMongoRepo.create).toHaveBeenCalledWith(data);
      expect(result.name).toBe("New Product");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // bulkUpdate
  // ═══════════════════════════════════════════════════════════════════════════

  describe("bulkUpdate()", () => {
    it("should call updateMany and return the modifiedCount", async () => {
      const ids = [new ObjectId().toString(), new ObjectId().toString()];
      mockMongoRepo.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const result = await repo.bulkUpdate(ids, { isDeleted: true });

      expect(mockMongoRepo.updateMany).toHaveBeenCalledTimes(1);
      expect(result).toBe(2);
    });

    it("should silently skip invalid ObjectIds and only update valid ones", async () => {
      const validId = new ObjectId().toString();
      mockMongoRepo.updateMany.mockResolvedValue({ modifiedCount: 1 });

      await repo.bulkUpdate([validId, "not-valid"], { status: "inactive" });

      const callArgs = mockMongoRepo.updateMany.mock.calls[0];
      expect(callArgs[0]._id.$in).toHaveLength(1);
    });

    it("should return 0 when modifiedCount is absent from the result", async () => {
      mockMongoRepo.updateMany.mockResolvedValue({});

      const result = await repo.bulkUpdate([new ObjectId().toString()], { isDeleted: true });

      expect(result).toBe(0);
    });

    it("should include isDeleted: false in filter to avoid re-deleting already-deleted items", async () => {
      const id = new ObjectId().toString();
      mockMongoRepo.updateMany.mockResolvedValue({ modifiedCount: 0 });

      await repo.bulkUpdate([id], { status: "inactive" });

      const filter = mockMongoRepo.updateMany.mock.calls[0][0];
      expect(filter.isDeleted).toBe(false);
    });

    it("should return 0 when empty ids array is passed", async () => {
      mockMongoRepo.updateMany.mockResolvedValue({ modifiedCount: 0 });

      const result = await repo.bulkUpdate([], { isDeleted: true });

      expect(result).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // count
  // ═══════════════════════════════════════════════════════════════════════════

  describe("count()", () => {
    it("should return the count matching the provided filter", async () => {
      mockMongoRepo.count.mockResolvedValue(42);

      const result = await repo.count({ isDeleted: false });

      expect(mockMongoRepo.count).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toBe(42);
    });

    it("should return 0 when nothing matches the filter", async () => {
      mockMongoRepo.count.mockResolvedValue(0);

      const result = await repo.count({ status: "nonexistent" });

      expect(result).toBe(0);
    });
  });
});
