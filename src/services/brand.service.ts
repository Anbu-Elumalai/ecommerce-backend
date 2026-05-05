import { AppDataSource } from "../data-source";
import { Brand } from "../entity/Brand";
import { CreateBrandDto, UpdateBrandDto } from "../dto/admin/Brand.dto";
import { slugify } from "../utils/helpers";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { ObjectId } from "mongodb";

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

    return await this.brandRepo.save(brand);
  }

  async delete(id: string): Promise<void> {
    const brand = await this.getById(id);

    // Future: Check if used in products

    brand.isDeleted = true;
    await this.brandRepo.save(brand);
  }
}
