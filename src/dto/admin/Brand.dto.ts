import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
  IsArray
} from "class-validator";

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
    name!: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsOptional()
    logo?: any;

  @IsOptional()
    banner?: any;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
    isFeatured?: boolean = false;

  @IsBoolean()
  @IsOptional()
    showInFilter?: boolean = true;

  @IsOptional()
    website?: string;

  @IsString()
  @IsOptional()
    countryOfOrigin?: string;
}

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
    name?: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsOptional()
    logo?: any;

  @IsOptional()
    banner?: any;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean;

  @IsBoolean()
  @IsOptional()
    isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
    showInFilter?: boolean;

  // @IsUrl({}, { message: "Website must be a valid URL" })
  @IsOptional()
    website?: string;

  @IsString()
  @IsOptional()
    countryOfOrigin?: string;
}

export class BulkDeleteBrandDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
    ids!: string[];
}

export class UpdateBrandStatusDto {
  @IsBoolean()
  @IsNotEmpty()
    isActive!: boolean;
}
