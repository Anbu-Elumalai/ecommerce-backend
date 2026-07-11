import { AppDataSource } from "../data-source";
import { Category } from "../entity/Category";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/admin/Category.dto";
import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "routing-controllers";
import imageService from "../utils/upload";
import path from "path";

export class CategoryService {
  private categoryRepo = AppDataSource.getMongoRepository(Category);

  /**
   * Slugify a string
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-"); // Replace multiple - with single -
  }

  /**
   * Build hierarchy level and path
   */
  private async buildHierarchy(parentId: ObjectId | null) {
    if (!parentId) {
      return { level: 0, path: "" };
    }

    const parent = await this.categoryRepo.findOneBy({ _id: parentId });
    if (!parent) {
      throw new BadRequestError("Parent category not found");
    }

    const level = parent.level + 1;
    const path = parent.path ? `${parent.path}/${parent.slug}` : parent.slug;

    return { level, path };
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto) {
    // Generate slug
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(data.name);

    // Check for duplicate slug
    const existing = await this.categoryRepo.findOneBy({ slug, isDeleted: false });
    if (existing) {
      throw new BadRequestError(`Category with slug '${slug}' already exists`);
    }

    const parentId = data.parentId ? new ObjectId(data.parentId) : null;
    const { level, path } = await this.buildHierarchy(parentId);

    const category = new Category();
    Object.assign(category, data);
    category.slug = slug;
    category.parentId = parentId;
    category.level = level;
    category.path = path;
    category.isDeleted = false;

    // Process image uploads
    category.image = await this.processImageField(data.image, "categories");
    category.banner = await this.processImageField(data.banner, "categories");

    return await this.categoryRepo.save(category);
  }

  /**
   * List categories with filters
   */
  async list(query: any) {
    const { search, status, parentId, level, page = 0, limit = 10, sortBy = "sortOrder", sortOrder = "ASC" } = query;

    const skip = Number(page) * Number(limit);
    const take = Number(limit);

    const filter: any = { isDeleted: false };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    if (parentId !== undefined) {
      filter.parentId = parentId === "null" ? null : new ObjectId(parentId);
    }

    if (level !== undefined && level !== null && level !== "") {
      filter.level = Number(level);
    }

    const [categories, total] = await this.categoryRepo.findAndCount({
      where: filter,
      skip,
      take,
      order: { [sortBy]: sortOrder as any }
    });

    return { categories, total };
  }

  /**
   * Get category by ID with parent details
   */
  async getById(id: string) {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Category ID");

    const category = await this.categoryRepo.findOneBy({
      _id: new ObjectId(id),
      isDeleted: false
    });

    if (!category) throw new NotFoundError("Category not found");

    // Populate parent details if exists
    const result: any = { ...category };
    if (category.parentId) {
      const parent = await this.categoryRepo.findOneBy({ _id: category.parentId });
      if (parent) {
        result.parent = {
          _id: parent._id,
          name: parent.name,
          slug: parent.slug
        };
      }
    }

    return result;
  }

