import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Matches
} from "class-validator";
import { Type } from "class-transformer";
import { AttributeDisplayType, AttributeStatus } from "../../entity/Attribute";

export class AttributeValueDto {
  @IsString()
  @IsNotEmpty()
    label!: string;

  @IsString()
  @IsOptional()
    value?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Invalid HEX color code"
  })
    color?: string;

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

  @IsOptional()
    sortOrder?: number;
}
