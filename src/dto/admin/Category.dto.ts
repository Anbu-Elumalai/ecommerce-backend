import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsNumber,
  IsArray
} from "class-validator";
import { CategoryStatus } from "../../entity/Category";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
    name!: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsMongoId()
  @IsOptional()
    parentId?: string | null;

  @IsString()
  @IsOptional()
    image?: string;

  @IsString()
  @IsOptional()
    banner?: string;

  @IsEnum(CategoryStatus)
  @IsOptional()
    status?: CategoryStatus = CategoryStatus.ACTIVE;

  @IsBoolean()
  @IsOptional()
    showInMenu?: boolean = true;

  @IsBoolean()
  @IsOptional()
    isFeatured?: boolean = false;

  @IsNumber()
  @IsOptional()
    sortOrder?: number = 0;

  @IsString()
  @IsOptional()
    metaTitle?: string;

  @IsString()
  @IsOptional()
    metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
    metaKeywords?: string[];
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
    name?: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsMongoId()
  @IsOptional()
    parentId?: string | null;

  @IsString()
  @IsOptional()
    image?: string;

  @IsString()
  @IsOptional()
    banner?: string;

  @IsEnum(CategoryStatus)
  @IsOptional()
    status?: CategoryStatus;

  @IsBoolean()
  @IsOptional()
    showInMenu?: boolean;

  @IsBoolean()
  @IsOptional()
    isFeatured?: boolean;

  @IsNumber()
  @IsOptional()
    sortOrder?: number;

  @IsString()
  @IsOptional()
    metaTitle?: string;

  @IsString()
  @IsOptional()
    metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
    metaKeywords?: string[];
}
