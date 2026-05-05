import {
  JsonController,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  Res,
  UseBefore,
  QueryParams
} from "routing-controllers";
import { CreateCategoryDto, UpdateCategoryDto } from "../../dto/admin/Category.dto";
import { CategoryService } from "../../services/category.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../utils/pagination";
import handleErrorResponse from "../../utils/commonFunction";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";
import { canAccess } from "../../middlewares/PermissionMiddleware";

@JsonController("/categories")
@UseBefore(AuthMiddleware)
export class CategoryController {
  private categoryService = new CategoryService();

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Category]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryDto'
   */
  @Post("/")
  @UseBefore(canAccess("categories", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateCategoryDto, @Res() res: any) {
    try {
      const category = await this.categoryService.create(data);
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Category created successfully",
        data: category
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: List categories with pagination and filters
   *     tags: [Category]
   */
  @Get("/")
  @UseBefore(canAccess("categories", "view"))
  async getAll(@QueryParams() query: any, @Res() res: any) {
    try {
      const { categories, total } = await this.categoryService.list(query);
      return pagination(total, categories, query.limit || 10, query.page || 0, res);
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Get single category by ID
   *     tags: [Category]
   */
  @Get("/:id")
  @UseBefore(canAccess("categories", "view"))
  async getOne(@Param("id") id: string, @Res() res: any) {
    try {
      const category = await this.categoryService.getById(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Category fetched successfully",
        data: category
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Update an existing category
   *     tags: [Category]
   */
  @Put("/:id")
  @UseBefore(canAccess("categories", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateCategoryDto, @Res() res: any) {
    try {
      const category = await this.categoryService.update(id, data);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Category updated successfully",
        data: category
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/categories/bulk-delete:
   *   post:
   *     summary: Bulk delete categories
   *     tags: [Category]
   */
  @Post("/bulk-delete")
  @UseBefore(canAccess("categories", "delete"))
  async bulkDelete(@Body() body: { ids: string[] }, @Res() res: any) {
    try {
      const result = await this.categoryService.bulkDelete(body.ids);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Bulk delete operation completed",
        data: result
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Soft delete a category
   *     tags: [Category]
   */
  @Delete("/:id")
  @UseBefore(canAccess("categories", "delete"))
  async delete(@Param("id") id: string, @Res() res: any) {
    try {
      await this.categoryService.delete(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Category deleted successfully",
        data: null
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }
}
