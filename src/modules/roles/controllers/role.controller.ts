import {
  JsonController,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundError,
  BadRequestError,
  HttpCode,
  QueryParam,
  UseBefore
} from "routing-controllers";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { AppDataSource } from "../../../data-source";
import { Role } from "../../../entity/Role.Permission";
import { AdminUser } from "../../../entity/AdminUser";
import { CreateRoleDto, UpdateRoleDto } from "../../../dto/admin/Role.dto";
import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import pagination from "../../../utils/pagination";
import { emitToUsers } from "../../../utils/socket";
import { canAccess } from "../../../middlewares/PermissionMiddleware";

@JsonController("/roles")
export class RoleController {
  private roleRepo = AppDataSource.getMongoRepository(Role);

  @Get("/")
  @UseBefore(AuthMiddleware, canAccess("roles_permissions", "view"))
  async getAll(
    @QueryParam("page") page: number,
    @QueryParam("limit") limit: number,
    @QueryParam("search") search: string
  ) {
    const pageNum = Number(page) || 0;
    const limitNum = Number(limit) || 10;

    const where: any = { isDeleted: false };
    if (search) {
      where.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } }
      ];
    }

    const [roles, totalCount] = await this.roleRepo.findAndCount({
      where,
      skip: pageNum * limitNum,
      take: limitNum
    });

    const userRepo = AppDataSource.getMongoRepository(AdminUser);

    // Aggregated user count grouped by roleId to solve the N+1 query problem
    const roleIds = roles.map(r => r._id);
    const userCounts = await userRepo.aggregate([
      {
        $match: {
          roleId: { $in: roleIds },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: "$roleId",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const countMap = new Map<string, number>(
      userCounts.map((c: any) => [c._id.toString(), c.count])
    );

    const rolesWithCounts = roles.map(role => ({
      ...role,
      userCount: countMap.get(role._id.toString()) || 0
    }));

    return pagination(totalCount, rolesWithCounts, limitNum, pageNum);
  }

  @Get("/:id")
  @UseBefore(AuthMiddleware, canAccess("roles_permissions", "view"))
  async getOne(@Param("id") id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }
    const role = await this.roleRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });
    if (!role) throw new NotFoundError("Role not found");
    return role;
  }

  @Post("/")
  @UseBefore(AuthMiddleware, canAccess("roles_permissions", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() roleData: CreateRoleDto) {
    // Check if name or code already exists
    const existingRole = await this.roleRepo.findOne({
      where: {
        $or: [
          { name: roleData.name },
          { code: roleData.code }
        ],
        isDeleted: false
      }
    });

    if (existingRole) {
      throw new BadRequestError("Role name or code already exists");
    }

    const newRole = new Role();
    newRole.name = roleData.name;
    newRole.code = roleData.code;
    newRole.description = roleData.description;
    newRole.isActive = roleData.isActive !== undefined ? roleData.isActive : true;
    newRole.isDeleted = false;

    // Map permissions
    newRole.permissions = roleData.permissions.map(p => ({
      moduleId: p.moduleId,
      actions: p.actions
    }));

    return await this.roleRepo.save(newRole);
  }

  @Patch("/:id")
  @UseBefore(AuthMiddleware, canAccess("roles_permissions", "edit"))
  async update(@Param("id") id: string, @Body() roleData: UpdateRoleDto) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }

    const role = await this.roleRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });

    if (!role) throw new NotFoundError("Role not found");

    if (roleData.name) role.name = roleData.name;
    if (roleData.code) role.code = roleData.code;
    if (roleData.description) role.description = roleData.description;
    if (roleData.isActive !== undefined) role.isActive = roleData.isActive;

    if (roleData.permissions) {
      role.permissions = roleData.permissions.map(p => ({
        moduleId: p.moduleId,
        actions: p.actions
      }));
    }

    const updatedRole = await this.roleRepo.save(role);

    // Notify users with this role about permission updates
    const userRepo = AppDataSource.getMongoRepository(AdminUser);
    const affectedUsers = await userRepo.find({
      where: { roleId: role._id, isDeleted: false }
    });

    const userIds = affectedUsers.map(u => u.id.toString());
    emitToUsers(userIds, "permissionsUpdated", {
      roleId: role._id.toString(),
      permissions: role.permissions
    });

    return updatedRole;
  }

  @Delete("/:id")
  @UseBefore(AuthMiddleware, canAccess("roles_permissions", "delete"))
  async delete(@Param("id") id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }

    const role = await this.roleRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });

    if (!role) throw new NotFoundError("Role not found");

    role.isDeleted = true;
    await this.roleRepo.save(role);

    return { message: "Role deleted successfully" };
  }
}
