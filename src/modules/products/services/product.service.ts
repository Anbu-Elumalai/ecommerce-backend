import { BadRequestError, NotFoundError } from "routing-controllers";
import { ObjectId } from "mongodb";
import { AppDataSource } from "../../../data-source";
import {
  Product,
  ProductType,
  ProductStatus,
  ProductPublishState,
  ProductImage,
  ProductVariant,
  ProductAttributeValue
} from "../../../entity/Product";
import { Category } from "../../../entity/Category";
import { Brand } from "../../../entity/Brand";
import { Attribute } from "../../../entity/Attribute";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListQueryDto,
  ChangeProductStatusDto,
  BulkPriceUpdateDto,
  BulkStockUpdateDto
} from "../../../dto/admin/Product.dto";
import {
  slugify,
  generateSKU,
  generateVariantSKU,
  generateVariantCombinations,
  generateId
} from "../../../utils/helpers";
import { ProductRepository } from "../repository/product.repository";

// ─── Internal helpers ─────────────────────────────────────────────────────────

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  name: "name",
  price: "pricing.sellingPrice",
  mrp: "pricing.mrp",
  stock: "inventory.stockQty",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  sortOrder: "sortOrder",
  viewCount: "viewCount",
  salesCount: "salesCount"
};

// ─── ProductService ───────────────────────────────────────────────────────────

export class ProductService {
  private readonly productRepo: ProductRepository;
  private readonly categoryRepo = AppDataSource.getMongoRepository(Category);
  private readonly brandRepo    = AppDataSource.getMongoRepository(Brand);
  private readonly attrRepo     = AppDataSource.getMongoRepository(Attribute);

