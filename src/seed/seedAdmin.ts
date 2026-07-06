import "reflect-metadata";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { Role } from "../entity/Role.Permission";
import { env } from "../config/env.config";
import { Admin } from "../entity/Admin";

export async function seedAdmin() {
  const roleRepo = AppDataSource.getMongoRepository(Role);
  const userRepo = AppDataSource.getMongoRepository(Admin);

  const modules = [
    "dashboard",
    "roles_permissions",
    "business_regions",
    "categories",
    "announcements",
    "events",
    "trainings",
    "points",
    "awards",
    "members",
    "activities",
    "connections",
    "contributions",
    "reports"
  ];

  const actions = ["view", "create", "edit", "delete"];

  const fullPermissions = modules.map((module) => ({
    moduleId: module,
    actions
  }));

  // ✅ ROLE
  let adminRole = await roleRepo.findOne({
    where: { code: "SUPER_ADMIN" }
  });

  if (!adminRole) {
    adminRole = roleRepo.create({
      name: "Super Admin",
      code: "SUPER_ADMIN",
      isActive: true,
      isDeleted: false,
      permissions: fullPermissions
    });

    adminRole = await roleRepo.save(adminRole);
  }

  // ✅ USER
  let adminUser = await userRepo.findOne({
    where: { phoneNumber: env.SEED_ADMIN_PHONE }
  });

  if (!adminUser) {
    const hashedPin = await bcrypt.hash(env.SEED_ADMIN_PIN, 10);

    adminUser = userRepo.create({
      name: "Super Admin",
      email: "admin@test.com",
      phoneNumber: env.SEED_ADMIN_PHONE,
      pin: hashedPin,
      userId: "USR001",
      roleId: adminRole._id,
      createdBy: adminRole._id,
      updatedBy: adminRole._id,
      isActive: true,
      isDeleted: false
    });

    await userRepo.save(adminUser);
    console.log(`🚀 Seeded super admin user with phone: ${env.SEED_ADMIN_PHONE}`);
  }

  console.log("✅ Seed Completed");
}
