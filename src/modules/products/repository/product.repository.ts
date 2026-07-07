import { MongoRepository } from "typeorm";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../../../data-source";
import { Product } from "../../../entity/Product";
import { BadRequestError } from "routing-controllers";

/**
 * ProductRepository — thin data-access wrapper around MongoRepository<Product>.
 *
 * Responsibilities:
 *   - ObjectId validation
 *   - Basic CRUD wrappers
 *   - Raw aggregation pipeline execution
 *   - Soft-delete helpers
 *
 * Business logic lives in ProductService, not here.
 */
export class ProductRepository {
  private readonly repo: MongoRepository<Product>;

  constructor() {
    this.repo = AppDataSource.getMongoRepository(Product);
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Find a single active (non-deleted) product by MongoDB ObjectId string.
   * Throws 400 on invalid ObjectId, returns null when not found.
   */
  async findById(id: string): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid product ID format");
    }
    return this.repo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false } as any
    });
  }

  /**
   * Find including soft-deleted records (used by restore endpoint).
   */
  async findByIdIncludeDeleted(id: string): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid product ID format");
    }
    return this.repo.findOne({
      where: { _id: new ObjectId(id) } as any
    });
  }

  /**
   * Check slug uniqueness, excluding a specific product (for update).
   */
  async findBySlug(slug: string, excludeId?: string): Promise<Product | null> {
    const where: any = { slug, isDeleted: false };
    if (excludeId && ObjectId.isValid(excludeId)) {
      where._id = { $ne: new ObjectId(excludeId) };
    }
    return this.repo.findOne({ where });
  }

  /**
   * Check SKU uniqueness, excluding a specific product (for update).
   */
  async findBySku(sku: string, excludeId?: string): Promise<Product | null> {
    const where: any = { sku, isDeleted: false };
    if (excludeId && ObjectId.isValid(excludeId)) {
      where._id = { $ne: new ObjectId(excludeId) };
    }
    return this.repo.findOne({ where });
  }

  /**
   * Find multiple products by their ObjectId strings.
   * Used by bulk operations.
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    const validIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    return this.repo.find({
      where: { _id: { $in: validIds } as any, isDeleted: false } as any
    });
  }

  // ─── Aggregation ──────────────────────────────────────────────────────────────

  /**
   * Execute a raw MongoDB aggregation pipeline against the products collection.
   *
   * TypeORM's MongoRepository exposes the native collection via
   * `repo.aggregate()` which wraps the MongoDB driver's collection.aggregate().
   */
  async aggregate(pipeline: object[]): Promise<any[]> {
    // TypeORM MongoRepository has a built-in aggregate() method
    const cursor = this.repo.aggregate(pipeline as any);
    return cursor.toArray();
  }

  // ─── Write ────────────────────────────────────────────────────────────────────

  async save(product: Product): Promise<Product> {
    return this.repo.save(product) as unknown as Promise<Product>;
  }

  create(data: Partial<Product>): Product {
    return this.repo.create(data as any) as unknown as Product;
  }

  // ─── Bulk Write ───────────────────────────────────────────────────────────────

  /**
   * Bulk update arbitrary fields across multiple documents.
   * Uses MongoDB native updateMany for performance.
   */
  async bulkUpdate(ids: string[], update: Record<string, any>): Promise<number> {
    const validIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const result = await this.repo.updateMany(
      { _id: { $in: validIds }, isDeleted: false } as any,
      { $set: update }
    );

    return (result as any).modifiedCount ?? 0;
  }

  /**
   * Count documents matching a filter (used for pagination facets when
   * aggregation pipeline is not available).
   */
  async count(filter: Record<string, any>): Promise<number> {
    return this.repo.count(filter as any);
  }
}
