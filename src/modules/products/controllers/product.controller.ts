import {
  JsonController,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  QueryParams,
  HttpCode,
  UseBefore,
  Patch,
  Req
} from "routing-controllers";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ChangeProductStatusDto,
  BulkDeleteProductDto,
  BulkStatusProductDto,
  BulkPriceUpdateDto,
  BulkStockUpdateDto,
  ProductImportDto
} from "../../../dto/admin/Product.dto";
import { ProductService } from "../services/product.service";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { canAccess } from "../../../middlewares/PermissionMiddleware";
import pagination from "../../../utils/pagination";

/**
 * ProductController
 *
 * Route prefix: /api/products
 * Auth:         JWT via AuthMiddleware (applied at class level)
 * RBAC:         canAccess("products", action) per route
 *
 * Endpoints:
 *  POST   /products                 → create
 *  GET    /products                 → list (paginated + filtered)
 *  GET    /products/export          → export all matching products
 *  POST   /products/import          → batch import
 *  POST   /products/bulk-delete     → soft-delete multiple
 *  POST   /products/bulk-status     → change status for multiple
 *  POST   /products/bulk-price      → adjust price for multiple
 *  POST   /products/bulk-stock      → adjust stock for multiple
 *  GET    /products/:id             → get single product with all details
 *  PUT    /products/:id             → full/partial update
 *  DELETE /products/:id             → soft delete
 *  PATCH  /products/:id/restore     → restore soft-deleted product
 *  PATCH  /products/:id/status      → change publish state / visibility
 *  POST   /products/:id/duplicate   → clone product with new SKU/slug
 */
