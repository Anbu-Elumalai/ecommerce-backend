import { Interceptor, InterceptorInterface, Action } from "routing-controllers";

@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: any) {
    // If headers have already been sent (e.g. static download endpoints), bypass interceptor
    if (action.response.headersSent || (content && content.headersSent)) {
      return content;
    }

    // Format consistent successful responses if standard structure is not present
    let formattedResponse = content;
    if (content && typeof content === "object" && !("status" in content) && !("statusCode" in content)) {
      // If it has success/message/data fields already (preserves backward compatibility), use them
      if ("success" in content && "message" in content) {
        formattedResponse = {
          status: "success",
          statusCode: action.response.statusCode || 200,
          message: content.message,
          data: content.data
        };
      } else {
        formattedResponse = {
          status: "success",
          statusCode: action.response.statusCode || 200,
          message: "Operation completed successfully",
          data: content
        };
      }
    }

    return this.transform(formattedResponse, new WeakSet());
  }

  private transform(obj: any, visited: WeakSet<any>): any {
    if (obj === null || obj === undefined) return obj;

    // Primitive values
    if (typeof obj !== "object") return obj;

    // Date objects
    if (obj instanceof Date) return obj.toISOString();

    // Prevent circular reference crash
    if (visited.has(obj)) return "[Circular]";
    visited.add(obj);

    // MongoDB ObjectId serialization
    if (obj.constructor && (obj.constructor.name === "ObjectId" || obj._bsontype === "ObjectID")) {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.transform(item, visited));
    }

    // Standard object transformation
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip private attributes but keep _id
        if (key.startsWith("_") && key !== "_id") {
          continue;
        }

        const value = obj[key];
        const newKey = key === "_id" ? "id" : key;
        newObj[newKey] = this.transform(value, visited);
      }
    }
    return newObj;
  }
}
