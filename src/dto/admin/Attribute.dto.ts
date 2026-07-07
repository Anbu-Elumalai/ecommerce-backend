import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Matches,
  ValidateIf
} from "class-validator";
import { Type } from "class-transformer";
import { AttributeDisplayType, AttributeStatus, AttributeGroup, AttributeType } from "../../entity/Attribute";

export class AttributeValueDto {
  @IsString()
  @IsNotEmpty()
    label!: string;

  @IsString()
  @IsOptional()
    value?: string;

  @IsOptional()
  @ValidateIf((o) => typeof o.color === "string" && o.color.trim() !== "")
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Invalid HEX color code"
  })
    color?: string;

  @IsString()
  @IsOptional()
    image?: string;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean = true;

  @IsOptional()
    sortOrder?: number = 0;
}

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
    name!: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsEnum(AttributeGroup)
  @IsOptional()
    group?: AttributeGroup = AttributeGroup.GENERAL;

  @IsEnum(AttributeType)
  @IsOptional()
    type?: AttributeType = AttributeType.SELECT;

  @IsEnum(AttributeDisplayType)
  @IsNotEmpty()
    displayType!: AttributeDisplayType;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
    values?: AttributeValueDto[];

  @IsEnum(AttributeStatus)
  @IsOptional()
    status?: AttributeStatus = AttributeStatus.ACTIVE;

  @IsBoolean()
  @IsOptional()
    usedForVariants?: boolean = false;

  @IsBoolean()
  @IsOptional()
    isRequired?: boolean = false;

  @IsBoolean()
  @IsOptional()
    isVisible?: boolean = true;

  @IsBoolean()
  @IsOptional()
    isFilterable?: boolean = true;

  @IsBoolean()
  @IsOptional()
    showOnProductPage?: boolean = true;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean = true;

  @IsOptional()
    sortOrder?: number = 0;
}

export class UpdateAttributeDto {
  @IsString()
  @IsOptional()
    name?: string;

  @IsString()
  @IsOptional()
    slug?: string;

  @IsString()
  @IsOptional()
    description?: string;

  @IsEnum(AttributeGroup)
  @IsOptional()
    group?: AttributeGroup;

  @IsEnum(AttributeType)
  @IsOptional()
    type?: AttributeType;

  @IsEnum(AttributeDisplayType)
  @IsOptional()
    displayType?: AttributeDisplayType;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
    values?: AttributeValueDto[];

  @IsEnum(AttributeStatus)
  @IsOptional()
    status?: AttributeStatus;

  @IsBoolean()
  @IsOptional()
    usedForVariants?: boolean;

  @IsBoolean()
  @IsOptional()
    isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
    isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
    isFilterable?: boolean;

  @IsBoolean()
  @IsOptional()
    showOnProductPage?: boolean;

  @IsBoolean()
  @IsOptional()
    isActive?: boolean;

  @IsOptional()
    sortOrder?: number;
}