@JsonController("/products")
@UseBefore(AuthMiddleware)
export class ProductController {
  private readonly productService = new ProductService();

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductDto'
   *     responses:
   *       201:
   *         description: Product created successfully
   *       400:
   *         description: Validation error or business rule violation
   *       409:
   *         description: Duplicate SKU or slug
   */
  @Post("/")
  @UseBefore(canAccess("products", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() dto: CreateProductDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const product = await this.productService.create(dto, userId);
    return {
      status: StatusCodes.CREATED,
      message: "Product created successfully",
      data: product
    };
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get paginated list of products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *         description: Search by name, SKU, barcode, slug, description
   *       - in: query
   *         name: categoryId
   *         schema: { type: string }
   *       - in: query
   *         name: brandId
   *         schema: { type: string }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [active, inactive] }
   *       - in: query
   *         name: publishState
   *         schema: { type: string, enum: [draft, published, scheduled, archived] }
   *       - in: query
   *         name: priceFrom
   *         schema: { type: number }
   *       - in: query
   *         name: priceTo
   *         schema: { type: number }
   *       - in: query
   *         name: stockStatus
   *         schema: { type: string, enum: [in_stock, out_of_stock, low_stock] }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: sortBy
   *         schema: { type: string, default: createdAt }
   *       - in: query
   *         name: sortOrder
   *         schema: { type: string, enum: [ASC, DESC], default: DESC }
   *     responses:
   *       200:
   *         description: Paginated product list
   */
  @Get("/")
  @UseBefore(canAccess("products", "view"))
  async getAll(@QueryParams() query: ProductListQueryDto) {
    const { products, total } = await this.productService.list(query);
    return pagination(total, products, Number(query.limit) || 10, Number(query.page) || 0);
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/export:
   *   get:
   *     summary: Export products (returns full list for CSV/Excel generation)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  @Get("/export")
  @UseBefore(canAccess("products", "view"))
  async export(@QueryParams() query: ProductListQueryDto) {
    const products = await this.productService.exportProducts(query);
    return {
      status: StatusCodes.OK,
      message: "Products exported successfully",
      total: products.length,
      data: products
    };
  }

  // ─── Import ────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/import:
   *   post:
   *     summary: Batch import products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  @Post("/import")
  @UseBefore(canAccess("products", "add"))
  @HttpCode(StatusCodes.CREATED)
  async import(@Body() dto: ProductImportDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const result = await this.productService.importProducts(dto.products, userId);
    return {
      status: result.failed.length === 0 ? StatusCodes.CREATED : StatusCodes.MULTI_STATUS,
      message: `Import complete: ${result.created} created, ${result.failed.length} failed`,
      data: result
    };
  }

  // ─── Bulk Delete ───────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/bulk-delete:
   *   post:
   *     summary: Soft-delete multiple products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           example:
   *             ids: ["6693a1f...", "6693a2b..."]
   */
  @Post("/bulk-delete")
  @UseBefore(canAccess("products", "delete"))
  async bulkDelete(@Body() dto: BulkDeleteProductDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const result = await this.productService.bulkDelete(dto.ids, userId);
    return {
      status: StatusCodes.OK,
      message: `${result.deleted} product(s) deleted successfully`,
      data: result
    };
  }

  // ─── Bulk Status ───────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/bulk-status:
   *   post:
   *     summary: Change publish state / visibility for multiple products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  @Post("/bulk-status")
  @UseBefore(canAccess("products", "edit"))
  async bulkStatus(@Body() dto: BulkStatusProductDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const result = await this.productService.bulkStatus(
      dto.ids,
      dto.publishState,
      dto.status,
      userId
    );
    return {
      status: StatusCodes.OK,
      message: `${result.updated} product(s) updated`,
      data: result
    };
  }

  // ─── Bulk Price ────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/bulk-price:
   *   post:
   *     summary: Adjust price for multiple products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           examples:
   *             flatIncrease:
   *               value: { ids: ["..."], flatAdjustment: 50, field: "sellingPrice" }
   *             percentDiscount:
   *               value: { ids: ["..."], percentAdjustment: -10, field: "sellingPrice" }
   */
  @Post("/bulk-price")
  @UseBefore(canAccess("products", "edit"))
  async bulkPriceUpdate(@Body() dto: BulkPriceUpdateDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const result = await this.productService.bulkPriceUpdate(dto, userId);
    return {
      status: StatusCodes.OK,
      message: `${result.updated} product(s) price updated, ${result.failed.length} failed`,
      data: result
    };
  }

  // ─── Bulk Stock ────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/bulk-stock:
   *   post:
   *     summary: Adjust stock for multiple products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           examples:
   *             addStock:
   *               value: { ids: ["..."], stockDelta: 100 }
   *             deductStock:
   *               value: { ids: ["..."], stockDelta: -20 }
   */
  @Post("/bulk-stock")
  @UseBefore(canAccess("products", "edit"))
  async bulkStockUpdate(@Body() dto: BulkStockUpdateDto, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const result = await this.productService.bulkStockUpdate(dto, userId);
    return {
      status: StatusCodes.OK,
      message: `${result.updated} product(s) stock updated, ${result.failed.length} failed`,
      data: result
    };
  }

  // ─── Get Single ────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     summary: Get full product details by ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Full product with brand, category, attributes, variants, inventory, SEO
   *       404:
   *         description: Product not found
   */
  @Get("/:id")
  @UseBefore(canAccess("products", "view"))
  async getOne(@Param("id") id: string) {
    const product = await this.productService.getById(id);
    return {
      status: StatusCodes.OK,
      message: "Product fetched successfully",
      data: product
    };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     summary: Update a product (supports partial update)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Product updated successfully
   *       404:
   *         description: Product not found
   */
  @Put("/:id")
  @UseBefore(canAccess("products", "edit"))
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: Request
  ) {
    const userId = (req as any).user?.userId || "system";
    const product = await this.productService.update(id, dto, userId);
    return {
      status: StatusCodes.OK,
      message: "Product updated successfully",
      data: product
    };
  }

  // ─── Soft Delete ───────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     summary: Soft-delete a product (sets isDeleted=true, never permanently removes)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  @Delete("/:id")
  @UseBefore(canAccess("products", "delete"))
  async delete(@Param("id") id: string, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    await this.productService.softDelete(id, userId);
    return {
      status: StatusCodes.OK,
      message: "Product deleted successfully",
      data: null
    };
  }

  // ─── Restore ───────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}/restore:
   *   patch:
   *     summary: Restore a soft-deleted product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  @Patch("/:id/restore")
  @UseBefore(canAccess("products", "edit"))
  async restore(@Param("id") id: string, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const product = await this.productService.restore(id, userId);
    return {
      status: StatusCodes.OK,
      message: "Product restored successfully",
      data: product
    };
  }

  // ─── Change Status ─────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}/status:
   *   patch:
   *     summary: Change product publish state or visibility status
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           examples:
   *             publish:
   *               value: { publishState: "published" }
   *             archive:
   *               value: { publishState: "archived" }
   *             deactivate:
   *               value: { status: "inactive" }
   */
  @Patch("/:id/status")
  @UseBefore(canAccess("products", "edit"))
  async changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeProductStatusDto,
    @Req() req: Request
  ) {
    const userId = (req as any).user?.userId || "system";
    const product = await this.productService.changeStatus(id, dto, userId);
    return {
      status: StatusCodes.OK,
      message: "Product status updated successfully",
      data: product
    };
  }

  // ─── Duplicate ─────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /products/{id}/duplicate:
   *   post:
   *     summary: Duplicate a product with a new SKU and slug
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       Creates an exact clone of the product with:
   *       - New auto-generated SKU (appends timestamp suffix)
   *       - New slug ("{original-slug}-copy-{timestamp}")
   *       - publishState set to "draft"
   *       - status set to "inactive"
   *       - All variant SKUs regenerated
   *       - Analytics (viewCount, salesCount) reset to 0
   */
  @Post("/:id/duplicate")
  @UseBefore(canAccess("products", "add"))
  @HttpCode(StatusCodes.CREATED)
  async duplicate(@Param("id") id: string, @Req() req: Request) {
    const userId = (req as any).user?.userId || "system";
    const product = await this.productService.duplicate(id, userId);
    return {
      status: StatusCodes.CREATED,
      message: "Product duplicated successfully",
      data: product
    };
  }
}
