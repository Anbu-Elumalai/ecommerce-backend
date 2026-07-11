import { ProductService } from "../modules/products/services/product.service";
import { ProductRepository } from "../modules/products/repository/product.repository";
import { ProductStatus, ProductPublishState, Product } from "../entity/Product";
import { CreateProductDto } from "../dto/admin/Product.dto";
import { ObjectId } from "mongodb";

// Mock ProductRepository
jest.mock("../modules/products/repository/product.repository");

describe("ProductService Unit Tests", () => {
  let productService: ProductService;
  let mockProductRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    productService = new ProductService();
    mockProductRepo = (productService as any).productRepo as jest.Mocked<ProductRepository>;
  });

  describe("create", () => {
    it("should successfully create a simple product", async () => {
      const dto: CreateProductDto = {
        name: "Test Green Tea",
        slug: "test-green-tea",
        sku: "TS-TEA-001",
        categoryId: new ObjectId().toString(),
        pricing: {
          mrp: 100,
          sellingPrice: 80,
          costPrice: 50,
          currency: "INR"
        },
        status: ProductStatus.ACTIVE,
        publishState: ProductPublishState.DRAFT
      };

      // Mock dependency checks in service: validateCategory and validateBrand
      (productService as any).validateCategory = jest.fn().mockResolvedValue(true);
      (productService as any).validateBrand = jest.fn().mockResolvedValue(true);

      // Mock repository calls
      mockProductRepo.findBySlug.mockResolvedValue(null);
      mockProductRepo.findBySku.mockResolvedValue(null);

      const createdProduct = new Product();
      createdProduct._id = new ObjectId();
      createdProduct.name = dto.name;
      createdProduct.slug = dto.slug!;
      createdProduct.sku = dto.sku!;
      createdProduct.categoryId = dto.categoryId;
      createdProduct.pricing = dto.pricing as any;
      createdProduct.inventory = { trackInventory: true, stockQty: 0, allowBackOrders: false };
      createdProduct.status = dto.status!;
      createdProduct.publishState = dto.publishState!;

      mockProductRepo.create.mockReturnValue(createdProduct);
      mockProductRepo.save.mockResolvedValue(createdProduct);

      const result = await productService.create(dto, "user-id-123");

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Green Tea");
      expect(result.sku).toBe("TS-TEA-001");
      expect(mockProductRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should throw error if slug already exists", async () => {
      const dto: CreateProductDto = {
        name: "Test Green Tea",
        slug: "test-green-tea",
        categoryId: new ObjectId().toString(),
        pricing: { mrp: 100, sellingPrice: 80 }
      };

      mockProductRepo.findBySlug.mockResolvedValue(new Product());

      await expect(productService.create(dto, "user-id-123")).rejects.toThrow(
        "A product with slug 'test-green-tea' already exists"
      );
    });
  });

  describe("getById", () => {
    it("should return a product if it exists", async () => {
      const productId = new ObjectId().toString();
      const mockProduct = new Product();
      mockProduct._id = new ObjectId(productId);
      mockProduct.name = "Matcha Powder";

      mockProductRepo.findById.mockResolvedValue(mockProduct);

      const result = await productService.getById(productId);

      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(productId);
      expect(result.name).toBe("Matcha Powder");
    });

    it("should throw NotFoundError if product does not exist", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(productService.getById(new ObjectId().toString())).rejects.toThrow(
        "Product not found"
      );
    });
  });

  describe("softDelete", () => {
    it("should mark isDeleted to true and store deletion details", async () => {
      const productId = new ObjectId().toString();
      const mockProduct = new Product();
      mockProduct._id = new ObjectId(productId);
      mockProduct.isDeleted = false;

      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockProductRepo.save.mockResolvedValue(mockProduct);

      await productService.softDelete(productId, "user-id-123");

      expect(mockProduct.isDeleted).toBe(true);
      expect(mockProduct.deletedBy).toBe("user-id-123");
      expect(mockProduct.deletedAt).toBeInstanceOf(Date);
      expect(mockProductRepo.save).toHaveBeenCalledWith(mockProduct);
    });
  });
});
