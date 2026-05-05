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
import { CreateAttributeDto, UpdateAttributeDto } from "../../dto/admin/Attribute.dto";
import { AttributeService } from "../../services/attribute.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../utils/pagination";
import handleErrorResponse from "../../utils/commonFunction";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware";
import { canAccess } from "../../middlewares/PermissionMiddleware";

@JsonController("/attributes")
@UseBefore(AuthMiddleware)
export class AttributeController {
  private attributeService = new AttributeService();

  /**
   * @swagger
   * /api/attributes:
   *   post:
   *     summary: Create a new attribute
   *     tags: [Attribute]
   *     security:
   *       - bearerAuth: []
   */
  @Post("/")
  @UseBefore(canAccess("attributes", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateAttributeDto, @Res() res: any) {
    try {
      const attribute = await this.attributeService.create(data);
      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Attribute created successfully",
        data: attribute
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/attributes:
   *   get:
   *     summary: List all attributes with filtering and pagination
   *     tags: [Attribute]
   */
  @Get("/")
  @UseBefore(canAccess("attributes", "view"))
  async getAll(@QueryParams() query: any, @Res() res: any) {
    try {
      const { attributes, total } = await this.attributeService.list(query);
      return pagination(total, attributes, query.limit || 10, query.page || 0, res);
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/attributes/{id}:
   *   get:
   *     summary: Get attribute by ID
   *     tags: [Attribute]
   */
  @Get("/:id")
  @UseBefore(canAccess("attributes", "view"))
  async getOne(@Param("id") id: string, @Res() res: any) {
    try {
      const attribute = await this.attributeService.getById(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Attribute fetched successfully",
        data: attribute
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/attributes/{id}:
   *   put:
   *     summary: Update an attribute
   *     tags: [Attribute]
   */
  @Put("/:id")
  @UseBefore(canAccess("attributes", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateAttributeDto, @Res() res: any) {
    try {
      const attribute = await this.attributeService.update(id, data);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Attribute updated successfully",
        data: attribute
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }

  /**
   * @swagger
   * /api/attributes/{id}:
   *   delete:
   *     summary: Soft delete an attribute
   *     tags: [Attribute]
   */
  @Delete("/:id")
  @UseBefore(canAccess("attributes", "delete"))
  async delete(@Param("id") id: string, @Res() res: any) {
    try {
      await this.attributeService.delete(id);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Attribute deleted successfully",
        data: null
      });
    } catch (error: any) {
      return handleErrorResponse(error, res);
    }
  }
}
