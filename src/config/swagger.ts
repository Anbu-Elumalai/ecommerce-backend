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

      // ── Product ───────────────────────────────────────────────
      ProductImage: {
        type: "object",
        required: ["url"],
        properties: {
          id: { type: "string" },
          url: { type: "string", example: "https://example.com/images/product.jpg" },
          thumbnailUrl: { type: "string" },
          altText: { type: "string" },
          isPrimary: { type: "boolean", default: false },
          sortOrder: { type: "integer", default: 0 }
        }
      },
      ProductPricing: {
        type: "object",
        required: ["mrp", "sellingPrice"],
        properties: {
          mrp: { type: "number", minimum: 0, example: 5999 },
          sellingPrice: { type: "number", minimum: 0, example: 4499 },
          costPrice: { type: "number", minimum: 0, example: 2500 },
          offerPrice: { type: "number", minimum: 0, example: 3999 },
          taxRate: { type: "number", minimum: 0, maximum: 100, example: 18 },
          hsnCode: { type: "string", example: "8518300000" },
          currency: { type: "string", example: "INR" }
        }
      },
      ProductInventory: {
        type: "object",
        properties: {
          trackInventory: { type: "boolean", default: true },
          stockQty: { type: "number", minimum: 0, example: 150 },
          lowStockAlert: { type: "number", minimum: 0, example: 10 },
          allowBackOrders: { type: "boolean", default: false },
          minOrderQty: { type: "number", minimum: 1, example: 1 },
          maxOrderQty: { type: "number", minimum: 1, example: 5 },
          shelfLife: { type: "string", example: "2 years" },
          expiryDate: { type: "string", example: "2027-12-31" }
        }
      },
      ProductShipping: {
        type: "object",
        properties: {
          weight: { type: "number", minimum: 0, example: 0.35 },
          length: { type: "number", minimum: 0, example: 20 },
          width: { type: "number", minimum: 0, example: 18 },
          height: { type: "number", minimum: 0, example: 10 },
          shippingClass: { type: "string", enum: ["standard", "express", "fragile", "bulky"], example: "standard" },
          deliveryDays: { type: "number", minimum: 1, example: 3 },
          isFragile: { type: "boolean", default: false },
          isTemperatureControlled: { type: "boolean", default: false }
        }
      },
      ProductSEO: {
        type: "object",
        properties: {
          metaTitle: { type: "string", maxLength: 60, example: "Buy Product Online" },
          metaDescription: { type: "string", maxLength: 160 },
          metaKeywords: { type: "array", items: { type: "string" } },
          canonicalUrl: { type: "string" }
        }
      },
      ProductAttributeValue: {
        type: "object",
        required: ["attributeId", "attributeName", "values"],
        properties: {
          attributeId: { type: "string", example: "<attribute_object_id>" },
          attributeName: { type: "string", example: "Color" },
          values: { type: "array", items: { type: "string" }, example: ["Black", "White"] }
        }
      },
      ProductVariant: {
        type: "object",
        required: ["combination", "sku", "mrp", "sellingPrice"],
        properties: {
          id: { type: "string" },
          combination: { type: "object", additionalProperties: { type: "string" }, example: { Color: "Black" } },
          sku: { type: "string", example: "SKU-WH-001-BLK" },
          barcode: { type: "string" },
          mrp: { type: "number", minimum: 0, example: 5999 },
          sellingPrice: { type: "number", minimum: 0, example: 4499 },
          costPrice: { type: "number", minimum: 0 },
          stockQty: { type: "number", minimum: 0 },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
          imageUrl: { type: "string" },
          weight: { type: "number", minimum: 0 }
        }
      },
      CreateProduct: {
        type: "object",
        required: ["name", "categoryId", "pricing"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 200, example: "Premium Wireless Headphones" },
          slug: { type: "string", example: "premium-wireless-headphones" },
          shortDescription: { type: "string", maxLength: 300, example: "Crystal clear audio with 40hrs battery life" },
          description: { type: "string", example: "<p>Full HTML description...</p>" },
          productType: { type: "string", enum: ["simple", "variable", "digital", "service"], default: "simple" },
          sku: { type: "string", example: "SKU-WH-001" },
          barcode: { type: "string", example: "123456789012" },
          categoryId: { type: "string", example: "<category_object_id>" },
          subCategoryId: { type: "string", example: "<subcategory_object_id>" },
          childCategoryId: { type: "string" },
          brandId: { type: "string", example: "<brand_object_id>" },
          tags: { type: "array", items: { type: "string" }, example: ["wireless", "audio"] },
          collections: { type: "array", items: { type: "string" }, example: ["best-sellers"] },
          images: { type: "array", items: { $ref: "#/components/schemas/ProductImage" } },
          pricing: { $ref: "#/components/schemas/ProductPricing" },
          inventory: { $ref: "#/components/schemas/ProductInventory" },
          selectedAttributes: { type: "array", items: { $ref: "#/components/schemas/ProductAttributeValue" } },
          variants: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } },
          shipping: { $ref: "#/components/schemas/ProductShipping" },
          seo: { $ref: "#/components/schemas/ProductSEO" },
          crossSellIds: { type: "array", items: { type: "string" } },
          upsellIds: { type: "array", items: { type: "string" } },
          frequentlyBoughtIds: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
          publishState: { type: "string", enum: ["draft", "published", "scheduled", "archived"], default: "draft" },
          scheduledAt: { type: "string", example: "2026-07-15T00:00:00.000Z" },
          sortOrder: { type: "integer", minimum: 0, default: 0 }
        }
      },
      UpdateProduct: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 3, maxLength: 200 },
          slug: { type: "string" },
          shortDescription: { type: "string", maxLength: 300 },
          description: { type: "string" },
          productType: { type: "string", enum: ["simple", "variable", "digital", "service"] },
          sku: { type: "string" },
          barcode: { type: "string" },
          categoryId: { type: "string" },
          subCategoryId: { type: "string" },
          childCategoryId: { type: "string" },
          brandId: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          collections: { type: "array", items: { type: "string" } },
          images: { type: "array", items: { $ref: "#/components/schemas/ProductImage" } },
          pricing: { $ref: "#/components/schemas/ProductPricing" },
          inventory: { $ref: "#/components/schemas/ProductInventory" },
          selectedAttributes: { type: "array", items: { $ref: "#/components/schemas/ProductAttributeValue" } },
          variants: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } },
          shipping: { $ref: "#/components/schemas/ProductShipping" },
          seo: { $ref: "#/components/schemas/ProductSEO" },
          crossSellIds: { type: "array", items: { type: "string" } },
          upsellIds: { type: "array", items: { type: "string" } },
          frequentlyBoughtIds: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["active", "inactive"] },
          publishState: { type: "string", enum: ["draft", "published", "scheduled", "archived"] },
          scheduledAt: { type: "string" },
          sortOrder: { type: "integer", minimum: 0 }
        }
      },
      ChangeProductStatus: {
        type: "object",
        properties: {
          publishState: { type: "string", enum: ["draft", "published", "scheduled", "archived"] },
          status: { type: "string", enum: ["active", "inactive"] }
        }
      },
      BulkDeleteProduct: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string" }, minItems: 1, example: ["<id1>", "<id2>"] }
        }
      },
      BulkStatusProduct: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string" }, minItems: 1 },
          publishState: { type: "string", enum: ["draft", "published", "scheduled", "archived"] },
          status: { type: "string", enum: ["active", "inactive"] }
        }
      },
      BulkPriceUpdate: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string" }, minItems: 1 },
          flatAdjustment: { type: "number", description: "Flat amount to add/subtract (mutually exclusive with percentAdjustment)", example: 50 },
          percentAdjustment: { type: "number", description: "Percentage to add/subtract e.g. 10 = +10%, -5 = -5%", example: -10 },
          field: { type: "string", enum: ["sellingPrice", "mrp", "offerPrice"], default: "sellingPrice" }
        }
      },
      BulkStockUpdate: {
        type: "object",
        required: ["ids", "stockDelta"],
        properties: {
          ids: { type: "array", items: { type: "string" }, minItems: 1 },
          stockDelta: { type: "number", description: "Delta to add to current stock (positive = add, negative = subtract)", example: 100 }
        }
      },
      ProductImport: {
        type: "object",
        required: ["products"],
        properties: {
          products: { type: "array", items: { $ref: "#/components/schemas/CreateProduct" }, minItems: 1 }
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
      },
      UploadedMedia: {
        type: "object",
        properties: {
          fileName: { type: "string", example: "media-1719830100-abcde.jpg" },
          url: { type: "string", example: "/general/media-1719830100-abcde.jpg" },
          size: { type: "integer", example: 1048576 },
          mimetype: { type: "string", example: "image/jpeg" }
        }
      },
      MediaUploadResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "1 files uploaded successfully" },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/UploadedMedia"
            }
          }
        }
      },
      MediaListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fileName: { type: "string", example: "media-1719830100-abcde.jpg" },
                url: { type: "string", example: "/general/media-1719830100-abcde.jpg" }
              }
            }
          }
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
    // PRODUCTS
    // =====================================================================
    "/api/products": {
      post: {
        tags: ["Products"],
        summary: "Create a new product",
        description: "Creates a product. Only `name`, `categoryId`, and `pricing` (mrp + sellingPrice) are required. Slug and SKU are auto-generated if omitted.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProduct" } } }
        },
        responses: {
          "201": { description: "Product created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "409": { description: "Duplicate SKU or slug" }
        }
      },
      get: {
        tags: ["Products"],
        summary: "List products (paginated + filtered)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 0 }, description: "Page index (0-based)" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, SKU, barcode, slug, description" },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "brandId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } },
          { name: "publishState", in: "query", schema: { type: "string", enum: ["draft", "published", "scheduled", "archived"] } },
          { name: "productType", in: "query", schema: { type: "string", enum: ["simple", "variable", "digital", "service"] } },
          { name: "priceFrom", in: "query", schema: { type: "number" } },
          { name: "priceTo", in: "query", schema: { type: "number" } },
          { name: "stockStatus", in: "query", schema: { type: "string", enum: ["in_stock", "out_of_stock", "low_stock"] } },
          { name: "sortBy", in: "query", schema: { type: "string", default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" } }
        ],
        responses: {
          "200": { description: "Paginated product list", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/export": {
      get: {
        tags: ["Products"],
        summary: "Export all matching products",
        description: "Returns the full (unpaginated) product list for CSV/Excel export. Accepts the same filters as the list endpoint.",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "brandId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } },
          { name: "publishState", in: "query", schema: { type: "string", enum: ["draft", "published", "scheduled", "archived"] } },
          { name: "stockStatus", in: "query", schema: { type: "string", enum: ["in_stock", "out_of_stock", "low_stock"] } }
        ],
        responses: {
          "200": { description: "Full product list for export", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/import": {
      post: {
        tags: ["Products"],
        summary: "Batch import products",
        description: "Import multiple products in one request. Returns per-row success/failure details.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductImport" } } }
        },
        responses: {
          "201": { description: "Import complete (all succeeded)", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "207": { description: "Partial success — some rows failed" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/bulk-delete": {
      post: {
        tags: ["Products"],
        summary: "Soft-delete multiple products",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BulkDeleteProduct" } } }
        },
        responses: {
          "200": { description: "Products soft-deleted" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/bulk-status": {
      post: {
        tags: ["Products"],
        summary: "Change publish state / visibility for multiple products",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BulkStatusProduct" } } }
        },
        responses: {
          "200": { description: "Products status updated" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/bulk-price": {
      post: {
        tags: ["Products"],
        summary: "Bulk price adjustment for multiple products",
        description: "Use `flatAdjustment` for a fixed ±amount or `percentAdjustment` for a percentage change. These are mutually exclusive.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkPriceUpdate" },
              examples: {
                flatIncrease: { summary: "Flat +50 on sellingPrice", value: { ids: ["<id1>"], flatAdjustment: 50, field: "sellingPrice" } },
                percentDiscount: { summary: "-10% on sellingPrice", value: { ids: ["<id1>"], percentAdjustment: -10, field: "sellingPrice" } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Prices updated" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/bulk-stock": {
      post: {
        tags: ["Products"],
        summary: "Bulk stock adjustment for multiple products",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BulkStockUpdate" },
              examples: {
                addStock: { summary: "Add 100 units", value: { ids: ["<id1>"], stockDelta: 100 } },
                deductStock: { summary: "Deduct 20 units", value: { ids: ["<id1>"], stockDelta: -20 } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Stock updated" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get full product details by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Full product with brand, category, attributes, variants, inventory, SEO", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      },
      put: {
        tags: ["Products"],
        summary: "Update a product (supports partial update)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProduct" } } }
        },
        responses: {
          "200": { description: "Product updated successfully" },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      },
      delete: {
        tags: ["Products"],
        summary: "Soft-delete a product",
        description: "Sets isDeleted=true. The product is never permanently removed.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Product deleted" },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/{id}/restore": {
      patch: {
        tags: ["Products"],
        summary: "Restore a soft-deleted product",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Product restored" },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/{id}/status": {
      patch: {
        tags: ["Products"],
        summary: "Change product publish state or visibility status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangeProductStatus" },
              examples: {
                publish: { summary: "Publish product", value: { publishState: "published" } },
                archive: { summary: "Archive product", value: { publishState: "archived" } },
                deactivate: { summary: "Deactivate product", value: { status: "inactive" } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Status updated" },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/products/{id}/duplicate": {
      post: {
        tags: ["Products"],
        summary: "Duplicate a product",
        description: "Clones the product with a new auto-generated SKU, slug suffixed with `-copy-{timestamp}`, publishState=draft, status=inactive, and analytics reset to 0.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "201": { description: "Product duplicated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "404": { description: "Product not found" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    // =====================================================================
    // MEDIA
    // =====================================================================
    "/api/media/upload": {
      post: {
        tags: ["Media"],
        summary: "Upload multiple files (Images/Documents/Videos)",
        description: "Uploads files to the server. File key in the form data must be `files`. Can upload multiple files.",
        parameters: [
          {
            name: "folder",
            in: "query",
            schema: { type: "string", default: "general" },
            description: "Target subfolder under public/ (e.g. products, brands, categories, general)"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: {
                      type: "string",
                      format: "binary"
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Files uploaded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MediaUploadResponse" }
              }
            }
          },
          "400": { description: "Invalid input or limit exceeded" },
          "401": { description: "Unauthorized" }
        }
      }
    },

    "/api/media": {
      get: {
        tags: ["Media"],
        summary: "Get list of uploaded media files in a folder",
        parameters: [
          {
            name: "folder",
            in: "query",
            schema: { type: "string", default: "general" },
            description: "Subfolder name under public/"
          }
        ],
        responses: {
          "200": {
            description: "Files listed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MediaListResponse" }
              }
            }
          },
          "401": { description: "Unauthorized" }
        }
      },
      delete: {
        tags: ["Media"],
        summary: "Delete an uploaded media file",
        parameters: [
          {
            name: "folder",
            in: "query",
            schema: { type: "string", default: "general" },
            description: "The subfolder containing the file (e.g. products, banners, general)"
          },
          {
            name: "fileName",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "The name of the file to delete"
          }
        ],
        responses: {
          "200": {
            description: "File deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Media deleted successfully" }
                  }
                }
              }
            }
          },
          "400": { description: "Invalid input or failure to delete" },
          "401": { description: "Unauthorized" }
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
    { name: "Products", description: "Product catalogue management — create, update, variants, inventory, SEO, bulk operations" },
    { name: "Media", description: "Media files upload and folder listing management" },
    { name: "System", description: "System health and diagnostics" }
  ]
};
