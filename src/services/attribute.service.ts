import { AppDataSource } from "../data-source";
import { Attribute, AttributeDisplayType } from "../entity/Attribute";
import { CreateAttributeDto, UpdateAttributeDto } from "../dto/admin/Attribute.dto";
import { slugify, validateHexColor } from "../utils/helpers";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { ObjectId } from "mongodb";

export class AttributeService {
  private attributeRepo = AppDataSource.getMongoRepository(Attribute);

  /**
   * Create a new attribute with validation and normalization.
   */
  async create(data: CreateAttributeDto): Promise<Attribute> {
    const { name, slug, displayType, values, usedForVariants } = data;

    // 1. Generate Slug
    const finalSlug = slug || slugify(name);

    // 2. Check Uniqueness (Across all non-deleted attributes)
    const existing = await this.attributeRepo.findOne({
      where: {
        slug: finalSlug,
        isDeleted: false
      } as any
    });
    if (existing) {
      throw new BadRequestError(`Attribute with slug '${finalSlug}' already exists`);
    }

    // 3. Variant Integrity Validation
    let normalizedValues = values || [];
    if (usedForVariants && normalizedValues.length === 0) {
      throw new BadRequestError("At least one value is required when 'usedForVariants' is true");
    }

    // 4. Normalize and Validate Values
    normalizedValues = this.normalizeValues(normalizedValues, displayType);

    const attribute = this.attributeRepo.create({
      ...data,
      slug: finalSlug,
      values: normalizedValues,
      isDeleted: false
    });

    return await this.attributeRepo.save(attribute);
  }

  /**
   * List attributes with pagination, search, and type-based filtering.
   */
  async list(query: any) {
    const {
      search,
      status,
      displayType,
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

    if (status) filter.status = status;
    if (displayType) filter.displayType = displayType;

    const [attributes, total] = await this.attributeRepo.findAndCount({
      where: filter,
      take: Number(limit),
      skip: Number(page) * Number(limit),
      order: { [sortBy]: sortOrder as any }
    });

    return { attributes, total };
  }

  /**
   * Fetch a single attribute by ID.
   */
  async getById(id: string): Promise<Attribute> {
    if (!ObjectId.isValid(id)) throw new BadRequestError("Invalid Attribute ID");

    const attribute = await this.attributeRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false } as any
    });

    if (!attribute) {
      throw new NotFoundError("Attribute not found");
    }

    return attribute;
  }

  /**
   * Update an existing attribute with partial updates and re-validation.
   */
  async update(id: string, data: UpdateAttributeDto): Promise<Attribute> {
    const attribute = await this.getById(id);
    const attributeId = new ObjectId(id);

    // 1. Identity Updates (Name & Slug)
    if (data.name !== undefined) {
      attribute.name = data.name;
      // Auto-generate slug if not explicitly provided in the update
      if (data.slug === undefined) {
        attribute.slug = slugify(data.name);
      }
    }

    if (data.slug !== undefined) {
      attribute.slug = slugify(data.slug);
    }

    // 2. Slug Uniqueness Check (if changed)
    if (data.name !== undefined || data.slug !== undefined) {
      const existing = await this.attributeRepo.findOne({
        where: {
          _id: { $ne: attributeId },
          slug: attribute.slug,
          isDeleted: false
        } as any
      });
      if (existing) {
        throw new BadRequestError(`Attribute with slug '${attribute.slug}' already exists`);
      }
    }

    // 3. Display Type & Variant Integrity
    const displayType = data.displayType || attribute.displayType;
    const usedForVariants = data.usedForVariants !== undefined ? data.usedForVariants : attribute.usedForVariants;

    // 4. Value Updates & Normalization
    if (data.values !== undefined) {
      if (usedForVariants && data.values.length === 0) {
        throw new BadRequestError("At least one value is required when 'usedForVariants' is true");
      }
      attribute.values = this.normalizeValues(data.values, displayType);
    } else if (usedForVariants && (!attribute.values || attribute.values.length === 0)) {
      throw new BadRequestError("Cannot enable 'usedForVariants' without providing at least one value");
    }

    // 5. Explicit Assignment for other fields (to handle partial updates safely)
    if (data.displayType !== undefined) attribute.displayType = data.displayType;
    if (data.status !== undefined) attribute.status = data.status;
    if (data.usedForVariants !== undefined) attribute.usedForVariants = data.usedForVariants;
    if (data.isRequired !== undefined) attribute.isRequired = data.isRequired;
    if (data.isVisible !== undefined) attribute.isVisible = data.isVisible;
    if (data.sortOrder !== undefined) attribute.sortOrder = data.sortOrder;

    return await this.attributeRepo.save(attribute);
  }

  /**
   * Soft delete an attribute.
   */
  async delete(id: string): Promise<void> {
    const attribute = await this.getById(id);

    // Future: Add check to prevent deletion if attribute is actively used in published products

    attribute.isDeleted = true;
    await this.attributeRepo.save(attribute);
  }

  /**
   * Normalizes and validates attribute values.
   * - Trims labels
   * - Auto-generates value slugs
   * - Validates HEX colors if displayType is 'color'
   * - Prevents duplicate labels (case-insensitive)
   */
  private normalizeValues(values: any[], displayType: AttributeDisplayType) {
    const seenLabels = new Set();

    return values.map((v, index) => {
      const label = v.label.trim();

      if (!label) throw new BadRequestError(`Value at index ${index} must have a label`);

      if (seenLabels.has(label.toLowerCase())) {
        throw new BadRequestError(`Duplicate value label found: '${label}'`);
      }
      seenLabels.add(label.toLowerCase());

      const value = v.value || slugify(label);

      // Color Validation
      if (displayType === AttributeDisplayType.COLOR) {
        if (!v.color || !validateHexColor(v.color)) {
          throw new BadRequestError(`Attribute value '${label}' must include a valid HEX color code.`);
        }
      }

      return {
        label,
        value,
        color: v.color || null,
        image: v.image || null,
        isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
        sortOrder: v.sortOrder !== undefined ? Number(v.sortOrder) : 0
      };
    });
  }
}
