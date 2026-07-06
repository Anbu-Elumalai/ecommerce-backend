import * as dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 50001;

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Thinai Backend API",
    version: "1.0.0",
    description: "Complete API Documentation for Thinai E-Commerce Backend"
  },
  servers: [{ url: `http://localhost:${PORT}` }],

  // ─── SECURITY SCHEME ──────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      // ── Auth ──────────────────────────────────────────────────
      LoginRequest: {
        type: "object",
        required: ["phoneNumber", "pin"],
        properties: {
          phoneNumber: { type: "string", example: "9876543210" },
          pin: { type: "string", example: "1234" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  phoneNumber: { type: "string" },
                  roleId: { type: "string" },
                  isActive: { type: "boolean" }
                }
              }
            }
          }
        }
      },
      ChangePinRequest: {
        type: "object",
        required: ["oldPin", "newPin"],
        properties: {
          oldPin: { type: "string", example: "1234" },
          newPin: { type: "string", example: "5678" }
        }
      },

      // ── Role ──────────────────────────────────────────────────
      Permission: {
        type: "object",
        required: ["moduleId", "actions"],
        properties: {
          moduleId: { type: "string", example: "dashboard" },
          actions: {
            type: "array",
            items: { type: "string", enum: ["view", "create", "edit", "delete"] }
          }
        }
      },
      CreateRole: {
        type: "object",
        required: ["name", "code", "permissions"],
        properties: {
          name: { type: "string", example: "Manager" },
          code: { type: "string", example: "MANAGER" },
          description: { type: "string", example: "Regional Manager Role" },
          isActive: { type: "boolean", example: true },
          permissions: {
            type: "array",
            items: { $ref: "#/components/schemas/Permission" }
          }
        }
      },
      UpdateRole: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          description: { type: "string" },
          isActive: { type: "boolean" },
          permissions: {
            type: "array",
            items: { $ref: "#/components/schemas/Permission" }
          }
        }
      },
      Role: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          code: { type: "string" },
          description: { type: "string" },
          isActive: { type: "boolean" },
          permissions: { type: "array", items: { $ref: "#/components/schemas/Permission" } },
          userCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },

      // ── Brand ─────────────────────────────────────────────────
      CreateBrand: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Nike" },
          slug: { type: "string", example: "nike" },
          description: { type: "string" },
          logo: { type: "string" },
          banner: { type: "string" },
          isActive: { type: "boolean", default: true },
          isFeatured: { type: "boolean", default: false },
          showInFilter: { type: "boolean", default: true },
          website: { type: "string" },
          countryOfOrigin: { type: "string", example: "USA" }
        }
      },
      UpdateBrand: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          logo: { type: "string" },
          banner: { type: "string" },
          isActive: { type: "boolean" },
          isFeatured: { type: "boolean" },
          showInFilter: { type: "boolean" },
          website: { type: "string" },
          countryOfOrigin: { type: "string" }
        }
      },
      Brand: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          logo: { type: "string" },
          isActive: { type: "boolean" },
          isFeatured: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },

      // ── Category ──────────────────────────────────────────────
      CreateCategory: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Electronics" },
          slug: { type: "string" },
          description: { type: "string" },
          parentId: { type: "string", nullable: true },
          image: { type: "string" },
          banner: { type: "string" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
          showInMenu: { type: "boolean", default: true },
          isFeatured: { type: "boolean", default: false },
          sortOrder: { type: "integer", default: 0 },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
          metaKeywords: { type: "array", items: { type: "string" } }
        }
      },
      UpdateCategory: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          parentId: { type: "string", nullable: true },
          image: { type: "string" },
          banner: { type: "string" },
          status: { type: "string", enum: ["active", "inactive"] },
          showInMenu: { type: "boolean" },
          isFeatured: { type: "boolean" },
          sortOrder: { type: "integer" },
          metaTitle: { type: "string" },
          metaDescription: { type: "string" },
          metaKeywords: { type: "array", items: { type: "string" } }
        }
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          parentId: { type: "string", nullable: true },
          status: { type: "string" },
          sortOrder: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },

      // ── Attribute ─────────────────────────────────────────────
      AttributeValue: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string", example: "Red" },
          value: { type: "string" },
          color: { type: "string", example: "#FF0000" },
          sortOrder: { type: "integer", default: 0 }
        }
      },
      CreateAttribute: {
        type: "object",
        required: ["name", "displayType"],
        properties: {
          name: { type: "string", example: "Color" },
          slug: { type: "string" },
          displayType: {
            type: "string",
            enum: ["color", "button", "image", "dropdown"],
            example: "color"
          },
          values: { type: "array", items: { $ref: "#/components/schemas/AttributeValue" } },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
          usedForVariants: { type: "boolean", default: false },
          isRequired: { type: "boolean", default: false },
          isVisible: { type: "boolean", default: true },
          sortOrder: { type: "integer", default: 0 }
        }
      },
      UpdateAttribute: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          displayType: { type: "string", enum: ["color", "button", "image", "dropdown"] },
          values: { type: "array", items: { $ref: "#/components/schemas/AttributeValue" } },
          status: { type: "string", enum: ["active", "inactive"] },
          usedForVariants: { type: "boolean" },
          isRequired: { type: "boolean" },
          isVisible: { type: "boolean" },
          sortOrder: { type: "integer" }
        }
      },

      // ── Admin User ────────────────────────────────────────────
      CreateAdminUser: {
        type: "object",
        required: ["name", "email", "phoneNumber", "roleId"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", example: "john@example.com" },
          phoneNumber: { type: "string", example: "9876543210" },
          companyName: { type: "string" },
          roleId: { type: "string", example: "6647abc123def456" },
          isActive: { type: "integer", enum: [0, 1], default: 1 }
        }
      },
      UpdateAdminUser: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phoneNumber: { type: "string" },
          companyName: { type: "string" },
          roleId: { type: "string" },
          pin: { type: "string" },
          isActive: { type: "integer", enum: [0, 1] }
        }
      },
      UpdateAdminUserStatus: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "integer", enum: [0, 1] }
        }
      },
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          phoneNumber: { type: "string" },
          companyName: { type: "string" },
          roleId: { type: "string" },
          roleName: { type: "string" },
          isActive: { type: "boolean" },
          lastLoginAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },

      // ── Shared ────────────────────────────────────────────────
      PaginatedResponse: {
        type: "object",
        properties: {
          status: { type: "integer" },
          message: { type: "string" },
          total: { type: "integer" },
          from: { type: "integer" },
          to: { type: "integer" },
          totalPages: { type: "integer" },
          currentPage: { type: "integer" },
          data: { type: "array", items: {} }
        }
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {}
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string" },
          statusCode: { type: "integer" },
          message: { type: "string" },
          errors: {}
        }
      }
    }
  },

  // Global security (can be overridden per-route)
  security: [{ BearerAuth: [] }],

  // ─── PATHS ────────────────────────────────────────────────────────────────
  paths: {

    // =====================================================================
    // AUTH
    // =====================================================================
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin Login",
        description: "Authenticates an admin user with phone number and PIN. Returns a JWT access token.",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } }
          },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Admin Logout",
        description: "Invalidates the current JWT session token.",
        responses: {
          "200": { description: "Logout successful" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/auth/change-pin": {
      post: {
        tags: ["Auth"],
        summary: "Change PIN",
        description: "Allows an authenticated admin to change their login PIN.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePinRequest" } } }
        },
        responses: {
          "200": { description: "PIN changed successfully" },
          "400": { description: "Invalid old PIN" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    // =====================================================================
    // ROLES
    // =====================================================================
    "/api/roles": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "List all roles",
        description: "Returns paginated list of roles with user counts aggregated per role.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 }, description: "Page index (0-based)" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name or code" }
        ],
        responses: {
          "200": {
            description: "Paginated roles list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } }
          },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Roles & Permissions"],
        summary: "Create role",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRole" } } }
        },
        responses: {
          "201": { description: "Role created", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } },
          "400": { description: "Role name or code already exists" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/roles/{id}": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Get role by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Role found", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } },
          "404": { description: "Role not found" }
        }
      },
      patch: {
        tags: ["Roles & Permissions"],
        summary: "Update role",
        description: "Updates role fields and emits a Socket.IO `permissionsUpdated` event to all users with this role.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRole" } } }
        },
        responses: {
          "200": { description: "Role updated" },
          "404": { description: "Role not found" }
        }
      },
      delete: {
        tags: ["Roles & Permissions"],
        summary: "Soft delete role",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Role deleted" },
          "404": { description: "Role not found" }
        }
      }
    },

    // =====================================================================
    // BRANDS
    // =====================================================================
    "/api/brands": {
      get: {
        tags: ["Brands"],
        summary: "List all brands",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Paginated brands", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Brands"],
        summary: "Create brand",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBrand" } } }
        },
        responses: {
          "201": { description: "Brand created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/brands/{id}": {
      get: {
        tags: ["Brands"],
        summary: "Get brand by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Brand found", content: { "application/json": { schema: { $ref: "#/components/schemas/Brand" } } } },
          "404": { description: "Brand not found" }
        }
      },
      put: {
        tags: ["Brands"],
        summary: "Update brand",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateBrand" } } }
        },
        responses: {
          "200": { description: "Brand updated" },
          "404": { description: "Brand not found" }
        }
      },
      delete: {
        tags: ["Brands"],
        summary: "Delete brand",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Brand deleted" },
          "404": { description: "Brand not found" }
        }
      }
    },

    // =====================================================================
    // CATEGORIES
    // =====================================================================
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "parentId", in: "query", schema: { type: "string" }, description: "Filter by parent category ID" }
        ],
        responses: {
          "200": { description: "Paginated categories", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Categories"],
        summary: "Create category",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategory" } } }
        },
        responses: {
          "201": { description: "Category created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Category found", content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } },
          "404": { description: "Category not found" }
        }
      },
      put: {
        tags: ["Categories"],
        summary: "Update category",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateCategory" } } }
        },
        responses: {
          "200": { description: "Category updated" },
          "404": { description: "Category not found" }
        }
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Category deleted" },
          "404": { description: "Category not found" }
        }
      }
    },

    "/api/categories/bulk-delete": {
      post: {
        tags: ["Categories"],
        summary: "Bulk delete categories",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ids"],
                properties: { ids: { type: "array", items: { type: "string" } } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Bulk delete completed" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    // =====================================================================
    // ATTRIBUTES
    // =====================================================================
    "/api/attributes": {
      get: {
        tags: ["Attributes"],
        summary: "List all attributes",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Paginated attributes", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Attributes"],
        summary: "Create attribute",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAttribute" } } }
        },
        responses: {
          "201": { description: "Attribute created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/attributes/{id}": {
      get: {
        tags: ["Attributes"],
        summary: "Get attribute by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Attribute found" },
          "404": { description: "Attribute not found" }
        }
      },
      put: {
        tags: ["Attributes"],
        summary: "Update attribute",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAttribute" } } }
        },
        responses: {
          "200": { description: "Attribute updated" },
          "404": { description: "Attribute not found" }
        }
      },
      delete: {
        tags: ["Attributes"],
        summary: "Delete attribute",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Attribute deleted" },
          "404": { description: "Attribute not found" }
        }
      }
    },

    // =====================================================================
    // ADMIN USERS
    // =====================================================================
    "/api/admin-users": {
      get: {
        tags: ["Admin Users"],
        summary: "List all admin users",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, email, phone or userId" },
          { name: "roleId", in: "query", schema: { type: "string" }, description: "Filter by role ID" }
        ],
        responses: {
          "200": { description: "Paginated admin users", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        tags: ["Admin Users"],
        summary: "Create admin user",
        description: "Creates a new admin user. A random 4-digit PIN is generated and returned in `tempPin` — share this securely with the new user.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAdminUser" } } }
        },
        responses: {
          "201": {
            description: "Admin user created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            tempPin: { type: "string", description: "One-time temporary PIN to share with the new user" }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "400": { description: "Email or phone already exists" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/admin-users/{id}": {
      get: {
        tags: ["Admin Users"],
        summary: "Get admin user by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Admin user found", content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUser" } } } },
          "404": { description: "Admin user not found" }
        }
      },
      patch: {
        tags: ["Admin Users"],
        summary: "Update admin user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAdminUser" } } }
        },
        responses: {
          "200": { description: "Admin user updated" },
          "404": { description: "Admin user not found" }
        }
      },
      delete: {
        tags: ["Admin Users"],
        summary: "Soft delete admin user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Admin user deleted" },
          "404": { description: "Admin user not found" }
        }
      }
    },

    "/api/admin-users/{id}/status": {
      patch: {
        tags: ["Admin Users"],
        summary: "Toggle admin user active status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAdminUserStatus" } } }
        },
        responses: {
          "200": { description: "Status updated" },
          "404": { description: "Admin user not found" }
        }
      }
    },

    // =====================================================================
    // HEALTH
    // =====================================================================
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description: "Returns a simple alive signal. Used by cron job monitoring.",
        security: [],
        responses: {
          "200": { description: "Server is alive" }
        }
      }
    }
  },

  // ─── TAG DESCRIPTIONS ─────────────────────────────────────────────────────
  tags: [
    { name: "Auth", description: "Login, logout, and PIN management" },
    { name: "Roles & Permissions", description: "Role creation and permission management" },
    { name: "Brands", description: "Product brand catalogue management" },
    { name: "Categories", description: "Product category hierarchy management" },
    { name: "Attributes", description: "Product attribute and variant option management" },
    { name: "Admin Users", description: "Admin user account management" },
    { name: "System", description: "System health and diagnostics" }
  ]
};
