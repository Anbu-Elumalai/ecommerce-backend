import { env } from "../config/env.config";

describe("Environment Configuration Validator", () => {
  it("should validate and load correct NODE_ENV setting", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(["development", "production", "test"]).toContain(env.NODE_ENV);
  });

  it("should parse and load valid server PORT", () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe("number");
  });

  it("should assert presence of JWT_SECRET configuration", () => {
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.JWT_SECRET.length).toBeGreaterThan(0);
  });

  it("should contain standard MONGO_URI string", () => {
    expect(env.MONGO_URI).toBeDefined();
    expect(env.MONGO_URI.startsWith("mongodb")).toBe(true);
  });
});
