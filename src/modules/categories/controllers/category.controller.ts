import {
  JsonController,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  UseBefore,
  QueryParams
} from "routing-controllers";
import { CreateCategoryDto, UpdateCategoryDto, BulkDeleteCategoryDto } from "../../../dto/admin/Category.dto";
import { CategoryService } from "../../../services/category.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../../utils/pagination";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { canAccess } from "../../../middlewares/PermissionMiddleware";

@JsonController("/categories")
@UseBefore(AuthMiddleware)
export class CategoryController {
  private categoryService = new CategoryService();

  @Post("/")
  @UseBefore(canAccess("categories", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateCategoryDto) {
    const category = await this.categoryService.create(data);
    return {
      success: true,
      message: "Category created successfully",
      data: category
    };
  }

  @Get("/tree")
  @UseBefore(canAccess("categories", "view"))
  async getTree() {
    const tree = await this.categoryService.getTree();
    return {
      success: true,
      message: "Category tree fetched successfully",
      data: tree
    };
  }

  @Get("/")
  @UseBefore(canAccess("categories", "view"))
  async getAll(@QueryParams() query: any) {
    const { categories, total } = await this.categoryService.list(query);
    return pagination(total, categories, query.limit || 10, query.page || 0);
  }

  @Get("/:id")
  @UseBefore(canAccess("categories", "view"))
  async getOne(@Param("id") id: string) {
    const category = await this.categoryService.getById(id);
    return {
      success: true,
      message: "Category fetched successfully",
      data: category
    };
  }

  @Put("/:id")
  @UseBefore(canAccess("categories", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateCategoryDto) {
    const category = await this.categoryService.update(id, data);
    return {
      success: true,
      message: "Category updated successfully",
      data: category
    };
  }

  @Patch("/status")
  @UseBefore(canAccess("categories", "edit"))
  async patchStatusBulk(@Body() body: { id: string; status: string }) {
    const category = await this.categoryService.updateStatus(body.id, body.status);
    return {
      success: true,
      message: "Category status updated successfully",
      data: category
    };
  }

  @Patch("/:id/status")
  @UseBefore(canAccess("categories", "edit"))
  async patchStatus(@Param("id") id: string, @Body() body: { status: string }) {
    const category = await this.categoryService.updateStatus(id, body.status);
    return {
      success: true,
      message: "Category status updated successfully",
      data: category
    };
  }

  @Patch("/sort-order")
  @UseBefore(canAccess("categories", "edit"))
  async patchSortOrderBulk(@Body() body: { id: string; sortOrder: number }) {
    const category = await this.categoryService.updateSortOrder(body.id, body.sortOrder);
    return {
      success: true,
      message: "Category sort order updated successfully",
      data: category
    };
  }

  @Patch("/:id/sort-order")
  @UseBefore(canAccess("categories", "edit"))
  async patchSortOrder(@Param("id") id: string, @Body() body: { sortOrder: number }) {
    const category = await this.categoryService.updateSortOrder(id, body.sortOrder);
    return {
      success: true,
      message: "Category sort order updated successfully",
      data: category
    };
  }

  @Post("/bulk-delete")
  @UseBefore(canAccess("categories", "delete"))
  async bulkDelete(@Body() body: BulkDeleteCategoryDto) {
    const result = await this.categoryService.bulkDelete(body.ids);
    return {
      success: true,
      message: "Bulk delete operation completed",
      data: result
    };
  }

  @Delete("/:id")
  @UseBefore(canAccess("categories", "delete"))
  async delete(@Param("id") id: string) {
    await this.categoryService.delete(id);
    return {
      success: true,
      message: "Category deleted successfully",
      data: null
    };
  }
}
