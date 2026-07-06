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
import { AppDataSource } from "../../../data-source";
import { AdminUser } from "../../../entity/AdminUser";
import { Role } from "../../../entity/Role.Permission";
import { CreateAdminUserDto, UpdateAdminUserDto, UpdateAdminUserStatusDto } from "../../../dto/admin/AdminUser.dto";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { generateAdminUserId } from "../../../utils/id.generator";
import { StatusCodes } from "http-status-codes";
import pagination from "../../../utils/pagination";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { canAccess } from "../../../middlewares/PermissionMiddleware";

@JsonController("/admin-users")
export class AdminUserController {
  private adminUserRepo = AppDataSource.getMongoRepository(AdminUser);

  @Get("/")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "view"))
  async getAll(
    @QueryParam("page") page: number,
    @QueryParam("limit") limit: number,
    @QueryParam("search") search: string,
    @QueryParam("roleId") roleId: string
  ) {
    const pageNum = Number(page) || 0;
    const limitNum = Number(limit) || 10;

    const where: any = { isDeleted: false };
    if (search) {
      where.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } }
      ];
    }

    if (roleId && ObjectId.isValid(roleId)) {
      where.roleId = new ObjectId(roleId);
    }

    const [users, totalCount] = await this.adminUserRepo.findAndCount({
      where,
      skip: pageNum * limitNum,
      take: limitNum,
      order: { createdAt: "DESC" }
    });

    // Fetch roles to attach roleName
    const roleRepo = AppDataSource.getMongoRepository(Role);
    const roleIds = [...new Set(users.map(u => u.roleId).filter(id => id))];
    const roles = await roleRepo.find({
      where: { _id: { $in: roleIds } } as any
    });

    const roleMap = new Map(roles.map(r => [r._id.toString(), r.name]));

    const usersWithRole = users.map(user => ({
      id: user.id,
      name: user.name,
      userId: user.userId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      roleId: user.roleId,
      roleName: user.roleId ? roleMap.get(user.roleId.toString()) : "N/A",
      isActive: user.isActive,
      profileImage: user.profileImage,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return pagination(totalCount, usersWithRole, limitNum, pageNum);
  }

  @Get("/:id")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "view"))
  async getOne(@Param("id") id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }
    const user = await this.adminUserRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });
    if (!user) throw new NotFoundError("Admin user not found");

    const userResponse: any = {
      id: user.id,
      name: user.name,
      userId: user.userId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      roleId: user.roleId,
      isActive: user.isActive,
      profileImage: user.profileImage,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    if (user.roleId) {
      const roleRepo = AppDataSource.getMongoRepository(Role);
      const role = await roleRepo.findOne({ where: { _id: user.roleId } });
      if (role) {
        userResponse.roleName = role.name;
      }
    }

    return userResponse;
  }

  @Post("/")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "add"))
  @HttpCode(StatusCodes.CREATED)
  async create(@Body() userData: CreateAdminUserDto) {
    // Check if email or phone already exists
    const existingUser = await this.adminUserRepo.findOne({
      where: {
        $or: [
          { email: userData.email },
          { phoneNumber: userData.phoneNumber }
        ],
        isDeleted: false
      }
    });

    if (existingUser) {
      throw new BadRequestError("Email or Phone number already exists");
    }

    const newUser = new AdminUser();
    Object.assign(newUser, userData);

    // Generate atomic userId sequence
    newUser.userId = await generateAdminUserId();

    // Generate a random secure 4-digit PIN (Resolves hardcoded default credential leak)
    const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
    newUser.pin = await bcrypt.hash(rawPin, 10);

    // Convert roleId string to ObjectId
    newUser.roleId = new ObjectId(userData.roleId);

    // Default values
    newUser.isActive = userData.isActive !== undefined ? Boolean(userData.isActive) : true;
    newUser.isDeleted = false;

    const savedUser = await this.adminUserRepo.save(newUser);

    // Return the created user along with their generated temporary login PIN
    return {
      success: true,
      message: "Admin user created successfully",
      data: {
        id: savedUser.id.toString(),
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
        roleId: savedUser.roleId.toString(),
        isActive: savedUser.isActive,
        tempPin: rawPin // Administrator can securely share this one-time PIN with the new user
      }
    };
  }

  @Patch("/:id")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "edit"))
  async update(@Param("id") id: string, @Body() userData: UpdateAdminUserDto) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }

    const user = await this.adminUserRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });

    if (!user) throw new NotFoundError("Admin user not found");

    if (userData.pin) {
      userData.pin = await bcrypt.hash(userData.pin, 10);
    }

    if (userData.roleId) {
      (user as any).roleId = new ObjectId(userData.roleId);
      delete (userData as any).roleId;
    }

    if (userData.isActive !== undefined) {
      user.isActive = Boolean(userData.isActive);
      delete (userData as any).isActive;
    }

    Object.assign(user, userData);
    const savedUser = await this.adminUserRepo.save(user);

    return {
      success: true,
      message: "Admin user updated successfully",
      data: {
        id: savedUser.id.toString(),
        userId: savedUser.userId,
        name: savedUser.name,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
        roleId: savedUser.roleId.toString(),
        isActive: savedUser.isActive
      }
    };
  }

  @Delete("/:id")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "delete"))
  async delete(@Param("id") id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }

    const user = await this.adminUserRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });

    if (!user) throw new NotFoundError("Admin user not found");

    user.isDeleted = true;
    await this.adminUserRepo.save(user);

    return { message: "Admin user deleted successfully" };
  }

  @Patch("/:id/status")
  @UseBefore(AuthMiddleware, canAccess("admin_users", "edit"))
  async updateStatus(@Param("id") id: string, @Body() statusData: UpdateAdminUserStatusDto) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid ID format");
    }

    const user = await this.adminUserRepo.findOne({
      where: { _id: new ObjectId(id), isDeleted: false }
    });

    if (!user) throw new NotFoundError("Admin user not found");

    user.isActive = Boolean(statusData.isActive);
    await this.adminUserRepo.save(user);

    return {
      message: `User status updated to ${user.isActive ? "Active" : "Inactive"}`,
      isActive: user.isActive
    };
  }
}