  /**
   * Update category
   */
  async update(id: string, data: UpdateCategoryDto) {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Category ID");
    const categoryId = new ObjectId(id);

    const category = await this.categoryRepo.findOneBy({ _id: categoryId, isDeleted: false });
    if (!category) throw new NotFoundError("Category not found");

    // Check for circular dependency if parentId is changing
    if (data.parentId) {
      const newParentId = new ObjectId(data.parentId);
      if (newParentId.equals(categoryId)) {
        throw new BadRequestError("A category cannot be its own parent");
      }

      // Deep check for circular dependency
      let currentParent = await this.categoryRepo.findOneBy({ _id: newParentId });
      while (currentParent && currentParent.parentId) {
        if (currentParent.parentId.equals(categoryId)) {
          throw new BadRequestError("Circular dependency detected in category hierarchy");
        }
        currentParent = await this.categoryRepo.findOneBy({ _id: currentParent.parentId });
      }

      category.parentId = newParentId;
      const { level, path } = await this.buildHierarchy(newParentId);
      category.level = level;
      category.path = path;
    } else if (data.parentId === null) {
      category.parentId = null;
      category.level = 0;
      category.path = "";
    }

    // Update slug if name changes or slug is explicitly provided
    if (data.name && !data.slug) {
      category.slug = this.slugify(data.name);
    } else if (data.slug) {
      category.slug = this.slugify(data.slug);
    }

    // If slug changed, check for duplicates
    if (data.name || data.slug) {
      const existing = await this.categoryRepo.findOne({
        where: {
          slug: category.slug,
          isDeleted: false,
          _id: { $ne: categoryId }
        } as any
      });
      if (existing) {
        throw new BadRequestError(`Category with slug '${category.slug}' already exists`);
      }
    }

    // Explicitly assign fields to avoid overwriting with undefined
    if (data.name !== undefined) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.image !== undefined) {
      category.image = await this.processImageField(data.image, "categories", category.image);
    }
    if (data.banner !== undefined) {
      category.banner = await this.processImageField(data.banner, "categories", category.banner);
    }
    if (data.status !== undefined) category.status = data.status;
    if (data.showInMenu !== undefined) category.showInMenu = data.showInMenu;
    if (data.isFeatured !== undefined) category.isFeatured = data.isFeatured;
    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
    if (data.metaTitle !== undefined) category.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) category.metaDescription = data.metaDescription;
    if (data.metaKeywords !== undefined) category.metaKeywords = data.metaKeywords;

    return await this.categoryRepo.save(category);
  }

  /**
   * Soft delete category
   */
  async delete(id: string) {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Category ID");
    const categoryId = new ObjectId(id);

    const category = await this.categoryRepo.findOneBy({ _id: categoryId, isDeleted: false });
    if (!category) throw new NotFoundError("Category not found");

    // Prevent deleting if it has children
    const childrenCount = await this.categoryRepo.count({
      where: { parentId: categoryId, isDeleted: false }
    });

    if (childrenCount > 0) {
      throw new BadRequestError("Cannot delete category with active sub-categories");
    }

    category.isDeleted = true;
    return await this.categoryRepo.save(category);
  }

  /**
   * Bulk delete categories
   */
  async bulkDelete(ids: string[]) {
    const objectIds = ids.map(id => new ObjectId(id));

    // We only delete categories that DON'T have active children
    const withChildren = await this.categoryRepo.find({
      where: {
        parentId: { $in: objectIds },
        isDeleted: false
      } as any
    });

    const idsWithChildren = new Set(withChildren.map(c => c.parentId?.toString()));
    const deletableIds = objectIds.filter(id => !idsWithChildren.has(id.toString()));

    if (deletableIds.length === 0) {
      throw new BadRequestError("No deletable categories found (some may have sub-categories)");
    }

    await this.categoryRepo.update(
      { _id: { $in: deletableIds } } as any,
      { isDeleted: true } as any
    );

    return {
      deletedCount: deletableIds.length,
      skippedCount: ids.length - deletableIds.length
    };
  }

  /**
   * Get categories as a tree structure
   */
  async getTree() {
    const categories = await this.categoryRepo.find({
      where: { isDeleted: false },
      order: { sortOrder: "ASC" }
    });

    const rootNodes: any[] = [];
    const childrenMap = new Map<string, any[]>();

    // Map categories and build relations
    const categoryMap = new Map<string, any>();
    for (const cat of categories) {
      const node = {
        _id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId ? cat.parentId.toString() : null,
        level: cat.level,
        path: cat.path,
        status: cat.status,
        productCount: cat.productCount || 0,
        children: []
      };
      categoryMap.set(node._id, node);

      const parentIdStr = node.parentId;
      if (parentIdStr) {
        if (!childrenMap.has(parentIdStr)) {
          childrenMap.set(parentIdStr, []);
        }
        childrenMap.get(parentIdStr)!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    // Recursively attach children
    for (const [id, node] of categoryMap.entries()) {
      if (childrenMap.has(id)) {
        node.children = childrenMap.get(id);
      }
    }

    return rootNodes;
  }

  /**
   * Update category status
   */
  async updateStatus(id: string, status: any) {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Category ID");
    const category = await this.categoryRepo.findOneBy({
      _id: new ObjectId(id),
      isDeleted: false
    });

    if (!category) throw new NotFoundError("Category not found");
    category.status = status;
    return await this.categoryRepo.save(category);
  }

  /**
   * Update category sort order
   */
  async updateSortOrder(id: string, sortOrder: number) {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Category ID");
    const category = await this.categoryRepo.findOneBy({
      _id: new ObjectId(id),
      isDeleted: false
    });

    if (!category) throw new NotFoundError("Category not found");
    category.sortOrder = sortOrder;
    return await this.categoryRepo.save(category);
  }

  /**
   * Private helper to process image fields (base64 string vs existing object)
   */
  private async processImageField(
    imageVal: any,
    folder: string = "categories",
    oldImageVal?: any
  ): Promise<any> {
    if (!imageVal) {
      if (oldImageVal && oldImageVal.path) {
        const oldFileName = path.basename(oldImageVal.path);
        await imageService.deleteImage(folder, oldFileName);
      }
      return null;
    }

    // If it is a base64 data URL string, save it as a new file
    if (typeof imageVal === "string" && imageVal.startsWith("data:")) {
      // Get extension from mimetype
      const match = imageVal.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      let fileExt = ".png"; // default fallback
      if (match && match[1]) {
        const mime = match[1];
        if (mime === "image/svg+xml") fileExt = ".svg";
        else if (mime === "image/jpeg" || mime === "image/jpg") fileExt = ".jpg";
        else if (mime === "image/png") fileExt = ".png";
        else if (mime === "image/webp") fileExt = ".webp";
      }

      const fileName = `media-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

      let oldFileName: string | undefined;
      if (oldImageVal && oldImageVal.path) {
        oldFileName = path.basename(oldImageVal.path);
      }

      const success = await imageService.imageUpload(imageVal, folder, fileName, oldFileName);
      if (success) {
        return {
          url: `/${folder}/${fileName}`,
          originalName: `category-image${fileExt}`,
          path: `${folder}/${fileName}`
        };
      }
      return null;
    }

    // If it's already a valid object, return it as-is
    if (typeof imageVal === "object" && imageVal.url && imageVal.path) {
      return imageVal;
    }

    return null;
  }
}
