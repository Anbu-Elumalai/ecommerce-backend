import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Strategy Pattern Interface for Storage
export interface IStorageProvider {
  save(buffer: Buffer, folder: string, fileName: string): Promise<boolean>;
  delete(folder: string, fileName: string): Promise<boolean>;
}

// Local Storage Strategy using asynchronous filesystem operations
class LocalStorageProvider implements IStorageProvider {
  async save(buffer: Buffer, folder: string, fileName: string): Promise<boolean> {
    try {
      const folderPath = path.join(process.cwd(), "public", folder);
      const filePath = path.join(folderPath, fileName);

      // Async directory verification & creation
      await fs.promises.mkdir(folderPath, { recursive: true });
      await fs.promises.writeFile(filePath, buffer);
      return true;
    } catch (error) {
      console.error("LocalStorage save error:", error);
      return false;
    }
  }

  async delete(folder: string, fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), "public", folder, fileName);

      try {
        await fs.promises.access(filePath);
        await fs.promises.unlink(filePath);
      } catch (err: any) {
        if (err.code !== "ENOENT") throw err;
      }
      return true;
    } catch (error) {
      console.error("LocalStorage delete error:", error);
      return false;
    }
  }
}

// Mock/Adapter Cloud Storage strategy (can easily link S3 client using process.env.S3_BUCKET)
class S3StorageProvider implements IStorageProvider {
  async save(buffer: Buffer, folder: string, fileName: string): Promise<boolean> {
    try {
      // Propose S3 integration: e.g. using @aws-sdk/client-s3 PutObjectCommand
      console.log(`☁️ [S3 Upload]: Mock Uploading ${fileName} to folder ${folder}`);
      // Return true to mock fallback
      return true;
    } catch (err) {
      console.error("S3 upload failure:", err);
      return false;
    }
  }

  async delete(folder: string, fileName: string): Promise<boolean> {
    try {
      console.log(`☁️ [S3 Delete]: Mock Deleting ${fileName} from folder ${folder}`);
      return true;
    } catch (err) {
      console.error("S3 delete failure:", err);
      return false;
    }
  }
}

class ImageService {
  private provider: IStorageProvider;

  constructor() {
    // Select S3 provider if AWS keys are provided, else fallback to Local
    const hasAwsConfig = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
    this.provider = hasAwsConfig ? new S3StorageProvider() : new LocalStorageProvider();
    console.log(`📦 File Storage Provider Initialized: ${this.provider.constructor.name}`);
  }

  /* ----------------------------------------
     IMAGE UPLOAD (BASE64)
    ---------------------------------------- */
  async imageUpload(
    base64: string,
    folder: string,
    fileName: string,
    oldFileName?: string
  ): Promise<boolean> {
    try {
      const base64Data = base64.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      if (oldFileName) {
        await this.provider.delete(folder, oldFileName);
      }

      return await this.provider.save(buffer, folder, fileName);
    } catch (error) {
      console.error("imageUpload error:", error);
      return false;
    }
  }

  /* ----------------------------------------
     FILE UPLOAD (multipart/form-data)
    ---------------------------------------- */
  async fileUpload(
    file: any,
    folder: string,
    fileName: string,
    oldFileName?: string
  ): Promise<boolean> {
    try {
      if (!file || !file.data) return false;

      if (oldFileName) {
        await this.provider.delete(folder, oldFileName);
      }

      return await this.provider.save(file.data, folder, fileName);
    } catch (error) {
      console.error("fileUpload error:", error);
      return false;
    }
  }

  /* ----------------------------------------
     DELETE IMAGE
    ---------------------------------------- */
  async deleteImage(
    folder: string,
    fileName: string
  ): Promise<boolean> {
    return await this.provider.delete(folder, fileName);
  }

  /* ----------------------------------------
     BUFFER FILE UPLOAD
    ---------------------------------------- */
  async fileUploadForBufferData(
    fileBuffer: Buffer,
    folder: string,
    fileName: string,
    oldFileName?: string
  ): Promise<boolean> {
    try {
      if (oldFileName) {
        await this.provider.delete(folder, oldFileName);
      }

      return await this.provider.save(fileBuffer, folder, fileName);
    } catch (error) {
      console.error("fileUploadForBufferData error:", error);
      return false;
    }
  }

  async validateImageFile(file: any) {
    if (!file) {
      throw new Error("File not found");
    }

    const extension = path.extname(file.name).toLowerCase();
    const mimeType = file.mimetype;

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error("Invalid file extension. Allowed: png, jpg, jpeg");
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error("Invalid file type. Only images allowed");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 2MB limit");
    }

    return extension;
  }
}

const imageService = new ImageService();
export default imageService;
