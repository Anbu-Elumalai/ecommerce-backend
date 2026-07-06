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
  UseBefore
} from "routing-controllers";
import { CreateBrandDto, UpdateBrandDto } from "../../../dto/admin/Brand.dto";
import { BrandService } from "../../../services/brand.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../../utils/pagination";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { canAccess } from "../../../middlewares/PermissionMiddleware";

@JsonController("/brands")
@UseBefore(AuthMiddleware)
export class BrandController {
  private brandService = new BrandService();

  @Post("/")
  @UseBefore(canAccess("brands", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateBrandDto) {
    const brand = await this.brandService.create(data);
    return {
      success: true,
      message: "Brand created successfully",
      data: brand
    };
  }

  @Get("/")
  @UseBefore(canAccess("brands", "view"))
  async getAll(@QueryParams() query: any) {
    const { brands, total } = await this.brandService.list(query);
    return pagination(total, brands, query.limit || 10, query.page || 0);
  }

  @Get("/:id")
  @UseBefore(canAccess("brands", "view"))
  async getOne(@Param("id") id: string) {
    const brand = await this.brandService.getById(id);
    return {
      success: true,
      message: "Brand fetched successfully",
      data: brand
    };
  }

  @Put("/:id")
  @UseBefore(canAccess("brands", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateBrandDto) {
    const brand = await this.brandService.update(id, data);
    return {
      success: true,
      message: "Brand updated successfully",
      data: brand
    };
  }

  @Delete("/:id")
  @UseBefore(canAccess("brands", "delete"))
  async delete(@Param("id") id: string) {
    await this.brandService.delete(id);
    return {
      success: true,
      message: "Brand deleted successfully",
      data: null
    };
  }
}
