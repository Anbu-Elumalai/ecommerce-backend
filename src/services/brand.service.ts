import { AppDataSource } from "../data-source";
import { Brand } from "../entity/Brand";
import { CreateBrandDto, UpdateBrandDto } from "../dto/admin/Brand.dto";
import { slugify } from "../utils/helpers";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { ObjectId } from "mongodb";
import imageService from "../utils/upload";
import path from "path";

export class BrandService {
  private brandRepo = AppDataSource.getMongoRepository(Brand);

  async create(data: CreateBrandDto): Promise<Brand> {
    const { name, slug } = data;

    // 1. Generate and Normalize Slug
    const finalSlug = (slug || slugify(name)).toLowerCase().trim();

    // 2. Check Uniqueness
    const existing = await this.brandRepo.findOne({
      where: {
        slug: finalSlug,
        isDeleted: false
      } as any
    });
    if (existing) {
      throw new BadRequestError(`Brand with slug '${finalSlug}' already exists`);
    }

    const brand = this.brandRepo.create({
      ...data,
      name: name.trim(),
      slug: finalSlug,
      isDeleted: false
    });

    // Process image uploads
    brand.logo = await this.processImageField(data.logo, "brands");
    brand.banner = await this.processImageField(data.banner, "brands");

    return await this.brandRepo.save(brand);
  }

  async list(query: any) {
    const {
      search,
      isActive,
      isFeatured,
      page = 0,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC"
    } = query;

    const filter: any = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } }
      ];
    }

    if (isActive !== undefined) filter.isActive = isActive === "true" || isActive === true;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true" || isFeatured === true;

    const [brands, total] = await this.brandRepo.findAndCount({
      where: filter,
      take: Number(limit),
      skip: Number(page) * Number(limit),
      order: { [sortBy]: sortOrder as any }
    });

    return { brands, total };
  }

  async getById(id: string): Promise<Brand> {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Brand ID");

    const brand = await this.brandRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false } as any
    });

    if (!brand) {
      throw new NotFoundError("Brand not found");
    }

    return brand;
  }

  async update(id: string, data: UpdateBrandDto): Promise<Brand> {
    const brand = await this.getById(id);
    const brandId = new ObjectId(id);

    if (data.name !== undefined) {
      brand.name = data.name.trim();
      if (data.slug === undefined) {
        brand.slug = slugify(data.name).toLowerCase();
      }
    }

    if (data.slug !== undefined) {
      brand.slug = slugify(data.slug).toLowerCase();
    }

    // Uniqueness check if slug changed
    if (data.name !== undefined || data.slug !== undefined) {
      const existing = await this.brandRepo.findOne({
        where: {
          _id: { $ne: brandId },
          slug: brand.slug,
          isDeleted: false
        } as any
      });
      if (existing) {
        throw new BadRequestError(`Brand with slug '${brand.slug}' already exists`);
      }
    }

    Object.assign(brand, data);

    // Process image uploads on update
    if (data.logo !== undefined) {
      brand.logo = await this.processImageField(data.logo, "brands", brand.logo);
    }
    if (data.banner !== undefined) {
      brand.banner = await this.processImageField(data.banner, "brands", brand.banner);
    }

    return await this.brandRepo.save(brand);
  }

  async delete(id: string): Promise<void> {
    const brand = await this.getById(id);

    // Future: Check if used in products

    brand.isDeleted = true;
    await this.brandRepo.save(brand);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Brand> {
    const brand = await this.getById(id);
    brand.isActive = isActive;
    return await this.brandRepo.save(brand);
  }

  async bulkDelete(ids: string[]): Promise<{ deletedCount: number }> {
    const objectIds = ids.map(id => new ObjectId(id));
    
    await this.brandRepo.update(
      { _id: { $in: objectIds } } as any,
      { isDeleted: true } as any
    );

    return {
      deletedCount: ids.length
    };
  }

  /**
   * Private helper to process image fields (base64 string vs existing object)
   */
  private async processImageField(
    imageVal: any,
    folder: string = "brands",
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
          originalName: `${folder}-image${fileExt}`,
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