  constructor() {
    this.productRepo = new ProductRepository();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    // 1. Slug generation & uniqueness
    const slug = slugify(dto.slug || dto.name);
    if (await this.productRepo.findBySlug(slug)) {
      throw new BadRequestError(`A product with slug '${slug}' already exists`);
    }

    // 2. SKU generation & uniqueness
    const sku = dto.sku || generateSKU();
    if (await this.productRepo.findBySku(sku)) {
      throw new BadRequestError(`A product with SKU '${sku}' already exists`);
    }

    // 3. Category validation
    await this.validateCategory(dto.categoryId);

    // 4. Brand validation (optional)
    if (dto.brandId) {
      await this.validateBrand(dto.brandId);
    }

    // 5. Attribute validation
    const resolvedAttributes = await this.resolveAttributes(dto.selectedAttributes || []);

    // 6. Variant generation for variable products
    const variants = await this.buildVariants(
      dto.productType || ProductType.SIMPLE,
      dto.variants,
      resolvedAttributes,
      sku
    );

    // 7. Build full product document
    const product = this.productRepo.create({
      name: dto.name,
      slug,
      sku,
      barcode: dto.barcode,
      shortDescription: dto.shortDescription,
      description: dto.description,
      productType: dto.productType || ProductType.SIMPLE,
      categoryId: new ObjectId(dto.categoryId),
      subCategoryId: dto.subCategoryId ? new ObjectId(dto.subCategoryId) : undefined,
      childCategoryId: dto.childCategoryId ? new ObjectId(dto.childCategoryId) : undefined,
      brandId: dto.brandId ? new ObjectId(dto.brandId) : undefined,
      tags: dto.tags || [],
      collections: dto.collections || [],
      images: this.normalizeImages(dto.images || []),
      pricing: this.buildPricing(dto.pricing),
      inventory: this.buildInventory(dto.inventory),
      selectedAttributes: resolvedAttributes,
      variants,
      shipping: dto.shipping ? this.buildShipping(dto.shipping) : undefined,
      seo: dto.seo ? this.buildSEO(dto.seo) : undefined,
      crossSellIds: (dto.crossSellIds || []).map((sid: string) => new ObjectId(sid)),
      upsellIds: (dto.upsellIds || []).map((sid: string) => new ObjectId(sid)),
      frequentlyBoughtIds: (dto.frequentlyBoughtIds || []).map((sid: string) => new ObjectId(sid)),
      status: dto.status || ProductStatus.ACTIVE,
      publishState: dto.publishState || ProductPublishState.DRAFT,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      sortOrder: dto.sortOrder || 0,
      viewCount: 0,
      salesCount: 0,
      reviewCount: 0,
      isDeleted: false,
      createdBy: new ObjectId(userId)
    }) as any;

    return this.productRepo.save(product as Product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // LIST  (MongoDB aggregation pipeline)
  // ──────────────────────────────────────────────────────────────────────────────

  async list(query: ProductListQueryDto): Promise<{
    products: Product[];
    total: number;
  }> {
    const {
      search,
      categoryId,
      subCategoryId,
      brandId,
      status,
      publishState,
      productType,
      collection,
      priceFrom,
      priceTo,
      stockStatus,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "DESC",
      page = 0,
      limit = 10
    } = query;

    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = pageNum * limitNum;

    // ── $match stage ──────────────────────────────────────────────────────────
    const match: any = { isDeleted: false };

    // Full-text search: name, sku, barcode, description, slug
    if (search) {
      const regex = { $regex: search, $options: "i" };
      match.$or = [
        { name: regex },
        { sku: regex },
        { barcode: regex },
        { slug: regex },
        { shortDescription: regex },
        { description: regex },
        { tags: { $elemMatch: regex } }
      ];
    }

    if (categoryId)   match.categoryId   = categoryId;
    if (subCategoryId) match.subCategoryId = subCategoryId;
    if (brandId)      match.brandId      = brandId;
    if (status)       match.status       = status;
    if (publishState) match.publishState = publishState;
    if (productType)  match.productType  = productType;
    if (collection)   match.collections  = { $elemMatch: { $eq: collection } };

    // Price range (on sellingPrice inside the pricing embedded doc)
    if (priceFrom !== undefined || priceTo !== undefined) {
      match["pricing.sellingPrice"] = {};
      if (priceFrom !== undefined) match["pricing.sellingPrice"].$gte = Number(priceFrom);
      if (priceTo   !== undefined) match["pricing.sellingPrice"].$lte = Number(priceTo);
    }

    // Stock status
    if (stockStatus === "out_of_stock") {
      match["inventory.stockQty"] = { $lte: 0 };
    } else if (stockStatus === "in_stock") {
      match["inventory.stockQty"] = { $gt: 0 };
    } else if (stockStatus === "low_stock") {
      // low stock: qty > 0 but below lowStockAlert threshold
      match.$expr = {
        $and: [
          { $gt: ["$inventory.stockQty", 0] },
          { $gt: ["$inventory.lowStockAlert", 0] },
          { $lte: ["$inventory.stockQty", "$inventory.lowStockAlert"] }
        ]
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   match.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
    }

    // ── Sort stage ────────────────────────────────────────────────────────────
    const sortField = ALLOWED_SORT_FIELDS[sortBy] || "createdAt";
    const sortDir   = sortOrder.toUpperCase() === "ASC" ? 1 : -1;
    const sort: any = { [sortField]: sortDir };

    // ── Build pipeline ────────────────────────────────────────────────────────
    const pipeline: object[] = [
      { $match: match },
      // Lookup brand name
      {
        $lookup: {
          from: "brands",
          let: { brandId: "$brandId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toString: "$_id" }, "$$brandId"] },
                    { $eq: ["$isDeleted", false] }
                  ]
                }
              }
            },
            { $project: { name: 1, slug: 1, logo: 1 } }
          ],
          as: "brand"
        }
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      // Lookup category name
      {
        $lookup: {
          from: "categories",
          let: { catId: "$categoryId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toString: "$_id" }, "$$catId"] },
                    { $eq: ["$isDeleted", false] }
                  ]
                }
              }
            },
            { $project: { name: 1, slug: 1 } }
          ],
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      // Project lean output for list (omit heavy description, variants)
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          sku: 1,
          productType: 1,
          status: 1,
          publishState: 1,
          sortOrder: 1,
          viewCount: 1,
          salesCount: 1,
          reviewCount: 1,
          averageRating: 1,
          shortDescription: 1,
          tags: 1,
          categoryId: 1,
          brandId: 1,
          createdAt: 1,
          updatedAt: 1,
          "images": { $slice: ["$images", 1] }, // only primary image
          "pricing.mrp": 1,
          "pricing.sellingPrice": 1,
          "pricing.offerPrice": 1,
          "pricing.currency": 1,
          "inventory.stockQty": 1,
          "inventory.trackInventory": 1,
          "inventory.lowStockAlert": 1,
          brand: 1,
          category: 1
        }
      },
      { $sort: sort },
      // Facet: count + paginated slice
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }]
        }
      }
    ];

    const results = await this.productRepo.aggregate(pipeline);
    const facet   = results[0] || {};
    const total   = facet.metadata?.[0]?.total ?? 0;
    const products = facet.data ?? [];

    return { products, total };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // GET BY ID
  // ──────────────────────────────────────────────────────────────────────────────

  async getById(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.getById(id);

    // Slug change
    if (dto.name !== undefined || dto.slug !== undefined) {
      const newSlug = slugify(dto.slug || dto.name || product.name);
      if (newSlug !== product.slug) {
        if (await this.productRepo.findBySlug(newSlug, id)) {
          throw new BadRequestError(`A product with slug '${newSlug}' already exists`);
        }
        product.slug = newSlug;
      }
      if (dto.name !== undefined) product.name = dto.name;
    }

    // SKU change
    if (dto.sku !== undefined && dto.sku !== product.sku) {
      if (await this.productRepo.findBySku(dto.sku, id)) {
        throw new BadRequestError(`A product with SKU '${dto.sku}' already exists`);
      }
      product.sku = dto.sku;
    }

    // Category change
    if (dto.categoryId && dto.categoryId !== product.categoryId?.toString()) {
      await this.validateCategory(dto.categoryId);
      product.categoryId = new ObjectId(dto.categoryId) as any;
    }

    // Brand change
    if (dto.brandId !== undefined && dto.brandId !== product.brandId?.toString()) {
      if (dto.brandId) await this.validateBrand(dto.brandId);
      product.brandId = dto.brandId ? new ObjectId(dto.brandId) as any : undefined;
    }

    // Scalar fields
    if (dto.shortDescription !== undefined) product.shortDescription = dto.shortDescription;
    if (dto.description      !== undefined) product.description      = dto.description;
    if (dto.barcode          !== undefined) product.barcode          = dto.barcode;
    if (dto.productType      !== undefined) product.productType      = dto.productType;
    if (dto.subCategoryId    !== undefined) product.subCategoryId    = dto.subCategoryId ? new ObjectId(dto.subCategoryId) as any : undefined;
    if (dto.childCategoryId  !== undefined) product.childCategoryId  = dto.childCategoryId ? new ObjectId(dto.childCategoryId) as any : undefined;
    if (dto.tags             !== undefined) product.tags             = dto.tags;
    if (dto.collections      !== undefined) product.collections      = dto.collections;
    if (dto.sortOrder        !== undefined) product.sortOrder        = dto.sortOrder;
    if (dto.status           !== undefined) product.status           = dto.status;
    if (dto.publishState     !== undefined) product.publishState     = dto.publishState;
    if (dto.scheduledAt      !== undefined) {
      product.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    }
    if (dto.crossSellIds        !== undefined) product.crossSellIds        = dto.crossSellIds.map((sid) => new ObjectId(sid)) as any[];
    if (dto.upsellIds           !== undefined) product.upsellIds           = dto.upsellIds.map((sid) => new ObjectId(sid)) as any[];
    if (dto.frequentlyBoughtIds !== undefined) product.frequentlyBoughtIds = dto.frequentlyBoughtIds.map((sid) => new ObjectId(sid)) as any[];

    // Images
    if (dto.images !== undefined) {
      product.images = this.normalizeImages(dto.images);
    }

    // Pricing (merge partial)
    if (dto.pricing !== undefined) {
      product.pricing = { ...product.pricing, ...dto.pricing };
    }

    // Inventory (merge partial)
    if (dto.inventory !== undefined) {
      product.inventory = { ...product.inventory, ...dto.inventory };
    }

    // Shipping (merge partial)
    if (dto.shipping !== undefined) {
      product.shipping = { ...(product.shipping || {}), ...dto.shipping } as any;
    }

    // SEO (merge partial)
    if (dto.seo !== undefined) {
      product.seo = { ...(product.seo || {}), ...dto.seo } as any;
    }

    // Attributes + variants update
    if (dto.selectedAttributes !== undefined) {
      product.selectedAttributes = await this.resolveAttributes(dto.selectedAttributes);
    }

    if (dto.variants !== undefined) {
      product.variants = await this.buildVariants(
        product.productType,
        dto.variants,
        product.selectedAttributes || [],
        product.sku
      );
    }

    product.updatedBy = new ObjectId(userId) as any;
    return this.productRepo.save(product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // SOFT DELETE
  // ──────────────────────────────────────────────────────────────────────────────

  async softDelete(id: string, userId: string): Promise<void> {
    const product = await this.getById(id);
    product.isDeleted  = true;
    product.deletedAt  = new Date();
    product.deletedBy  = new ObjectId(userId) as any;
    product.updatedBy  = new ObjectId(userId) as any;
    await this.productRepo.save(product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // RESTORE
  // ──────────────────────────────────────────────────────────────────────────────

  async restore(id: string, userId: string): Promise<Product> {
    const product = await this.productRepo.findByIdIncludeDeleted(id);
    if (!product) throw new NotFoundError("Product not found");
    if (!product.isDeleted) throw new BadRequestError("Product is not deleted");

    product.isDeleted  = false;
    product.deletedAt  = undefined;
    product.deletedBy  = undefined;
    product.updatedBy  = new ObjectId(userId) as any;
    return this.productRepo.save(product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CHANGE STATUS
  // ──────────────────────────────────────────────────────────────────────────────

  async changeStatus(id: string, dto: ChangeProductStatusDto, userId: string): Promise<Product> {
    const product = await this.getById(id);
    if (dto.status       !== undefined) product.status       = dto.status;
    if (dto.publishState !== undefined) product.publishState = dto.publishState;
    product.updatedBy = new ObjectId(userId) as any;
    return this.productRepo.save(product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // DUPLICATE
  // ──────────────────────────────────────────────────────────────────────────────

  async duplicate(id: string, userId: string): Promise<Product> {
    const source = await this.getById(id);

    const timestamp = Date.now().toString(36).toUpperCase();
    const newSku    = `${source.sku}-${timestamp}`;
    const newSlug   = `${source.slug}-copy-${timestamp.toLowerCase()}`;

    // Ensure new slug/SKU are unique (edge case for rapid duplications)
    if (await this.productRepo.findBySlug(newSlug)) {
      throw new BadRequestError("Could not generate a unique slug for duplicate product. Try again.");
    }
    if (await this.productRepo.findBySku(newSku)) {
      throw new BadRequestError("Could not generate a unique SKU for duplicate product. Try again.");
    }

    // Clone variants with new SKUs
    const clonedVariants = (source.variants || []).map((v) => ({
      ...v,
      id: generateId(),
      sku: `${v.sku}-${timestamp}`,
      stockQty: 0
    }));

    const cloned = this.productRepo.create({
      ...source,
      _id: undefined as any,
      name: `${source.name} (Copy)`,
      slug: newSlug,
      sku: newSku,
      publishState: ProductPublishState.DRAFT,
      status: ProductStatus.INACTIVE,
      variants: clonedVariants,
      viewCount: 0,
      salesCount: 0,
      reviewCount: 0,
      averageRating: undefined,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      createdBy: new ObjectId(userId),
      updatedBy: undefined
    }) as any;

    return this.productRepo.save(cloned as Product);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // BULK DELETE
  // ──────────────────────────────────────────────────────────────────────────────

  async bulkDelete(ids: string[], userId: string): Promise<{ deleted: number }> {
    const modified = await this.productRepo.bulkUpdate(ids, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new ObjectId(userId),
      updatedBy: new ObjectId(userId)
    });
    return { deleted: modified };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // BULK STATUS
  // ──────────────────────────────────────────────────────────────────────────────

  async bulkStatus(
    ids: string[],
    publishState: ProductPublishState | undefined,
    status: ProductStatus | undefined,
    userId: string
  ): Promise<{ updated: number }> {
    const updatePayload: Record<string, any> = { updatedBy: new ObjectId(userId) };
    if (publishState) updatePayload.publishState = publishState;
    if (status)       updatePayload.status       = status;

    if (Object.keys(updatePayload).length === 1) {
      throw new BadRequestError("Provide at least one of: publishState, status");
    }

    const modified = await this.productRepo.bulkUpdate(ids, updatePayload);
    return { updated: modified };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // BULK PRICE UPDATE
  // ──────────────────────────────────────────────────────────────────────────────

  async bulkPriceUpdate(
    dto: BulkPriceUpdateDto,
    userId: string
  ): Promise<{ updated: number; failed: string[] }> {
    const { ids, flatAdjustment, percentAdjustment, field = "sellingPrice" } = dto;
    if (flatAdjustment === undefined && percentAdjustment === undefined) {
      throw new BadRequestError("Provide flatAdjustment or percentAdjustment");
    }

    const products = await this.productRepo.findByIds(ids);
    let updated = 0;
    const failed: string[] = [];

    for (const product of products) {
      try {
        const currentPrice: number =
          field === "mrp"
            ? product.pricing.mrp
            : field === "offerPrice"
              ? product.pricing.offerPrice || product.pricing.sellingPrice
              : product.pricing.sellingPrice;

        let newPrice: number;
        if (percentAdjustment !== undefined) {
          newPrice = Math.max(0, +(currentPrice * (1 + percentAdjustment / 100)).toFixed(2));
        } else {
          newPrice = Math.max(0, +(currentPrice + (flatAdjustment || 0)).toFixed(2));
        }

        if (field === "mrp")             product.pricing.mrp          = newPrice;
        else if (field === "offerPrice") product.pricing.offerPrice   = newPrice;
        else                             product.pricing.sellingPrice  = newPrice;

        product.updatedBy = new ObjectId(userId) as any;
        await this.productRepo.save(product);
        updated++;
      } catch {
        failed.push(product._id.toString());
      }
    }

    return { updated, failed };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // BULK STOCK UPDATE
  // ──────────────────────────────────────────────────────────────────────────────

  async bulkStockUpdate(
    dto: BulkStockUpdateDto,
    userId: string
  ): Promise<{ updated: number; failed: string[] }> {
    const { ids, stockDelta } = dto;
    const products = await this.productRepo.findByIds(ids);
    let updated = 0;
    const failed: string[] = [];

    for (const product of products) {
      try {
        const newQty = Math.max(0, product.inventory.stockQty + stockDelta);
        product.inventory.stockQty = newQty;
        product.updatedBy = new ObjectId(userId) as any;
        await this.productRepo.save(product);
        updated++;
      } catch {
        failed.push(product._id.toString());
      }
    }

    return { updated, failed };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // EXPORT
  // ──────────────────────────────────────────────────────────────────────────────

  async exportProducts(query: ProductListQueryDto): Promise<Product[]> {
    // Run list without pagination limits for export
    const exportQuery = { ...query, page: 0, limit: 10000 };
    const { products } = await this.list(exportQuery as ProductListQueryDto);
    return products;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // IMPORT
  // ──────────────────────────────────────────────────────────────────────────────

  async importProducts(
    items: CreateProductDto[],
    userId: string
  ): Promise<{ created: number; failed: Array<{ index: number; error: string }> }> {
    let created = 0;
    const failed: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      try {
        await this.create(items[i], userId);
        created++;
      } catch (err: any) {
        failed.push({ index: i, error: err.message || "Unknown error" });
      }
    }

    return { created, failed };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────────

  private async validateCategory(categoryId: string): Promise<void> {
    if (!ObjectId.isValid(categoryId)) {
      throw new BadRequestError(`Invalid category ID: ${categoryId}`);
    }
    const cat = await this.categoryRepo.findOne({
      where: { _id: new ObjectId(categoryId), isDeleted: false } as any
    });
    if (!cat) throw new BadRequestError(`Category '${categoryId}' not found`);
  }

  private async validateBrand(brandId: string): Promise<void> {
    if (!ObjectId.isValid(brandId)) {
      throw new BadRequestError(`Invalid brand ID: ${brandId}`);
    }
    const brand = await this.brandRepo.findOne({
      where: { _id: new ObjectId(brandId), isDeleted: false } as any
    });
    if (!brand) throw new BadRequestError(`Brand '${brandId}' not found`);
  }

  /**
   * Validate attribute IDs exist and resolve attribute names for the
   * selectedAttributes array.
   */
  private async resolveAttributes(
    selected: Array<{ attributeId: string; attributeName: string; values: string[] }>
  ): Promise<ProductAttributeValue[]> {
    if (!selected || selected.length === 0) return [];

    const resolved: ProductAttributeValue[] = [];

    for (const sel of selected) {
      if (!ObjectId.isValid(sel.attributeId)) {
        throw new BadRequestError(`Invalid attribute ID: ${sel.attributeId}`);
      }
      const attr = await this.attrRepo.findOne({
        where: { _id: new ObjectId(sel.attributeId), isDeleted: false } as any
      });
      if (!attr) {
        throw new BadRequestError(`Attribute '${sel.attributeId}' not found or inactive`);
      }

      // Validate selected values exist in the attribute's value list
      const validValues = new Set(attr.values.map((v) => v.value).concat(attr.values.map((v) => v.label)));
      for (const val of sel.values) {
        if (!validValues.has(val)) {
          throw new BadRequestError(
            `Value '${val}' is not valid for attribute '${attr.name}'. Valid values: ${attr.values.map((v) => v.label).join(", ")}`
          );
        }
      }

      resolved.push({
        attributeId: new ObjectId(sel.attributeId) as any,
        attributeName: attr.name,
        values: sel.values
      });
    }

    return resolved;
  }

  /**
   * Build and validate variants.
   * For variable products without explicit variants array, auto-generate
   * combinations from selectedAttributes that have usedForVariants=true.
   */
  private async buildVariants(
    productType: ProductType,
    variantDtos: any[] | undefined,
    selectedAttributes: ProductAttributeValue[],
    baseSku: string
  ): Promise<ProductVariant[]> {
    if (productType !== ProductType.VARIABLE) return [];

    // If explicit variants supplied, validate and use them
    if (variantDtos && variantDtos.length > 0) {
      return this.validateExplicitVariants(variantDtos, baseSku);
    }

    // Auto-generate combinations from variant-eligible attributes
    const axes = selectedAttributes
      .filter((a) => a.values.length > 0)
      .map((a) => ({ name: a.attributeName, values: a.values }));

    if (axes.length === 0) return [];

    const combinations = generateVariantCombinations(axes);

    if (combinations.length > 200) {
      throw new BadRequestError(
        `Too many variant combinations (${combinations.length}). Maximum allowed is 200. Reduce attribute values.`
      );
    }

    return combinations.map((combination) => ({
      id: generateId(),
      combination,
      sku: generateVariantSKU(baseSku, combination),
      mrp: 0,
      sellingPrice: 0,
      stockQty: 0,
      status: "active" as const
    }));
  }

  /**
   * Validate explicitly provided variants (check duplicate SKUs).
   */
  private validateExplicitVariants(
    variantDtos: any[],
    baseSku: string
  ): ProductVariant[] {
    const skuSet = new Set<string>();

    return variantDtos.map((v, index) => {
      const sku = v.sku || generateVariantSKU(baseSku, v.combination || {});

      if (skuSet.has(sku)) {
        throw new BadRequestError(`Duplicate variant SKU '${sku}' at index ${index}`);
      }
      skuSet.add(sku);

      return {
        id: v.id || generateId(),
        combination: v.combination || {},
        sku,
        barcode: v.barcode,
        mrp: Number(v.mrp) || 0,
        sellingPrice: Number(v.sellingPrice) || 0,
        costPrice: v.costPrice !== undefined ? Number(v.costPrice) : undefined,
        stockQty: Number(v.stockQty) || 0,
        status: v.status || "active",
        imageUrl: v.imageUrl,
        weight: v.weight !== undefined ? Number(v.weight) : undefined
      };
    });
  }

  private normalizeImages(images: any[]): ProductImage[] {
    if (!images || images.length === 0) return [];

    let hasPrimary = images.some((img) => img.isPrimary);
    return images.map((img, idx) => ({
      id: img.id || generateId(),
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      altText: img.altText || "",
      isPrimary: img.isPrimary || (!hasPrimary && idx === 0),
      sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx
    }));
  }

  private buildPricing(dto: any): any {
    return {
      mrp: Number(dto.mrp) || 0,
      sellingPrice: Number(dto.sellingPrice) || 0,
      costPrice: dto.costPrice !== undefined ? Number(dto.costPrice) : undefined,
      offerPrice: dto.offerPrice !== undefined ? Number(dto.offerPrice) : undefined,
      taxRate: dto.taxRate !== undefined ? Number(dto.taxRate) : undefined,
      hsnCode: dto.hsnCode || undefined,
      currency: dto.currency || "INR"
    };
  }

  private buildInventory(dto?: any): any {
    return {
      trackInventory: dto?.trackInventory !== false,
      stockQty: dto?.stockQty !== undefined ? Number(dto.stockQty) : 0,
      lowStockAlert: dto?.lowStockAlert !== undefined ? Number(dto.lowStockAlert) : undefined,
      allowBackOrders: dto?.allowBackOrders || false,
      minOrderQty: dto?.minOrderQty !== undefined ? Number(dto.minOrderQty) : undefined,
      maxOrderQty: dto?.maxOrderQty !== undefined ? Number(dto.maxOrderQty) : undefined,
      shelfLife: dto?.shelfLife || undefined,
      expiryDate: dto?.expiryDate || undefined
    };
  }

  private buildShipping(dto: any): any {
    return {
      weight: dto.weight !== undefined ? Number(dto.weight) : undefined,
      length: dto.length !== undefined ? Number(dto.length) : undefined,
      width: dto.width !== undefined ? Number(dto.width) : undefined,
      height: dto.height !== undefined ? Number(dto.height) : undefined,
      shippingClass: dto.shippingClass || undefined,
      deliveryDays: dto.deliveryDays !== undefined ? Number(dto.deliveryDays) : undefined,
      isFragile: dto.isFragile || false,
      isTemperatureControlled: dto.isTemperatureControlled || false
    };
  }

  private buildSEO(dto: any): any {
    return {
      metaTitle: dto.metaTitle || undefined,
      metaDescription: dto.metaDescription || undefined,
      metaKeywords: dto.metaKeywords || [],
      canonicalUrl: dto.canonicalUrl || undefined
    };
  }
}
