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
import { CreateAttributeDto, UpdateAttributeDto } from "../../../dto/admin/Attribute.dto";
import { AttributeService } from "../../../services/attribute.service";
import { StatusCodes } from "http-status-codes";
import pagination from "../../../utils/pagination";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { canAccess } from "../../../middlewares/PermissionMiddleware";

@JsonController("/attributes")
@UseBefore(AuthMiddleware)
export class AttributeController {
  private attributeService = new AttributeService();

  @Post("/")
  @UseBefore(canAccess("attributes", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() data: CreateAttributeDto) {
    const attribute = await this.attributeService.create(data);
    return {
      success: true,
      message: "Attribute created successfully",
      data: attribute
    };
  }

  @Get("/")
  @UseBefore(canAccess("attributes", "view"))
  async getAll(@QueryParams() query: any) {
    const { attributes, total } = await this.attributeService.list(query);
    return pagination(total, attributes, query.limit || 10, query.page || 0);
  }

  @Get("/:id")
  @UseBefore(canAccess("attributes", "view"))
  async getOne(@Param("id") id: string) {
    const attribute = await this.attributeService.getById(id);
    return {
      success: true,
      message: "Attribute fetched successfully",
      data: attribute
    };
  }

  @Put("/:id")
  @UseBefore(canAccess("attributes", "edit"))
  async update(@Param("id") id: string, @Body() data: UpdateAttributeDto) {
    const attribute = await this.attributeService.update(id, data);
    return {
      success: true,
      message: "Attribute updated successfully",
      data: attribute
    };
  }

  @Delete("/:id")
  @UseBefore(canAccess("attributes", "delete"))
  async delete(@Param("id") id: string) {
    await this.attributeService.delete(id);
    return {
      success: true,
      message: "Attribute deleted successfully",
      data: null
    };
  }
}
