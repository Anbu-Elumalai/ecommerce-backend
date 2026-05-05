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
  Res,
  UseBefore
} from "routing-controllers";
import { CreateBrandDto, UpdateBrandDto } from "../../dto/admin/Brand.dto";
import { BrandService } from "../../services/brand.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../utils/pagination";
import handleErrorResponse from "../../utils/commonFunction";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";
import { canAccess } from "../../middlewares/PermissionMiddleware";

@JsonController("/brands")
@UseBefore(AuthMiddleware)
export class BrandController {
  private brandService = new BrandService();

  /**
   * @swagger
   * /api/brands:
   *   post:
   *     summary: Create a new brand
   *     tags: [Brand]
   *     security:
   *       - bearerAuth: []
   */
  @Post("/")
  @UseBefore(canAccess("brands", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateBrandDto, @Res() res: any) {
    try {
      const brand = await this.brandService.create(data);
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Brand created successfully",
        data: brand
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/brands:
   *   get:
   *     summary: List brands with filtering and pagination
   *     tags: [Brand]
   */
  @Get("/")
  @UseBefore(canAccess("brands", "view"))
  async getAll(@QueryParams() query: any, @Res() res: any) {
    try {
      const { brands, total } = await this.brandService.list(query);
      return pagination(total, brands, query.limit || 10, query.page || 0, res);
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/brands/{id}:
   *   get:
   *     summary: Get single brand by ID
   *     tags: [Brand]
   */
  @Get("/:id")
  @UseBefore(canAccess("brands", "view"))
  async getOne(@Param("id") id: string, @Res() res: any) {
    try {
      const brand = await this.brandService.getById(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Brand fetched successfully",
        data: brand
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/brands/{id}:
   *   put:
   *     summary: Update an existing brand
   *     tags: [Brand]
   */
  @Put("/:id")
  @UseBefore(canAccess("brands", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateBrandDto, @Res() res: any) {
    try {
      const brand = await this.brandService.update(id, data);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Brand updated successfully",
        data: brand
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/brands/{id}:
   *   delete:
   *     summary: Soft delete a brand
   *     tags: [Brand]
   */
  @Delete("/:id")
  @UseBefore(canAccess("brands", "delete"))
  async delete(@Param("id") id: string, @Res() res: any) {
    try {
      await this.brandService.delete(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Brand deleted successfully",
        data: null
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }
}
