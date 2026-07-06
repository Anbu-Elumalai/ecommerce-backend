import {
  JsonController,
  Post,
  Body,
  HttpCode,
  UnauthorizedError,
  BadRequestError,
  Req,
  UseBefore
} from "routing-controllers";
import { ObjectId } from "mongodb";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AppDataSource } from "../../../data-source";
import { AdminUser } from "../../../entity/AdminUser";
import { UserToken } from "../../../entity/UserToken";
import { LoginDto, ChangePinDto } from "../../../dto/admin/Auth.dto";
import { AuthMiddleware } from "../../../middlewares/AuthMiddleware";
import { env } from "../../../config/env.config";
import { Admin } from "../../../entity/Admin";

@JsonController("/auth")
export class AuthController {

  @Post("/login")
  @HttpCode(StatusCodes.OK)
  async login(@Body() body: LoginDto, @Req() req: any) {
    const { phoneNumber, pin } = body;

    const adminRepo     = AppDataSource.getMongoRepository(Admin);
    const adminUserRepo = AppDataSource.getMongoRepository(AdminUser);

    // ─── 1. Locate user by phone number (check both Admin and AdminUser) ───
    const admin     = await adminRepo.findOne({ where: { phoneNumber, isDeleted: false } });
    const adminUser = await adminUserRepo.findOne({ where: { phoneNumber, isDeleted: false } });

    // Prefer Admin entity (super-admin seeded here); fallback to AdminUser
    const foundUser: (Admin | AdminUser) | null = admin ?? adminUser;

    if (!foundUser) {
      // Constant-time guard to prevent timing-based user enumeration
      await bcrypt.compare(pin, "$2a$10$DUMMYHASHTOPREVENTTIMINGATTACKS00000000000000");
      throw new UnauthorizedError("Invalid credentials");
    }

    // ─── 2. Account status checks ───────────────────────────────────────────
    if (!foundUser.isActive) {
      throw new UnauthorizedError("Account is inactive. Please contact admin.");
    }

    // ─── 3. PIN verification ─────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(pin, foundUser.pin);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // ─── 4. Token cleanup – remove stale / expired tokens ────────────────────
    const tokenRepo = AppDataSource.getMongoRepository(UserToken);
    const existingTokens = await tokenRepo.find({ where: { userId: foundUser.id } });
    for (const t of existingTokens) {
      try {
        jwt.verify(t.token, env.JWT_SECRET);
      } catch {
        await tokenRepo.delete({ _id: t._id } as any);
      }
    }

    // ─── 5. Issue a fresh JWT ─────────────────────────────────────────────────
    const roleIdStr = foundUser.roleId?.toString?.() ?? "";
    const finalToken = jwt.sign(
      { id: foundUser.id.toString(), roleId: roleIdStr },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const userToken = new UserToken();
    userToken.userId = foundUser.id;
    userToken.token  = finalToken;
    await tokenRepo.save(userToken);

    // ─── 6. Update last-login metadata ───────────────────────────────────────
    foundUser.lastLoginAt = new Date();
    (foundUser as any).lastLoginIp = req.ip ?? req.socket?.remoteAddress ?? "unknown";
    (foundUser as any).device      = req.headers["user-agent"]?.slice(0, 200) ?? "unknown";

    if (admin) {
      await adminRepo.save(foundUser as Admin);
    } else {
      await adminUserRepo.save(foundUser as AdminUser);
    }

    // ─── 7. Return sanitised payload ─────────────────────────────────────────
    return {
      success: true,
      message: "Login successful",
      data: {
        accessToken: finalToken,
        user: {
          id:          foundUser.id.toString(),
          name:        foundUser.name,
          email:       (foundUser as any).email ?? null,
          phoneNumber: foundUser.phoneNumber,
          roleId:      roleIdStr,
          isActive:    foundUser.isActive,
        }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  @Post("/change-pin")
  @UseBefore(AuthMiddleware)
  @HttpCode(StatusCodes.OK)
  async changePin(@Body() body: ChangePinDto, @Req() req: any) {
    const { oldPin, newPin } = body;
    const userId = req.user.userId;

    const adminRepo     = AppDataSource.getMongoRepository(Admin);
    const adminUserRepo = AppDataSource.getMongoRepository(AdminUser);

    const admin     = await adminRepo.findOne({ where: { _id: new ObjectId(userId), isDeleted: false } });
    const adminUser = !admin
      ? await adminUserRepo.findOne({ where: { _id: new ObjectId(userId), isDeleted: false } })
      : null;

    const user = admin ?? adminUser;
    if (!user) throw new UnauthorizedError("User not found");

    const isMatch = await bcrypt.compare(oldPin, user.pin);
    if (!isMatch) throw new BadRequestError("Invalid old PIN");

    user.pin = await bcrypt.hash(newPin, 10);

    if (admin) {
      await adminRepo.save(user as Admin);
    } else {
      await adminUserRepo.save(user as AdminUser);
    }

    return { success: true, message: "PIN changed successfully" };
  }

  // ─────────────────────────────────────────────────────────────────────────
  @Post("/logout")
  @UseBefore(AuthMiddleware)
  @HttpCode(StatusCodes.OK)
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedError("Token missing");

    const token  = authHeader.split(" ")[1];
    const userId = req.user.userId;

    const tokenRepo = AppDataSource.getMongoRepository(UserToken);
    await tokenRepo.deleteMany({ userId: new ObjectId(userId), token });

    return { success: true, message: "Logout successful" };
  }
}
