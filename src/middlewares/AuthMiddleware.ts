import {
  ExpressMiddlewareInterface,
  UnauthorizedError,
} from "routing-controllers";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { AdminUser } from "../entity/AdminUser";
import { ObjectId } from "mongodb";
import { UserToken } from "../entity/UserToken";
import { Role } from "../entity/Role.Permission";
import handleErrorResponse from "../utils/commonFunction";
import { env } from "../config/env.config";
import { Admin } from "../entity/Admin";

export interface AuthPayload {
  userId: string;
  companyId: string;
  role?: string | Role;
  roleId?: string;
  userType?: "ADMIN" | "ADMIN_USER" | "MEMBER";
}

export class AuthMiddleware implements ExpressMiddlewareInterface {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedError("Authorization header missing");
      }

      if (!authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Invalid authorization format");
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new UnauthorizedError("Token missing");
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const decodedId = decoded.id || decoded.userId;

      if (!decoded || typeof decoded !== "object" || !decodedId) {
        console.error("Auth Error: Missing ID in payload", decoded);
        throw new Error("Invalid token payload");
      }

      // Check if user is still active in database
      const userId = decodedId;

      const user = await AppDataSource.getMongoRepository(AdminUser).findOneBy({
        _id: new ObjectId(userId),
        isDeleted: false
      });
      const admin = await AppDataSource.getMongoRepository(Admin).findOneBy({
        _id: new ObjectId(userId),
        isDeleted: false
      });

      if (!user && !admin) {
        throw new UnauthorizedError("User not found or account deleted");
      }

      if (!user?.isActive && !admin?.isActive) {
        throw new UnauthorizedError("Account is inactive. Please contact admin.");
      }

      // Load Role with permissions
      let role = null;
      if (user?.roleId) {
        role = await AppDataSource.getMongoRepository(Role).findOneBy({
          _id: new ObjectId(user.roleId),
          isDeleted: false
        });
      }

      // Check active token record
      const activeTokenRecord = await AppDataSource.getMongoRepository(UserToken).findOneBy({
        userId: new ObjectId(userId),
        token: token
      });

      if (!activeTokenRecord) {
        throw new UnauthorizedError("Session expired. Another login detected.");
      }

      (req as any).user = {
        ...decoded,
        userId: decodedId,
        companyName: user?.companyName || admin?.companyName,
        roleId: user?.roleId?.toString() || admin?.roleId || decoded.roleId,
        role: role // attach full role object with permissions
      }
      if (admin) {
        (req as any).admin = {
          ...decoded,
          userId: decodedId,
          companyName: admin?.companyName,
          roleId: admin?.roleId?.toString() || decoded.roleId,
          role: role
        };
      }

      next();
    } catch (error: any) {
      handleErrorResponse(error, res);
    }
  }
}
