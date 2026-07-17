import "reflect-metadata";
import { env } from "./config/env.config"; // ✅ Zod Env validated first
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import { AppDataSource } from "./data-source";
import fileUpload from "express-fileupload";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { seedAdmin } from "./seed/seedAdmin";
import { seedTax } from "./seed/seedTax";
import { createServer } from "http";
import { initSocket } from "./utils/socket";
import cron from "node-cron";
import axios from "axios";

AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Database connected");

    const app = express();
    // seed default admin user
    await seedAdmin();
    await seedTax();
    app.use(express.json());

    // Configure CORS securely based on env.ALLOWED_ORIGINS
    const allowedOrigins = env.ALLOWED_ORIGINS === "*" ? "*" : env.ALLOWED_ORIGINS.split(",");
    app.use(
      cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "Content-Type", "Authorization"],
        credentials: env.ALLOWED_ORIGINS !== "*"
      })
    );

    // File uploads: keep files in-memory so file.data buffer is always populated
    app.use(
      fileUpload({
        limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — matches controller limit
        abortOnLimit: true
      })
    );

    app.use("/public", express.static("public"));

    // Swagger route
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    const ext = __filename.endsWith(".ts") ? "ts" : "js";
    useExpressServer(app, {
      routePrefix: "/api",
      controllers: [
        __dirname + `/controllers/**/*.${ext}`,
        __dirname + `/modules/**/*.controller.${ext}` // ✅ Feature-Driven compatibility
      ],
      middlewares: [
        __dirname + `/middlewares/**/*.${ext}`,
        __dirname + `/core/middlewares/**/*.${ext}`  // ✅ core middlewares
      ],
      interceptors: [
        __dirname + `/core/interceptors/ResponseInterceptor.${ext}` // ✅ new interceptor
      ],
      defaultErrorHandler: false,
      validation: true,
      classTransformer: true
    });

    app.get("/api/health", (req, res) => {
      res.status(200).send("Server is alive");
    });

    app.get("/", (_req, res) => {
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: AppDataSource.isInitialized ? "connected" : "disconnected",
        nodeVersion: process.version,
        uptime: process.uptime()
      });
    });

    // Fallback error responder
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (res.headersSent) return;
      console.error("🔥 Express Fallback Error:", err);
      const isProd = env.NODE_ENV === "production";
      res.status(err.httpCode || 500).json({
        status: "error",
        message: isProd ? "An unexpected error occurred." : err.message,
        errors: isProd ? null : err.errors || null
      });
    });

    const PORT = env.PORT;

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);

      // Safe self-health monitor cron job (prevents pinging foreign Render URL)
      cron.schedule("*/5 * * * *", async () => {
        try {
          const healthUrl = `http://localhost:${PORT}/api/health`;
          const response = await axios.get(healthUrl);
          console.log(`🕒 Cron Health Check: ${response.data} at ${new Date().toLocaleString()}`);
        } catch (error: any) {
          console.error(`❌ Cron Health Check Failed: ${error.message}`);
        }
      });
    });

  })
  .catch((error) => {
    console.error("❌ DB Connection Error:", error);
  });
